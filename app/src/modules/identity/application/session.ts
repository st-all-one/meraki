import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context, MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/deno";
import type { AppEnv } from "@kernel/auth/context.ts";
import type { Db } from "@kernel/db/database.ts";
import { one, run } from "@kernel/db/database.ts";
import {
  blake3Hex,
  hashPassword,
  opaqueToken,
  verifyDecoy,
  verifyPassword,
} from "@kernel/crypto/hash.ts";
import { cookieOptions, env } from "@kernel/config/env.ts";
import { normalizeEmail, nowIso, uuidv7 } from "@kernel/util.ts";
import type { Actor, Role } from "@kernel/auth/context.ts";

export interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  password_hash: string;
  role: Role;
  must_change_password: number;
  active: number;
}

export function findActor(db: Db, token: string): Actor | null {
  const row = one<UserRow & { session_id: string; last_seen_at: string; expires_at: string }>(
    db,
    `SELECT s.id AS session_id, s.last_seen_at, s.expires_at,
            u.id, u.tenant_id, u.email, u.display_name, u.role, u.must_change_password, u.active
     FROM sessions s JOIN users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND u.active = 1`,
    blake3Hex(token),
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  if (new Date(row.last_seen_at).getTime() < Date.now() - 5 * 60 * 1000) {
    run(db, "UPDATE sessions SET last_seen_at = ? WHERE id = ?", nowIso(), row.session_id);
  }
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.display_name,
    role: row.role,
    sessionId: row.session_id,
    mustChangePassword: row.must_change_password === 1,
  };
}

export function createSession(
  db: Db,
  user: Pick<Actor, "id" | "tenantId">,
  context: { userAgent?: string | null; ip?: string | null } = {},
): { token: string; sessionId: string; expiresAt: string } {
  const token = opaqueToken(32);
  const id = uuidv7();
  const now = nowIso();
  const expiresAt = new Date(Date.now() + env.sessionTtlSeconds * 1000).toISOString();
  run(
    db,
    `INSERT INTO sessions(id, tenant_id, user_id, token_hash, user_agent, ip,
      created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    user.tenantId,
    user.id,
    blake3Hex(token),
    context.userAgent ?? null,
    context.ip ?? null,
    now,
    now,
    expiresAt,
  );
  return { token, sessionId: id, expiresAt };
}

export function login(
  db: Db,
  email: string,
  password: string,
): { ok: true; actor: Actor; token: string } | { ok: false } {
  const normalized = normalizeEmail(email);
  const user = one<UserRow & { tenant_id: string }>(
    db,
    "SELECT * FROM users WHERE email = ? AND active = 1 ORDER BY created_at LIMIT 1",
    normalized,
  );
  if (!user) {
    verifyDecoy(password);
    return { ok: false };
  }
  if (!verifyPassword(password, user.password_hash)) return { ok: false };
  const session = createSession(db, { id: user.id, tenantId: user.tenant_id });
  run(
    db,
    `INSERT INTO audit_logs(id, tenant_id, actor_id, actor_email, action, metadata, created_at)
     VALUES (?, ?, ?, ?, 'login_succeeded', '{}', ?)`,
    uuidv7(),
    user.tenant_id,
    user.id,
    user.email,
    nowIso(),
  );
  return {
    ok: true,
    token: session.token,
    actor: {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      name: user.display_name,
      role: user.role,
      sessionId: session.sessionId,
      mustChangePassword: user.must_change_password === 1,
    },
  };
}

export function audit(
  db: Db,
  actor: Actor | null,
  action: string,
  target: string | null = null,
  metadata: Record<string, unknown> = {},
  requestId: string | null = null,
): void {
  run(
    db,
    `INSERT INTO audit_logs(id, tenant_id, actor_id, actor_email, action, target, metadata, request_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    uuidv7(),
    actor?.tenantId ?? "",
    actor?.id ?? null,
    actor?.email ?? null,
    action,
    target,
    JSON.stringify(metadata),
    requestId,
    nowIso(),
  );
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, env.sessionCookie, token, cookieOptions(env.sessionTtlSeconds));
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, env.sessionCookie, { path: "/" });
}

export function revokeSession(db: Db, token: string): void {
  run(
    db,
    "UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
    nowIso(),
    blake3Hex(token),
  );
}

export function rateLimitKey(email: string, ip: string): string {
  return blake3Hex(`${normalizeEmail(email)}|${ip}`);
}

export function clientIpFrom(c: Context<AppEnv>): string {
  const remote = getConnInfo(c).remote.address ?? "unknown";
  const hops = env.trustProxyHops;
  if (hops === 0) return remote;
  const forwarded = c.req.header("x-forwarded-for");
  if (!forwarded) return remote;
  const chain = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
  return chain[Math.max(0, chain.length - hops)] ?? remote;
}

export { hashPassword };

export function sessionContext(db: Db): MiddlewareHandler {
  return async (c, next) => {
    const token = getCookie(c, env.sessionCookie);
    c.set("actor", token ? findActor(db, token) : null);
    await next();
  };
}
