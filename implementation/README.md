# Implementação — Meraki sobre o Somlos

> **Base oficial:** Somlos (`_REF/somlos`), copiado para `app/` e cortado. **Alvo:** binário único, SQLite, índice geral de demandas, tarefas oficiais, issues sugeridas, chat Markdown em tempo real, anexos locais e Excalidraw colaborativo incorporado. **Fora:** SaaS, multi-tenant, e-mail, Redis, S3, worker, SPA.

Este diretório é o plano de execução. Ele é sequencial: cada fase termina com um aceite verificável; não comece a próxima antes dele. Os documentos `00`–`05` de `docs/` explicam o produto e a decisão; este plano manda na implementação.

## 1. Decisões fechadas

| Tema | Decisão |
|---|---|
| App | `app/` na raiz; `_REF/somlos` permanece somente leitura |
| Runtime | `deno compile`; binário `meraki`; sem Deno/Node no servidor |
| Dados | SQLite WAL em `DATA_PATH/meraki.sqlite3`; anexos em `DATA_PATH/attachments` |
| UI | Server-side JSX + HTMX + JS pontual; sem SPA |
| Entidade | `items` com `kind = task \| issue`; a UI chama de **demanda** |
| Tarefa | Oficial; criada/arquivada por manager/admin; `po_id` definido por manager/admin |
| Issue | Sugestão; criada/editada por qualquer usuário; arquivada pelo autor ou admin; promovida a tarefa por manager/admin |
| Índice | `/demands` é a home; todos consultam tarefas + issues, com filtros e contagens |
| Pastas | `projects` são as pastas; agrupam tarefas e issues; admin gerencia |
| Cargos | `admin`, `manager`, `developer` |
| Permissões | `create`, `edit`, `archive`, `export`; sem catálogo RBAC |
| Chat | Canais `general`, `project`, `demand`; mensagens Markdown; SSE para receber, POST para enviar |
| Conversa da demanda | É o canal `demand` da tarefa/issue; não há tabela `comments` separada |
| Markdown | Subconjunto seguro; preview no cliente; render final no servidor; sem HTML cru |
| Anexos | Demanda e chat; disco local; download autenticado; imagens/PDF |
| Excalidraw | Um canvas por demanda; **colaborativo em tempo real**; modal full-screen; participantes identificados |
| Tarefa | Exige início, fim e responsável; prioridade Eisenhower calculada (Q1–Q4), override por manager/admin |
| Tags | Globais no tenant, até 8 por demanda, filtro AND, criadas por qualquer usuário |
| Persistência | Eventos, mensagens, anexos e snapshots do canvas append-only; sem delete duro |
| Mobile | Mobile-first; PWA instalável (Android/desktop/iOS); desktop com sidebar + inspector |
| Deploy | binário + systemd + Caddy; sem Docker obrigatório; sem allowlist de IP |
| Notificações | Inbox in-app + Web Push (browser/celular); dispatcher no binário, sem worker |
| Serviços externos | **0 serviços de aplicação**; push usa endpoints do navegador (FCM/APNs/Mozilla), inerentes ao Web Push |

## 2. Cargos e permissões

Regra central: **manager tem poucos privilégios a mais que developer**: criar tarefa, arquivar/restaurar tarefa, definir o PO, ajustar a prioridade manualmente e renomear/arquivar tags. Admin também gerencia usuários e pastas. Developer cria issues.

| Recurso / ação | Admin | Manager | Developer |
|---|---|---|---|
| Usuários: criar, bloquear, definir manager | sim | — | — |
| Pasta/projeto: criar/editar/arquivar | sim | — | — |
| Pasta/projeto: ver/exportar | sim | sim | sim |
| Índice de demandas: ver/exportar | sim | sim | sim |
| Tarefa: criar | sim | sim | **não** |
| Tarefa: editar conteúdo/status/assignee/datas/importância/tags | sim | sim | sim |
| Tarefa: arquivar/restaurar | sim | sim | **não** |
| Tarefa: definir `po_id` | sim | sim | **não** |
| Tarefa: override/limpar prioridade | sim | sim | **não** |
| Tags: criar/anexar/remover | sim | sim | sim |
| Tags: renomear/arquivar | sim | sim | **não** |
| Issue: criar | sim | sim | sim |
| Issue: editar | sim | sim | sim |
| Issue: arquivar/restaurar | qualquer | autor | autor |
| Issue: promover a tarefa | sim | sim | **não** |
| Conversa/anexos: criar | sim | sim | sim |
| Conversa/anexos: editar/arquivar | qualquer | autor | autor |
| Canvas: abrir/editar | sim | sim | sim |
| Canvas: exportar | sim | sim | sim |
| Exportar index/lista/board/calendário | sim | sim | sim |

Regras:

- `po_id` existe só em tarefa; pode ser qualquer usuário ativo.
- Arquivar é **soft archive**: sai das listas, continua por link; manager/admin restauram tarefa; autor/admin restauram issue.
- Não existe “delete” no MVP.
- Toda checagem é no servidor; a UI apenas esconde o que o servidor negaria.
- Admin não pode bloquear o último admin; usuário bloqueado perde sessões.

## 3. Princípios de UX (ordem de prioridade)

1. **Índice primeiro:** ao entrar, ver todas as demandas, com tarefa/issue, status, PO, responsável, período e prioridade.
2. **Responder antes de configurar:** status, responsável, início/fim, prioridade e tags visíveis em toda linha/card.
3. **Prioridade é derivada:** fim + importância calculam Q1–Q4; manager/admin pode sobrepor, nunca digitar o quadrante no fluxo comum.
4. **Tags agrupam ideias:** chips no índice/board/detalhe e filtro AND por URL.
5. **Uma ação, um clique:** selects inline na lista; drag no board; menu “Mover para” acessível.
6. **URL é estado:** filtros, pasta, view e busca vivem na URL.
7. **Sem modal para o fluxo principal:** criar/editar demanda no inspector/página; modal só para confirmação e para o canvas full-screen.
8. **Mobile-first:** base em 375 px; melhorias em `min-width: 640px/1024px`; toque ≥44 px; nada depende de hover.
9. **Desktop denso:** sidebar fixa, tabela legível, inspector de 480–560 px; atalhos `/`, `c`, `Esc`.
10. **Markdown sem cerimônia:** textarea + toolbar + preview; desktop lado a lado; mobile abas “Escrever/Prévia”.
11. **Anexo é cidadão:** arrastar/colar, preview, remover antes de enviar, progresso e erro claros.
12. **Canvas é parte da demanda:** modal full-screen, todos interagem, presença identificada, salvo automaticamente.
13. **Vazio e erro ensinam:** CTA explícito, sem ilustração decorativa; erro diz o que fazer.

## 4. Fases

| # | Fase | Entregável | Depende de |
|---|---|---|---|
| 00 | [Baseline e licença](00-baseline-e-licenca.md) | `app/` copiado, licença, build/check inicial | — |
| 01 | [Tooling e CI](01-tooling-e-ci.md) | tarefas Deno, env mínimo, CI, higiene | 00 |
| 02 | [Corte do Somlos](02-corte-do-somlos.md) | só kernel/identity/system/layout/db | 01 |
| 03 | [Dados e migrações](03-dados-e-migracoes.md) | schema de demandas, datas/prioridade, tags, conversas, anexos e canvas | 02 |
| 04 | [Auth, cargos e permissões](04-auth-cargos-e-permissoes.md) | login, 3 cargos, permissões, admin de usuários | 03 |
| 05 | [UX shell e design system](05-ux-shell-e-design-system.md) | shell responsivo, tokens, componentes base | 04 |
| 06 | [Demandas e visões](06-tarefas-e-visoes.md) | índice, tarefas com início/fim/Eisenhower, tags, board, calendário, export | 05 |
| 07 | [Anexos](07-anexos.md) | upload/download local em demanda e base para chat | 06 |
| 08 | [Markdown e conversas](08-markdown-e-conversas.md) | editor/preview, canais de demanda, conversas ricas | 07 |
| 09 | [Chat em tempo real](09-chat-sse.md) | Geral/projeto, SSE, não lidos, anexos, Markdown | 08 |
| 10 | [Excalidraw colaborativo](10-excalidraw-na-tarefa.md) | canvas full-screen, WebSocket, presença, snapshots, export | 07, 08 |
| 11 | [PWA e notificações](11-pwa-e-notificacoes.md) | manifest/SW, offline, Web Push, preferências, inbox | 05, 09, 10 |
| 12 | [Segurança e operação](12-seguranca-e-operacao.md) | hardening, limites, backup, doctor, logs | 09, 10, 11 |
| 13 | [Testes e aceitação](13-testes-e-aceitacao.md) | unit/HTTP/Playwright/a11y/restore | 12 |
| 14 | [Deploy e runbook](14-deploy-e-runbook.md) | binário em produção, Caddy, systemd, backup | 13 |
| 15 | [Pós-deploy](15-pos-deploy-e-evolucao.md) | medição, backlog e gatilhos | 14 |

## 5. Regras de execução

- Um commit por fase (ou por marco); mensagem `feat|fix|chore(scope): ...`.
- Antes de fechar: `cd app && deno task check && deno task test` + smoke descrito.
- Nunca usar `MODULES=identity,system` como substituto de deletar código.
- Toda rota mutante tem CSRF, autorização e limite; toda query tem `tenant_id`/escopo.
- Todo upload tem limite, allowlist, nome gerado e download auth.
- Todo Markdown é renderizado no servidor com o mesmo subconjunto do preview.
- Nenhuma chamada externa no navegador (fontes, CDN, analytics, avatar).
- Histórico é append-only: eventos de demanda, edições de mensagem, snapshots de canvas.
- Se uma fase ameaçar o UX ou o escopo, corte a feature, não o aceite.

## 6. Critério global de pronto

- Índice `/demands` mostra tarefas + issues para todos, com início/fim, prioridade Eisenhower e tags.
- Manager cria/arquiva tarefa, define PO, ajusta prioridade e gerencia tags; developer cria issue e não cria tarefa.
- Tarefa não salva sem início, fim e responsável; prioridade automática Q1–Q4 com override auditado.
- Tags criadas/anexadas por qualquer usuário; filtro AND funciona em índice/lista/board.
- Tarefa/issue: editar, status, conversa, anexos, canvas, export.
- Lista/board/calendário por pasta.
- Conversa de demanda e canais Geral/projeto com Markdown, anexos e SSE.
- Canvas colaborativo full-screen, com presença identificada, snapshots e export.
- Anexos de demanda/chat autenticados, validados e no backup.
- CSP/CSRF/sessão/rate limit/upload/SSE/WebSocket cobertos por testes.
- PWA instalável; inbox + push para os eventos definidos; nenhum HTML autenticado no cache.
- Deploy documentado e restore testado.
