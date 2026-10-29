import type { Child, FC, PropsWithChildren } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import { env } from "@kernel/config/env.ts";
import { Icon } from "@layout/views/ui.tsx";

export interface LayoutProps {
  title: string;
  actor: Actor | null;
  active?: string;
  children?: Child;
  unread?: number;
  description?: string;
  noHtmx?: boolean;
}

const NavLink: FC<{ href: string; label: string; icon: string; current: boolean }> = (
  { href, label, icon, current },
) => (
  <a
    href={href}
    class={current ? "nav-link nav-current" : "nav-link"}
    aria-current={current ? "page" : undefined}
  >
    <Icon name={icon} class="icon" />
    <span>{label}</span>
  </a>
);

export const Layout: FC<PropsWithChildren<LayoutProps>> = (props) => {
  const actor = props.actor;
  const is = (value: string): boolean => props.active === value;
  return (
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>{props.title === "Meraki" ? props.title : `${props.title} · Meraki`}</title>
        {props.description ? <meta name="description" content={props.description} /> : null}
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/static/icons/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/static/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="stylesheet" href="/static/css/app.css" />
        <script src="/static/js/htmx.min.js" defer></script>
        <script src="/static/js/app.js" defer></script>
      </head>
      <body>
        <a class="skip" href="#conteudo">Pular para o conteúdo</a>
        <div class="app-shell">
          {actor
            ? (
              <>
                <aside class="sidebar" aria-label="Navegação principal">
                  <a class="brand" href="/demands">
                    <span class="brand-mark">M</span>
                    <span>Meraki</span>
                  </a>
                  <nav class="nav">
                    <NavLink href="/demands" label="Demandas" icon="list" current={is("demands")} />
                    <NavLink href="/my" label="Minhas tarefas" icon="user" current={is("my")} />
                    <NavLink
                      href="/projects"
                      label="Pastas"
                      icon="folder"
                      current={is("projects")}
                    />
                    <NavLink href="/chat" label="Chat" icon="chat" current={is("chat")} />
                    <NavLink
                      href="/notifications"
                      label="Notificações"
                      icon="bell"
                      current={is("notifications")}
                    />
                    {actor.role === "admin" || actor.role === "manager"
                      ? (
                        <NavLink
                          href="/admin/tags"
                          label="Tags"
                          icon="settings"
                          current={is("admin-tags")}
                        />
                      )
                      : null}
                    {actor.role === "admin"
                      ? (
                        <NavLink
                          href="/admin/users"
                          label="Usuários"
                          icon="user"
                          current={is("admin-users")}
                        />
                      )
                      : null}
                  </nav>
                  <div class="sidebar-foot">
                    <a class="nav-link" href="/account/password">
                      <span class="avatar">{actor.name.slice(0, 1).toUpperCase()}</span>
                      <span class="truncate">{actor.name}</span>
                    </a>
                    <form method="post" action="/logout">
                      <button class="nav-link button-like" type="submit">
                        <Icon name="logout" class="icon" />
                        <span>Sair</span>
                      </button>
                    </form>
                  </div>
                </aside>
                <header class="topbar">
                  <a class="mobile-brand" href="/demands">Meraki</a>
                  <form class="search" method="get" action="/search" role="search">
                    <label class="sr-only" for="top-search">Buscar</label>
                    <Icon name="search" class="icon" />
                    <input
                      id="top-search"
                      name="q"
                      type="search"
                      placeholder="Buscar demandas (/)"
                      autocomplete="off"
                    />
                  </form>
                  <div class="top-actions">
                    <a class="btn btn-small" href="/items/new?kind=issue">
                      <Icon name="plus" class="icon" /> Issue
                    </a>
                    {actor.role === "admin" || actor.role === "manager"
                      ? (
                        <a class="btn btn-small btn-primary" href="/items/new?kind=task">
                          <Icon name="plus" class="icon" /> Tarefa
                        </a>
                      )
                      : null}
                    <a class="icon-button" href="/notifications" aria-label="Notificações">
                      <Icon name="bell" class="icon" />
                      {(props.unread ?? 0) > 0
                        ? <span class="unread-dot">{Math.min(props.unread ?? 0, 99)}</span>
                        : null}
                    </a>
                  </div>
                </header>
                <main id="conteudo" class="main" tabindex={-1}>{props.children}</main>
                <nav class="bottom-nav" aria-label="Navegação móvel">
                  <NavLink href="/demands" label="Demandas" icon="list" current={is("demands")} />
                  <NavLink href="/projects" label="Pastas" icon="folder" current={is("projects")} />
                  <NavLink href="/chat" label="Chat" icon="chat" current={is("chat")} />
                  <NavLink href="/my" label="Minhas" icon="user" current={is("my")} />
                </nav>
              </>
            )
            : <main class="auth-main">{props.children}</main>}
        </div>
        <div id="toast" class="toast" aria-live="polite"></div>
      </body>
    </html>
  );
};

export function pageTitle(value: string): string {
  return `${value} · ${env.appName}`;
}
