import type { Child, FC } from "hono/jsx";
import type { ItemKind, Quadrant, TagDisplay } from "./types.ts";
import { humanBytes } from "@kernel/util.ts";
import type { AttachmentDisplay } from "./types.ts";

export const Icon: FC<{ name: string; class?: string }> = ({ name, class: cls = "" }) => {
  const paths: Record<string, string> = {
    home: "M3 11.5 12 4l9 7.5M5 10v9h5v-6h4v6h5v-9",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    folder: "M3 6h7l2 2h9v11H3z",
    chat: "M4 5h16v11H8l-4 4z",
    bell: "M6 8a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9M10 21h4",
    plus: "M12 5v14M5 12h14",
    search: "m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    user: "M20 21a8 8 0 0 0-16 0M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8",
    logout: "M10 17l5-5-5-5M15 12H3M21 3v18h-6",
    settings:
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-1.9.3 1.7 1.7 0 0 0-.6 1.3V22h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1L5 17.4l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.3-.6H4v-4h.1A1.7 1.7 0 0 0 5.7 9.7a1.7 1.7 0 0 0-.3-1.9L5.3 7.7 7.3 4.3l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3.4V3h4v.4a1.7 1.7 0 0 0 .7 1.3 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.3.6h.4v4h-.4a1.7 1.7 0 0 0-1.2.7",
    chevron: "m9 18 6-6-6-6",
    paperclip: "m21 11-8 8a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-2-2l8-8",
    send: "m22 2-7 20-4-9-9-4z",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    archive: "M3 4h18v4H3zM5 8v12h14V8M10 12h4",
    check: "m5 12 5 5L20 7",
    x: "M6 6l12 12M18 6 6 18",
    arrow: "M5 12h14m-6-6 6 6-6 6",
  };
  return (
    <svg
      class={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths["list"]} />
    </svg>
  );
};

export const Badge: FC<{ children: Child; tone?: string; title?: string }> = (
  { children, tone = "neutral", title },
) => <span class={`badge badge-${tone}`} title={title}>{children}</span>;

const TASK_STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  doing: "Em andamento",
  review: "Em revisão",
  done: "Concluído",
};
const ISSUE_STATUS_LABEL: Record<string, string> = {
  open: "Aberta",
  accepted: "Aceita",
  rejected: "Rejeitada",
};
export function statusLabel(kind: ItemKind, status: string): string {
  return (kind === "task" ? TASK_STATUS_LABEL : ISSUE_STATUS_LABEL)[status] ?? status;
}
const PRIORITY_LABEL: Record<Quadrant, string> = {
  q1: "Fazer agora",
  q2: "Agendar",
  q3: "Delegar",
  q4: "Depois",
};
export const KindBadge: FC<{ kind: ItemKind }> = ({ kind }) => (
  <Badge tone={kind === "task" ? "task" : "issue"}>{kind === "task" ? "Tarefa" : "Issue"}</Badge>
);

export const StatusBadge: FC<{ kind: ItemKind; status: string }> = ({ kind, status }) => {
  const tone = status === "done" || status === "accepted"
    ? "success"
    : status === "rejected"
    ? "muted"
    : status === "blocked"
    ? "danger"
    : kind === "issue"
    ? "issue"
    : "info";
  return <Badge tone={tone}>{statusLabel(kind, status)}</Badge>;
};

export const PriorityBadge: FC<{ value: Quadrant | null; source: "auto" | "manual" | "none" }> = (
  { value, source },
) => {
  if (!value) return <span class="muted">—</span>;
  return (
    <span class={`priority priority-${value}`} title={PRIORITY_LABEL[value]}>
      {value.toUpperCase()} · {PRIORITY_LABEL[value]}
      {source === "manual" ? <span class="priority-manual">manual</span> : null}
    </span>
  );
};

export const TagChips: FC<{ tags: readonly TagDisplay[]; limit?: number; href?: boolean }> = (
  { tags, limit = 3, href = true },
) => {
  if (tags.length === 0) return <span class="muted">—</span>;
  const shown = tags.slice(0, limit);
  return (
    <span class="chips">
      {shown.map((tag) => (
        href
          ? <a class="chip" href={`/demands?tag=${encodeURIComponent(tag.slug)}`}>#{tag.name}</a>
          : <span class="chip">#{tag.name}</span>
      ))}
      {tags.length > shown.length
        ? (
          <span class="chip chip-more" title={tags.map((t) => t.name).join(", ")}>
            +{tags.length - shown.length}
          </span>
        )
        : null}
    </span>
  );
};

export const Empty: FC<{ title: string; detail?: string; action?: Child }> = (
  { title, detail, action },
) => (
  <div class="empty">
    <p class="empty-title">{title}</p>
    {detail ? <p class="muted">{detail}</p> : null}
    {action}
  </div>
);

export const Field: FC<{
  label: string;
  name: string;
  type?: string;
  value?: string | number | null;
  error?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  rows?: number;
  autofocus?: boolean;
  disabled?: boolean;
  autocomplete?: string;
}> = (props) => (
  <label class="field">
    <span class="field-label">{props.label}{props.required ? " *" : ""}</span>
    <input
      class={props.error ? "input input-error" : "input"}
      type={props.type ?? "text"}
      name={props.name}
      id={props.name}
      value={props.value ?? ""}
      required={props.required}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      step={props.step}
      autofocus={props.autofocus}
      autocomplete={props.autocomplete}
      disabled={props.disabled}
      aria-describedby={props.error
        ? `${props.name}-error`
        : props.hint
        ? `${props.name}-hint`
        : undefined}
      aria-invalid={props.error ? "true" : undefined}
    />
    {props.hint ? <span id={`${props.name}-hint`} class="field-hint">{props.hint}</span> : null}
    {props.error
      ? <span id={`${props.name}-error`} class="field-error" role="alert">{props.error}</span>
      : null}
  </label>
);

export const TextArea: FC<{
  label: string;
  name: string;
  value?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  hint?: string;
  placeholder?: string;
}> = (props) => (
  <label class="field">
    <span class="field-label">{props.label}{props.required ? " *" : ""}</span>
    <textarea
      class={props.error ? "input textarea input-error" : "input textarea"}
      name={props.name}
      id={props.name}
      rows={props.rows ?? 5}
      required={props.required}
      placeholder={props.placeholder}
      aria-describedby={props.error
        ? `${props.name}-error`
        : props.hint
        ? `${props.name}-hint`
        : undefined}
    >
      {props.value ?? ""}
    </textarea>
    {props.hint ? <span id={`${props.name}-hint`} class="field-hint">{props.hint}</span> : null}
    {props.error
      ? <span id={`${props.name}-error`} class="field-error" role="alert">{props.error}</span>
      : null}
  </label>
);

export const Select: FC<{
  label: string;
  name: string;
  value?: string;
  options: readonly { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  blank?: string;
}> = (props) => (
  <label class="field">
    <span class="field-label">{props.label}{props.required ? " *" : ""}</span>
    <select
      class={props.error ? "input input-error" : "input"}
      name={props.name}
      id={props.name}
      required={props.required}
      disabled={props.disabled}
      aria-describedby={props.error ? `${props.name}-error` : undefined}
      aria-invalid={props.error ? "true" : undefined}
    >
      {props.blank ? <option value="">{props.blank}</option> : null}
      {props.options.map((option) => (
        <option value={option.value} selected={option.value === props.value}>{option.label}</option>
      ))}
    </select>
    {props.error
      ? <span id={`${props.name}-error`} class="field-error" role="alert">{props.error}</span>
      : null}
  </label>
);

export const Avatar: FC<{ name: string; size?: "sm" | "md" }> = ({ name, size = "sm" }) => (
  <span class={`avatar avatar-${size}`} aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
);

export const DateRange: FC<{ start: string | null; end: string | null }> = ({ start, end }) => {
  if (!start && !end) return <span class="muted">—</span>;
  const fmt = (value: string) => value.slice(5).replace("-", "/");
  return (
    <time class="date-range" datetime={start ?? end ?? ""}>
      {start ? fmt(start) : "?"} → {end ? fmt(end) : "?"}
    </time>
  );
};

export const AttachmentList: FC<{
  attachments: readonly AttachmentDisplay[];
  canArchive?: boolean;
  itemId?: string;
}> = ({ attachments, canArchive = false, itemId }) => {
  if (attachments.length === 0) return <p class="muted">Nenhum anexo.</p>;
  return (
    <ul class="attachments">
      {attachments.map((file) => (
        <li class="attachment">
          <a class="attachment-name" href={`/attachments/${file.id}/download`}>
            <Icon name="paperclip" class="icon" />
            <span>{file.original_name}</span>
          </a>
          <span class="muted small">{humanBytes(file.bytes)} · {file.uploader_name ?? ""}</span>
          {file.mime.startsWith("image/")
            ? (
              <a class="small" href={`/attachments/${file.id}`} target="_blank" rel="noreferrer">
                ver
              </a>
            )
            : null}
          {canArchive && itemId
            ? (
              <form
                method="post"
                action={`/items/${itemId}/attachments/${file.id}/archive`}
                class="inline"
              >
                <button class="link danger" type="submit">arquivar</button>
              </form>
            )
            : null}
        </li>
      ))}
    </ul>
  );
};

export const TaskStatusOptions: readonly { value: string; label: string }[] = Object.entries(
  TASK_STATUS_LABEL,
).map(([value, label]) => ({ value, label }));
export const IssueStatusOptions: readonly { value: string; label: string }[] = Object.entries(
  ISSUE_STATUS_LABEL,
).map(([value, label]) => ({ value, label }));

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}
