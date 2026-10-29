import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Db } from "@kernel/db/database.ts";
import { one, rows, run, tx } from "@kernel/db/database.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { boolValue, formValue, pageParam } from "@kernel/http/request.ts";
import {
  can,
  canCreateTask,
  canManageTags,
  canOverridePriority,
  canPromote,
  canSetPo,
} from "@services/auth/policy.ts";
import {
  counts as demandCounts,
  type Filters,
  type Importance,
  type Item,
  itemById,
  type ItemKind,
  items,
  statusesFor,
} from "../infrastructure/items.ts";
import {
  csv,
  normalizeTagName,
  nowIso,
  safeNextPath,
  slugify,
  todayIso,
  uuidv7,
  validDate,
} from "@kernel/util.ts";
import { back, render } from "@kernel/http/render.ts";
import { listTags, setItemTags } from "../infrastructure/tags.ts";
import { demandEvent } from "../domain/events.ts";
import { Page } from "@layout/views/page.tsx";
import { notify, unreadCount } from "@services/notifications/service.ts";
import {
  ensureChannel,
  messagesForChannel,
  messageViews,
} from "@services/conversations/service.ts";
import {
  type EventRow,
  ItemFormPage,
  itemKindFrom,
  ItemPage,
  type ItemTab,
} from "../views/item.tsx";
import { BoardPage, CalendarPage, DemandsPage, MyPage } from "../views/demands.tsx";
import { ProjectFormPage, ProjectPage, type ProjectRow, ProjectsPage } from "../views/projects.tsx";
import { TagsPage } from "../views/tags.tsx";
import { attachmentsForItem } from "@services/attachments/storage.ts";

interface ProjectOption {
  id: string;
  key: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
}

function activeUsers(db: Db, tenantId: string): UserOption[] {
  return rows<UserOption>(
    db,
    "SELECT id, display_name AS name FROM users WHERE tenant_id = ? AND active = 1 ORDER BY display_name COLLATE NOCASE",
    tenantId,
  );
}

function projectOptions(db: Db, tenantId: string): ProjectOption[] {
  return rows<ProjectOption>(
    db,
    "SELECT id, key, name FROM projects WHERE tenant_id = ? AND archived_at IS NULL ORDER BY name COLLATE NOCASE",
    tenantId,
  );
}

function tagSlugs(c: { req: { queries(name: string): string[] | undefined } }): string[] {
  return (c.req.queries("tag") ?? []).filter(Boolean);
}

function filtersFrom(c: {
  req: {
    query(name: string): string | undefined;
    queries(name: string): string[] | undefined;
  };
}): Filters {
  const kindRaw = c.req.query("kind");
  const kind = kindRaw === "task" || kindRaw === "issue" ? kindRaw : undefined;
  const priority = c.req.query("priority");
  return {
    ...(kind ? { kind } : {}),
    ...(c.req.query("status") ? { status: c.req.query("status") } : {}),
    ...(c.req.query("project") ? { projectKey: c.req.query("project") } : {}),
    ...(c.req.query("po") ? { poId: c.req.query("po") } : {}),
    ...(c.req.query("assignee") ? { assigneeId: c.req.query("assignee") } : {}),
    ...(tagSlugs(c).length ? { tagSlugs: tagSlugs(c) } : {}),
    ...(priority === "q1" || priority === "q2" || priority === "q3" || priority === "q4"
      ? { priority }
      : {}),
    ...(c.req.query("ready") === "1" ? { ready: true } : {}),
    ...(c.req.query("attention") === "1" ? { attention: true } : {}),
    ...(c.req.query("q") ? { q: c.req.query("q") } : {}),
  };
}

function filterOptions(db: Db, tenantId: string, query: URLSearchParams) {
  return {
    projects: projectOptions(db, tenantId),
    users: activeUsers(db, tenantId),
    tags: listTags(db, tenantId),
    query,
  };
}

function loadItem(db: Db, tenantId: string, id: string): Item {
  const item = itemById(db, tenantId, id);
  if (!item) throw new HTTPException(404, { message: "Demanda não encontrada" });
  return item;
}

function projectByKey(db: Db, tenantId: string, key: string): ProjectOption | undefined {
  return one<ProjectOption>(
    db,
    "SELECT id, key, name FROM projects WHERE tenant_id = ? AND key = ?",
    tenantId,
    key,
  );
}

function validateItem(
  db: Db,
  tenantId: string,
  kind: ItemKind,
  input: {
    title: string;
    start_date: string;
    end_date: string;
    assignee_id: string;
    po_id: string;
    status: string;
  },
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.title.length < 1) errors["title"] = "Título é obrigatório.";
  if (input.title.length > 200) errors["title"] = "Título deve ter até 200 caracteres.";
  if (!statusesFor(kind).includes(input.status)) {
    errors["status"] = "Status inválido para este tipo.";
  }
  if (kind === "task") {
    if (!validDate(input.start_date)) errors["start_date"] = "Informe uma data de início válida.";
    if (!validDate(input.end_date)) errors["end_date"] = "Informe uma data de fim válida.";
    if (
      validDate(input.start_date) && validDate(input.end_date) &&
      input.start_date > input.end_date
    ) {
      errors["end_date"] = "O fim não pode ser anterior ao início.";
    }
    if (!input.assignee_id) {
      errors["assignee_id"] = "Responsável é obrigatório.";
    } else if (
      !one(
        db,
        "SELECT id FROM users WHERE id = ? AND tenant_id = ? AND active = 1",
        input.assignee_id,
        tenantId,
      )
    ) {
      errors["assignee_id"] = "Responsável ativo não encontrado.";
    }
    if (
      input.po_id &&
      !one(
        db,
        "SELECT id FROM users WHERE id = ? AND tenant_id = ? AND active = 1",
        input.po_id,
        tenantId,
      )
    ) {
      errors["po_id"] = "PO ativo não encontrado.";
    }
  }
  return errors;
}

function notifyAssignee(
  db: Db,
  tenantId: string,
  actorId: string,
  previous: string | null,
  next: string | null,
  item: Item,
  kind: "assigned" | "po",
): void {
  if (!next || next === previous || next === actorId) return;
  notify(
    db,
    tenantId,
    next,
    kind,
    kind === "assigned" ? `Você é responsável por ${item.code}` : `Você é PO de ${item.code}`,
    item.title,
    `/items/${item.id}`,
    { item_id: item.id },
  );
}

export function demandRoutes(db: Db, tenantId: string): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.get("/demands", (c) => {
    const actor = c.get("actor")!;
    const filters = filtersFrom(c);
    const all = items(db, tenantId, { ...filters, limit: 100000, offset: 0 });
    const { page, limit, offset } = pageParam(c.req.url);
    const url = new URL(c.req.url);
    return render(
      c,
      (
        <DemandsPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          items={all.slice(offset, offset + limit)}
          counts={demandCounts(db, tenantId)}
          filters={filters}
          opts={filterOptions(db, tenantId, url.searchParams)}
          total={all.length}
          page={page}
          ok={c.req.query("ok")}
        />
      ),
    );
  });

  app.get("/my", (c) => {
    const actor = c.get("actor")!;
    const mine = items(db, tenantId, { limit: 100000 }).filter((item) =>
      item.assignee_id === actor.id || item.po_id === actor.id
    );
    return render(c, <MyPage actor={actor} unread={unreadCount(db, actor.id)} items={mine} />);
  });

  app.get("/projects", (c) => {
    const actor = c.get("actor")!;
    const projects = rows<ProjectRow>(
      db,
      `SELECT p.*,
        (SELECT COUNT(*) FROM items i WHERE i.project_id = p.id AND i.kind = 'task' AND i.archived_at IS NULL) AS task_count,
        (SELECT COUNT(*) FROM items i WHERE i.project_id = p.id AND i.kind = 'issue' AND i.archived_at IS NULL) AS issue_count
       FROM projects p WHERE p.tenant_id = ? AND p.archived_at IS NULL ORDER BY p.name COLLATE NOCASE`,
      tenantId,
    );
    return render(
      c,
      (
        <ProjectsPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          projects={projects}
          ok={c.req.query("ok")}
        />
      ),
    );
  });

  app.get("/projects/new", (c) => {
    const actor = c.get("actor")!;
    if (actor.role !== "admin") throw new HTTPException(403, { message: "Sem permissão" });
    return render(c, <ProjectFormPage actor={actor} unread={unreadCount(db, actor.id)} />);
  });

  app.post("/projects", async (c) => {
    const actor = c.get("actor")!;
    if (actor.role !== "admin") throw new HTTPException(403, { message: "Sem permissão" });
    const body = await c.req.parseBody();
    const key = formValue(body["key"] ?? null).toUpperCase();
    const name = formValue(body["name"] ?? null);
    if (!/^[A-Z0-9]{2,8}$/.test(key) || name.length < 2) {
      return render(
        c,
        (
          <ProjectFormPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            error="Chave de 2–8 letras/números e nome são obrigatórios."
          />
        ),
        422,
      );
    }
    if (one(db, "SELECT id FROM projects WHERE tenant_id = ? AND key = ?", tenantId, key)) {
      return render(
        c,
        (
          <ProjectFormPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            error="Já existe pasta com esta chave."
          />
        ),
        409,
      );
    }
    const id = uuidv7();
    const now = nowIso();
    run(
      db,
      `INSERT INTO projects(id, tenant_id, key, name, next_seq, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      id,
      tenantId,
      key,
      name,
      actor.id,
      now,
      now,
    );
    ensureChannel(db, tenantId, "project", { projectId: id, name });
    return c.redirect(`/projects/${key}?ok=created`, 303);
  });

  app.get("/projects/:key", (c) => {
    const actor = c.get("actor")!;
    const project = projectByKey(db, tenantId, c.req.param("key"));
    if (!project) return c.notFound();
    const list = items(db, tenantId, { projectKey: project.key, limit: 1000 });
    return render(
      c,
      (
        <ProjectPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          project={project}
          items={list}
          canAdmin={actor.role === "admin"}
        />
      ),
    );
  });

  app.post("/projects/:key", async (c) => {
    const actor = c.get("actor")!;
    if (actor.role !== "admin") throw new HTTPException(403, { message: "Sem permissão" });
    const project = projectByKey(db, tenantId, c.req.param("key"));
    if (!project) return c.notFound();
    const body = await c.req.parseBody();
    const name = formValue(body["name"] ?? null);
    if (name.length < 2) throw new HTTPException(422, { message: "Nome inválido" });
    run(
      db,
      "UPDATE projects SET name = ?, archived_at = ?, updated_at = ? WHERE id = ?",
      name,
      boolValue(body["archived"] ?? null) ? nowIso() : null,
      nowIso(),
      project.id,
    );
    return c.redirect(`/projects/${project.key}?ok=updated`, 303);
  });

  app.get("/projects/:key/board", (c) => {
    const actor = c.get("actor")!;
    const project = projectByKey(db, tenantId, c.req.param("key"));
    if (!project) return c.notFound();
    const filters = { ...filtersFrom(c), kind: "task" as const, projectKey: project.key };
    const list = items(db, tenantId, { ...filters, limit: 1000 });
    return render(
      c,
      (
        <BoardPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          project={project}
          items={list}
          filters={filters}
          opts={filterOptions(db, tenantId, new URL(c.req.url).searchParams)}
        />
      ),
    );
  });

  app.get("/projects/:key/calendar", (c) => {
    const actor = c.get("actor")!;
    const project = projectByKey(db, tenantId, c.req.param("key"));
    if (!project) return c.notFound();
    const month = /^\d{4}-\d{2}$/.test(c.req.query("month") ?? "")
      ? c.req.query("month")!
      : todayIso().slice(0, 7);
    const list = items(db, tenantId, { kind: "task", projectKey: project.key, limit: 1000 });
    return render(
      c,
      (
        <CalendarPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          project={project}
          items={list}
          month={month}
        />
      ),
    );
  });

  app.get("/items/new", (c) => {
    const actor = c.get("actor")!;
    const kind = itemKindFrom(c.req.query("kind") ?? null);
    if (kind === "task" && !canCreateTask(actor)) {
      throw new HTTPException(403, { message: "Só manager/admin cria tarefa." });
    }
    const projects = projectOptions(db, tenantId);
    if (projects.length === 0) {
      throw new HTTPException(409, { message: "Crie uma pasta primeiro." });
    }
    const requested = c.req.query("project");
    const project = requested ? projectByKey(db, tenantId, requested) : undefined;
    const ordered = project ? [project, ...projects.filter((p) => p.id !== project.id)] : projects;
    return render(
      c,
      (
        <ItemFormPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          mode="new"
          kind={kind}
          projects={ordered}
          users={activeUsers(db, tenantId)}
          tags={listTags(db, tenantId)}
        />
      ),
    );
  });

  app.post("/items", async (c) => {
    const actor = c.get("actor")!;
    const body = await c.req.parseBody();
    const kind = itemKindFrom(formValue(body["kind"] ?? null));
    if (kind === "task" && !canCreateTask(actor)) {
      throw new HTTPException(403, { message: "Só manager/admin cria tarefa." });
    }
    const project = one<ProjectOption>(
      db,
      "SELECT id, key, name FROM projects WHERE id = ? AND tenant_id = ? AND archived_at IS NULL",
      formValue(body["project_id"] ?? null),
      tenantId,
    );
    if (!project) throw new HTTPException(422, { message: "Pasta inválida" });
    const title = formValue(body["title"] ?? null);
    const description = formValue(body["description_md"] ?? null).slice(0, 100_000);
    const status = formValue(body["status"] ?? null) || (kind === "task" ? "backlog" : "open");
    const importance = formValue(body["importance"] ?? null) || "medium";
    const start = kind === "task" ? formValue(body["start_date"] ?? null) : "";
    const end = kind === "task" ? formValue(body["end_date"] ?? null) : "";
    const assignee = kind === "task" ? formValue(body["assignee_id"] ?? null) : "";
    const po = kind === "task" && canSetPo(actor) ? formValue(body["po_id"] ?? null) : "";
    const errors = validateItem(db, tenantId, kind, {
      title,
      start_date: start,
      end_date: end,
      assignee_id: assignee,
      po_id: po,
      status,
    });
    if (!["low", "medium", "high"].includes(importance)) {
      errors["importance"] = "Importância inválida.";
    }
    if (Object.keys(errors).length > 0) {
      return render(
        c,
        (
          <ItemFormPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            mode="new"
            kind={kind}
            projects={projectOptions(db, tenantId)}
            users={activeUsers(db, tenantId)}
            tags={listTags(db, tenantId)}
            errors={errors}
          />
        ),
        422,
      );
    }
    const id = uuidv7();
    const now = nowIso();
    tx(db, () => {
      const seq =
        one<{ next_seq: number }>(db, "SELECT next_seq FROM projects WHERE id = ?", project.id)
          ?.next_seq ?? 1;
      run(
        db,
        "UPDATE projects SET next_seq = next_seq + 1, updated_at = ? WHERE id = ?",
        now,
        project.id,
      );
      run(
        db,
        `INSERT INTO items(id, tenant_id, project_id, seq, kind, title, description_md, status,
          blocked, blocked_reason, importance, start_date, end_date, assignee_id, po_id,
          completed_at, created_by, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        id,
        tenantId,
        project.id,
        seq,
        kind,
        title,
        description,
        status,
        boolValue(body["blocked"] ?? null) ? 1 : 0,
        formValue(body["blocked_reason"] ?? null) || null,
        importance,
        kind === "task" ? start : null,
        kind === "task" ? end : null,
        kind === "task" ? assignee : null,
        kind === "task" ? po || null : null,
        status === "done" ? now : null,
        actor.id,
        now,
        now,
      );
      const names = parseTagInput(formValue(body["tags"] ?? null));
      setItemTags(db, actor, id, names);
      demandEvent(db, tenantId, id, actor.id, "created", null, kind);
      if (kind === "issue") {
        // Managers são notificados dentro da transação para o inbox ser consistente.
        const managers = db.prepare(
          "SELECT id FROM users WHERE tenant_id = ? AND active = 1 AND role IN ('admin','manager') AND id <> ?",
        ).all(tenantId, actor.id) as { id: string }[];
        for (const manager of managers) {
          notify(
            db,
            tenantId,
            manager.id,
            "issue",
            `Nova issue ${project.key}-${seq}`,
            `${actor.name} sugeriu: ${title}`,
            `/items/${id}`,
            { item_id: id },
          );
        }
      }
    });
    const created = itemById(db, tenantId, id)!;
    if (kind === "task") {
      notifyAssignee(db, tenantId, actor.id, null, assignee || null, created, "assigned");
    }
    return c.redirect(`/items/${id}`, 303);
  });

  app.get("/items/:id", (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    const tab = (["conversation", "attachments", "canvas", "history"] as const)
      .find((value) => value === c.req.query("tab")) ?? "conversation";
    const channel = ensureChannel(db, tenantId, "demand", {
      demandId: item.id,
      name: item.code,
    });
    const messages = messageViews(db, messagesForChannel(db, channel.id, 100));
    const events = rows<EventRow>(
      db,
      `SELECT e.*, u.display_name AS actor_name FROM demand_events e
       LEFT JOIN users u ON u.id = e.actor_id WHERE e.item_id = ?
       ORDER BY e.created_at DESC LIMIT 200`,
      item.id,
    );
    return render(
      c,
      (
        <ItemPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          item={item}
          tab={tab as ItemTab}
          messages={messages}
          attachments={attachmentsForItem(db, item.id)}
          events={events}
          poOptions={activeUsers(db, tenantId)}
          projectOptions={projectOptions(db, tenantId).map((p) => ({ id: p.id, name: p.name }))}
          canEdit={can(actor, "edit", "demand", { kind: item.kind, ownerId: item.created_by })}
          canArchive={can(actor, item.archived_at ? "restore" : "archive", "demand", {
            kind: item.kind,
            ownerId: item.created_by,
          })}
          canSetPo={canSetPo(actor) && item.kind === "task"}
          canOverride={canOverridePriority(actor) && item.kind === "task"}
          canPromote={canPromote(actor) && item.kind === "issue"}
          canEditMessages={actor.role === "admin"}
          maxChatBody={Number(Deno.env.get("MAX_CHAT_BODY") ?? "10000") || 10000}
          conversationAction={`/chat/channels/${channel.id}/messages`}
          ok={c.req.query("ok")}
        />
      ),
    );
  });

  app.get("/items/:id/edit", (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (!can(actor, "edit", "demand", { kind: item.kind, ownerId: item.created_by })) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    return render(
      c,
      (
        <ItemFormPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          mode="edit"
          kind={item.kind}
          item={item}
          projects={projectOptions(db, tenantId)}
          users={activeUsers(db, tenantId)}
          tags={listTags(db, tenantId, true)}
        />
      ),
    );
  });

  app.post("/items/:id", async (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (!can(actor, "edit", "demand", { kind: item.kind, ownerId: item.created_by })) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    const body = await c.req.parseBody();
    const title = formValue(body["title"] ?? null);
    const description = formValue(body["description_md"] ?? null).slice(0, 100_000);
    const status = formValue(body["status"] ?? null);
    const importance = formValue(body["importance"] ?? null);
    const start = item.kind === "task" ? formValue(body["start_date"] ?? null) : "";
    const end = item.kind === "task" ? formValue(body["end_date"] ?? null) : "";
    const assignee = item.kind === "task" ? formValue(body["assignee_id"] ?? null) : "";
    const po = item.kind === "task" && canSetPo(actor)
      ? formValue(body["po_id"] ?? null)
      : item.po_id ?? "";
    const errors = validateItem(db, tenantId, item.kind, {
      title,
      start_date: start,
      end_date: end,
      assignee_id: assignee,
      po_id: po,
      status,
    });
    if (!["low", "medium", "high"].includes(importance)) {
      errors["importance"] = "Importância inválida.";
    }
    if (Object.keys(errors).length > 0) {
      return render(
        c,
        (
          <ItemFormPage
            actor={actor}
            unread={unreadCount(db, actor.id)}
            mode="edit"
            kind={item.kind}
            item={{
              ...item,
              title,
              description_md: description,
              status,
              importance: importance as Importance,
              start_date: start || null,
              end_date: end || null,
              assignee_id: assignee || null,
              po_id: po || null,
            }}
            projects={projectOptions(db, tenantId)}
            users={activeUsers(db, tenantId)}
            tags={listTags(db, tenantId, true)}
            errors={errors}
          />
        ),
        422,
      );
    }
    const expected = Number(formValue(body["version"] ?? null));
    const now = nowIso();
    const completed = status === "done" ? item.completed_at ?? now : null;
    const changedAssignee = assignee !== (item.assignee_id ?? "");
    const changedPo = (po || null) !== item.po_id;
    tx(db, () => {
      const result = run(
        db,
        `UPDATE items SET title = ?, description_md = ?, status = ?, importance = ?,
          blocked = ?, blocked_reason = ?, start_date = ?, end_date = ?, assignee_id = ?,
          po_id = ?, completed_at = ?, version = version + 1, updated_at = ?
         WHERE id = ? AND tenant_id = ? AND version = ? AND archived_at IS NULL`,
        title,
        description,
        status,
        importance,
        boolValue(body["blocked"] ?? null) ? 1 : 0,
        formValue(body["blocked_reason"] ?? null) || null,
        item.kind === "task" ? start : null,
        item.kind === "task" ? end : null,
        item.kind === "task" ? assignee : null,
        item.kind === "task" ? po || null : null,
        completed,
        now,
        item.id,
        tenantId,
        expected,
      );
      if (result.changes === 0) {
        throw new HTTPException(409, { message: "A demanda mudou. Recarregue." });
      }
      const changes: [string, unknown, unknown][] = [
        ["title", item.title, title],
        ["description", item.description_md, description],
        ["status", item.status, status],
        ["importance", item.importance, importance],
        ["start", item.start_date, start || null],
        ["end", item.end_date, end || null],
        ["assignee", item.assignee_id, assignee || null],
        ["po", item.po_id, po || null],
        ["blocked", item.blocked, boolValue(body["blocked"] ?? null) ? 1 : 0],
      ];
      for (const [kind, from, to] of changes) {
        if (String(from) !== String(to)) {
          demandEvent(
            db,
            tenantId,
            item.id,
            actor.id,
            kind,
            from === null ? null : String(from),
            to === null ? null : String(to),
          );
        }
      }
      setItemTags(db, actor, item.id, parseTagInput(formValue(body["tags"] ?? null)));
    });
    const updated = itemById(db, tenantId, item.id)!;
    if (changedAssignee) {
      notifyAssignee(
        db,
        tenantId,
        actor.id,
        item.assignee_id,
        assignee || null,
        updated,
        "assigned",
      );
    }
    if (changedPo) {
      notifyAssignee(db, tenantId, actor.id, item.po_id, po || null, updated, "po");
    }
    return c.redirect(`/items/${item.id}?ok=saved`, 303);
  });

  app.post("/items/:id/status", async (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (!can(actor, "edit", "demand", { kind: item.kind, ownerId: item.created_by })) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    const body = await c.req.parseBody();
    const status = formValue(body["status"] ?? null);
    if (!statusesFor(item.kind).includes(status)) {
      throw new HTTPException(422, { message: "Status inválido" });
    }
    const now = nowIso();
    run(
      db,
      `UPDATE items SET status = ?, completed_at = ?, blocked = CASE WHEN ? = 'done' THEN 0 ELSE blocked END,
        version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ?
        AND version = ?`,
      status,
      status === "done" ? item.completed_at ?? now : null,
      status,
      now,
      item.id,
      tenantId,
      Number(formValue(body["version"] ?? null)) || item.version,
    );
    demandEvent(db, tenantId, item.id, actor.id, "status", item.status, status);
    const redirect = safeNextPath(formValue(body["redirect"] ?? null) || undefined);
    return c.redirect(redirect.startsWith("/items/") ? `${redirect}?ok=moved` : redirect, 303);
  });

  app.post("/items/:id/archive", (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (!can(actor, "archive", "demand", { kind: item.kind, ownerId: item.created_by })) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    run(
      db,
      "UPDATE items SET archived_at = ?, updated_at = ? WHERE id = ?",
      nowIso(),
      nowIso(),
      item.id,
    );
    demandEvent(db, tenantId, item.id, actor.id, "archived");
    return back(c, "/demands");
  });

  app.post("/items/:id/restore", (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (!can(actor, "restore", "demand", { kind: item.kind, ownerId: item.created_by })) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    run(db, "UPDATE items SET archived_at = NULL, updated_at = ? WHERE id = ?", nowIso(), item.id);
    demandEvent(db, tenantId, item.id, actor.id, "restored");
    return back(c, `/items/${item.id}`);
  });

  app.post("/items/:id/po", async (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (item.kind !== "task" || !canSetPo(actor)) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    const body = await c.req.parseBody();
    const po = formValue(body["po_id"] ?? null) || null;
    if (
      po &&
      !one(db, "SELECT id FROM users WHERE id = ? AND tenant_id = ? AND active = 1", po, tenantId)
    ) {
      throw new HTTPException(422, { message: "PO inválido" });
    }
    run(
      db,
      "UPDATE items SET po_id = ?, version = version + 1, updated_at = ? WHERE id = ?",
      po,
      nowIso(),
      item.id,
    );
    demandEvent(db, tenantId, item.id, actor.id, "po", item.po_id, po);
    const updated = itemById(db, tenantId, item.id)!;
    notifyAssignee(db, tenantId, actor.id, item.po_id, po, updated, "po");
    return c.redirect(`/items/${item.id}?ok=po`, 303);
  });

  app.post("/items/:id/priority", async (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (item.kind !== "task" || !canOverridePriority(actor)) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    const body = await c.req.parseBody();
    const raw = formValue(body["priority"] ?? null);
    const priority = raw === "q1" || raw === "q2" || raw === "q3" || raw === "q4" ? raw : null;
    const reason = formValue(body["reason"] ?? null) || null;
    run(
      db,
      `UPDATE items SET priority_override = ?, priority_override_by = ?, priority_override_at = ?,
        priority_override_reason = ?, version = version + 1, updated_at = ? WHERE id = ?`,
      priority,
      priority ? actor.id : null,
      priority ? nowIso() : null,
      priority ? reason : null,
      nowIso(),
      item.id,
    );
    demandEvent(db, tenantId, item.id, actor.id, "priority", item.priority_override, priority, {
      source: priority ? "manual" : "auto",
      calculated: item.priority.calculated,
      reason,
    });
    return c.redirect(`/items/${item.id}?ok=priority`, 303);
  });

  app.post("/items/:id/promote", async (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    if (item.kind !== "issue" || !canPromote(actor)) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    const body = await c.req.parseBody();
    const start = formValue(body["start_date"] ?? null);
    const end = formValue(body["end_date"] ?? null);
    const assignee = formValue(body["assignee_id"] ?? null);
    const po = formValue(body["po_id"] ?? null) || null;
    const errors = validateItem(db, tenantId, "task", {
      title: item.title,
      start_date: start,
      end_date: end,
      assignee_id: assignee,
      po_id: po || "",
      status: "backlog",
    });
    if (Object.keys(errors).length > 0) {
      throw new HTTPException(422, { message: Object.values(errors)[0] ?? "Dados inválidos" });
    }
    const now = nowIso();
    tx(db, () => {
      run(
        db,
        `UPDATE items SET kind = 'task', status = 'backlog', start_date = ?, end_date = ?,
          assignee_id = ?, po_id = ?, promoted_at = ?, promoted_by = ?,
          version = version + 1, updated_at = ? WHERE id = ?`,
        start,
        end,
        assignee,
        po,
        now,
        actor.id,
        now,
        item.id,
      );
      demandEvent(db, tenantId, item.id, actor.id, "promoted", "issue", "task", {
        po_id: po,
        assignee_id: assignee,
      });
      notify(
        db,
        tenantId,
        item.created_by,
        "promoted",
        `${item.code} virou tarefa`,
        item.title,
        `/items/${item.id}`,
        { item_id: item.id },
      );
    });
    return c.redirect(`/items/${item.id}?ok=promoted`, 303);
  });

  app.get("/demands/export.csv", (c) => {
    const kind = c.req.query("kind");
    const filters: Filters = {
      ...filtersFrom(c),
      ...(kind === "task" || kind === "issue" ? { kind } : {}),
    };
    const all = items(db, tenantId, { ...filters, limit: 100000 });
    const header = [
      "Tipo",
      "ID",
      "Título",
      "Pasta",
      "Status",
      "PO",
      "Responsável",
      "Início",
      "Fim",
      "Importância",
      "Prioridade",
      "Origem da prioridade",
      "Tags",
      "Bloqueado",
      "Atualizado",
    ];
    const body = all.map((item) => [
      item.kind,
      item.code,
      item.title,
      item.project_name,
      item.status,
      item.po_name ?? "",
      item.assignee_name ?? "",
      item.start_date ?? "",
      item.end_date ?? "",
      item.importance,
      item.priority.value ?? "",
      item.priority.source,
      item.tags.map((tag) => tag.name).join(";"),
      item.blocked ? "sim" : "não",
      item.updated_at,
    ]);
    return c.body(csv([header, ...body]), 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="meraki-demandas.csv"`,
      "Cache-Control": "no-store",
    });
  });

  app.get("/items/:id/export.md", (c) => {
    const actor = c.get("actor")!;
    const item = loadItem(db, tenantId, c.req.param("id"));
    const channel = ensureChannel(db, tenantId, "demand", { demandId: item.id, name: item.code });
    const messages = messagesForChannel(db, channel.id, 200);
    const lines = [
      `# ${item.code} · ${item.title}`,
      "",
      `- Tipo: ${item.kind}`,
      `- Pasta: ${item.project_name}`,
      `- Status: ${item.status}`,
      `- Responsável: ${item.assignee_name ?? "—"}`,
      `- PO: ${item.po_name ?? "—"}`,
      `- Período: ${item.start_date ?? "—"} → ${item.end_date ?? "—"}`,
      `- Prioridade: ${item.priority.value?.toUpperCase() ?? "—"} (${item.priority.source})`,
      `- Tags: ${item.tags.map((tag) => tag.name).join(", ") || "—"}`,
      "",
      "## Descrição",
      "",
      item.description_md || "_Sem descrição._",
      "",
      "## Conversa",
      "",
      ...messages.flatMap((message) => [
        `### ${message.author_name} · ${message.created_at}`,
        "",
        message.deleted_at ? "_Mensagem removida._" : message.body_md,
        "",
      ]),
      "## Anexos",
      "",
      ...attachmentsForItem(db, item.id).map((file) =>
        `- [${file.original_name}](/attachments/${file.id}/download)`
      ),
      "",
      `Exportado por ${actor.name} em ${nowIso()}.`,
      "",
    ];
    return c.body(lines.join("\n"), 200, {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${item.code}.md"`,
      "Cache-Control": "no-store",
    });
  });

  app.get("/search", (c) => {
    const actor = c.get("actor")!;
    const q = c.req.query("q") ?? "";
    const list = q ? items(db, tenantId, { q, limit: 100 }) : [];
    const marks = list.map((item) => {
      const excerpt = item.description_md.slice(0, 180);
      return (
        <a class="card card-pad" href={`/items/${item.id}`}>
          <div class="section-head">
            <strong>{item.code}</strong>
            <span class="muted small">{item.project_name}</span>
          </div>
          <div>{item.title}</div>
          {excerpt ? <p class="muted small mt-4">{excerpt}</p> : null}
        </a>
      );
    });
    return render(
      c,
      (
        <Page actor={actor} title="Busca" unread={unreadCount(db, actor.id)}>
          <div class="page-head">
            <div>
              <h1>Busca</h1>
              <p class="lede">
                {q
                  ? `${list.length} resultado(s) para “${q}”`
                  : "Busque por título, descrição ou tag."}
              </p>
            </div>
          </div>
          <form class="toolbar" method="get" action="/search">
            <input class="input" name="q" value={q} placeholder="Buscar…" autofocus />
            <button class="btn" type="submit">Buscar</button>
          </form>
          <div class="grid-cards">{marks}</div>
        </Page>
      ),
    );
  });

  app.get("/admin/tags", (c) => {
    const actor = c.get("actor")!;
    if (!canManageTags(actor)) throw new HTTPException(403, { message: "Sem permissão" });
    return render(
      c,
      (
        <TagsPage
          actor={actor}
          unread={unreadCount(db, actor.id)}
          tags={listTags(db, tenantId, true)}
          ok={c.req.query("ok")}
        />
      ),
    );
  });

  app.post("/admin/tags/:id", async (c) => {
    const actor = c.get("actor")!;
    if (!canManageTags(actor)) throw new HTTPException(403, { message: "Sem permissão" });
    const body = await c.req.parseBody();
    const action = formValue(body["action"] ?? null);
    const id = c.req.param("id") ?? "";
    const tag = one<{ id: string; name: string; slug: string }>(
      db,
      "SELECT id, name, slug FROM tags WHERE id = ? AND tenant_id = ?",
      id,
      tenantId,
    );
    if (!tag) return c.notFound();
    if (action === "rename") {
      const name = normalizeTagName(formValue(body["name"] ?? null));
      const slug = slugify(name);
      if (!name || !slug) {
        return render(
          c,
          (
            <TagsPage
              actor={actor}
              unread={unreadCount(db, actor.id)}
              tags={listTags(db, tenantId, true)}
              error="Nome de tag inválido."
            />
          ),
          422,
        );
      }
      const conflict = one<{ id: string }>(
        db,
        "SELECT id FROM tags WHERE tenant_id = ? AND slug = ? AND id <> ?",
        tenantId,
        slug,
        id,
      );
      if (conflict) {
        return render(
          c,
          (
            <TagsPage
              actor={actor}
              unread={unreadCount(db, actor.id)}
              tags={listTags(db, tenantId, true)}
              error="Já existe uma tag com este slug."
            />
          ),
          409,
        );
      }
      run(
        db,
        "UPDATE tags SET name = ?, slug = ?, updated_at = ? WHERE id = ?",
        name,
        slug,
        nowIso(),
        id,
      );
    } else if (action === "archive") {
      run(
        db,
        "UPDATE tags SET archived_at = ?, updated_at = ? WHERE id = ?",
        nowIso(),
        nowIso(),
        id,
      );
    } else if (action === "restore") {
      run(db, "UPDATE tags SET archived_at = NULL, updated_at = ? WHERE id = ?", nowIso(), id);
    }
    return c.redirect("/admin/tags?ok=updated", 303);
  });

  return app;
}

function parseTagInput(raw: string): string[] {
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

export { parseTagInput };
