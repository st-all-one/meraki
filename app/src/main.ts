import { join } from "@std/path";
import { createApp } from "./app.tsx";
import { createRuntime } from "./runtime.ts";
import { env } from "@kernel/config/env.ts";
import { migrate, one, openDb, run } from "@kernel/db/database.ts";
import { seed } from "./db/seed.ts";
import { tenant } from "@services/tenancy/service.ts";
import { hashPassword, opaqueToken } from "@kernel/crypto/hash.ts";
import { systemClock } from "@kernel/time/clock.ts";
import { backup, restore } from "./db/operations.ts";
import { drainPush, startPushTimer } from "@services/notifications/push.ts";

const command = Deno.args[0];

if (command === "migrate" || command === "db:reset") {
  if (command === "db:reset" && env.isProduction) {
    console.error("db:reset é proibido em produção");
    Deno.exit(2);
  }
  if (command === "db:reset") {
    for (const suffix of ["", "-wal", "-shm"]) {
      try {
        await Deno.remove(`${env.dbPath}${suffix}`);
      } catch {
        // Arquivo já inexistente.
      }
    }
  }
  const db = openDb();
  try {
    console.log(JSON.stringify(await migrate(db)));
  } finally {
    db.close();
  }
  Deno.exit(0);
}

if (command === "seed") {
  const db = openDb();
  try {
    await migrate(db);
    console.log(JSON.stringify(seed(db)));
  } finally {
    db.close();
  }
  Deno.exit(0);
}

if (command === "create-admin") {
  const emailArg = arg("--email");
  const nameArg = arg("--name") ?? "Admin";
  if (!emailArg || !emailArg.includes("@")) {
    console.error('uso: meraki create-admin --email admin@empresa --name "Admin"');
    Deno.exit(2);
  }
  const db = openDb();
  try {
    await migrate(db);
    const t = tenant(db);
    if (
      one(
        db,
        "SELECT id FROM users WHERE tenant_id = ? AND lower(email) = lower(?)",
        t.id,
        emailArg,
      )
    ) {
      console.error("usuário já existe");
      Deno.exit(4);
    }
    const password = `Mk-${opaqueToken(9)}`;
    const now = systemClock.nowIso();
    const id = systemClock.uuidv7();
    run(
      db,
      `INSERT INTO users(id, tenant_id, email, display_name, password_hash, role,
        must_change_password, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'admin', 1, 1, ?, ?)`,
      id,
      t.id,
      emailArg.trim().toLowerCase(),
      nameArg,
      hashPassword(password),
      now,
      now,
    );
    run(db, "INSERT INTO notification_preferences(user_id, updated_at) VALUES (?, ?)", id, now);
    console.log(JSON.stringify({ email: emailArg, password, must_change_password: true }));
  } finally {
    db.close();
  }
  Deno.exit(0);
}

if (command === "backup") {
  const db = openDb();
  try {
    console.log(JSON.stringify(await backup(db)));
  } finally {
    db.close();
  }
  Deno.exit(0);
}

if (command === "restore") {
  const source = Deno.args[1];
  if (!source) {
    console.error("uso: meraki restore <diretório-de-backup> [--force]");
    Deno.exit(2);
  }
  try {
    console.log(JSON.stringify(await restore(source, Deno.args.includes("--force"))));
  } catch (error) {
    console.error(`restore falhou: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
  Deno.exit(0);
}

if (command === "doctor") {
  const db = openDb();
  try {
    const integrity = db.prepare("PRAGMA integrity_check").all() as { integrity_check: string }[];
    const fk = db.prepare("PRAGMA foreign_key_check").all();
    const migrations = db.prepare("SELECT version FROM schema_migrations ORDER BY version").all();
    const report = {
      ok: integrity.every((row) => row.integrity_check === "ok") && fk.length === 0,
      integrity,
      fk,
      migrations,
    };
    console.log(JSON.stringify(report));
    Deno.exit(report.ok ? 0 : 1);
  } finally {
    db.close();
  }
}

if (command === "push:keys") {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const publicKey = new Uint8Array([
    4,
    ...base64UrlDecode(publicJwk.x ?? ""),
    ...base64UrlDecode(publicJwk.y ?? ""),
  ]);
  console.log(JSON.stringify({
    VAPID_PUBLIC_KEY: base64Url(publicKey),
    VAPID_PRIVATE_KEY: privateJwk.d ?? "",
    VAPID_SUBJECT: env.vapidSubject,
  }));
  Deno.exit(0);
}

function arg(name: string): string | undefined {
  const index = Deno.args.indexOf(name);
  return index >= 0 ? Deno.args[index + 1] : undefined;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

Deno.mkdirSync(env.dataPath, { recursive: true, mode: 0o700 });
const autoMigrate = (Deno.env.get("AUTO_MIGRATE") ?? "true") === "true";
if (autoMigrate) {
  const migrationDb = openDb();
  try {
    console.log(JSON.stringify(await migrate(migrationDb)));
  } finally {
    migrationDb.close();
  }
}
const seedOnBoot = (Deno.env.get("SEED_ON_BOOT") ?? "true") === "true";
if (!env.isProduction && seedOnBoot) {
  const seedDb = openDb();
  try {
    await migrate(seedDb);
    console.log(JSON.stringify(seed(seedDb)));
  } finally {
    seedDb.close();
  }
}

Deno.mkdirSync(join(env.dataPath, "attachments"), { recursive: true, mode: 0o700 });
const runtime = await createRuntime();
startPushTimer(runtime.db);
void drainPush(runtime.db).catch(() => {});
const app = createApp(runtime);

const server = Deno.serve({
  port: env.port,
  hostname: env.host,
  onListen: ({ hostname, port }) => {
    console.log(
      JSON.stringify({ event: "listen", url: `http://${hostname}:${port}`, env: env.appEnv }),
    );
  },
}, app.fetch);

const shutdown = async (signal: string): Promise<void> => {
  console.log(JSON.stringify({ event: "shutdown", signal }));
  await server.shutdown();
  runtime.close();
  Deno.exit(0);
};
Deno.addSignalListener("SIGINT", () => void shutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => void shutdown("SIGTERM"));
