import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import type { MessageDisplay } from "./types.ts";
import { Markdown } from "./markdown.tsx";
import { relativeTime } from "@/kernel/util.ts";
import { AttachmentList, Avatar, Empty, Icon } from "@layout/views/ui.tsx";

export interface MessageView extends MessageDisplay {}

export const MessageCard: FC<{
  message: MessageView;
  actor: Actor;
  canEditAny?: boolean;
}> = ({ message, actor, canEditAny = false }) => {
  const own = message.author_id === actor.id;
  return (
    <article
      class={`message ${own ? "message-own" : ""}`}
      id={`m-${message.id}`}
      data-message-id={message.id}
    >
      <div class="message-head">
        <Avatar name={message.author_name} />
        <span class="message-author">{message.author_name}</span>
        <time datetime={message.created_at}>{relativeTime(message.created_at)}</time>
        {message.edited_at ? <span>editado</span> : null}
      </div>
      {message.deleted_at
        ? <p class="message-removed">Mensagem removida.</p>
        : <Markdown source={message.body_md} />}
      {message.attachments.length > 0 ? <AttachmentList attachments={message.attachments} /> : null}
      {!message.deleted_at && (canEditAny || own)
        ? (
          <div class="message-actions">
            <a
              href={`/messages/${message.id}`}
              hx-get={`/messages/${message.id}`}
              hx-target={`#m-${message.id}`}
              hx-swap="outerHTML"
            >
              editar
            </a>
            <form
              method="post"
              action={`/messages/${message.id}/archive`}
              class="inline"
              data-confirm="Arquivar esta mensagem?"
            >
              <button class="link" type="submit">arquivar</button>
            </form>
          </div>
        )
        : null}
    </article>
  );
};

export const MessageEditForm: FC<{ message: MessageView; maxLength: number; error?: string }> = (
  { message, maxLength, error },
) => (
  <form
    method="post"
    action={`/messages/${message.id}/edit`}
    class="message"
    id={`m-${message.id}`}
  >
    {error ? <div class="alert alert-danger">{error}</div> : null}
    <label class="field">
      <span class="field-label">Editar mensagem</span>
      <textarea class="input textarea" name="body_md" rows={4} maxlength={maxLength}>
        {message.body_md}
      </textarea>
    </label>
    <div class="form-actions">
      <button class="btn btn-small btn-primary" type="submit">Salvar</button>
      <button class="btn btn-small" type="button" data-cancel-edit>Cancelar</button>
    </div>
  </form>
);

export const MessageList: FC<{
  messages: readonly MessageView[];
  actor: Actor;
  empty?: string;
  canEditAny?: boolean;
}> = ({ messages, actor, empty = "Comece a conversa.", canEditAny = false }) => {
  if (messages.length === 0) {
    return <Empty title={empty} detail="Markdown, código, listas e anexos." />;
  }
  let lastDay = "";
  return (
    <div class="message-list" id="message-list" aria-live="polite">
      {messages.map((message) => {
        const day = message.created_at.slice(0, 10);
        const header = day !== lastDay
          ? (
            <div class="timeline-day">
              {new Date(`${day}T12:00:00Z`).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "short",
              })}
            </div>
          )
          : null;
        lastDay = day;
        return (
          <>
            {header}
            <MessageCard message={message} actor={actor} canEditAny={canEditAny} />
          </>
        );
      })}
    </div>
  );
};

export const Composer: FC<{
  action: string;
  label?: string;
  maxLength: number;
  compact?: boolean;
}> = ({ action, label = "Enviar", maxLength, compact = false }) => (
  <form
    method="post"
    action={action}
    enctype="multipart/form-data"
    class="composer card card-pad"
    data-composer
  >
    <div class="composer-tools" aria-label="Formatação Markdown">
      <button type="button" data-md="bold" title="Negrito">B</button>
      <button type="button" data-md="italic" title="Itálico">
        <em>I</em>
      </button>
      <button type="button" data-md="code" title="Código">
        <span class="mono">`</span>
      </button>
      <button type="button" data-md="link" title="Link">link</button>
      <button type="button" data-md="list" title="Lista">•</button>
      <button type="button" data-md="quote" title="Citação">”</button>
      <button type="button" data-md="table" title="Tabela">▦</button>
    </div>
    <label class="sr-only" for={`body-${action.replaceAll("/", "-")}`}>Mensagem</label>
    <textarea
      class="input textarea"
      name="body_md"
      id={`body-${action.replaceAll("/", "-")}`}
      rows={compact ? 3 : 4}
      maxlength={maxLength}
      placeholder="Escreva em Markdown…"
      data-markdown-input
    >
    </textarea>
    <div class="preview" data-preview aria-live="polite"></div>
    <div class="composer-tools center">
      <label class="btn btn-small btn-ghost cursor-pointer">
        <Icon name="paperclip" class="icon" /> Anexo
        <input
          type="file"
          name="attachments"
          multiple
          accept="image/png,image/jpeg,application/pdf"
          class="sr-only"
        />
      </label>
      <span class="muted small">até 3 arquivos · 10 MB cada</span>
      <span class="spacer"></span>
      <button class="btn btn-primary" type="submit">
        <Icon name="send" class="icon" /> {label}
      </button>
    </div>
    <p class="small muted" data-file-list></p>
  </form>
);
