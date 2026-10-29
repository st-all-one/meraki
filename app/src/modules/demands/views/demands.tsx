import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import type { Counts, Item } from "../infrastructure/items.ts";
import { statusLabel } from "../infrastructure/items.ts";
import type { Filters } from "../infrastructure/items.ts";
import type { TagRow } from "../infrastructure/tags.ts";
import type { Quadrant } from "../domain/priority.ts";
import { Page } from "@layout/views/page.tsx";
import {
  DateRange,
  Empty,
  KindBadge,
  PriorityBadge,
  StatusBadge,
  TagChips,
} from "@layout/views/ui.tsx";

export interface FilterOptions {
  projects: readonly { key: string; name: string }[];
  users: readonly { id: string; name: string }[];
  tags: readonly TagRow[];
  query: URLSearchParams;
}

function hrefWith(query: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(query);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const text = next.toString();
  return `/demands${text ? `?${text}` : ""}`;
}

const FiltersForm: FC<{ opts: FilterOptions; filters: Filters; base: string }> = (
  { opts, filters, base },
) => (
  <form method="get" action={base} class="toolbar" aria-label="Filtros de demandas">
    <input
      class="input input filter-q"
      type="search"
      name="q"
      value={filters.q ?? ""}
      placeholder="Buscar título, descrição ou tag"
    />
    <select class="input input select-auto" name="kind" aria-label="Tipo">
      <option value="">Tipo</option>
      <option value="task" selected={filters.kind === "task"}>Tarefa</option>
      <option value="issue" selected={filters.kind === "issue"}>Issue</option>
    </select>
    <select class="input input select-auto" name="status" aria-label="Status">
      <option value="">Status</option>
      {["backlog", "todo", "doing", "review", "done", "open", "accepted", "rejected"].map((
        status,
      ) => (
        <option value={status} selected={filters.status === status}>
          {statusLabel("task", status)}
        </option>
      ))}
    </select>
    <select class="input input select-auto" name="project" aria-label="Pasta">
      <option value="">Pasta</option>
      {opts.projects.map((project) => (
        <option value={project.key} selected={filters.projectKey === project.key}>
          {project.name}
        </option>
      ))}
    </select>
    <select class="input input select-auto" name="assignee" aria-label="Responsável">
      <option value="">Responsável</option>
      {opts.users.map((user) => (
        <option value={user.id} selected={filters.assigneeId === user.id}>{user.name}</option>
      ))}
    </select>
    <select class="input input select-auto" name="po" aria-label="PO">
      <option value="">PO</option>
      {opts.users.map((user) => (
        <option value={user.id} selected={filters.poId === user.id}>{user.name}</option>
      ))}
    </select>
    <select class="input input select-auto" name="priority" aria-label="Prioridade">
      <option value="">Prioridade</option>
      {(["q1", "q2", "q3", "q4"] as const).map((q) => (
        <option value={q} selected={filters.priority === q}>{q.toUpperCase()}</option>
      ))}
    </select>
    <select class="input input select-auto" name="tag" multiple size={1} aria-label="Tags">
      {opts.tags.map((tag) => (
        <option value={tag.slug} selected={filters.tagSlugs?.includes(tag.slug)}>
          #{tag.name}
        </option>
      ))}
    </select>
    <label class="small">
      <input type="checkbox" name="ready" value="1" checked={filters.ready} /> Prontas
    </label>
    <label class="small">
      <input type="checkbox" name="attention" value="1" checked={filters.attention} /> Atenção
    </label>
    <button class="btn" type="submit">Filtrar</button>
    <a class="btn btn-ghost" href={base}>Limpar</a>
  </form>
);

const DemandsTable: FC<{ items: Item[] }> = ({ items }) => (
  <div class="table-wrap desktop-only">
    <table class="data">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>ID</th>
          <th>Título</th>
          <th>Pasta</th>
          <th>Status</th>
          <th>PO</th>
          <th>Responsável</th>
          <th>Início → Fim</th>
          <th>Prioridade</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr class={item.status === "done" ? "table-done" : ""}>
            <td>
              <KindBadge kind={item.kind} />
            </td>
            <td class="id">{item.code}</td>
            <td>
              <a class="title-link" href={`/items/${item.id}`}>{item.title}</a>
              {item.blocked ? <span class="badge badge-danger ml-6">bloqueada</span> : null}
            </td>
            <td>{item.project_name}</td>
            <td>
              <StatusBadge kind={item.kind} status={item.status} />
            </td>
            <td>{item.po_name ?? <span class="muted">Sem PO</span>}</td>
            <td>{item.assignee_name ?? <span class="muted">—</span>}</td>
            <td>
              <DateRange start={item.start_date} end={item.end_date} />
            </td>
            <td>
              <PriorityBadge value={item.priority.value} source={item.priority.source} />
            </td>
            <td>
              <TagChips tags={item.tags} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DemandsCards: FC<{ items: Item[] }> = ({ items }) => (
  <div class="mobile-cards mobile-only">
    {items.map((item) => (
      <a class="demand-card" href={`/items/${item.id}`}>
        <div class="demand-card-head">
          <span>
            <KindBadge kind={item.kind} /> <span class="id mono">{item.code}</span>
          </span>
          <StatusBadge kind={item.kind} status={item.status} />
        </div>
        <div class="demand-card-title">{item.title}</div>
        <div class="demand-card-meta">
          <PriorityBadge value={item.priority.value} source={item.priority.source} />
          <DateRange start={item.start_date} end={item.end_date} />
          <span>{item.assignee_name ?? "Sem responsável"}</span>
        </div>
        <div class="mt-6">
          <TagChips tags={item.tags} />
        </div>
      </a>
    ))}
  </div>
);

export const DemandsPage: FC<{
  actor: Actor;
  unread: number;
  items: Item[];
  counts: Counts;
  filters: Filters;
  opts: FilterOptions;
  total: number;
  page: number;
  ok?: string;
}> = ({ actor, unread, items, counts, filters, opts, total, page, ok }) => (
  <Page actor={actor} title="Demandas" active="demands" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Demandas</h1>
        <p class="lede">Tarefas oficiais e issues sugeridas, com prioridade calculada.</p>
      </div>
      <div class="page-actions">
        <a class="btn" href="/demands/export.csv?${opts.query.toString()}">Exportar CSV</a>
        <a class="btn" href="/items/new?kind=issue">Nova issue</a>
        {actor.role === "admin" || actor.role === "manager"
          ? <a class="btn btn-primary" href="/items/new?kind=task">Nova tarefa</a>
          : null}
      </div>
    </div>
    {ok === "password" ? <div class="alert alert-success">Senha atualizada.</div> : null}
    <div class="stats">
      <a class="stat" href={hrefWith(opts.query, { kind: "task" })}>
        <div class="stat-value">{counts.tasks}</div>
        <div class="stat-label">Tarefas abertas</div>
      </a>
      <a class="stat" href={hrefWith(opts.query, { kind: "issue" })}>
        <div class="stat-value">{counts.issues}</div>
        <div class="stat-label">Issues abertas</div>
      </a>
      <a class="stat" href={hrefWith(opts.query, { attention: "1" })}>
        <div class="stat-value">{counts.overdue}</div>
        <div class="stat-label">Atrasadas</div>
      </a>
      <a class="stat" href={hrefWith(opts.query, { attention: "1" })}>
        <div class="stat-value">{counts.blocked}</div>
        <div class="stat-label">Bloqueadas</div>
      </a>
      <a class="stat" href={hrefWith(opts.query, { priority: "q1" })}>
        <div class="stat-value">{counts.q1}</div>
        <div class="stat-label">Q1</div>
      </a>
    </div>
    <FiltersForm opts={opts} filters={filters} base="/demands" />
    {items.length === 0
      ? (
        <Empty
          title="Nenhuma demanda com estes filtros."
          detail="Ajuste os filtros ou crie uma issue."
        />
      )
      : (
        <>
          <DemandsTable items={items} />
          <DemandsCards items={items} />
          <div class="pagination">
            <span class="muted">{total} demanda(s)</span>
            {page > 1
              ? (
                <a class="btn btn-small" href={hrefWith(opts.query, { page: String(page - 1) })}>
                  Anterior
                </a>
              )
              : null}
            {items.length === 50
              ? (
                <a class="btn btn-small" href={hrefWith(opts.query, { page: String(page + 1) })}>
                  Próxima
                </a>
              )
              : null}
          </div>
        </>
      )}
  </Page>
);

export const MyPage: FC<{ actor: Actor; unread: number; items: Item[] }> = (
  { actor, unread, items },
) => {
  const today = new Date().toISOString().slice(0, 10);
  const open = items.filter((item) => item.status !== "done");
  const sections: { title: string; list: Item[] }[] = [
    {
      title: "Atrasadas",
      list: open.filter((item) => item.end_date !== null && item.end_date < today),
    },
    { title: "Hoje", list: open.filter((item) => item.end_date === today) },
    {
      title: "Próximos 7 dias",
      list: open.filter((item) =>
        item.end_date !== null && item.end_date > today &&
        item.end_date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      ),
    },
    {
      title: "Depois",
      list: open.filter((item) =>
        item.end_date === null ||
        item.end_date > new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      ),
    },
    {
      title: "Concluídas recentemente",
      list: items.filter((item) => item.status === "done").slice(0, 10),
    },
  ];
  return (
    <Page actor={actor} title="Minhas tarefas" active="my" unread={unread}>
      <div class="page-head">
        <div>
          <h1>Minhas tarefas</h1>
          <p class="lede">Sou responsável ou PO.</p>
        </div>
        <a class="btn" href="/demands">Índice geral</a>
      </div>
      {sections.map((section) =>
        section.list.length === 0 ? null : (
          <section class="section">
            <div class="section-head">
              <h2>{section.title}</h2>
              <span class="muted small">{section.list.length}</span>
            </div>
            <div class="mobile-cards">
              {section.list.map((item) => (
                <a class="demand-card" href={`/items/${item.id}`}>
                  <div class="demand-card-head">
                    <span class="mono small">{item.code}</span>
                    <StatusBadge kind={item.kind} status={item.status} />
                  </div>
                  <div class="demand-card-title">{item.title}</div>
                  <div class="demand-card-meta">
                    <PriorityBadge value={item.priority.value} source={item.priority.source} />
                    <DateRange start={item.start_date} end={item.end_date} />
                    <TagChips tags={item.tags} />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )
      )}
      {items.length === 0
        ? <Empty title="Nada atribuído a você." detail="O índice geral mostra todas as demandas." />
        : null}
    </Page>
  );
};

export const BoardPage: FC<{
  actor: Actor;
  unread: number;
  project: { key: string; name: string };
  items: Item[];
  filters: Filters;
  opts: FilterOptions;
}> = ({ actor, unread, project, items, filters, opts }) => {
  const columns = [
    { status: "backlog", label: "Backlog" },
    { status: "todo", label: "A fazer" },
    { status: "doing", label: "Em andamento" },
    { status: "review", label: "Em revisão" },
    { status: "done", label: "Concluído" },
  ];
  return (
    <Page actor={actor} title={`${project.name} · Board`} active="projects" unread={unread}>
      <div class="page-head">
        <div>
          <h1>{project.name}</h1>
          <p class="lede">Board de tarefas oficiais.</p>
        </div>
        <div class="page-actions">
          <a class="btn" href={`/projects/${project.key}`}>Lista</a>
          <a class="btn" href={`/projects/${project.key}/calendar`}>Calendário</a>
          <a class="btn btn-primary" href={`/items/new?kind=task&project=${project.key}`}>
            Nova tarefa
          </a>
        </div>
      </div>
      <FiltersForm opts={opts} filters={filters} base={`/projects/${project.key}/board`} />
      <div class="board">
        {columns.map((column) => {
          const list = items.filter((item) => item.status === column.status);
          return (
            <section class="board-col">
              <h2>
                <span>{column.label}</span>
                <span>{list.length}</span>
              </h2>
              {list.map((item) => (
                <div class="board-card">
                  <div class="demand-card-head">
                    <span class="mono small">{item.code}</span>
                    <PriorityBadge value={item.priority.value} source={item.priority.source} />
                  </div>
                  <a class="board-card-title" href={`/items/${item.id}`}>{item.title}</a>
                  <div class="board-card-meta">
                    <span>{item.assignee_name ?? "Sem responsável"}</span>
                    <DateRange start={item.start_date} end={item.end_date} />
                  </div>
                  <div class="board-card-meta mt-4">
                    <TagChips tags={item.tags} limit={2} />
                  </div>
                  <form method="post" action={`/items/${item.id}/status`} class="mt-6">
                    <input type="hidden" name="version" value={item.version} />
                    <input type="hidden" name="redirect" value={`/projects/${project.key}/board`} />
                    <label class="sr-only" for={`move-${item.id}`}>Mover {item.code}</label>
                    <select id={`move-${item.id}`} name="status" data-autosubmit>
                      {columns.map((c) => (
                        <option value={c.status} selected={c.status === item.status}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </form>
                </div>
              ))}
              {list.length === 0 ? <p class="muted small">Vazio.</p> : null}
            </section>
          );
        })}
      </div>
    </Page>
  );
};

export const CalendarPage: FC<{
  actor: Actor;
  unread: number;
  project: { key: string; name: string };
  items: Item[];
  month: string;
}> = ({ actor, unread, project, items, month }) => {
  const first = new Date(`${month}-01T00:00:00.000Z`);
  const startOffset = first.getUTCDay();
  const start = new Date(first);
  start.setUTCDate(1 - startOffset);
  const days: Date[] = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date;
  });
  const monthLabel = first.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const prev = new Date(first);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const next = new Date(first);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Page actor={actor} title={`${project.name} · Calendário`} active="projects" unread={unread}>
      <div class="page-head">
        <div>
          <h1>{project.name}</h1>
          <p class="lede">Calendário de tarefas.</p>
        </div>
        <div class="page-actions">
          <a class="btn" href={`/projects/${project.key}`}>Lista</a>
          <a class="btn" href={`/projects/${project.key}/board`}>Board</a>
        </div>
      </div>
      <div class="calendar-head">
        <a
          class="btn btn-small"
          href={`/projects/${project.key}/calendar?month=${iso(prev).slice(0, 7)}`}
        >
          ←
        </a>
        <strong class="capitalize">{monthLabel}</strong>
        <a
          class="btn btn-small"
          href={`/projects/${project.key}/calendar?month=${iso(next).slice(0, 7)}`}
        >
          →
        </a>
      </div>
      <div class="calendar">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div class="calendar-day calendar-weekday">{day}</div>
        ))}
        {days.map((date) => {
          const day = iso(date);
          const list = items.filter((item) =>
            item.start_date !== null && item.end_date !== null && item.start_date <= day &&
            item.end_date >= day
          );
          return (
            <div
              class={`calendar-day ${date.getUTCMonth() !== first.getUTCMonth() ? "out" : ""} ${
                day === today ? "today" : ""
              }`}
            >
              <div class="calendar-num">{date.getUTCDate()}</div>
              {list.slice(0, 4).map((item) => (
                <a
                  class={`calendar-task ${
                    item.end_date !== null && item.end_date < today ? "late" : ""
                  }`}
                  href={`/items/${item.id}`}
                  title={item.title}
                >
                  {item.code} {item.title}
                </a>
              ))}
              {list.length > 4 ? <span class="small muted">+{list.length - 4}</span> : null}
            </div>
          );
        })}
      </div>
      <section class="section mobile-only">
        <h2>Agenda</h2>
        <div class="mobile-cards">
          {items.map((item) => (
            <a class="demand-card" href={`/items/${item.id}`}>
              <div class="demand-card-title">{item.title}</div>
              <div class="demand-card-meta">
                <DateRange start={item.start_date} end={item.end_date} />
                <PriorityBadge value={item.priority.value} source={item.priority.source} />
              </div>
            </a>
          ))}
        </div>
      </section>
    </Page>
  );
};

export function priorityLabel(value: Quadrant | null): string {
  return value ? value.toUpperCase() : "—";
}
