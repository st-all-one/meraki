import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import type { Item } from "../infrastructure/items.ts";
import { statusesFor, statusLabel } from "../infrastructure/items.ts";
import type { TagRow } from "../infrastructure/tags.ts";
import { Page } from "@layout/views/page.tsx";
import type { AttachmentDisplay } from "@layout/views/types.ts";
import { Markdown } from "@layout/views/markdown.tsx";
import { formatDate } from "@layout/views/page.tsx";
import {
  AttachmentList,
  Avatar,
  DateRange,
  Field,
  Icon,
  KindBadge,
  PriorityBadge,
  Select,
  StatusBadge,
  TagChips,
  TextArea,
} from "@layout/views/ui.tsx";
import { Composer, MessageList, type MessageView } from "@layout/views/chat.tsx";

export type ItemTab = "conversation" | "attachments" | "canvas" | "history";

interface UserOption {
  id: string;
  name: string;
}

export interface EventRow {
  id: string;
  kind: string;
  from_value: string | null;
  to_value: string | null;
  metadata: string;
  created_at: string;
  actor_name: string | null;
}

const EVENT_LABEL: Record<string, string> = {
  created: "criou",
  edited: "editou",
  status: "mudou status",
  assignee: "mudou responsável",
  po: "mudou PO",
  importance: "mudou importância",
  priority: "mudou prioridade",
  start: "mudou início",
  end: "mudou fim",
  blocked: "mudou bloqueio",
  title: "mudou título",
  description: "mudou descrição",
  tags: "mudou tags",
  archived: "arquivou",
  restored: "restaurou",
  promoted: "promoveu a tarefa",
  attachment: "anexou",
  canvas: "editou canvas",
  conversation: "criou conversa",
};

function tabs(item: Item): { id: ItemTab; label: string; href: string }[] {
  return [
    { id: "conversation", label: "Conversa", href: `/items/${item.id}` },
    { id: "attachments", label: "Anexos", href: `/items/${item.id}?tab=attachments` },
    { id: "canvas", label: "Canvas", href: `/items/${item.id}?tab=canvas` },
    { id: "history", label: "Histórico", href: `/items/${item.id}?tab=history` },
  ];
}

const StatusForm: FC<{ item: Item; redirect: string; label?: string }> = (
  { item, redirect, label = "Mover status" },
) => (
  <form method="post" action={`/items/${item.id}/status`} class="composer">
    <input type="hidden" name="version" value={item.version} />
    <input type="hidden" name="redirect" value={redirect} />
    <label class="field">
      <span class="field-label">{label}</span>
      <select class="input" name="status">
        {statusesFor(item.kind).map((status) => (
          <option value={status} selected={status === item.status}>
            {statusLabel(item.kind, status)}
          </option>
        ))}
      </select>
    </label>
    <button class="btn" type="submit">Aplicar</button>
  </form>
);

export const ItemPage: FC<{
  actor: Actor;
  unread: number;
  item: Item;
  tab: ItemTab;
  messages: MessageView[];
  attachments: AttachmentDisplay[];
  events: EventRow[];
  poOptions: UserOption[];
  projectOptions: UserOption[];
  canEdit: boolean;
  canArchive: boolean;
  canSetPo: boolean;
  canOverride: boolean;
  canPromote: boolean;
  canEditMessages: boolean;
  maxChatBody: number;
  conversationAction: string;
  errors?: Record<string, string>;
  ok?: string;
}> = (props) => {
  const { actor, item } = props;
  return (
    <Page
      actor={actor}
      title={`${item.code} · ${item.title}`}
      active="demands"
      unread={props.unread}
    >
      <div class="item-head">
        <KindBadge kind={item.kind} />
        <span class="mono small muted">{item.code}</span>
        <StatusBadge kind={item.kind} status={item.status} />
        {item.blocked ? <span class="badge badge-danger">bloqueada</span> : null}
        <span class="spacer"></span>
        {props.canEdit
          ? (
            <a class="btn btn-small" href={`/items/${item.id}/edit`}>
              <Icon name="edit" class="icon" /> Editar
            </a>
          )
          : null}
        {props.canArchive
          ? (
            item.archived_at
              ? (
                <form method="post" action={`/items/${item.id}/restore`} class="inline">
                  <button class="btn btn-small" type="submit">Restaurar</button>
                </form>
              )
              : (
                <form
                  method="post"
                  action={`/items/${item.id}/archive`}
                  class="inline"
                  data-confirm="Arquivar esta demanda?"
                >
                  <button class="btn btn-small" type="submit">Arquivar</button>
                </form>
              )
          )
          : null}
      </div>
      <h1 class="item-title">{item.title}</h1>
      {item.archived_at
        ? <div class="alert">Esta demanda está arquivada. O link continua funcionando.</div>
        : null}
      {props.ok ? <div class="alert alert-success">{props.ok}</div> : null}
      <div class="item-grid">
        <div>
          <div class="tabs" role="tablist">
            {tabs(item).map((tab) => (
              <a
                class="tab"
                role="tab"
                aria-current={tab.id === props.tab ? "page" : undefined}
                href={tab.href}
              >
                {tab.label}
              </a>
            ))}
          </div>
          {props.tab === "conversation"
            ? (
              <section>
                <div id="chat-stream" data-channel-id="">
                  <MessageList
                    messages={props.messages}
                    actor={actor}
                    canEditAny={props.canEditMessages}
                    empty="Comece a conversa."
                  />
                </div>
                <div class="section">
                  <Composer action={props.conversationAction} maxLength={props.maxChatBody} />
                </div>
              </section>
            )
            : null}
          {props.tab === "attachments"
            ? (
              <section>
                <div class="section-head">
                  <h2>Anexos</h2>
                  <span class="muted small">{props.attachments.length}/10</span>
                </div>
                <form
                  method="post"
                  action={`/items/${item.id}/attachments`}
                  enctype="multipart/form-data"
                  class="card card-pad"
                >
                  <label class="field">
                    <span class="field-label">Adicionar arquivos</span>
                    <input
                      type="file"
                      name="attachments"
                      multiple
                      accept="image/png,image/jpeg,application/pdf"
                    />
                    <span class="field-hint">PNG, JPEG ou PDF · até 10 MB cada · 3 por envio.</span>
                  </label>
                  <button class="btn btn-primary" type="submit">Enviar anexos</button>
                </form>
                <div class="section">
                  <AttachmentList attachments={props.attachments} canArchive itemId={item.id} />
                </div>
              </section>
            )
            : null}
          {props.tab === "canvas"
            ? (
              <section>
                <div class="section-head">
                  <h2>Canvas da demanda</h2>
                  <button
                    class="btn btn-primary"
                    type="button"
                    data-canvas-open
                    data-item-id={item.id}
                  >
                    Abrir canvas
                  </button>
                </div>
                <p class="muted">
                  Um canvas por demanda; qualquer pessoa com acesso entra e edita em tempo real.
                </p>
                <div id="canvas-host" data-item-id={item.id}></div>
              </section>
            )
            : null}
          {props.tab === "history"
            ? (
              <section>
                <h2>Histórico</h2>
                <ul class="history">
                  {props.events.map((event) => (
                    <li>
                      <strong>{event.actor_name ?? "Sistema"}</strong>{" "}
                      {EVENT_LABEL[event.kind] ?? event.kind}
                      {event.from_value || event.to_value
                        ? (
                          <span class="muted">
                            {event.from_value ?? "—"} → {event.to_value ?? "—"}
                          </span>
                        )
                        : null}
                      <span class="muted small">
                        · {new Date(event.created_at).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )
            : null}
          {props.tab === "conversation" || props.tab === "attachments"
            ? (
              <section class="section">
                <h2>Descrição</h2>
                {item.description_md
                  ? <Markdown source={item.description_md} />
                  : <p class="muted">Sem descrição.</p>}
              </section>
            )
            : null}
        </div>
        <aside>
          <div class="card card-pad">
            <dl class="item-meta">
              <div>
                <dt>Pasta</dt>
                <dd>
                  <a href={`/projects/${item.project_key}`}>{item.project_name}</a>
                </dd>
              </div>
              <div>
                <dt>Responsável</dt>
                <dd>{item.assignee_name ?? "—"}</dd>
              </div>
              <div>
                <dt>PO</dt>
                <dd>{item.kind === "task" ? item.po_name ?? "Sem PO" : "—"}</dd>
              </div>
              <div>
                <dt>Período</dt>
                <dd>
                  <DateRange start={item.start_date} end={item.end_date} />
                </dd>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd>
                  <PriorityBadge value={item.priority.value} source={item.priority.source} />
                </dd>
              </div>
              <div>
                <dt>Importância</dt>
                <dd>{item.importance}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>
                  <TagChips tags={item.tags} limit={8} />
                </dd>
              </div>
              <div>
                <dt>Criada</dt>
                <dd>{formatDate(item.created_at.slice(0, 10))}</dd>
              </div>
            </dl>
            {props.canEdit ? <StatusForm item={item} redirect={`/items/${item.id}`} /> : null}

            {item.kind === "task" && props.canSetPo
              ? (
                <form method="post" action={`/items/${item.id}/po`} class="section">
                  <label class="field">
                    <span class="field-label">PO</span>
                    <select class="input" name="po_id">
                      <option value="">Sem PO</option>
                      {props.poOptions.map((user) => (
                        <option value={user.id} selected={user.id === item.po_id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button class="btn btn-small" type="submit">Salvar PO</button>
                </form>
              )
              : null}

            {item.kind === "task" && props.canOverride
              ? (
                <form method="post" action={`/items/${item.id}/priority`} class="section">
                  <label class="field">
                    <span class="field-label">Prioridade manual</span>
                    <select class="input" name="priority">
                      <option value="">Voltar ao automático</option>
                      {(["q1", "q2", "q3", "q4"] as const).map((q) => (
                        <option value={q} selected={item.priority_override === q}>
                          {q.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    {item.priority_override
                      ? (
                        <span class="field-hint">
                          Automática: {item.priority.calculated?.toUpperCase()}
                        </span>
                      )
                      : null}
                  </label>
                  <Field
                    label="Motivo (opcional)"
                    name="reason"
                    value={item.priority_override_reason}
                  />
                  <button class="btn btn-small" type="submit">Aplicar</button>
                </form>
              )
              : null}

            {item.kind === "issue" && props.canPromote
              ? (
                <form method="post" action={`/items/${item.id}/promote`} class="section form-card">
                  <h2 class="h2-small">Promover a tarefa</h2>
                  <p class="muted small">Datas e responsável são obrigatórios.</p>
                  <Field
                    label="Início"
                    name="start_date"
                    type="date"
                    required
                    value={item.start_date}
                  />
                  <Field label="Fim" name="end_date" type="date" required value={item.end_date} />
                  <Select
                    label="Responsável"
                    name="assignee_id"
                    required
                    options={props.poOptions.map((user) => ({ value: user.id, label: user.name }))}
                    blank="Escolha"
                  />
                  <Select
                    label="PO"
                    name="po_id"
                    options={props.poOptions.map((user) => ({ value: user.id, label: user.name }))}
                    blank="Sem PO"
                  />
                  <button class="btn btn-primary" type="submit">Promover</button>
                </form>
              )
              : null}
          </div>
          <div class="card card-pad section">
            <h2 class="h2-small">Participantes</h2>
            <p class="small">
              <Avatar name={item.creator_name} /> {item.creator_name} criou
            </p>
            {item.assignee_name
              ? (
                <p class="small">
                  <Avatar name={item.assignee_name} /> {item.assignee_name} executa
                </p>
              )
              : null}
          </div>
        </aside>
      </div>
    </Page>
  );
};

export const ItemFormPage: FC<{
  actor: Actor;
  unread: number;
  mode: "new" | "edit";
  kind: "task" | "issue";
  item?: Item;
  projects: readonly { id: string; key: string; name: string }[];
  users: readonly { id: string; name: string }[];
  tags: readonly TagRow[];
  errors?: Record<string, string>;
}> = (props) => {
  const item = props.item;
  const isTask = props.kind === "task";
  const action = item ? `/items/${item.id}` : "/items";
  return (
    <Page
      actor={props.actor}
      title={item ? `Editar ${item.code}` : isTask ? "Nova tarefa" : "Nova issue"}
      active="demands"
      unread={props.unread}
    >
      <div class="page-head">
        <div>
          <h1>{item ? `Editar ${item.code}` : isTask ? "Nova tarefa" : "Nova issue"}</h1>
          <p class="lede">
            {isTask
              ? "Tarefa oficial: início, fim e responsável são obrigatórios."
              : "Sugestão do time; sem datas, responsável ou PO até ser promovida."}
          </p>
        </div>
        <a class="btn" href={item ? `/items/${item.id}` : "/demands"}>Cancelar</a>
      </div>
      <form method="post" action={action} class="form-card form-wide">
        {item ? <input type="hidden" name="version" value={item.version} /> : null}
        <input type="hidden" name="kind" value={props.kind} />
        {!item
          ? (
            <Select
              label="Pasta"
              name="project_id"
              required
              options={props.projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              value={props.projects[0]?.id}
            />
          )
          : null}
        <Field
          label="Título"
          name="title"
          value={item?.title}
          required
          autofocus
          error={props.errors?.["title"]}
        />
        <TextArea
          label="Descrição (Markdown)"
          name="description_md"
          value={item?.description_md}
          rows={7}
          hint="HTML cru não é renderizado; imagens entram como anexo."
        />
        {isTask
          ? (
            <div class="form-grid two">
              <Field
                label="Início"
                name="start_date"
                type="date"
                value={item?.start_date}
                required
                error={props.errors?.["start_date"]}
              />
              <Field
                label="Fim"
                name="end_date"
                type="date"
                value={item?.end_date}
                required
                error={props.errors?.["end_date"]}
              />
              <Select
                label="Responsável"
                name="assignee_id"
                required
                options={props.users.map((user) => ({ value: user.id, label: user.name }))}
                value={item?.assignee_id ?? undefined}
                blank="Escolha"
                error={props.errors?.["assignee_id"]}
              />
              <Select
                label="PO"
                name="po_id"
                options={props.users.map((user) => ({ value: user.id, label: user.name }))}
                value={item?.po_id ?? undefined}
                blank="Sem PO"
              />
            </div>
          )
          : null}
        <div class="form-grid two">
          <Select
            label="Importância"
            name="importance"
            value={item?.importance ?? "medium"}
            options={[
              { value: "low", label: "Baixa" },
              { value: "medium", label: "Média" },
              { value: "high", label: "Alta" },
            ]}
          />
          <Select
            label="Status"
            name="status"
            options={statusesFor(props.kind).map((status) => ({
              value: status,
              label: statusLabel(props.kind, status),
            }))}
            value={item?.status ?? (isTask ? "backlog" : "open")}
          />
        </div>
        <label class="field">
          <span class="field-label">Tags</span>
          <input
            class="input"
            name="tags"
            value={item?.tags.map((tag) => tag.name).join(", ")}
            placeholder="ex.: frontend, bug, cliente-x"
          />
          <span class="field-hint">
            Até 8, separadas por vírgula. Tags existentes são reutilizadas.
          </span>
        </label>
        <label class="field">
          <span class="field-label">Bloqueada</span>
          <span>
            <input type="checkbox" name="blocked" checked={item?.blocked === 1} /> bloqueia o início
          </span>
        </label>
        <Field label="Motivo do bloqueio" name="blocked_reason" value={item?.blocked_reason} />
        {isTask && props.actor.role !== "admin" && props.actor.role !== "manager"
          ? <p class="notice">Você pode editar esta tarefa, mas não criar nem arquivar tarefas.</p>
          : null}
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">{item ? "Salvar" : "Criar"}</button>
          <a class="btn" href={item ? `/items/${item.id}` : "/demands"}>Cancelar</a>
        </div>
      </form>
    </Page>
  );
};

export function itemKindFrom(value: string | null): "task" | "issue" {
  return value === "task" ? "task" : "issue";
}
