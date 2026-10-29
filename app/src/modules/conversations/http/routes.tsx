import { Hono } from "hono";
import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { HTTPException } from "hono/http-exception";
import type { Db } from "@kernel/db/database.ts";
import { run } from "@kernel/db/database.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { formValue } from "@kernel/http/request.ts";
import type { Actor } from "@services/auth/contract.ts";
import { can } from "@services/auth/policy.ts";
import { env } from "@kernel/config/env.ts";
import { rateLimit } from "@kernel/rate-limit.ts";
import { nowIso, uuidv7 } from "@kernel/util.ts";
import { back, fileValues, render } from "@kernel/http/render.ts";
import {
  channelAccess,
  channelById,
  channelsForUser,
  markChannelRead,
  messageById,
  type MessageRow,
  messagesAfter,
  messagesForChannel,
  messageView,
  messageViews,
} from "@services/conversations/service.ts";
import { publish, subscribe, unsubscribe } from "@services/realtime/sse.ts";
import { ChannelPage, ChatHomePage } from "../views/chat.tsx";
import { MessageCard, MessageEditForm } from "@layout/views/chat.tsx";
import { notify, unreadCount } from "@services/notifications/service.ts";
import { linkMessageAttachment, storeAttachment } from "@services/attachments/storage.ts";
import { tx } from "@kernel/db/database.ts";

function requireChannel(db: Db, tenantId: string, actor: Actor, id: string) {
  const channel = channelById(db, tenantId, id);
  if (!channel || !channelAccess(db, tenantId, actor, id)) {
    throw new HTTPException(404, { message: "Canal não encontrado" });
  }
  return channel;
}

function canEditMessage(actor: Actor, message: MessageRow): boolean {
  return can(actor, "edit", "message", { ownerId: message.author_id });
}

function parseMessage(body: Record<string, unknown>): string {
  return typeof body["body_md"] === "string" ? body["body_md"].trim() : "";
}

function notifyDemandFollowers(
  db: Db,
  tenantId: string,
  channelDemandId: string | null,
  channelName: string,
  actor: Actor,
  message: MessageRow,
): void {
  if (!channelDemandId) return;
  const recipients = new Set<string>();
  for (
    const row of db.prepare(
      `SELECT i.created_by, i.po_id, i.assignee_id FROM items i WHERE i.id = ?`,
    ).all(channelDemandId) as {
      created_by: string;
      po_id: string | null;
      assignee_id: string | null;
    }[]
  ) {
    if (row.created_by !== actor.id) recipients.add(row.created_by);
    if (row.po_id && row.po_id !== actor.id) recipients.add(row.po_id);
    if (row.assignee_id && row.assignee_id !== actor.id) recipients.add(row.assignee_id);
  }
  for (const userId of recipients) {
    notify(
      db,
      tenantId,
      userId,
      "message",
      `Nova mensagem em ${channelName}`,
      `${actor.name}: ${message.body_md.slice(0, 140) || "anexo"}`,
      `/items/${channelDemandId}?tab=conversation`,
      { item_id: channelDemandId, message_id: message.id },
    );
  }
}

export function chatRoutes(db: Db, tenantId: string): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.get("/chat", (c) => {
    const actor = c.get("actor")!;
    return render(
      c,
      (
        <ChatHomePage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          channels={channelsForUser(db, tenantId, actor.id)}
        />
      ),
    );
  });

  app.get("/chat/channels/:id", (c) => {
    const actor = c.get("actor")!;
    const channel = requireChannel(db, tenantId, actor, c.req.param("id"));
    if (channel.scope === "demand") {
      return c.redirect(`/items/${channel.demand_id}?tab=conversation`, 302);
    }
    const before = c.req.query("before");
    const messages = messageViews(db, messagesForChannel(db, channel.id, 50, before));
    return render(
      c,
      (
        <ChannelPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          channel={{ id: channel.id, name: channel.name, scope: channel.scope }}
          channels={channelsForUser(db, tenantId, actor.id)}
          messages={messages}
          canEditAny={actor.role === "admin"}
          maxLength={env.maxChatBody}
          older={messages[0]?.created_at}
        />
      ),
    );
  });

  app.get("/chat/channels/:id/messages", (c) => {
    const actor = c.get("actor")!;
    const channel = requireChannel(db, tenantId, actor, c.req.param("id"));
    const before = c.req.query("before");
    const messages = messageViews(db, messagesForChannel(db, channel.id, 50, before));
    return c.html(
      messages.map((message) => (
        <MessageCard message={message} actor={actor} canEditAny={actor.role === "admin"} />
      )).join(""),
    );
  });

  app.get("/chat/channels/:id/events", (c) => {
    const actor = c.get("actor")!;
    const channel = requireChannel(db, tenantId, actor, c.req.param("id"));
    const lastId = c.req.header("last-event-id") ?? c.req.query("lastEventId");
    c.header("Cache-Control", "no-store");
    c.header("X-Accel-Buffering", "no");
    return streamSSE(c, async (stream) => {
      const client = {
        write: (event: string, data: string, id?: string) =>
          stream.writeSSE({ event, data, ...(id ? { id } : {}) }),
        close: () => stream.close(),
      };
      subscribe(channel.id, client);
      const { promise: done, resolve } = Promise.withResolvers<void>();
      stream.onAbort(() => {
        unsubscribe(channel.id, client);
        resolve();
      });
      await stream.writeSSE({ event: "hello", data: JSON.stringify({ channel: channel.id }) });
      if (lastId) {
        const missed = messagesAfter(db, channel.id, lastId);
        await Promise.all(missed.map((message) =>
          stream.writeSSE({
            id: message.id,
            event: "message",
            data: JSON.stringify({
              id: message.id,
              author: message.author_name,
              created_at: message.created_at,
            }),
          })
        ));
      }
      const heartbeat = setInterval(() => {
        void stream.writeSSE({ event: "heartbeat", data: "{}" }).catch(() => {});
      }, 15_000);
      try {
        await done;
      } finally {
        clearInterval(heartbeat);
        unsubscribe(channel.id, client);
      }
    });
  });

  async function handlePost(c: Context<AppEnv>, channel: ReturnType<typeof requireChannel>) {
    const actor = c.get("actor")!;
    const rate = rateLimit(`chat:${actor.id}:${channel.id}`, env.rateChat, 60);
    if (!rate.allowed) {
      c.header("Retry-After", String(rate.retryAfterSeconds));
      throw new HTTPException(429, { message: "Muitas mensagens. Aguarde." });
    }
    const body = await c.req.parseBody();
    const text = parseMessage(body);
    const files = fileValues(body, "attachments");
    if (text.length === 0 && files.length === 0) {
      throw new HTTPException(422, { message: "Escreva algo ou anexe um arquivo." });
    }
    if (text.length > env.maxChatBody) {
      throw new HTTPException(422, { message: "Mensagem longa demais." });
    }
    if (files.length > env.maxUploadFiles) {
      throw new HTTPException(422, { message: `Máximo de ${env.maxUploadFiles} anexos.` });
    }
    const stored = await Promise.all(
      files.map(async (file) =>
        await storeAttachment(db, actor, file.name, new Uint8Array(await file.arrayBuffer()))
      ),
    );
    const messageId = uuidv7();
    const now = nowIso();
    tx(db, () => {
      run(
        db,
        `INSERT INTO chat_messages(id, tenant_id, channel_id, author_id, body_md, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        messageId,
        tenantId,
        channel.id,
        actor.id,
        text,
        now,
      );
      for (const attachment of stored) linkMessageAttachment(db, messageId, attachment);
      if (channel.scope === "demand" && channel.demand_id) {
        notifyDemandFollowers(db, tenantId, channel.demand_id, channel.name, actor, {
          id: messageId,
          channel_id: channel.id,
          author_id: actor.id,
          author_name: actor.name,
          body_md: text,
          created_at: now,
          edited_at: null,
          deleted_at: null,
        });
      }
    });
    markChannelRead(db, channel.id, actor.id, messageId);
    const row = messageById(db, messageId)!;
    publish(channel.id, "message", {
      id: row.id,
      author: row.author_name,
      created_at: row.created_at,
    }, row.id);
    const redirect = channel.scope === "demand" && channel.demand_id
      ? `/items/${channel.demand_id}?tab=conversation`
      : `/chat/channels/${channel.id}`;
    return c.redirect(redirect, 303);
  }

  app.post("/chat/channels/:id/messages", async (c) => {
    const actor = c.get("actor")!;
    const channel = requireChannel(db, tenantId, actor, c.req.param("id") ?? "");
    return await handlePost(c, channel);
  });

  app.post("/markdown/preview", async (c) => {
    c.get("actor");
    const body = await c.req.parseBody();
    const text = typeof body["body_md"] === "string" ? body["body_md"] : "";
    if (text.length > env.maxChatBody) {
      throw new HTTPException(422, { message: "Texto longo demais." });
    }
    const { renderMarkdown } = await import("../markdown.ts");
    return c.html(renderMarkdown(text));
  });

  app.get("/messages/:id/partial", (c) => {
    const actor = c.get("actor")!;
    const message = messageById(db, c.req.param("id") ?? "");
    if (!message) throw new HTTPException(404, { message: "Mensagem não encontrada" });
    if (!channelAccess(db, tenantId, actor, message.channel_id)) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    return c.html(
      <MessageCard
        message={messageView(db, message)}
        actor={actor}
        canEditAny={actor.role === "admin"}
      />,
    );
  });

  app.get("/messages/:id", (c) => {
    const actor = c.get("actor")!;
    const message = messageById(db, c.req.param("id"));
    if (!message) throw new HTTPException(404, { message: "Mensagem não encontrada" });
    const channel = channelById(db, tenantId, message.channel_id);
    if (!channel || !channelAccess(db, tenantId, actor, channel.id)) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    if (!canEditMessage(actor, message)) throw new HTTPException(403, { message: "Sem permissão" });
    return c.html(
      <MessageEditForm message={messageView(db, message)} maxLength={env.maxChatBody} />,
    );
  });

  app.post("/messages/:id/edit", async (c) => {
    const actor = c.get("actor")!;
    const message = messageById(db, c.req.param("id"));
    if (!message) throw new HTTPException(404, { message: "Mensagem não encontrada" });
    if (!canEditMessage(actor, message)) throw new HTTPException(403, { message: "Sem permissão" });
    const body = await c.req.parseBody();
    const text = parseMessage(body);
    if (text.length < 1 || text.length > env.maxChatBody) {
      return c.html(
        <MessageEditForm
          message={messageView(db, message)}
          maxLength={env.maxChatBody}
          error="Mensagem inválida."
        />,
        422,
      );
    }
    const now = nowIso();
    tx(db, () => {
      run(
        db,
        "UPDATE chat_messages SET body_md = ?, edited_at = ? WHERE id = ?",
        text,
        now,
        message.id,
      );
      run(
        db,
        "INSERT INTO chat_message_edits(id, message_id, old_body_md, edited_by, edited_at) VALUES (?, ?, ?, ?, ?)",
        uuidv7(),
        message.id,
        message.body_md,
        actor.id,
        now,
      );
    });
    publish(message.channel_id, "message.updated", { id: message.id }, message.id);
    const updated = messageById(db, message.id)!;
    return c.html(
      <MessageCard
        message={messageView(db, updated)}
        actor={actor}
        canEditAny={actor.role === "admin"}
      />,
    );
  });

  app.post("/messages/:id/archive", (c) => {
    const actor = c.get("actor")!;
    const message = messageById(db, c.req.param("id"));
    if (!message) throw new HTTPException(404, { message: "Mensagem não encontrada" });
    if (!canEditMessage(actor, message)) throw new HTTPException(403, { message: "Sem permissão" });
    run(db, "UPDATE chat_messages SET deleted_at = ? WHERE id = ?", nowIso(), message.id);
    publish(message.channel_id, "message.archived", { id: message.id }, message.id);
    return back(c, `/chat/channels/${message.channel_id}`);
  });

  app.post("/chat/channels/:id/read", async (c) => {
    const actor = c.get("actor")!;
    const channel = requireChannel(db, tenantId, actor, c.req.param("id"));
    const body = await c.req.parseBody();
    markChannelRead(
      db,
      channel.id,
      actor.id,
      formValue(body["last_read_message_id"] ?? null) || null,
    );
    return c.json({ ok: true });
  });

  return app;
}

export { channelAccess };
