import type { Db } from "../kernel/db/database.ts";
import { one, run, tx } from "../kernel/db/database.ts";
import { env } from "../kernel/config/env.ts";
import { hashPassword } from "../kernel/crypto/hash.ts";
import { systemClock } from "../kernel/time/clock.ts";

/** Seed de desenvolvimento; recusa produção. */
export function seed(db: Db, email = env.seedEmail, password = env.seedPassword): {
  tenantId: string;
  userId: string;
  projectId: string;
} {
  if (env.isProduction) throw new Error("seed é proibido em produção");
  const existing = one<{ id: string }>(db, "SELECT id FROM tenants WHERE slug = 'default'");
  const tenantId = existing?.id ?? systemClock.uuidv7();
  const now = systemClock.nowIso();
  tx(db, () => {
    if (!existing) {
      run(
        db,
        "INSERT INTO tenants(id, slug, name, created_at) VALUES (?, 'default', 'Meraki', ?)",
        tenantId,
        now,
      );
    }
    let user = one<{ id: string }>(
      db,
      "SELECT id FROM users WHERE tenant_id = ? AND email = ?",
      tenantId,
      email,
    );
    if (!user) {
      const userId = systemClock.uuidv7();
      run(
        db,
        `INSERT INTO users(id, tenant_id, email, display_name, password_hash, role,
          must_change_password, password_changed_at, active, created_at, updated_at)
         VALUES (?, ?, ?, 'Admin', ?, 'admin', 0, ?, 1, ?, ?)`,
        userId,
        tenantId,
        email,
        hashPassword(password),
        now,
        now,
        now,
      );
      user = { id: userId };
    }
    let project = one<{ id: string }>(
      db,
      "SELECT id FROM projects WHERE tenant_id = ? AND key = 'GERAL'",
      tenantId,
    );
    if (!project) {
      const projectId = systemClock.uuidv7();
      run(
        db,
        `INSERT INTO projects(id, tenant_id, key, name, next_seq, created_by, created_at, updated_at)
         VALUES (?, ?, 'GERAL', 'Geral', 1, ?, ?, ?)`,
        projectId,
        tenantId,
        user.id,
        now,
        now,
      );
      project = { id: projectId };
    }
    const general = one<{ id: string }>(
      db,
      "SELECT id FROM chat_channels WHERE tenant_id = ? AND scope = 'general'",
      tenantId,
    );
    if (!general) {
      run(
        db,
        "INSERT INTO chat_channels(id, tenant_id, scope, name, created_at) VALUES (?, ?, 'general', 'Geral', ?)",
        systemClock.uuidv7(),
        tenantId,
        now,
      );
    }
    const prefs = one<{ user_id: string }>(
      db,
      "SELECT user_id FROM notification_preferences WHERE user_id = ?",
      user.id,
    );
    if (!prefs) {
      run(
        db,
        "INSERT INTO notification_preferences(user_id, updated_at) VALUES (?, ?)",
        user.id,
        now,
      );
    }
  });
  const user = one<{ id: string }>(
    db,
    "SELECT id FROM users WHERE tenant_id = ? AND email = ?",
    tenantId,
    email,
  );
  const project = one<{ id: string }>(
    db,
    "SELECT id FROM projects WHERE tenant_id = ? AND key = 'GERAL'",
    tenantId,
  );
  if (!user || !project) throw new Error("seed incompleto");
  return { tenantId, userId: user.id, projectId: project.id };
}
