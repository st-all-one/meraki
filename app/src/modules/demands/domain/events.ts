import type { Db } from "@kernel/db/database.ts";
import { run } from "@kernel/db/database.ts";
import { nowIso, uuidv7 } from "@kernel/util.ts";
import type { Actor } from "@services/auth/contract.ts";

export function demandEvent(
  db: Db,
  tenantId: string,
  itemId: string,
  actorId: string | null,
  kind: string,
  from: string | null = null,
  to: string | null = null,
  metadata: Record<string, unknown> = {},
): void {
  run(
    db,
    `INSERT INTO demand_events(id, tenant_id, item_id, actor_id, kind, from_value, to_value, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    uuidv7(),
    tenantId,
    itemId,
    actorId,
    kind,
    from,
    to,
    JSON.stringify(metadata),
    nowIso(),
  );
}

export function event(
  db: Db,
  actor: Actor,
  itemId: string,
  kind: string,
  from: string | null = null,
  to: string | null = null,
  metadata: Record<string, unknown> = {},
): void {
  demandEvent(db, actor.tenantId, itemId, actor.id, kind, from, to, metadata);
}
