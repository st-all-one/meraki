# 11 — PWA e notificações

**Objetivo:** instalar o Meraki no celular/desktop, funcionar como app shell offline e notificar o usuário no navegador/celular em eventos relevantes — sem um serviço de aplicação externo.

**Duração esperada:** 3–4 dias.

## 11.1 Escopo e limites

- PWA instalável em Android/Chrome, desktop e iOS (Safari, “Adicionar à Tela de Início”).
- Web Push no navegador/PWA. Em iOS, push exige PWA instalada e iOS 16.4+; mostrar instruções quando não suportado.
- Notificações **in-app** sempre; push é opcional por usuário/dispositivo.
- Não há e-mail/SMS/WhatsApp.
- Não há serviço de aplicação externo. O envio usa os **endpoints de push do navegador** (FCM/APNs/Mozilla) — inerente ao Web Push; o backend continua um binário.
- Service worker não cacheia páginas autenticadas, HTML de demanda/chat, anexos ou canvas. Só assets públicos + offline.

## 11.2 PWA

### Arquivos

```text
static/
  manifest.webmanifest
  sw.js
  offline.html
  icons/icon-192.png
  icons/icon-512.png
  icons/maskable-512.png
  icons/apple-touch-icon.png
```

- `manifest`:
  - `name` “Meraki”, `short_name` “Meraki”;
  - `start_url` `/demands`;
  - `scope` `/`;
  - `display` `standalone`;
  - `theme_color`/`background_color` do design system;
  - ícones 192/512 + maskable; `apple-touch-icon`.
- HTML:
  - `<link rel="manifest" href="/manifest.webmanifest">`;
  - `<meta name="theme-color" content="...">`;
  - `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`;
  - `viewport-fit=cover` + safe-area CSS.
- Registro do SW em `static/js/pwa.js` (same-origin, sem inline):
  ```js
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }
  ```

### Service worker

- `install`: precache apenas `/offline.html`, CSS, JS do shell, ícones e fontes locais.
- `activate`: apagar caches de versões antigas; `clients.claim()`.
- `fetch`:
  - assets estáticos (`/static/*`, `/icons/*`, fontes): cache-first;
  - navegação/HTML: network-only; se falhar, `offline.html`;
  - `/api/*`, `/attachments/*`, `/chat/*/events`, `/items/*/canvas/*`: **network-only**; nunca cachear.
- `message`: “nova versão disponível” → toast com “Atualizar” (`skipWaiting` + reload).
- Sem cache de respostas autenticadas; logout não deixa dados no Cache Storage.
- `offline.html` explica que o app precisa de conexão; não mostra dados antigos.

### UI/install

- Botão “Instalar app” quando `beforeinstallprompt` disponível; esconder se instalado.
- iOS: detectar e mostrar “Compartilhar → Adicionar à Tela de Início” para push.
- Mobile: bottom nav/safe-area; standalone sem barra do navegador.
- Desktop: instalação opcional; mesmo app.

## 11.3 Notificações: modelo e eventos

### Tabelas (adicionar em 0006_notifications.sql)

- `notifications`:
  - `id`, `tenant_id`, `user_id`, `kind` (`assigned|po|message|issue|promoted|system`);
  - `title`, `body`, `url`, `data_json`, `created_at`, `read_at`, `pushed_at`.
  - índice `(user_id, read_at, created_at)`.
- `push_subscriptions`:
  - `id`, `tenant_id`, `user_id`, `endpoint_hash` unique, `endpoint`, `p256dh`, `auth`;
  - `user_agent`, `created_at`, `last_seen_at`, `disabled_at`.
- `notification_preferences`:
  - `user_id` PK, `push_enabled`, `assignments`, `po_changes`, `demand_messages`, `new_issues`, `hide_details`, `updated_at`.
- `push_deliveries`:
  - `notification_id`, `subscription_id`, `status` (`pending|sent|failed|gone`), `attempts`, `last_error`, `next_attempt_at`, `updated_at`; PK composta.

### Eventos iniciais

| Evento | Destinatário | Push |
|---|---|---|
| Tarefa atribuída a mim | assignee (não o ator) | sim, se ativado |
| Virei PO de uma tarefa | novo `po_id` (não o ator) | sim |
| Nova mensagem na conversa de demanda que sou criador/PO/assignee | seguidores, exceto autor | sim; só `scope=demand` |
| Nova issue na pasta | managers/admin (preferência) | sim |
| Issue promovida | autor da issue | sim, opcional |

Não notificar:
- auto-atribuição/auto-PO;
- mensagens em Geral/projeto (só in-app? **não**; evitar spam; sem push e sem inbox por mensagem de canal amplo);
- edição/arquivamento de mensagem;
- canvas updates (não é evento de inbox).

Conteúdo:
- `title`/`body` com nome da demanda e ator; `url` same-origin (`/items/:id` ou `/demands`).
- `hide_details` (preferência) → título “Meraki” e corpo genérico; URL ainda abre o item.
- Nunca incluir token, anexo, markdown bruto ou dados sensíveis no payload.

## 11.4 Fluxo de permissão/subscribe

1. Usuário abre `/account/notifications`.
2. Clica “Ativar notificações” (gesto do usuário; obrigatório).
3. Se `Notification.permission === "denied"`, mostrar instruções do navegador; não insistir.
4. SW registrado; `pushManager.subscribe({ applicationServerKey })` com VAPID público.
5. POST `/account/push/subscriptions` com `endpoint`, `p256dh`, `auth`; CSRF/origin; salvar hash do endpoint.
6. `pushsubscriptionchange`: SW re-subscreve e reenvia automaticamente.
7. “Desativar” → DELETE subscription (marca `disabled_at`).
8. iOS não standalone: mostrar instrução de instalar antes de tentar.

Rotas:

```text
GET  /account/notifications              preferências + dispositivos
POST /account/push/subscriptions         registrar subscription
POST /account/push/subscriptions/delete  remover dispositivo
POST /account/notifications/preferences  salvar toggles
GET  /notifications                      inbox
POST /notifications/:id/read              marcar lida
POST /notifications/read-all              marcar todas
```

## 11.5 Envio (sob demanda, no binário)

- Toda ação relevante grava `notifications` na **mesma transação** do evento de domínio.
- Após o commit, um dispatcher em processo (`notifications.drain()`) é acionado sem bloquear a resposta:
  - busca `notifications` com `pushed_at is null` e `push_deliveries` pendentes;
  - para cada subscription ativa, envia Web Push com VAPID;
  - grava `sent`/`failed`; 404/410 → `gone` + desativa subscription;
  - backoff exponencial em `next_attempt_at`;
  - limite de concorrência (ex.: 4) e timeout (10 s).
- Também roda no boot e em um timer de 30 s, drenando o que falhou.
- Um processo = um dispatcher; sem Redis/worker. Se houver múltiplas instâncias, usar lock/lease (não no MVP).
- Falha de push **não** desfaz a ação; o inbox permanece.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` em env; `meraki push:keys` gera uma vez. Nunca no Git.
- Use uma biblioteca Web Push compatível com Deno (ex.: `@negrel/webpush`), pinada; fazer spike antes de integrar.

## 11.6 Service worker push

```js
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title ?? "Meraki", {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag,
    data: { url: data.url, id: data.id },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/demands", self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const existing = list.find((c) => c.url.startsWith(url.origin));
    if (existing) { existing.focus(); return existing.navigate(url.href); }
    return clients.openWindow(url.href);
  }));
});
```

- `url` só same-origin (allowlist `/demands`, `/items/`, `/notifications`).
- `tag` evita duplicata por demanda.
- Ícone/badge locais.

## 11.7 UI

- Topbar: sino com badge de não lidos; mobile no menu “Mais”.
- `/notifications`: lista (título, ator, demanda, hora, lida/não lida); “marcar todas”.
- `/account/notifications`: push on/off, toggles por evento, “ocultar detalhes”, dispositivos conectados, instruções iOS.
- Após ação relevante, não mostrar toast de push; o inbox atualiza no próximo load (ou SSE próprio? não no MVP).
- PWA install prompt discreto; não bloquear o uso.

## 11.8 Segurança

- HTTPS obrigatório para PWA/SW/push.
- Service worker scope `/`; headers `Service-Worker-Allowed: /` se necessário; `Cache-Control: no-cache` no `sw.js`.
- Nunca cachear HTML autenticado, anexos, chat, canvas.
- VAPID private key só no env; rotação invalida subscriptions (documentar).
- Validar endpoint de subscription:
  - `https:` apenas;
  - host público, sem IP privado/loopback/link-local;
  - sem redirects; timeout;
  - hash do endpoint para dedupe.
- CSRF/origin em subscribe/preferences/read.
- Notificação não carrega segredo; URL same-origin.
- `hide_details` para lock screen.
- Limite de subscriptions por usuário (ex.: 5) e notificações/dia (ex.: 100).
- Logs sem endpoint/p256dh/auth.

## 11.9 Testes

- Manifest válido; instalação em Chrome/Android (Lighthouse/DevTools).
- SW registra; offline.html aparece sem rede; HTML autenticado não está no cache.
- Push: permissão negada, concedida, subscription salva, push recebido com app fechado, click abre URL correta.
- `pushsubscriptionchange` atualiza.
- Preferências on/off; auto-atribuição não notifica; mensagem de demanda notifica seguidores; Geral/projeto não gera push.
- iOS: instrução de instalação; push só standalone (teste manual).
- Endpoint inválido/SSRF rejeitado; 404/410 desativa.
- Nenhum dado sensível em Cache Storage/payload.

## Aceite

- [ ] PWA instalável em Android/desktop; iOS com instruções.
- [ ] Offline shell funciona; nada autenticado é cacheado.
- [ ] Inbox in-app + badge.
- [ ] Push browser/mobile para assign/PO/mensagem de demanda/nova issue.
- [ ] Preferências e dispositivos.
- [ ] Dispatcher sob demanda/retry; sem worker externo.
- [ ] VAPID/segurança/SSRF cobertos.
- [ ] Sem serviço de aplicação externo.

## Riscos

- **Web Push depende de serviços do navegador** (FCM/APNs/Mozilla); não é possível evitá-los para push móvel. Documente.
- **iOS** exige instalação e versão recente; fallback é inbox.
- **Cache do SW** pode vazar dados se cachear HTML; proíba.
- **SSRF** no endpoint de subscription; valide host/protocolo.
- **Spam** de mensagens de canal amplo; só demandas seguem para push.
