import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import type { Item } from "../infrastructure/items.ts";
import { Page } from "@layout/views/page.tsx";
import {
  DateRange,
  Empty,
  KindBadge,
  PriorityBadge,
  StatusBadge,
  TagChips,
} from "@layout/views/ui.tsx";

export interface ProjectRow {
  id: string;
  key: string;
  name: string;
  next_seq: number;
  archived_at: string | null;
  task_count: number;
  issue_count: number;
}

export const ProjectsPage: FC<{
  actor: Actor;
  unread: number;
  projects: ProjectRow[];
  ok?: string;
}> = ({ actor, unread, projects, ok }) => (
  <Page actor={actor} title="Pastas" active="projects" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Pastas</h1>
        <p class="lede">Agrupam tarefas e issues; são geridas por admin.</p>
      </div>
      {actor.role === "admin"
        ? <a class="btn btn-primary" href="/projects/new">Nova pasta</a>
        : null}
    </div>
    {ok ? <div class="alert alert-success">{ok}</div> : null}
    {projects.length === 0
      ? <Empty title="Nenhuma pasta." detail="Admin pode criar a primeira." />
      : (
        <div class="grid-cards">
          {projects.map((project) => (
            <a class="card card-pad" href={`/projects/${project.key}`}>
              <div class="section-head">
                <h2>{project.name}</h2>
                <span class="mono muted small">{project.key}</span>
              </div>
              <p class="muted small">
                {project.task_count} tarefa(s) · {project.issue_count} issue(s)
              </p>
              {project.archived_at ? <span class="badge">arquivada</span> : null}
            </a>
          ))}
        </div>
      )}
  </Page>
);

export const ProjectFormPage: FC<{ actor: Actor; unread: number; error?: string }> = (
  { actor, unread, error },
) => (
  <Page actor={actor} title="Nova pasta" active="projects" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Nova pasta</h1>
        <p class="lede">Chave curta, única, usada no ID das demandas.</p>
      </div>
    </div>
    {error ? <div class="alert alert-danger">{error}</div> : null}
    <form method="post" action="/projects" class="form-card form-narrow">
      <label class="field">
        <span class="field-label">Chave *</span>
        <input class="input" name="key" required maxlength={8} placeholder="MER" />
      </label>
      <label class="field">
        <span class="field-label">Nome *</span>
        <input class="input" name="name" required placeholder="Meraki" />
      </label>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Criar</button>
        <a class="btn" href="/projects">Cancelar</a>
      </div>
    </form>
  </Page>
);

export const ProjectPage: FC<{
  actor: Actor;
  unread: number;
  project: { id: string; key: string; name: string };
  items: Item[];
  canAdmin: boolean;
}> = ({ actor, unread, project, items, canAdmin }) => (
  <Page actor={actor} title={project.name} active="projects" unread={unread}>
    <div class="page-head">
      <div>
        <h1>{project.name}</h1>
        <p class="lede">{project.key} · demandas da pasta</p>
      </div>
      <div class="page-actions">
        <a class="btn" href={`/projects/${project.key}/board`}>Board</a>
        <a class="btn" href={`/projects/${project.key}/calendar`}>Calendário</a>
        <a class="btn" href={`/demands?project=${project.key}`}>Índice</a>
        {actor.role !== "developer"
          ? (
            <a class="btn btn-primary" href={`/items/new?kind=task&project=${project.key}`}>
              Nova tarefa
            </a>
          )
          : null}
        <a class="btn" href={`/items/new?kind=issue&project=${project.key}`}>Nova issue</a>
      </div>
    </div>
    {canAdmin
      ? (
        <details class="card card-pad section">
          <summary>Editar pasta</summary>
          <form method="post" action={`/projects/${project.key}`} class="section">
            <label class="field">
              <span class="field-label">Nome</span>
              <input class="input" name="name" value={project.name} required />
            </label>
            <label class="field">
              <span class="field-label">Arquivar</span>
              <span>
                <input type="checkbox" name="archived" /> arquivar pasta
              </span>
            </label>
            <button class="btn" type="submit">Salvar pasta</button>
          </form>
        </details>
      )
      : null}
    {items.length === 0
      ? <Empty title="Pasta vazia." detail="Crie uma issue ou tarefa." />
      : (
        <div class="mobile-cards">
          {items.map((item) => (
            <a class="demand-card" href={`/items/${item.id}`}>
              <div class="demand-card-head">
                <span>
                  <KindBadge kind={item.kind} /> <span class="mono small">{item.code}</span>
                </span>
                <StatusBadge kind={item.kind} status={item.status} />
              </div>
              <div class="demand-card-title">{item.title}</div>
              <div class="demand-card-meta">
                <PriorityBadge value={item.priority.value} source={item.priority.source} />
                <DateRange start={item.start_date} end={item.end_date} />
                <span>{item.assignee_name ?? "Sem responsável"}</span>
              </div>
              <div class="mt-5">
                <TagChips tags={item.tags} />
              </div>
            </a>
          ))}
        </div>
      )}
  </Page>
);
