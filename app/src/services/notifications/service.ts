import type { Db } from "@kernel/db/database.ts";
import { one, rows, run } from "@kernel/db/database.ts";
import { nowIso, uuidv7 } from "@kernel/util.ts";

export interface NotificationRow {
  id: string;
  tenant_id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
  data_json: string;
  created_at: string;
  read_at: string | null;
  pushed_at: string | null;
}

export function notify(
  db: Db,
  tenantId: string,
  userId: string,
  kind: "assigned" | "po" | "message" | "issue" | "promoted" | "system",
  title: string,
  body: string,
  url: string,
  data: Record<string, unknown> = {},
): void {
  run(
    db,
    `INSERT INTO notifications(id, tenant_id, user_id, kind, title, body, url, data_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    uuidv7(),
    tenantId,
    userId,
    kind,
    title.slice(0, 160),
    body.slice(0, 300),
    url,
    JSON.stringify(data),
    nowIso(),
  );
}

export function unreadCount(db: Db, userId: string): number {
  return Number(
    one<{ n: number }>(
      db,
      "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL",
      userId,
    )?.n ?? 0,
  );
}

export function listNotifications(db: Db, userId: string, limit = 100): NotificationRow[] {
  return rows<NotificationRow>(
    db,
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    userId,
    limit,
  );
}

export function markRead(db: Db, userId: string, id: string): void {
  run(
    db,
    "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL",
    nowIso(),
    id,
    userId,
  );
}

export function markAllRead(db: Db, userId: string): void {
  run(
    db,
    "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
    nowIso(),
    userId,
  );
}

export function notificationPreferences(db: Db, userId: string): Record<string, number> {
  const row = one<Record<string, number>>(
    db,
    "SELECT push_enabled, assignments, po_changes, demand_messages, new_issues, hide_details FROM notification_preferences WHERE user_id = ?",
    userId,
  );
  return row ?? {
    push_enabled: 0,
    assignments: 1,
    po_changes: 1,
    demand_messages: 1,
    new_issues: 0,
    hide_details: 0,
  };
}

export default {
  name: "notifications",
  create() {
    return {
      notify,
      unreadCount,
      listNotifications,
      markRead,
      markAllRead,
      notificationPreferences,
    };
  },
};
