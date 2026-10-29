import { Hono } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import type { Db } from "@kernel/db/database.ts";
import { one, run, tx } from "@kernel/db/database.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { formValue } from "@kernel/http/request.ts";
import type { Actor } from "@services/auth/contract.ts";
import {
  clearSessionCookie,
  clientIpFrom,
  login,
  revokeSession,
  setSessionCookie,
} from "../application/session.ts";
import { hashPassword, opaqueToken, verifyPassword } from "@kernel/crypto/hash.ts";
import { env } from "@kernel/config/env.ts";
import { rateLimit } from "@kernel/rate-limit.ts";
import { rateLimitKey } from "../application/session.ts";
import { requireLogin } from "@services/auth/middleware.ts";
import { normalizeEmail, nowIso, safeNextPath } from "@kernel/util.ts";
import { noStore, render } from "@kernel/http/render.ts";
import { LoginPage, PasswordPage } from "../views/auth.tsx";
import { unreadCount } from "@services/notifications/service.ts";

export function authRoutes(db: Db, tenantId: string): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.get("/login", (c) => {
    noStore(c);
    if (c.get("actor")) return c.redirect("/demands", 302);
    return render(
      c,
      (
        <LoginPage
          actor={null}
          next={c.req.query("next")}
          showSeed={!env.isProduction}
          seedEmail={env.seedEmail}
        />
      ),
    );
  });

  app.post("/login", async (c) => {
    noStore(c);
    const body = await c.req.parseBody();
    const email = normalizeEmail(formValue(body["email"] ?? null));
    const password = formValue(body["password"] ?? null);
    const rate = rateLimit(rateLimitKey(email, clientIpFrom(c)), env.rateLogin, 60);
    if (!rate.allowed) {
      c.header("Retry-After", String(rate.retryAfterSeconds));
      return render(
        c,
        (
          <LoginPage
            actor={null}
            email={email}
            error="Muitas tentativas. Tente novamente."
            showSeed={!env.isProduction}
            seedEmail={env.seedEmail}
          />
        ),
        429,
      );
    }
    const result = login(db, email, password);
    if (!result.ok) {
      run(
        db,
        `INSERT INTO audit_logs(id, tenant_id, actor_email, action, metadata, created_at)
         VALUES (?, ?, ?, 'login_failed', '{"reason":"invalid_credentials"}', ?)`,
        crypto.randomUUID(),
        tenantId,
        email,
        nowIso(),
      );
      return render(
        c,
        (
          <LoginPage
            actor={null}
            email={email}
            error="E-mail ou senha inválidos."
            showSeed={!env.isProduction}
            seedEmail={env.seedEmail}
          />
        ),
        401,
      );
    }
    setSessionCookie(c, result.token);
    if (result.actor.mustChangePassword) return c.redirect("/account/password", 303);
    return c.redirect(safeNextPath(formValue(body["next"] ?? null) || undefined), 303);
  });

  app.post("/logout", requireLogin(), (c) => {
    const token = getCookie(c, env.sessionCookie);
    if (token) revokeSession(db, token);
    clearSessionCookie(c);
    return c.redirect("/login", 303);
  });

  app.get("/account/password", requireLogin(), (c) => {
    const actor = c.get("actor")!;
    noStore(c);
    return render(
      c,
      (
        <PasswordPage
          actor={actor}
          required={actor.mustChangePassword}
          unread={unreadCount(db, actor.id)}
        />
      ),
    );
  });

  app.post("/account/password", requireLogin(), async (c) => {
    const actor = c.get("actor")!;
    const body = await c.req.parseBody();
    const current = formValue(body["current"] ?? null);
    const password = formValue(body["password"] ?? null);
    const confirm = formValue(body["confirm"] ?? null);
    const user = one<{ password_hash: string }>(
      db,
      "SELECT password_hash FROM users WHERE id = ?",
      actor.id,
    );
    if (!user || !verifyPassword(current, user.password_hash)) {
      return render(
        c,
        <PasswordPage
          actor={actor}
          required={actor.mustChangePassword}
          error="Senha atual incorreta."
        />,
        422,
      );
    }
    if (password.length < 12) {
      return render(
        c,
        <PasswordPage
          actor={actor}
          required={actor.mustChangePassword}
          error="A nova senha deve ter ao menos 12 caracteres."
        />,
        422,
      );
    }
    if (password !== confirm) {
      return render(
        c,
        <PasswordPage
          actor={actor}
          required={actor.mustChangePassword}
          error="A confirmação não confere."
        />,
        422,
      );
    }
    const now = nowIso();
    tx(db, () => {
      run(
        db,
        "UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = ?, updated_at = ? WHERE id = ?",
        hashPassword(password),
        now,
        now,
        actor.id,
      );
      run(
        db,
        "UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id <> ? AND revoked_at IS NULL",
        now,
        actor.id,
        actor.sessionId,
      );
    });
    return c.redirect("/demands?ok=password", 303);
  });

  app.get("/", (c) => c.redirect(c.get("actor") ? "/demands" : "/login", 302));

  return app;
}

export function generateTempPassword(): string {
  return `${opaqueToken(8).slice(0, 12)}-${opaqueToken(4).slice(0, 6)}`;
}

export function updateUserRole(
  db: Db,
  actor: Actor,
  targetId: string,
  role: string,
  active: boolean,
): void {
  if (!["admin", "manager", "developer"].includes(role)) {
    throw new HTTPException(422, { message: "Cargo inválido" });
  }
  const target = one<{ id: string; role: string; active: number }>(
    db,
    "SELECT id, role, active FROM users WHERE id = ? AND tenant_id = ?",
    targetId,
    actor.tenantId,
  );
  if (!target) throw new HTTPException(404, { message: "Usuário não encontrado" });
  if (target.id === actor.id && !active) {
    throw new HTTPException(422, { message: "Você não pode se autobloquear." });
  }
  if (target.role === "admin" && (role !== "admin" || !active)) {
    const admins = one<{ n: number }>(
      db,
      "SELECT COUNT(*) AS n FROM users WHERE tenant_id = ? AND role = 'admin' AND active = 1",
      actor.tenantId,
    );
    if ((admins?.n ?? 0) <= 1) {
      throw new HTTPException(422, { message: "O último admin precisa permanecer ativo." });
    }
  }
  const now = nowIso();
  run(
    db,
    "UPDATE users SET role = ?, active = ?, updated_at = ? WHERE id = ?",
    role,
    active ? 1 : 0,
    now,
    targetId,
  );
  if (!active) {
    run(
      db,
      "UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
      now,
      targetId,
    );
  }
}

export function deleteSessionCookie(c: Parameters<typeof deleteCookie>[0]): void {
  deleteCookie(c, env.sessionCookie, { path: "/" });
}
