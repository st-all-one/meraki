import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import { Page } from "@layout/views/page.tsx";
import type { NotificationRow } from "@services/notifications/service.ts";
import { Empty } from "@layout/views/ui.tsx";
import { relativeTime } from "@kernel/util.ts";

export const InboxPage: FC<{
  actor: Actor;
  unread: number;
  notifications: NotificationRow[];
}> = ({ actor, unread, notifications }) => (
  <Page actor={actor} title="Notificações" active="notifications" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Notificações</h1>
        <p class="lede">Atribuições, PO, promoções e mensagens de demanda.</p>
      </div>
      <form method="post" action="/notifications/read-all">
        <button class="btn" type="submit">Marcar todas</button>
      </form>
    </div>
    {notifications.length === 0 ? <Empty title="Nada novo." /> : (
      <ul class="history">
        {notifications.map((item) => (
          <li class={item.read_at ? "" : "notice"}>
            <a href={item.url}>
              <strong>{item.title}</strong>
            </a>
            <div class="small muted">{item.body} · {relativeTime(item.created_at)}</div>
            {!item.read_at
              ? (
                <form method="post" action={`/notifications/${item.id}/read`} class="inline">
                  <button class="link small" type="submit">marcar lida</button>
                </form>
              )
              : null}
          </li>
        ))}
      </ul>
    )}
  </Page>
);

export const NotificationSettingsPage: FC<{
  actor: Actor;
  unread: number;
  prefs: Record<string, number>;
  subscriptions: { id: string; user_agent: string | null; created_at: string }[];
  vapidPublic: string;
  ok?: string;
}> = ({ actor, unread, prefs, subscriptions, vapidPublic, ok }) => (
  <Page actor={actor} title="Notificações" active="notifications" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Notificações e PWA</h1>
        <p class="lede">Inbox sempre; push é opcional por dispositivo.</p>
      </div>
    </div>
    {ok ? <div class="alert alert-success">{ok}</div> : null}
    <div class="form-card">
      <h2>Push</h2>
      <p class="small muted">
        No iPhone, instale o app na Tela de Início (iOS 16.4+) antes de ativar.
      </p>
      <p>
        <button class="btn" type="button" data-push-enable data-vapid={vapidPublic}>
          Ativar push neste dispositivo
        </button>
        <span class="small muted" data-push-status></span>
      </p>
      <form method="post" action="/account/notifications/preferences" class="section">
        <input type="hidden" name="push_enabled" value={prefs["push_enabled"] ? "1" : "0"} />
        <label class="field">
          <span class="field-label">Eventos</span>
        </label>
        {[
          ["assignments", "Tarefa atribuída a mim"],
          ["po_changes", "Virei PO"],
          ["demand_messages", "Mensagens em demandas que sigo"],
          ["new_issues", "Novas issues"],
          ["hide_details", "Ocultar detalhes na notificação"],
        ].map(([key, label]) => (
          <label class="small check-row">
            <input type="checkbox" name={key} value="1" checked={Boolean(prefs[key as string])} />
            {" "}
            {label}
          </label>
        ))}
        <button class="btn btn-primary" type="submit">Salvar preferências</button>
      </form>
    </div>
    <div class="form-card section">
      <h2>Dispositivos</h2>
      {subscriptions.length === 0
        ? <p class="muted">Nenhum dispositivo registrado.</p>
        : (
          <ul class="history">
            {subscriptions.map((sub) => (
              <li>
                {sub.user_agent ?? "Dispositivo"} · {relativeTime(sub.created_at)}
                <form method="post" action="/account/push/subscriptions/delete" class="inline ml-8">
                  <input type="hidden" name="subscription_id" value={sub.id} />
                  <button class="link danger" type="submit">remover</button>
                </form>
              </li>
            ))}
          </ul>
        )}
    </div>
  </Page>
);
