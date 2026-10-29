# Referências de mercado — OpenProject, Plane, Taiga, TabNews e knudge

Levantamento de código (não de marketing) sobre como três famílias de produto modelam, apresentam e operam trabalho, mais o TabNews como referência de organização e o knudge como referência de tarefas derivadas. Base para as decisões de produto e engenharia do meraki.

> O TabNews não entra na matriz de gestão de tarefas: ele é referência de **organização/segurança/UI** em [`08-tabnews-organizacao.md`](08-tabnews-organizacao.md), não de modelo de trabalho.

## Visão de produto e UX

| Documento | Fontes | O que responde |
|---|---|---|
| [`openproject-data-model.md`](openproject-data-model.md) | `_REF/openproject` @ `0e8599b3`, v18.0.0-dev | Work package unificado, tipos/variantes, custom fields + form configuration, RBAC de 4 escopos, `Query`/`View`/board/grid, journaling, HAL |
| [`openproject-ui-ux.md`](openproject-ui-ux.md) | idem | Shell, tabela com inline edit e split view, Gantt, boards, calendário, team planner, backlogs, dashboards, atalhos, a11y, Primer/Spot |
| [`plane-data-model.md`](plane-data-model.md) | `_REF/plane` @ `b98e1de`, v1.5.0 | Workspace→project→issue, estados/ciclos/módulos, `IssueView` (filtros + layout), permissões numéricas, `IssueActivity`, cursor pagination |
| [`plane-ui-ux.md`](plane-ui-ux.md) | idem | App rail/sidebar, 5 layouts, peek overview, Power K, atalhos de 2 teclas, inbox, editor colaborativo, temas |
| [`taiga-data-model.md`](taiga-data-model.md) | `_REF/taiga-back` @ `cb745e9` | Entidades separadas (épico/US/task/issue), taxonomias por projeto, `Role.permissions`, N ordens por view, `HistoryEntry` + timeline |
| [`taiga-ui-ux.md`](taiga-ui-ux.md) | `_REF/taiga-front` v6.10.3 | Kanban com swimlanes/zoom, backlog/sprints, epics, issues, wiki, lightbox + página, limitações de a11y/mobile |
| [`00-sintese-meraki.md`](00-sintese-meraki.md) | todos | Comparação de produto, anti-padrões e blueprint recomendado |

## Engenharia

| Documento | O que responde |
|---|---|
| [`01-openproject-backend.md`](01-openproject-backend.md) | Stack e deploy, ordem de middlewares, 15 métodos de auth, DDL e índices, contracts/services, SQL de query, `lock_version` + advisory lock, GoodJob, segurança (14 achados), testes |
| [`02-openproject-frontend.md`](02-openproject-frontend.md) | Angular zoneless em ilhas Turbo, dois sistemas de estado, `query_props`, tabela imperativa, inline edit, Gantt em DOM, DnD, Power/atalhos, a11y (15+15 achados), performance |
| [`03-plane-backend.md`](03-plane-backend.md) | Django/DRF, 13 middlewares, sessão em tabela, magic code/OAuth, DDL com uniques parciais, filtros legado+DSL, numeração com advisory lock, Celery, SSRF/upload/CSP, testes |
| [`04-plane-frontend.md`](04-plane-frontend.md) | React Router 7 + MobX, 30 stores, 5 layouts, DnD pragmatic, update otimista, peek, Power K, editor Yjs, a11y (18 achados), performance |
| [`05-taiga-backend.md`](05-taiga-backend.md) | Django 3.2 + DRF vendorizado, JWT (24 h/8 d), permissões calculadas, DDL sem constraints, OCC por histórico, reorder O(n), Celery/eventos, 15 achados de segurança |
| [`06-taiga-frontend.md`](06-taiga-frontend.md) | AngularJS/CoffeeScript, digest e `tg-repeat`, estado por singletons, dragula, kanban/backlog, lightbox, a11y (21 achados), performance e bundle |
| [`07-arquitetura-comparada.md`](07-arquitetura-comparada.md) | Comparação técnica cruzada, "o que copiar de cada um" e blueprint de auth, dados, API, concorrência, realtime, frontend e a11y |
| [`08-tabnews-organizacao.md`](08-tabnews-organizacao.md) | Organização de rotas/domínio/infra, CSRF, validação, autorização, testes e UI do TabNews; o que copiar e o que não copiar |

## Matriz rápida

| Dimensão | OpenProject | Plane | Taiga |
|---|---|---|---|
| Unidade de trabalho | `WorkPackage` única, tipada (`Type`+`TypeVariant`) | `Issue` única, tipada (`IssueType`) | 4 entidades: `Epic` → `UserStory` → `Task` / `Issue` |
| Estado | global configurável + workflow por tipo×papel | `State` por projeto, agrupado em 5 categorias | status por entidade, por projeto |
| Multi-visão | mesma `Query` → tabela/Gantt/board/calendário/planner | mesmo `IssueView` → list/kanban/calendar/spreadsheet/gantt | ordens independentes por view; sem Gantt/calendário |
| Config de view | `Query` (colunas, filtros, sort, group, sums, timeline) | `filters` + `display_filters` + `display_properties` (JSON) | filtros em query string + 4 colunas de ordem |
| Kanban | boards por atributo, sem swimlanes, sem WIP | group_by/sub_group_by, sem WIP | swimlanes × status, WIP visual, zoom de card |
| Permissões | 4 classes de papel, permissão por contexto, shares por WP | 3 papéis numéricos, workspace/projeto, guest | papéis por projeto, array de codenames, público/anônimo |
| Custom fields | STI por formato + seções + form configuration | **não existem** no núcleo | 8 tipos por entidade |
| Histórico | journal por atributo, coalescido, range no banco | `IssueActivity` por campo + descrição versionada | `HistoryEntry` snapshot + diff + timeline |
| Realtime | polling 60 s/10 s + Turbo Streams | sem WS para issues | WS por watcher + webhooks |
| Auth | 15 métodos, 2FA, LDAP/SAML/OIDC/SCIM | senha, magic code, 4 OAuth, API key; sem 2FA/SSO | JWT 24 h/8 d; sem 2FA/SSO |
| Acessibilidade | treegrid + roving tabindex + live region | atalhos fortes; sem `aria-live` e sem teclado no DnD | fraca: sem `<table>`, sem `role=dialog` |
| Operação | pesada (32 engines, 4 processos) | enxuta (API + worker + front estático) | barata, mas frágil (Django EOL, `pickle`) |

Números de linha e caminhos citados referem-se aos commits acima; ao atualizar `_REF/`, revalidar.

## Convenção de citações

- OpenProject: caminhos relativos à raiz do repositório.
- task-manager: caminhos relativos à raiz de `_REF/task-manager`.
- Plane: `.py` relativos a `apps/api/plane/`; `.ts`/`.tsx` relativos a `apps/web/` (ou ao pacote citado, ex.: `packages/editor/`); caminhos que já começam com `apps/` são da raiz.
- Taiga back: caminhos de app relativos a `taiga/projects/` (ex.: `userstories/models.py`); caminhos entre apps (`taiga/users/...`, `taiga/permissions/...`) são da raiz.
- Taiga front: caminhos relativos à raiz, com ou sem prefixo `app/`.
- TabNews: caminhos relativos à raiz de `_REF/tabnews.com.br`.
- `.../` abrevia um diretório já citado na mesma frase; nome de arquivo sem diretório é atalho para um arquivo citado na seção.
- Caminhos parciais que não batem na raiz do repositório são **sufixos** de um caminho existente (ex.: `issue/base.py` → `apps/api/plane/app/views/issue/base.py`). Quando o sufixo existe em mais de um app (ex.: `app/root.tsx` em `admin`, `space` e `web`), vale o prefixo declarado acima; para React, `apps/web`.
- Faixas `arquivo:linha` foram verificadas contra o arquivo resolvido: o início existe e o fim não ultrapassa o total de linhas.
- Em `07-arquitetura-comparada.md`, `§OP-BE`/`§OP-FE`/`§PL-BE`/`§PL-FE`/`§TG-BE`/`§TG-FE` referenciam a seção do documento numerado correspondente.

## Memória de agentes — knudge

| Documento | O que responde |
|---|---|
| [`09-knudge-tarefas.md`](09-knudge-tarefas.md) | Como o knudge organiza trabalho como view derivada de notas, e o que trazer para o Meraki sem árvore, dependências ou cerimônia |

## Projeto pessoal — task-manager

Revisão de `_REF/task-manager` (backend Rust/Axum/SQLite), com foco em organização, dados e camadas de proteção:

| Documento | O que responde |
|---|---|
| [`task-manager/00-visao-geral.md`](task-manager/00-visao-geral.md) | números, cinco camadas reais, fluxo de request, o que funciona e o que cobra caro |
| [`task-manager/01-arquitetura.md`](task-manager/01-arquitetura.md) | módulos, ordem real dos middlewares, `api→core→repo`, erros, cache, cerimônia vs. essencial |
| [`task-manager/02-dados.md`](task-manager/02-dados.md) | schema STRICT, JSON em TEXT, invariantes, repositórios, concorrência, migrações |
| [`task-manager/03-protecao.md`](task-manager/03-protecao.md) | auth por sessão/API key, RBAC+ACL, tenancy, rate limit, uploads, webhooks, lacunas |
| [`task-manager/04-api-runtime.md`](task-manager/04-api-runtime.md) | rotas, DTOs, RFC 9457, operações, bulk, OpenAPI, runtime SQLite |
| [`task-manager/05-engenharia.md`](task-manager/05-engenharia.md) | testes, CI, config, Docker, observabilidade, documentação |
| [`task-manager/06-simplicidade.md`](task-manager/06-simplicidade.md) | o que levar, o que cortar e a receita mínima para o meraki |

## Como ler

1. Produto/UX: comece por `00-sintese-meraki.md`, depois os pares `*-data-model` e `*-ui-ux`.
2. Engenharia: leia `07-arquitetura-comparada.md` e use os seis `0N-*` como evidência.
3. Antes de decidir stack, confira a seção "Lições objetivas para o meraki" de cada doc de engenharia.
