import type { Db, DbParam } from "@kernel/db/database.ts";
import { one, rows } from "@kernel/db/database.ts";
import type { TagRow } from "./tags.ts";
import { tagsForItem, tagsForItems } from "./tags.ts";
import {
  type EffectivePriority,
  effectivePriority,
  type Importance,
  type PriorityInput,
  priorityRank,
  type Quadrant,
} from "../domain/priority.ts";
import { todayIso } from "@kernel/util.ts";

export type ItemKind = "task" | "issue";
export type { Importance };
export type TaskStatus = "backlog" | "todo" | "doing" | "review" | "done";
export type IssueStatus = "open" | "accepted" | "rejected";

export interface ItemRow {
  id: string;
  tenant_id: string;
  project_id: string;
  project_key: string;
  project_name: string;
  seq: number;
  kind: ItemKind;
  title: string;
  description_md: string;
  status: string;
  blocked: number;
  blocked_reason: string | null;
  importance: Importance;
  priority_override: Quadrant | null;
  priority_override_by: string | null;
  priority_override_at: string | null;
  priority_override_reason: string | null;
  start_date: string | null;
  end_date: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  po_id: string | null;
  po_name: string | null;
  created_by: string;
  creator_name: string;
  completed_at: string | null;
  promoted_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Item extends ItemRow {
  tags: TagRow[];
  priority: EffectivePriority;
  code: string;
}

export interface Filters {
  kind?: ItemKind;
  status?: string;
  projectKey?: string;
  poId?: string;
  assigneeId?: string;
  tagSlugs?: string[];
  priority?: Quadrant;
  ready?: boolean;
  attention?: boolean;
  q?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

const SELECT = `
  SELECT i.*, p.key AS project_key, p.name AS project_name,
         a.display_name AS assignee_name, po.display_name AS po_name,
         cu.display_name AS creator_name
  FROM items i
  JOIN projects p ON p.id = i.project_id
  LEFT JOIN users a ON a.id = i.assignee_id
  LEFT JOIN users po ON po.id = i.po_id
  JOIN users cu ON cu.id = i.created_by`;

function toItem(row: ItemRow, tags: TagRow[], today: string): Item {
  const priority = effectivePriority(row as PriorityInput, today);
  return {
    ...row,
    tags,
    priority,
    code: `${row.project_key}-${row.seq}`,
  };
}

export function itemById(db: Db, tenantId: string, id: string): Item | null {
  const row = one<ItemRow>(db, `${SELECT} WHERE i.tenant_id = ? AND i.id = ?`, tenantId, id);
  if (!row) return null;
  return toItem(row, tagsForItem(db, id), todayIso());
}

export function items(db: Db, tenantId: string, filters: Filters = {}): Item[] {
  const where: string[] = ["i.tenant_id = ?"];
  const params: DbParam[] = [tenantId];
  if (!filters.includeArchived) where.push("i.archived_at IS NULL");
  if (filters.kind) {
    where.push("i.kind = ?");
    params.push(filters.kind);
  }
  if (filters.status) {
    where.push("i.status = ?");
    params.push(filters.status);
  }
  if (filters.projectKey) {
    where.push("p.key = ?");
    params.push(filters.projectKey);
  }
  if (filters.poId) {
    where.push("i.po_id = ?");
    params.push(filters.poId);
  }
  if (filters.assigneeId) {
    where.push("i.assignee_id = ?");
    params.push(filters.assigneeId);
  }
  if (filters.q) {
    where.push(`(i.title LIKE ? OR i.description_md LIKE ?
      OR EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON t.id = it.tag_id
                 WHERE it.item_id = i.id AND t.name LIKE ?))`);
    const like = `%${filters.q}%`;
    params.push(like, like, like);
  }
  const slugs = (filters.tagSlugs ?? []).filter(Boolean);
  if (slugs.length > 0) {
    where.push(`(SELECT COUNT(DISTINCT t.slug) FROM item_tags it JOIN tags t ON t.id = it.tag_id
      WHERE it.item_id = i.id AND t.slug IN (${slugs.map(() => "?").join(",")})) = ?`);
    params.push(...slugs, slugs.length);
  }
  if (filters.ready) {
    where.push("i.kind = 'task' AND i.status <> 'done' AND i.blocked = 0 AND i.start_date <= ?");
    params.push(todayIso());
  }
  const raw = rows<ItemRow>(
    db,
    `${SELECT} WHERE ${where.join(" AND ")} ORDER BY i.updated_at DESC`,
    ...params,
  );
  const tagMap = tagsForItems(db, raw.map((row) => row.id));
  let result = raw.map((row) => toItem(row, tagMap.get(row.id) ?? [], todayIso()));

  if (filters.attention) {
    const today = todayIso();
    result = result.filter((item) =>
      (item.end_date !== null && item.end_date < today) ||
      item.blocked === 1 ||
      item.priority.value === "q1"
    );
  }
  if (filters.priority) result = result.filter((item) => item.priority.value === filters.priority);

  result.sort((a, b) => {
    const aDone = a.status === "done" ? 1 : 0;
    const bDone = b.status === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const today = todayIso();
    const aLate = a.end_date !== null && a.end_date < today ? 0 : 1;
    const bLate = b.end_date !== null && b.end_date < today ? 0 : 1;
    if (aLate !== bLate) return aLate - bLate;
    if (a.blocked !== b.blocked) return b.blocked - a.blocked;
    const rank = priorityRank(a.priority.value) - priorityRank(b.priority.value);
    if (rank !== 0) return rank;
    const aEnd = a.end_date ?? "9999-99-99";
    const bEnd = b.end_date ?? "9999-99-99";
    if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
    return b.updated_at.localeCompare(a.updated_at);
  });
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;
  return result.slice(offset, offset + limit);
}

export interface Counts {
  tasks: number;
  issues: number;
  overdue: number;
  blocked: number;
  q1: number;
}

export function counts(db: Db, tenantId: string): Counts {
  const base = `SELECT
    SUM(CASE WHEN kind = 'task' AND status <> 'done' THEN 1 ELSE 0 END) AS tasks,
    SUM(CASE WHEN kind = 'issue' AND status NOT IN ('accepted','rejected') THEN 1 ELSE 0 END) AS issues,
    SUM(CASE WHEN end_date IS NOT NULL AND end_date < ? AND status <> 'done' THEN 1 ELSE 0 END) AS overdue,
    SUM(CASE WHEN blocked = 1 AND status <> 'done' THEN 1 ELSE 0 END) AS blocked
    FROM items WHERE tenant_id = ? AND archived_at IS NULL`;
  const row = one<
    { tasks: number | null; issues: number | null; overdue: number | null; blocked: number | null }
  >(
    db,
    base,
    todayIso(),
    tenantId,
  );
  const list = items(db, tenantId, { limit: 100000, offset: 0 });
  return {
    tasks: Number(row?.tasks ?? 0),
    issues: Number(row?.issues ?? 0),
    overdue: Number(row?.overdue ?? 0),
    blocked: Number(row?.blocked ?? 0),
    q1: list.filter((item) => item.priority.value === "q1").length,
  };
}

export function statusesFor(kind: ItemKind): readonly string[] {
  return kind === "task"
    ? ["backlog", "todo", "doing", "review", "done"]
    : ["open", "accepted", "rejected"];
}

export const TASK_STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  doing: "Em andamento",
  review: "Em revisão",
  done: "Concluído",
};

export const ISSUE_STATUS_LABEL: Record<string, string> = {
  open: "Aberta",
  accepted: "Aceita",
  rejected: "Rejeitada",
};

export function statusLabel(kind: ItemKind, status: string): string {
  return (kind === "task" ? TASK_STATUS_LABEL : ISSUE_STATUS_LABEL)[status] ?? status;
}
