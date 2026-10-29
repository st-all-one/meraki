import { DatabaseSync } from "node:sqlite";
import { basename, dirname, fromFileUrl, join } from "@std/path";
import { env } from "../config/env.ts";
import { blake3Hex } from "../crypto/hash.ts";

export type Db = DatabaseSync;
export type DbParam = string | number | bigint | null | Uint8Array;

/** Primitivas de banco do kernel. Não conhece tabelas de domínio. */
export function openDb(path = env.dbPath): Db {
  if (path !== ":memory:") Deno.mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = ${env.dbBusyTimeoutMs};`);
  return db;
}

export function rows<T>(db: Db, sql: string, ...params: DbParam[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function one<T>(db: Db, sql: string, ...params: DbParam[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(db: Db, sql: string, ...params: DbParam[]): {
  changes: number;
  lastInsertRowid: number | bigint;
} {
  const result = db.prepare(sql).run(...params);
  return { changes: Number(result.changes), lastInsertRowid: result.lastInsertRowid };
}

export function tx<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = fn();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // A transação já pode ter sido desfeita pelo SQLite.
    }
    throw error;
  }
}

async function migrationFiles(dir: string, out: string[] = []): Promise<string[]> {
  for await (const entry of Deno.readDir(dir)) {
    if (entry.name === "node_modules" || entry.name === "data" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory) await migrationFiles(path, out);
    else if (entry.isFile && entry.name.endsWith(".sql") && dir.endsWith("/migrations")) {
      out.push(path);
    }
  }
  return out;
}

/** Runner up-only de ADR-013: descobre `<dono>/migrations/*.sql` e ordena por versão. */
export async function migrate(db: Db): Promise<{ applied: string[] }> {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT;`);
  const srcRoot = fromFileUrl(new URL("../../", import.meta.url));
  const files = (await migrationFiles(srcRoot)).sort((a, b) =>
    basename(a).localeCompare(basename(b))
  );
  const seen = new Set<string>();
  const applied: string[] = [];
  for (const file of files) {
    const version = basename(file, ".sql");
    if (seen.has(version)) throw new Error(`migration duplicada: ${version}`);
    seen.add(version);
    const sql = await Deno.readTextFile(file);
    const checksum = blake3Hex(sql);
    const existing = one<{ checksum: string }>(
      db,
      "SELECT checksum FROM schema_migrations WHERE version = ?",
      version,
    );
    if (existing) {
      if (existing.checksum !== checksum) {
        throw new Error(`migration ${version} mudou depois de aplicada`);
      }
      continue;
    }
    tx(db, () => {
      db.exec(sql);
      run(
        db,
        "INSERT INTO schema_migrations(version, checksum, applied_at) VALUES (?, ?, ?)",
        version,
        checksum,
        new Date().toISOString(),
      );
    });
    applied.push(version);
  }
  return { applied };
}
