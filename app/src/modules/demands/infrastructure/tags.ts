import type { Db } from "@kernel/db/database.ts";
import { one, rows, run } from "@kernel/db/database.ts";
import { normalizeTagName, nowIso, slugify, uuidv7 } from "@kernel/util.ts";
import type { Actor } from "@services/auth/contract.ts";
import { event } from "../domain/events.ts";

export interface TagRow {
  id: string;
  name: string;
  slug: string;
  archived_at: string | null;
}

export interface ItemTag extends TagRow {
  item_id: string;
}

export function listTags(db: Db, tenantId: string, includeArchived = false): TagRow[] {
  return rows<TagRow>(
    db,
    `SELECT id, name, slug, archived_at FROM tags WHERE tenant_id = ?
     ${includeArchived ? "" : "AND archived_at IS NULL"} ORDER BY name COLLATE NOCASE`,
    tenantId,
  );
}

export function tagsForItem(db: Db, itemId: string): TagRow[] {
  return rows<TagRow>(
    db,
    `SELECT t.id, t.name, t.slug, t.archived_at
     FROM item_tags it JOIN tags t ON t.id = it.tag_id
     WHERE it.item_id = ? ORDER BY t.name COLLATE NOCASE`,
    itemId,
  );
}

export function tagsForItems(db: Db, itemIds: readonly string[]): Map<string, TagRow[]> {
  const result = new Map<string, TagRow[]>();
  if (itemIds.length === 0) return result;
  const placeholders = itemIds.map(() => "?").join(",");
  const found = rows<ItemTag>(
    db,
    `SELECT it.item_id, t.id, t.name, t.slug, t.archived_at
     FROM item_tags it JOIN tags t ON t.id = it.tag_id
     WHERE it.item_id IN (${placeholders}) ORDER BY t.name COLLATE NOCASE`,
    ...itemIds,
  );
  for (const tag of found) {
    const list = result.get(tag.item_id) ?? [];
    list.push(tag);
    result.set(tag.item_id, list);
  }
  return result;
}

export function ensureTag(
  db: Db,
  tenantId: string,
  actorId: string,
  rawName: string,
): TagRow | null {
  const name = normalizeTagName(rawName);
  if (!name) return null;
  const byName = one<TagRow>(
    db,
    "SELECT id, name, slug, archived_at FROM tags WHERE tenant_id = ? AND lower(name) = lower(?)",
    tenantId,
    name,
  );
  if (byName) return byName;
  let slug = slugify(name);
  if (!slug) return null;
  const bySlug = one<TagRow>(
    db,
    "SELECT id, name, slug, archived_at FROM tags WHERE tenant_id = ? AND slug = ?",
    tenantId,
    slug,
  );
  if (bySlug) return bySlug;
  const id = uuidv7();
  const now = nowIso();
  run(
    db,
    `INSERT INTO tags(id, tenant_id, name, slug, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    tenantId,
    name,
    slug,
    actorId,
    now,
    now,
  );
  slug = slugify(name);
  return { id, name, slug, archived_at: null };
}

export function resolveTags(
  db: Db,
  tenantId: string,
  actor: Actor,
  rawNames: readonly string[],
): TagRow[] {
  const unique = new Map<string, TagRow>();
  for (const raw of rawNames) {
    const name = normalizeTagName(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (unique.has(key)) continue;
    const tag = ensureTag(db, tenantId, actor.id, name);
    if (tag) unique.set(key, tag);
  }
  const result = [...unique.values()];
  if (result.length > 8) throw new Error("Uma demanda pode ter no máximo 8 tags.");
  return result;
}

export function setItemTags(
  db: Db,
  actor: Actor,
  itemId: string,
  rawNames: readonly string[],
): TagRow[] {
  const next = resolveTags(db, actor.tenantId, actor, rawNames);
  const current = tagsForItem(db, itemId);
  const currentIds = new Set(current.map((tag) => tag.id));
  const nextIds = new Set(next.map((tag) => tag.id));
  const added = next.filter((tag) => !currentIds.has(tag.id));
  const removed = current.filter((tag) => !nextIds.has(tag.id));
  const now = nowIso();
  for (const tag of added) {
    run(
      db,
      "INSERT OR IGNORE INTO item_tags(item_id, tag_id, created_at) VALUES (?, ?, ?)",
      itemId,
      tag.id,
      now,
    );
  }
  for (const tag of removed) {
    run(db, "DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?", itemId, tag.id);
  }
  if (added.length > 0 || removed.length > 0) {
    event(db, actor, itemId, "tags", null, null, {
      added: added.map((tag) => tag.slug),
      removed: removed.map((tag) => tag.slug),
    });
  }
  return next;
}
