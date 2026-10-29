import { Hono } from "hono";
import type { Db } from "@kernel/db/database.ts";
import { one, rows, run, tx } from "@kernel/db/database.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { boolValue, formValue } from "@kernel/http/request.ts";
import { requireRole } from "@services/auth/middleware.ts";
import { hashPassword } from "@kernel/crypto/hash.ts";
import { normalizeEmail, nowIso, uuidv7 } from "@kernel/util.ts";
import { render } from "@kernel/http/render.ts";
import { UserEditPage, UserNewPage, UsersPage } from "../views/users.tsx";
import type { Role } from "@services/auth/contract.ts";
import { unreadCount } from "@services/notifications/service.ts";
import { generateTempPassword, updateUserRole } from "./auth.tsx";

interface UserRow {
  id: string;
  display_name: string;
  email: string;
  role: Role;
  active: number;
  created_at: string;
}

function allUsers(db: Db, tenantId: string): UserRow[] {
  return rows<UserRow>(
    db,
    "SELECT id, display_name, email, role, active, created_at FROM users WHERE tenant_id = ? ORDER BY display_name COLLATE NOCASE",
    tenantId,
  );
}

function findUser(db: Db, tenantId: string, id: string): UserRow | undefined {
  return one<UserRow>(
    db,
    "SELECT id, display_name, email, role, active, created_at FROM users WHERE id = ? AND tenant_id = ?",
    id,
    tenantId,
  );
}

export function adminRoutes(db: Db, tenantId: string): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use("/admin/users", requireRole(["admin"]));
  app.use("/admin/users/*", requireRole(["admin"]));

  app.get("/admin/users", (c) => {
    const actor = c.get("actor")!;
    return render(
      c,
      (
        <UsersPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          users={allUsers(db, tenantId)}
          ok={c.req.query("ok")}
        />
      ),
    );
  });

  app.get("/admin/users/new", (c) => {
    const actor = c.get("actor")!;
    return render(c, <UserNewPage actor={actor} unread={unreadCount(db, actor.id)} />);
  });

  app.post("/admin/users", async (c) => {
    const actor = c.get("actor")!;
    const body = await c.req.parseBody();
    const name = formValue(body["name"] ?? null);
    const email = normalizeEmail(formValue(body["email"] ?? null));
    const role = formValue(body["role"] ?? null) as Role;
    if (
      name.length < 2 || !email.includes("@") || !["admin", "manager", "developer"].includes(role)
    ) {
      return render(
        c,
        (
          <UserNewPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            error="Preencha nome, e-mail e cargo válidos."
          />
        ),
        422,
      );
    }
    const exists = one<{ id: string }>(
      db,
      "SELECT id FROM users WHERE tenant_id = ? AND lower(email) = lower(?)",
      tenantId,
      email,
    );
    if (exists) {
      return render(
        c,
        (
          <UserNewPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            error="Já existe usuário com este e-mail."
          />
        ),
        409,
      );
    }
    const password = generateTempPassword();
    const id = uuidv7();
    const now = nowIso();
    tx(db, () => {
      run(
        db,
        `INSERT INTO users(id, tenant_id, email, display_name, password_hash, role,
          must_change_password, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
        id,
        tenantId,
        email,
        name,
        hashPassword(password),
        role,
        now,
        now,
      );
      run(db, "INSERT INTO notification_preferences(user_id, updated_at) VALUES (?, ?)", id, now);
    });
    return render(
      c,
      (
        <UsersPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          users={allUsers(db, tenantId)}
          created={{ name, email, password }}
        />
      ),
      201,
    );
  });

  app.get("/admin/users/:id", (c) => {
    const actor = c.get("actor")!;
    const user = findUser(db, tenantId, c.req.param("id"));
    if (!user) return c.notFound();
    return render(
      c,
      (
        <UserEditPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          user={user}
          temp={c.req.query("temp")}
        />
      ),
    );
  });

  app.post("/admin/users/:id", async (c) => {
    const actor = c.get("actor")!;
    const target = findUser(db, tenantId, c.req.param("id"));
    if (!target) return c.notFound();
    const body = await c.req.parseBody();
    try {
      updateUserRole(
        db,
        actor,
        target.id,
        formValue(body["role"] ?? null),
        boolValue(body["active"] ?? null),
      );
      return c.redirect("/admin/users?ok=updated", 303);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar.";
      return render(
        c,
        (
          <UserEditPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            user={target}
            error={message}
          />
        ),
        422,
      );
    }
  });

  app.post("/admin/users/:id/block", (c) => {
    const actor = c.get("actor")!;
    const target = findUser(db, tenantId, c.req.param("id"));
    if (!target) return c.notFound();
    try {
      updateUserRole(db, actor, target.id, target.role, false);
      return c.redirect("/admin/users?ok=blocked", 303);
    } catch (error) {
      return render(
        c,
        (
          <UsersPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            users={allUsers(db, tenantId)}
            error={error instanceof Error ? error.message : "Não foi possível bloquear."}
          />
        ),
        422,
      );
    }
  });

  app.post("/admin/users/:id/unblock", (c) => {
    const actor = c.get("actor")!;
    const target = findUser(db, tenantId, c.req.param("id"));
    if (!target) return c.notFound();
    updateUserRole(db, actor, target.id, target.role, true);
    return c.redirect("/admin/users?ok=unblocked", 303);
  });

  app.post("/admin/users/:id/password", (c) => {
    const actor = c.get("actor")!;
    const target = findUser(db, tenantId, c.req.param("id"));
    if (!target) return c.notFound();
    const password = generateTempPassword();
    const now = nowIso();
    tx(db, () => {
      run(
        db,
        "UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = ? WHERE id = ?",
        hashPassword(password),
        now,
        target.id,
      );
      run(
        db,
        "UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
        now,
        target.id,
      );
    });
    return render(
      c,
      (
        <UserEditPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          user={target}
          temp={password}
        />
      ),
    );
  });

  return app;
}
