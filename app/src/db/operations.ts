import { dirname, join } from "@std/path";
import type { Db } from "@kernel/db/database.ts";
import { env } from "@kernel/config/env.ts";
import { sha256Hex } from "@kernel/crypto/hash.ts";
import { nowIso } from "@kernel/util.ts";

async function filesUnder(root: string): Promise<string[]> {
  const result: string[] = [];
  async function walk(dir: string, prefix: string): Promise<void> {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isDirectory) await walk(join(dir, entry.name), `${prefix}${entry.name}/`);
      else if (entry.isFile) result.push(`${prefix}${entry.name}`);
    }
  }
  try {
    await walk(root, "");
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return result.sort();
}

export async function backup(db: Db): Promise<Record<string, unknown>> {
  const root = join(env.dataPath, "backups");
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const target = join(root, `meraki-${stamp}`);
  await Deno.mkdir(target, { recursive: true, mode: 0o700 });
  const dbFile = join(target, "meraki.sqlite3");
  const walFile = `${env.dbPath}-wal`;
  const walTarget = `${dbFile}-wal`;
  // `VACUUM INTO` exige ATTACH; Deno restringe ATTACH sem permissão total.
  // Em vez disso, bloqueia escritores e copia o par DB+WAL de forma consistente.
  db.exec("BEGIN IMMEDIATE");
  let walCopied = false;
  try {
    await Deno.copyFile(env.dbPath, dbFile);
    try {
      await Deno.copyFile(walFile, walTarget);
      walCopied = true;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  } finally {
    db.exec("COMMIT");
  }
  const attachmentSource = join(env.dataPath, "attachments");
  const files = await filesUnder(attachmentSource);
  for (const file of files) {
    const destination = join(target, "attachments", file);
    await Deno.mkdir(dirname(destination), { recursive: true, mode: 0o700 });
    await Deno.copyFile(join(attachmentSource, file), destination);
  }
  const dbBytes = await Deno.readFile(dbFile);
  const walBytes = walCopied ? await Deno.readFile(walTarget) : null;
  const manifest = {
    created_at: nowIso(),
    database: "meraki.sqlite3",
    database_sha256: await sha256Hex(dbBytes),
    wal: walCopied ? "meraki.sqlite3-wal" : null,
    wal_sha256: walBytes ? await sha256Hex(walBytes) : null,
    attachments: files.length,
    app: env.appName,
  };
  await Deno.writeTextFile(join(target, "manifest.json"), JSON.stringify(manifest, null, 2));
  return { ok: true, path: target, ...manifest };
}

export async function restore(source: string, force: boolean): Promise<Record<string, unknown>> {
  const manifestPath = join(source, "manifest.json");
  const manifest = JSON.parse(await Deno.readTextFile(manifestPath)) as {
    database?: string;
    database_sha256?: string;
    wal?: string | null;
    wal_sha256?: string | null;
    attachments?: number;
  };
  const dbSource = join(source, manifest.database ?? "meraki.sqlite3");
  const bytes = await Deno.readFile(dbSource);
  if (manifest.database_sha256) {
    const actual = await sha256Hex(bytes);
    if (actual !== manifest.database_sha256) throw new Error("checksum do banco não confere");
  }
  const walSource = manifest.wal ? join(source, manifest.wal) : null;
  const walBytes = walSource ? await Deno.readFile(walSource) : null;
  if (walBytes && manifest.wal_sha256) {
    const actual = await sha256Hex(walBytes);
    if (actual !== manifest.wal_sha256) throw new Error("checksum do WAL não confere");
  }
  if (!force) {
    try {
      await Deno.stat(env.dbPath);
      throw new Error("DB_PATH já existe; use --force com o serviço parado");
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // ok
      } else {
        throw error;
      }
    }
  }
  await Deno.mkdir(dirname(env.dbPath), { recursive: true, mode: 0o700 });
  for (const suffix of ["-wal", "-shm"]) {
    try {
      await Deno.remove(`${env.dbPath}${suffix}`);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  await Deno.copyFile(dbSource, env.dbPath);
  if (walSource) await Deno.copyFile(walSource, `${env.dbPath}-wal`);
  const attachmentSource = join(source, "attachments");
  const files = await filesUnder(attachmentSource);
  for (const file of files) {
    const destination = join(env.dataPath, "attachments", file);
    await Deno.mkdir(dirname(destination), { recursive: true, mode: 0o700 });
    await Deno.copyFile(join(attachmentSource, file), destination);
  }
  return {
    ok: true,
    database: env.dbPath,
    attachments: files.length,
    wal: Boolean(walSource),
    manifest,
  };
}
