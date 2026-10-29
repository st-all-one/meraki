import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Db } from "@kernel/db/database.ts";
import { one, run, tx } from "@kernel/db/database.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { formValue } from "@kernel/http/request.ts";
import { env } from "@kernel/config/env.ts";
import { blake3Hex } from "@kernel/crypto/hash.ts";
import { nowIso, uuidv7 } from "@kernel/util.ts";
import { render } from "@kernel/http/render.ts";
import {
  listNotifications,
  markAllRead,
  markRead,
  notificationPreferences,
  unreadCount,
} from "@services/notifications/service.ts";
import { InboxPage, NotificationSettingsPage } from "../views/notifications.tsx";

function validateEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?$)/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function accountRoutes(db: Db, tenantId: string): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.get("/notifications", (c) => {
    const actor = c.get("actor")!;
    return render(
      c,
      (
        <InboxPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          notifications={listNotifications(db, actor.id)}
        />
      ),
    );
  });

  app.post("/notifications/:id/read", (c) => {
    const actor = c.get("actor")!;
    markRead(db, actor.id, c.req.param("id"));
    return c.redirect("/notifications", 303);
  });

  app.post("/notifications/read-all", (c) => {
    const actor = c.get("actor")!;
    markAllRead(db, actor.id);
    return c.redirect("/notifications", 303);
  });

  app.get("/account/notifications", (c) => {
    const actor = c.get("actor")!;
    const subscriptions = db.prepare(
      `SELECT id, user_agent, created_at FROM push_subscriptions
       WHERE user_id = ? AND disabled_at IS NULL ORDER BY created_at DESC`,
    ).all(actor.id) as { id: string; user_agent: string | null; created_at: string }[];
    return render(
      c,
      (
        <NotificationSettingsPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          prefs={notificationPreferences(db, actor.id)}
          subscriptions={subscriptions}
          vapidPublic={env.vapidPublicKey}
          ok={c.req.query("ok")}
        />
      ),
    );
  });

  app.post("/account/notifications/preferences", async (c) => {
    const actor = c.get("actor")!;
    const body = await c.req.parseBody();
    const value = (key: string) => body[key] === "1" || body[key] === "on" ? 1 : 0;
    run(
      db,
      `INSERT INTO notification_preferences(user_id, push_enabled, assignments, po_changes,
        demand_messages, new_issues, hide_details, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         push_enabled = excluded.push_enabled, assignments = excluded.assignments,
         po_changes = excluded.po_changes, demand_messages = excluded.demand_messages,
         new_issues = excluded.new_issues, hide_details = excluded.hide_details,
         updated_at = excluded.updated_at`,
      actor.id,
      value("push_enabled"),
      value("assignments"),
      value("po_changes"),
      value("demand_messages"),
      value("new_issues"),
      value("hide_details"),
      nowIso(),
    );
    return c.redirect("/account/notifications?ok=preferences", 303);
  });

  app.post("/account/push/subscriptions", async (c) => {
    const actor = c.get("actor")!;
    const body = await c.req.json().catch(() => null) as {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    } | null;
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
    const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
    const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
    if (!validateEndpoint(endpoint) || !p256dh || !auth) {
      throw new HTTPException(422, { message: "Subscription inválida." });
    }
    const endpointHash = blake3Hex(endpoint);
    const count = one<{ n: number }>(
      db,
      "SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ? AND disabled_at IS NULL",
      actor.id,
    );
    if ((count?.n ?? 0) >= 5) {
      throw new HTTPException(422, { message: "Limite de 5 dispositivos." });
    }
    const now = nowIso();
    tx(db, () => {
      run(
        db,
        `INSERT INTO push_subscriptions(id, tenant_id, user_id, endpoint_hash, endpoint, p256dh, auth,
          user_agent, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint_hash) DO UPDATE SET
           user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
           user_agent = excluded.user_agent, last_seen_at = excluded.last_seen_at, disabled_at = NULL`,
        uuidv7(),
        tenantId,
        actor.id,
        endpointHash,
        endpoint,
        p256dh,
        auth,
        c.req.header("user-agent") ?? null,
        now,
        now,
      );
      run(
        db,
        "UPDATE notification_preferences SET push_enabled = 1, updated_at = ? WHERE user_id = ?",
        now,
        actor.id,
      );
    });
    return c.json({ ok: true });
  });

  app.post("/account/push/subscriptions/delete", async (c) => {
    const actor = c.get("actor")!;
    const body = await c.req.parseBody();
    run(
      db,
      "UPDATE push_subscriptions SET disabled_at = ? WHERE id = ? AND user_id = ?",
      nowIso(),
      formValue(body["subscription_id"] ?? null),
      actor.id,
    );
    return c.redirect("/account/notifications?ok=removed", 303);
  });

  return app;
}
