import { dirname, join } from "@std/path";
import type { Db } from "@kernel/db/database.ts";
import { one, rows, run } from "@kernel/db/database.ts";
import { env } from "@kernel/config/env.ts";
import { sha256Hex } from "@kernel/crypto/hash.ts";
import { nowIso, safeFileName, uuidv7 } from "@kernel/util.ts";
import { sanitizeUpload } from "./images.ts";
import type { Actor } from "@services/auth/contract.ts";

export interface AttachmentRow {
  id: string;
  tenant_id: string;
  uploader_id: string;
  sha256: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  storage_key: string;
  original_name: string;
  created_at: string;
  uploader_name?: string;
}

export interface AttachmentLink extends AttachmentRow {
  item_id?: string;
  message_id?: string;
  kind?: string;
}

export function attachmentRoot(): string {
  return join(env.dataPath, "attachments");
}

function storagePath(key: string): string {
  if (!/^attachments\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{64}$/.test(key)) {
    throw new Error("storage key inválida");
  }
  const root = attachmentRoot();
  const path = join(root, key.slice("attachments/".length));
  if (!path.startsWith(root + "/")) throw new Error("path traversal");
  return path;
}

export async function storeAttachment(
  db: Db,
  actor: Actor,
  originalName: string,
  input: Uint8Array,
): Promise<AttachmentRow> {
  if (input.byteLength === 0) throw new Error("Arquivo vazio.");
  if (input.byteLength > env.maxUploadBytes) throw new Error("Arquivo maior que 10 MB.");
  const checked = sanitizeUpload(input);
  const bytes = checked.kind === "image" ? checked.image.bytes : input;
  const mime = checked.kind === "image" ? checked.image.mime : "application/pdf";
  const width = checked.kind === "image" ? checked.image.width : null;
  const height = checked.kind === "image" ? checked.image.height : null;
  const sha = await sha256Hex(bytes);
  const existing = one<AttachmentRow>(
    db,
    "SELECT * FROM attachments WHERE tenant_id = ? AND sha256 = ? AND deleted_at IS NULL",
    actor.tenantId,
    sha,
  );
  if (existing) return existing;

  const key = `attachments/${sha.slice(0, 2)}/${sha.slice(2, 4)}/${sha}`;
  const path = storagePath(key);
  await Deno.mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${uuidv7()}.tmp`;
  await Deno.writeFile(tmp, bytes, { mode: 0o600 });
  await Deno.rename(tmp, path);

  const id = uuidv7();
  const cleanName = safeFileName(originalName);
  try {
    run(
      db,
      `INSERT INTO attachments(id, tenant_id, uploader_id, sha256, mime, bytes, width, height,
        storage_key, original_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      actor.tenantId,
      actor.id,
      sha,
      mime,
      bytes.byteLength,
      width,
      height,
      key,
      cleanName,
      nowIso(),
    );
  } catch (error) {
    try {
      await Deno.remove(path);
    } catch {
      // Blob pode ser de outro upload concorrente.
    }
    throw error;
  }
  return one<AttachmentRow>(db, "SELECT * FROM attachments WHERE id = ?", id)!;
}

export function linkDemandAttachment(
  db: Db,
  itemId: string,
  attachment: AttachmentRow,
  kind: "file" | "canvas_export" = "file",
): void {
  const count = one<{ n: number }>(
    db,
    "SELECT COUNT(*) AS n FROM demand_attachments WHERE item_id = ? AND archived_at IS NULL",
    itemId,
  );
  if ((count?.n ?? 0) >= 10) throw new Error("Limite de 10 anexos por demanda.");
  run(
    db,
    `INSERT OR IGNORE INTO demand_attachments(item_id, attachment_id, kind, created_at)
     VALUES (?, ?, ?, ?)`,
    itemId,
    attachment.id,
    kind,
    nowIso(),
  );
}

export function linkMessageAttachment(
  db: Db,
  messageId: string,
  attachment: AttachmentRow,
): void {
  run(
    db,
    "INSERT OR IGNORE INTO chat_message_attachments(message_id, attachment_id, created_at) VALUES (?, ?, ?)",
    messageId,
    attachment.id,
    nowIso(),
  );
}

export function attachmentsForItem(db: Db, itemId: string): AttachmentRow[] {
  return rows<AttachmentRow>(
    db,
    `SELECT a.*, u.display_name AS uploader_name
     FROM demand_attachments da JOIN attachments a ON a.id = da.attachment_id
     JOIN users u ON u.id = a.uploader_id
     WHERE da.item_id = ? AND da.archived_at IS NULL AND a.deleted_at IS NULL
     ORDER BY da.created_at DESC`,
    itemId,
  );
}

export function attachmentsForMessage(db: Db, messageId: string): AttachmentRow[] {
  return rows<AttachmentRow>(
    db,
    `SELECT a.*, u.display_name AS uploader_name
     FROM chat_message_attachments ca JOIN attachments a ON a.id = ca.attachment_id
     JOIN users u ON u.id = a.uploader_id
     WHERE ca.message_id = ? AND a.deleted_at IS NULL ORDER BY ca.created_at`,
    messageId,
  );
}

export function archiveDemandAttachment(
  db: Db,
  itemId: string,
  attachmentId: string,
): void {
  run(
    db,
    "UPDATE demand_attachments SET archived_at = ? WHERE item_id = ? AND attachment_id = ?",
    nowIso(),
    itemId,
    attachmentId,
  );
}

export async function storeCanvasExport(
  db: Db,
  actor: Actor,
  originalName: string,
  bytes: Uint8Array,
  mime: "application/json" | "image/png" | "image/svg+xml",
): Promise<AttachmentRow> {
  if (bytes.byteLength === 0 || bytes.byteLength > env.maxUploadBytes) {
    throw new Error("Export inválido.");
  }
  const sha = await sha256Hex(bytes);
  const existing = one<AttachmentRow>(
    db,
    "SELECT * FROM attachments WHERE tenant_id = ? AND sha256 = ? AND deleted_at IS NULL",
    actor.tenantId,
    sha,
  );
  if (existing) return existing;
  const key = `attachments/${sha.slice(0, 2)}/${sha.slice(2, 4)}/${sha}`;
  const path = storagePath(key);
  await Deno.mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${uuidv7()}.tmp`;
  await Deno.writeFile(tmp, bytes, { mode: 0o600 });
  await Deno.rename(tmp, path);
  const id = uuidv7();
  run(
    db,
    `INSERT INTO attachments(id, tenant_id, uploader_id, sha256, mime, bytes, width, height,
      storage_key, original_name, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
    id,
    actor.tenantId,
    actor.id,
    sha,
    mime,
    bytes.byteLength,
    key,
    safeFileName(originalName),
    nowIso(),
  );
  return one<AttachmentRow>(db, "SELECT * FROM attachments WHERE id = ?", id)!;
}

export async function openAttachment(
  attachment: AttachmentRow,
): Promise<Deno.FsFile> {
  return await Deno.open(storagePath(attachment.storage_key), { read: true });
}

export async function readAttachment(attachment: AttachmentRow): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await Deno.readFile(storagePath(attachment.storage_key)));
}

export function attachmentAccess(
  db: Db,
  tenantId: string,
  attachmentId: string,
): { attachment: AttachmentRow; itemId: string | null; messageId: string | null } | null {
  const attachment = one<AttachmentRow>(
    db,
    "SELECT * FROM attachments WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
    attachmentId,
    tenantId,
  );
  if (!attachment) return null;
  const demand = one<{ item_id: string }>(
    db,
    `SELECT item_id FROM demand_attachments WHERE attachment_id = ? AND archived_at IS NULL LIMIT 1`,
    attachmentId,
  );
  const message = one<{ message_id: string }>(
    db,
    "SELECT message_id FROM chat_message_attachments WHERE attachment_id = ? LIMIT 1",
    attachmentId,
  );
  return {
    attachment,
    itemId: demand?.item_id ?? null,
    messageId: message?.message_id ?? null,
  };
}

export function contentDisposition(name: string, inline: boolean): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replaceAll('"', "'");
  const encoded = encodeURIComponent(name);
  return `${inline ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
