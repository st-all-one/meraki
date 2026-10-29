import { Hono } from "hono";
import { upgradeWebSocket } from "hono/deno";
import { HTTPException } from "hono/http-exception";
import type { Db } from "@kernel/db/database.ts";
import { one, run, tx } from "@kernel/db/database.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { env } from "@kernel/config/env.ts";
import type { DemandsLookup } from "../application/ports.ts";
import { nowIso, uuidv7 } from "@kernel/util.ts";
import {
  linkDemandAttachment,
  storeAttachment,
  storeCanvasExport,
} from "@services/attachments/storage.ts";
import { fileValues } from "@kernel/http/render.ts";
import { attachmentsForItem } from "@services/attachments/storage.ts";

interface Whiteboard {
  id: string;
  tenant_id: string;
  demand_id: string;
  scene_json: string;
  scene_version: number;
}

interface Participant {
  id: string;
  userId: string;
  name: string;
  color: string;
  socket?: { send(data: string): void };
  sessionId: string;
  joinedAt: number;
}

interface Room {
  whiteboard: Whiteboard;
  participants: Map<string, Participant>;
  scene: string;
  version: number;
  dirty: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

const rooms = new Map<string, Room>();
const COLORS = ["#2563eb", "#db2777", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

function ensureWhiteboard(db: Db, tenantId: string, demandId: string, actorId: string): Whiteboard {
  const existing = one<Whiteboard>(db, "SELECT * FROM whiteboards WHERE demand_id = ?", demandId);
  if (existing) return existing;
  const id = uuidv7();
  const now = nowIso();
  run(
    db,
    `INSERT INTO whiteboards(id, tenant_id, demand_id, scene_json, scene_version, created_by, created_at, updated_at)
     VALUES (?, ?, ?, '{"elements":[],"appState":{}}', 1, ?, ?, ?)`,
    id,
    tenantId,
    demandId,
    actorId,
    now,
    now,
  );
  return one<Whiteboard>(db, "SELECT * FROM whiteboards WHERE id = ?", id)!;
}

function saveScene(
  db: Db,
  room: Room,
  actorId: string,
  reason: "autosave" | "manual" | "export" | "join",
): void {
  if (!room.dirty && reason === "autosave") return;
  const now = nowIso();
  room.version += 1;
  room.dirty = false;
  tx(db, () => {
    run(
      db,
      "UPDATE whiteboards SET scene_json = ?, scene_version = ?, updated_at = ? WHERE id = ?",
      room.scene,
      room.version,
      now,
      room.whiteboard.id,
    );
    run(
      db,
      `INSERT INTO whiteboard_snapshots(id, whiteboard_id, scene_json, scene_version, created_by, created_at, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      uuidv7(),
      room.whiteboard.id,
      room.scene,
      room.version,
      actorId,
      now,
      reason,
    );
  });
}

function participantPayload(room: Room): unknown[] {
  return [...room.participants.values()].map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    color: p.color,
  }));
}

function broadcast(room: Room, payload: unknown, except?: string): void {
  const data = JSON.stringify(payload);
  for (const participant of room.participants.values()) {
    if (participant.id === except) continue;
    try {
      participant.socket?.send(data);
    } catch {
      // Fechamento concorrente.
    }
  }
}

function parseScene(raw: string): string {
  if (raw.length > 5 * 1024 * 1024) throw new Error("Cena grande demais.");
  const parsed = JSON.parse(raw) as { elements?: unknown; appState?: unknown };
  if (!Array.isArray(parsed.elements)) throw new Error("Cena inválida.");
  return JSON.stringify({ elements: parsed.elements, appState: parsed.appState ?? {} });
}

function frameCsp(): string {
  return "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'self'; " +
    "script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; " +
    "worker-src 'self' blob:; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'";
}

export function canvasRoutes(
  db: Db,
  tenantId: string,
  demands: DemandsLookup,
): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.post("/items/:id/canvas", (c) => {
    const actor = c.get("actor")!;
    const item = demands.getItem(c.req.param("id") ?? "");
    if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
    const board = ensureWhiteboard(db, tenantId, item.id, actor.id);
    demands.recordEvent(item.id, "canvas", null, board.id);
    return c.json({ id: board.id });
  });

  app.get("/items/:id/canvas/frame", (c) => {
    const actor = c.get("actor")!;
    const item = demands.getItem(c.req.param("id") ?? "");
    if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
    ensureWhiteboard(db, tenantId, item.id, actor.id);
    c.header("Content-Security-Policy", frameCsp());
    c.header("Cache-Control", "no-store");
    return c.html(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${item.code} · Canvas</title>
<link rel="stylesheet" href="/static/whiteboard/whiteboard.css">
<script src="/static/js/whiteboard-config.js"></script>
</head><body>
<div id="whiteboard-root" data-item-id="${item.id}" data-code="${item.code}"></div>
<script type="module" src="/static/whiteboard/whiteboard.js"></script>
</body></html>`);
  });

  app.get("/api/items/:id/canvas", (c) => {
    const actor = c.get("actor")!;
    const item = demands.getItem(c.req.param("id") ?? "");
    if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
    const board = ensureWhiteboard(db, tenantId, item.id, actor.id);
    const room = rooms.get(board.id);
    return c.json({
      scene: JSON.parse(room?.scene ?? board.scene_json),
      version: room?.version ?? board.scene_version,
      participants: room ? participantPayload(room) : [],
      files: db.prepare(
        `SELECT wf.excalidraw_file_id AS id, a.id AS attachment_id FROM whiteboard_files wf
         JOIN attachments a ON a.id = wf.attachment_id WHERE wf.whiteboard_id = ?`,
      ).all(board.id),
    });
  });

  app.post("/api/items/:id/canvas/files", async (c) => {
    const actor = c.get("actor")!;
    const item = demands.getItem(c.req.param("id") ?? "");
    if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
    const board = ensureWhiteboard(db, tenantId, item.id, actor.id);
    const body = await c.req.parseBody();
    const files = fileValues(body, "file");
    const file = files[0];
    const fileId = typeof body["fileId"] === "string" ? body["fileId"] : "";
    if (!file || !fileId) {
      throw new HTTPException(422, { message: "Arquivo e fileId são obrigatórios." });
    }
    const attachment = await storeAttachment(
      db,
      actor,
      file.name,
      new Uint8Array(await file.arrayBuffer()),
    );
    run(
      db,
      "INSERT OR REPLACE INTO whiteboard_files(whiteboard_id, excalidraw_file_id, attachment_id) VALUES (?, ?, ?)",
      board.id,
      fileId,
      attachment.id,
    );
    return c.json({ fileId, attachmentId: attachment.id, url: `/attachments/${attachment.id}` });
  });

  app.post("/api/items/:id/canvas/export", async (c) => {
    const actor = c.get("actor")!;
    const item = demands.getItem(c.req.param("id") ?? "");
    if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
    const board = ensureWhiteboard(db, tenantId, item.id, actor.id);
    const format = c.req.query("format");
    if (format !== "excalidraw" && format !== "png" && format !== "svg") {
      throw new HTTPException(422, { message: "Formato inválido." });
    }
    const body = await c.req.parseBody();
    const files = fileValues(body, "file");
    const file = files[0];
    if (!file) throw new HTTPException(422, { message: "Arquivo ausente." });
    const mime = format === "excalidraw"
      ? "application/json"
      : format === "png"
      ? "image/png"
      : "image/svg+xml";
    const bytes = new Uint8Array(await file.arrayBuffer());
    const attachment = await storeCanvasExport(db, actor, file.name, bytes, mime);
    tx(db, () => {
      linkDemandAttachment(db, item.id, attachment, "canvas_export");
      run(
        db,
        "INSERT INTO whiteboard_exports(id, whiteboard_id, attachment_id, format, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        uuidv7(),
        board.id,
        attachment.id,
        format,
        actor.id,
        nowIso(),
      );
    });
    return c.json({ id: attachment.id, url: `/attachments/${attachment.id}/download` });
  });

  app.get(
    "/items/:id/canvas/ws",
    upgradeWebSocket((c) => {
      const actor = c.get("actor");
      const origin = c.req.header("origin");
      const site = c.req.header("sec-fetch-site");
      if (
        !actor || (origin && origin !== env.appUrl && site !== "same-origin" && site !== "none")
      ) {
        return {
          onOpen(_event, ws) {
            ws.close(1008, "Origem inválida");
          },
        };
      }
      const item = demands.getItem(c.req.param("id") ?? "");
      if (!item) {
        return {
          onOpen(_event, ws) {
            ws.close(1008, "Demanda não encontrada");
          },
        };
      }
      const board = ensureWhiteboard(db, tenantId, item.id, actor.id);
      let room = rooms.get(board.id);
      if (!room) {
        room = {
          whiteboard: board,
          participants: new Map(),
          scene: board.scene_json,
          version: board.scene_version,
          dirty: false,
        };
        rooms.set(board.id, room);
      }
      const currentRoom = room;
      const participant: Participant = {
        id: uuidv7(),
        userId: actor.id,
        name: actor.name,
        color: COLORS[currentRoom.participants.size % COLORS.length] ?? "#2563eb",
        sessionId: uuidv7(),
        joinedAt: Date.now(),
      };
      return {
        onOpen(_event, ws) {
          participant.socket = ws;
          currentRoom.participants.set(participant.id, participant);
          run(
            db,
            "INSERT INTO whiteboard_sessions(id, whiteboard_id, user_id, joined_at) VALUES (?, ?, ?, ?)",
            participant.sessionId,
            board.id,
            actor.id,
            nowIso(),
          );
          ws.send(JSON.stringify({
            type: "scene-state",
            scene: JSON.parse(currentRoom.scene),
            version: currentRoom.version,
            participants: participantPayload(currentRoom),
            self: { id: participant.id, name: participant.name, color: participant.color },
            persister: currentRoom.participants.size === 1,
          }));
          broadcast(currentRoom, {
            type: "participant-joined",
            participant: { id: participant.id, name: participant.name, color: participant.color },
          }, participant.id);
        },
        onMessage(event, ws) {
          if (typeof event.data !== "string") return;
          if (event.data.length > 6 * 1024 * 1024) return;
          let message: Record<string, unknown>;
          try {
            message = JSON.parse(event.data) as Record<string, unknown>;
          } catch {
            return;
          }
          const type = message["type"];
          if (type === "scene-update" && Array.isArray(message["elements"])) {
            try {
              currentRoom.scene = parseScene(JSON.stringify({
                elements: message["elements"],
                appState: message["appState"] ?? {},
              }));
            } catch {
              ws.send(JSON.stringify({ type: "error", message: "Cena inválida." }));
              return;
            }
            currentRoom.dirty = true;
            broadcast(currentRoom, {
              type: "scene-update",
              elements: message["elements"],
              from: participant.id,
            }, participant.id);
            currentRoom.timer ??= setTimeout(() => {
              currentRoom.timer = undefined;
              saveScene(db, currentRoom, actor.id, "autosave");
            }, 2000);
          } else if (type === "snapshot") {
            try {
              currentRoom.scene = parseScene(JSON.stringify(message["scene"] ?? {}));
              saveScene(db, currentRoom, actor.id, "manual");
              ws.send(
                JSON.stringify({ type: "saved", version: currentRoom.version, at: nowIso() }),
              );
            } catch {
              ws.send(JSON.stringify({ type: "error", message: "Snapshot inválido." }));
            }
          } else if (type === "cursor") {
            broadcast(currentRoom, {
              type: "cursor",
              id: participant.id,
              name: participant.name,
              color: participant.color,
              x: Number(message["x"] ?? 0),
              y: Number(message["y"] ?? 0),
              tool: typeof message["tool"] === "string" ? message["tool"] : undefined,
            }, participant.id);
          } else if (type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        },
        onClose() {
          currentRoom.participants.delete(participant.id);
          run(
            db,
            "UPDATE whiteboard_sessions SET left_at = ? WHERE id = ?",
            nowIso(),
            participant.sessionId,
          );
          broadcast(currentRoom, {
            type: "participant-left",
            participant: { id: participant.id },
          });
          if (currentRoom.participants.size === 0) {
            clearTimeout(currentRoom.timer);
            saveScene(db, currentRoom, actor.id, "autosave");
            rooms.delete(board.id);
          } else {
            const next = currentRoom.participants.values().next().value as Participant | undefined;
            try {
              next?.socket?.send(JSON.stringify({ type: "persister", persister: true }));
            } catch {
              // Ignora fechamento concorrente.
            }
          }
        },
        onError() {
          currentRoom.participants.delete(participant.id);
        },
      };
    }),
  );

  return app;
}

export function canvasExports(db: Db, itemId: string): unknown[] {
  return db.prepare(
    `SELECT a.id, a.original_name, a.mime, a.bytes FROM whiteboard_exports we
     JOIN whiteboards w ON w.id = we.whiteboard_id
     JOIN attachments a ON a.id = we.attachment_id WHERE w.demand_id = ? ORDER BY we.created_at DESC`,
  ).all(itemId);
}

export function canvasAttachments(db: Db, itemId: string): unknown[] {
  return attachmentsForItem(db, itemId);
}
