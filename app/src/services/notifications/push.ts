// @ts-types="npm:@types/web-push@3.6.4"
import webpush from "web-push";
import type { Db } from "@kernel/db/database.ts";
import { one, rows, run } from "@kernel/db/database.ts";
import { env } from "@kernel/config/env.ts";
import { nowIso } from "@kernel/util.ts";

interface PendingNotification {
  id: string;
  tenant_id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  url: string;
  data_json: string;
  push_enabled: number;
  assignments: number;
  po_changes: number;
  demand_messages: number;
  new_issues: number;
  hide_details: number;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured = false;
let running = false;

function configure(): boolean {
  if (configured) return true;
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return false;
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
  configured = true;
  return true;
}

function wants(kind: string, prefs: PendingNotification): boolean {
  if (!prefs.push_enabled) return false;
  if (kind === "assigned" || kind === "promoted") return prefs.assignments === 1;
  if (kind === "po") return prefs.po_changes === 1;
  if (kind === "message") return prefs.demand_messages === 1;
  if (kind === "issue") return prefs.new_issues === 1;
  return true;
}

function errorStatus(error: unknown): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    return Number(error.statusCode);
  }
  return 0;
}

function payload(notification: PendingNotification): string {
  let itemId: string | undefined;
  try {
    const data = JSON.parse(notification.data_json) as { item_id?: string };
    itemId = data.item_id;
  } catch {
    itemId = undefined;
  }
  return JSON.stringify({
    title: notification.hide_details ? "Meraki" : notification.title,
    body: notification.hide_details ? "Abra o Meraki para ver." : notification.body,
    url: notification.url.startsWith("/") ? notification.url : "/demands",
    tag: itemId ? `item-${itemId}` : notification.id,
    id: notification.id,
  });
}

function markProcessed(db: Db, notificationId: string): void {
  const pending = one<{ n: number }>(
    db,
    "SELECT COUNT(*) AS n FROM push_deliveries WHERE notification_id = ? AND status IN ('pending','failed')",
    notificationId,
  );
  if ((pending?.n ?? 0) === 0) {
    run(
      db,
      "UPDATE notifications SET pushed_at = ? WHERE id = ? AND pushed_at IS NULL",
      nowIso(),
      notificationId,
    );
  }
}

async function sendDelivery(
  db: Db,
  delivery: {
    notification_id: string;
    subscription_id: string;
    attempts: number;
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  body: string,
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: delivery.endpoint,
        keys: { p256dh: delivery.p256dh, auth: delivery.auth },
      },
      body,
      { TTL: 3600, urgency: "normal" },
    );
    run(
      db,
      "UPDATE push_deliveries SET status = 'sent', attempts = attempts + 1, updated_at = ?, last_error = NULL WHERE notification_id = ? AND subscription_id = ?",
      nowIso(),
      delivery.notification_id,
      delivery.subscription_id,
    );
  } catch (error) {
    const status = errorStatus(error);
    const message = error instanceof Error ? error.message.slice(0, 300) : "push failed";
    const attempts = delivery.attempts + 1;
    if (status === 404 || status === 410) {
      run(
        db,
        "UPDATE push_subscriptions SET disabled_at = ? WHERE id = ?",
        nowIso(),
        delivery.subscription_id,
      );
      run(
        db,
        "UPDATE push_deliveries SET status = 'gone', attempts = ?, updated_at = ?, last_error = ? WHERE notification_id = ? AND subscription_id = ?",
        attempts,
        nowIso(),
        message,
        delivery.notification_id,
        delivery.subscription_id,
      );
    } else {
      const delayMinutes = Math.min(60, 2 ** Math.min(attempts, 5));
      const next = new Date(Date.now() + delayMinutes * 60_000).toISOString();
      run(
        db,
        `UPDATE push_deliveries SET status = 'failed', attempts = ?, updated_at = ?, last_error = ?,
          next_attempt_at = ? WHERE notification_id = ? AND subscription_id = ?`,
        attempts,
        nowIso(),
        message,
        next,
        delivery.notification_id,
        delivery.subscription_id,
      );
    }
  }
}

/** Drena inbox → subscriptions → Web Push. Uma instância; falha não desfaz a ação. */
export async function drainPush(db: Db): Promise<{ sent: number; failed: number }> {
  if (running || !configure()) return { sent: 0, failed: 0 };
  running = true;
  let sent = 0;
  let failed = 0;
  try {
    const notifications = rows<PendingNotification>(
      db,
      `SELECT n.*, p.push_enabled, p.assignments, p.po_changes, p.demand_messages,
        p.new_issues, p.hide_details
       FROM notifications n JOIN notification_preferences p ON p.user_id = n.user_id
       WHERE n.pushed_at IS NULL ORDER BY n.created_at LIMIT 50`,
    );
    for (const notification of notifications) {
      if (!wants(notification.kind, notification)) {
        run(db, "UPDATE notifications SET pushed_at = ? WHERE id = ?", nowIso(), notification.id);
        continue;
      }
      const subscriptions = rows<SubscriptionRow>(
        db,
        `SELECT id, endpoint, p256dh, auth FROM push_subscriptions
         WHERE user_id = ? AND disabled_at IS NULL ORDER BY last_seen_at DESC`,
        notification.user_id,
      );
      if (subscriptions.length === 0) {
        run(db, "UPDATE notifications SET pushed_at = ? WHERE id = ?", nowIso(), notification.id);
        continue;
      }
      const body = payload(notification);
      for (const subscription of subscriptions) {
        run(
          db,
          `INSERT OR IGNORE INTO push_deliveries(notification_id, subscription_id, status, attempts, updated_at)
           VALUES (?, ?, 'pending', 0, ?)`,
          notification.id,
          subscription.id,
          nowIso(),
        );
        const delivery = one<{ attempts: number }>(
          db,
          "SELECT attempts FROM push_deliveries WHERE notification_id = ? AND subscription_id = ?",
          notification.id,
          subscription.id,
        );
        const current = one<{ status: string; next_attempt_at: string | null }>(
          db,
          "SELECT status, next_attempt_at FROM push_deliveries WHERE notification_id = ? AND subscription_id = ?",
          notification.id,
          subscription.id,
        );
        if (current?.status === "sent" || current?.status === "gone") continue;
        if (current?.next_attempt_at && current.next_attempt_at > nowIso()) continue;
        await sendDelivery(db, {
          notification_id: notification.id,
          subscription_id: subscription.id,
          attempts: delivery?.attempts ?? 0,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        }, body);
        const result = one<{ status: string }>(
          db,
          "SELECT status FROM push_deliveries WHERE notification_id = ? AND subscription_id = ?",
          notification.id,
          subscription.id,
        );
        if (result?.status === "sent") sent++;
        else failed++;
      }
      markProcessed(db, notification.id);
    }
    return { sent, failed };
  } finally {
    running = false;
  }
}

export function startPushTimer(db: Db): ReturnType<typeof setInterval> {
  return setInterval(() => {
    void drainPush(db).catch((error) => {
      console.error(JSON.stringify({ event: "push_drain_failed", error: String(error) }));
    });
  }, 30_000);
}
