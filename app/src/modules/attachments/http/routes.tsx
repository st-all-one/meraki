import { Hono } from "hono";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Db } from "@kernel/db/database.ts";
import { one } from "@kernel/db/database.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { can } from "@services/auth/policy.ts";
import { env } from "@kernel/config/env.ts";
import { rateLimit } from "@kernel/rate-limit.ts";
import {
  archiveDemandAttachment,
  attachmentAccess,
  contentDisposition,
  linkDemandAttachment,
  readAttachment,
  storeAttachment,
} from "@services/attachments/storage.ts";
import type { DemandsLookup } from "../application/ports.ts";
import { fileValues } from "@kernel/http/render.ts";
import { channelAccess } from "@services/conversations/service.ts";

export function attachmentRoutes(
  db: Db,
  tenantId: string,
  demands: DemandsLookup,
): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.post("/items/:id/attachments", async (c) => {
    const actor = c.get("actor")!;
    const item = demands.getItem(c.req.param("id") ?? "");
    if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
    if (!can(actor, "edit", "demand", { kind: item.kind, ownerId: item.created_by })) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    const rate = rateLimit(`upload:${actor.id}`, env.rateUpload, 60);
    if (!rate.allowed) {
      c.header("Retry-After", String(rate.retryAfterSeconds));
      throw new HTTPException(429, { message: "Muitos uploads. Aguarde." });
    }
    const body = await c.req.parseBody();
    const files = fileValues(body, "attachments");
    if (files.length === 0) throw new HTTPException(422, { message: "Selecione um arquivo." });
    if (files.length > env.maxUploadFiles) {
      throw new HTTPException(422, {
        message: `Máximo de ${env.maxUploadFiles} arquivos por envio.`,
      });
    }
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const attachment = await storeAttachment(db, actor, file.name, bytes);
      linkDemandAttachment(db, item.id, attachment);
    }
    return c.redirect(`/items/${item.id}?tab=attachments&ok=attached`, 303);
  });

  app.post("/items/:id/attachments/:aid/archive", (c) => {
    const actor = c.get("actor")!;
    const item = demands.getItem(c.req.param("id") ?? "");
    if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
    if (!can(actor, "edit", "demand", { kind: item.kind, ownerId: item.created_by })) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    archiveDemandAttachment(db, item.id, c.req.param("aid"));
    return c.redirect(`/items/${item.id}?tab=attachments&ok=archived`, 303);
  });

  const serve = async (c: Context<AppEnv>, download: boolean) => {
    const actor = c.get("actor")!;
    const found = attachmentAccess(db, tenantId, c.req.param("id") ?? "");
    if (!found) throw new HTTPException(404, { message: "Anexo não encontrado" });
    if (found.itemId) {
      const item = demands.getItem(found.itemId);
      if (!item) throw new HTTPException(404, { message: "Anexo não encontrado" });
    } else if (found.messageId) {
      const message = one<{ channel_id: string }>(
        db,
        "SELECT channel_id FROM chat_messages WHERE id = ?",
        found.messageId,
      );
      if (!message || !channelAccess(db, tenantId, actor, message.channel_id)) {
        throw new HTTPException(403, { message: "Sem permissão" });
      }
    } else {
      throw new HTTPException(404, { message: "Anexo não encontrado" });
    }
    const bytes = await readAttachment(found.attachment);
    if (bytes.byteLength === 0) throw new HTTPException(404, { message: "Anexo vazio" });
    const inline = !download &&
      (found.attachment.mime === "image/png" || found.attachment.mime === "image/jpeg");
    return c.body(bytes.slice().buffer, 200, {
      "Content-Type": found.attachment.mime,
      "Content-Length": String(found.attachment.bytes),
      "Content-Disposition": contentDisposition(found.attachment.original_name, inline),
      "X-Content-Type-Options": "nosniff",
      "ETag": `"${found.attachment.sha256}"`,
      "Cache-Control": "private, max-age=3600",
    });
  };

  app.get("/attachments/:id", (c) => serve(c, false));
  app.on("HEAD", "/attachments/:id", (c) => serve(c, false));
  app.get("/attachments/:id/download", (c) => serve(c, true));
  app.on("HEAD", "/attachments/:id/download", (c) => serve(c, true));

  return app;
}
