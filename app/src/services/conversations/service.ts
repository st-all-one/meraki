import type { Db } from "@kernel/db/database.ts";
import { one, rows, run } from "@kernel/db/database.ts";
import { nowIso, uuidv7 } from "@kernel/util.ts";
import { attachmentsForMessage } from "@services/attachments/storage.ts";
export interface MessageDisplay {
  id: string;
  channel_id: string;
  author_id: string;
  author_name: string;
  body_md: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachments: {
    id: string;
    original_name: string;
    mime: string;
    bytes: number;
    uploader_name?: string;
  }[];
}

export interface ChannelRow {
  id: string;
  tenant_id: string;
  scope: "general" | "project" | "demand";
  project_id: string | null;
  demand_id: string | null;
  name: string;
  archived_at: string | null;
}

export interface MessageRow {
  id: string;
  channel_id: string;
  author_id: string;
  author_name: string;
  body_md: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export function ensureChannel(
  db: Db,
  tenantId: string,
  scope: "general" | "project" | "demand",
  target: { projectId?: string; demandId?: string; name: string },
): ChannelRow {
  const existing = scope === "general"
    ? one<ChannelRow>(
      db,
      "SELECT * FROM chat_channels WHERE tenant_id = ? AND scope = 'general'",
      tenantId,
    )
    : scope === "project"
    ? one<ChannelRow>(
      db,
      "SELECT * FROM chat_channels WHERE project_id = ? AND scope = 'project'",
      target.projectId ?? "",
    )
    : one<ChannelRow>(
      db,
      "SELECT * FROM chat_channels WHERE demand_id = ? AND scope = 'demand'",
      target.demandId ?? "",
    );
  if (existing) return existing;
  const id = uuidv7();
  run(
    db,
    `INSERT INTO chat_channels(id, tenant_id, scope, project_id, demand_id, name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    tenantId,
    scope,
    target.projectId ?? null,
    target.demandId ?? null,
    target.name,
    nowIso(),
  );
  return one<ChannelRow>(db, "SELECT * FROM chat_channels WHERE id = ?", id)!;
}

export function channelById(db: Db, tenantId: string, id: string): ChannelRow | null {
  return one<ChannelRow>(
    db,
    "SELECT * FROM chat_channels WHERE id = ? AND tenant_id = ?",
    id,
    tenantId,
  ) ?? null;
}

export function messagesForChannel(
  db: Db,
  channelId: string,
  limit = 50,
  before?: string,
): MessageRow[] {
  return rows<MessageRow>(
    db,
    `SELECT m.*, u.display_name AS author_name
     FROM chat_messages m JOIN users u ON u.id = m.author_id
     WHERE m.channel_id = ? ${before ? "AND m.created_at < ?" : ""}
     ORDER BY m.created_at DESC LIMIT ?`,
    ...(before ? [channelId, before, limit] : [channelId, limit]),
  ).reverse();
}

export function messagesAfter(db: Db, channelId: string, afterId: string): MessageRow[] {
  const after = one<{ created_at: string }>(
    db,
    "SELECT created_at FROM chat_messages WHERE id = ?",
    afterId,
  );
  if (!after) return messagesForChannel(db, channelId, 50);
  return rows<MessageRow>(
    db,
    `SELECT m.*, u.display_name AS author_name
     FROM chat_messages m JOIN users u ON u.id = m.author_id
     WHERE m.channel_id = ? AND m.created_at > ? ORDER BY m.created_at`,
    channelId,
    after.created_at,
  );
}

export function messageById(db: Db, id: string): MessageRow | null {
  return one<MessageRow>(
    db,
    `SELECT m.*, u.display_name AS author_name
     FROM chat_messages m JOIN users u ON u.id = m.author_id WHERE m.id = ?`,
    id,
  ) ?? null;
}

export function channelAccess(
  db: Db,
  tenantId: string,
  _actor: { id: string },
  channelId: string,
): boolean {
  const channel = channelById(db, tenantId, channelId);
  if (!channel) return false;
  if (channel.scope === "general") return true;
  if (channel.scope === "project") {
    return Boolean(
      one(
        db,
        "SELECT id FROM projects WHERE id = ? AND tenant_id = ?",
        channel.project_id,
        tenantId,
      ),
    );
  }
  return Boolean(
    one(db, "SELECT id FROM items WHERE id = ? AND tenant_id = ?", channel.demand_id, tenantId),
  );
}

export function messageView(db: Db, row: MessageRow): MessageDisplay {
  return { ...row, attachments: attachmentsForMessage(db, row.id) };
}

export function messageViews(db: Db, rowsIn: MessageRow[]): MessageDisplay[] {
  return rowsIn.map((row) => messageView(db, row));
}

export interface ChannelUnread extends ChannelRow {
  unread: number;
}

export function channelsForUser(db: Db, tenantId: string, userId: string): ChannelUnread[] {
  const channels = rows<ChannelRow>(
    db,
    `SELECT * FROM chat_channels
     WHERE tenant_id = ? AND scope IN ('general','project') AND archived_at IS NULL
     ORDER BY CASE scope WHEN 'general' THEN 0 ELSE 1 END, name COLLATE NOCASE`,
    tenantId,
  );
  return channels.map((channel) => {
    const row = one<{ n: number }>(
      db,
      `SELECT COUNT(*) AS n FROM chat_messages m
       WHERE m.channel_id = ? AND m.deleted_at IS NULL
         AND m.created_at > COALESCE((
           SELECT cm.created_at FROM chat_messages cm
           JOIN chat_reads r ON r.last_read_message_id = cm.id
           WHERE r.channel_id = ? AND r.user_id = ?
         ), '')`,
      channel.id,
      channel.id,
      userId,
    );
    return { ...channel, unread: Number(row?.n ?? 0) };
  });
}

export function markChannelRead(
  db: Db,
  channelId: string,
  userId: string,
  messageId: string | null,
): void {
  const last = messageId ?? one<{ id: string }>(
    db,
    "SELECT id FROM chat_messages WHERE channel_id = ? ORDER BY created_at DESC LIMIT 1",
    channelId,
  )?.id ?? null;
  if (!last) return;
  run(
    db,
    `INSERT INTO chat_reads(channel_id, user_id, last_read_message_id, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(channel_id, user_id) DO UPDATE SET last_read_message_id = excluded.last_read_message_id,
       updated_at = excluded.updated_at`,
    channelId,
    userId,
    last,
    nowIso(),
  );
}

export default {
  name: "conversations",
  create() {
    return {
      ensureChannel,
      channelById,
      messagesForChannel,
      messagesAfter,
      messageById,
      messageView,
      messageViews,
      channelsForUser,
      markChannelRead,
      channelAccess,
    };
  },
};
