# task-manager — API HTTP, operações de domínio e runtime

> Área: contrato REST, camada de operações (`core/*_ops.rs`), busca/relatórios e processo.
> Caminhos relativos a `_REF/task-manager/`. Backend: Axum 0.8 (`backend/Cargo.toml:13`),
> SQLx 0.8 runtime (`:27`), SQLite. Sem evidência direta no código, o texto marca `[INFERENCE]`.
> Complementa os docs de arquitetura/dados/proteção; não repete README nem plano.

## 1. Papel da área no sistema

O backend é **um processo único** que serve JSON sob `/api/v1`, mais dois endpoints de
documentação (`/api/v1/docs`, `/api/v1/openapi.yaml`) e um healthcheck na raiz (`/_healthz`,
`backend/src/main.rs:44`). Não há WebSocket, SSE, fila, worker nem job runner: tudo que acontece
acontece dentro do ciclo de request, exceto (a) dispatch de webhook e (b) limpeza de sessões;
a indexação FTS, que seria um job natural, roda inline no próprio handler.

O recorte de camadas é explícito:

```
HTTP (axum)                    api/*.rs        parse, auth, status code, envelope
  → regra de negócio           core/*_ops.rs   permissão, validação, cache, efeitos
    → persistência             db/repositories/*_repo.rs  SQL cru (sqlx::query)
      → SQLite (WAL, STRICT)   backend/sql/v1-initial.sql
transversal: error/ (Problem Details), types/ (DTOs), spec/ (OpenAPI estático)
```

Onde essa área **se paga**: o contrato é estável e previsível (envelope único, erro único, IDs
UUIDv7, soft-delete, versionamento otimista exposto ao cliente), a API é pequena o bastante para
caber numa tabela e o runtime é de ~113 linhas (`main.rs`) + 57 de pool (`db/pool.rs`). Onde ela
**não se paga**: a camada `core` é quase sempre um encaminhamento 1:1 dos handlers, o cache
write-through não tem invalidação real, e não existe transação em nenhuma operação de escrita
composta (§5). Números: 101 arquivos / 12.948 linhas em `backend/src`, sendo 2.925 em `api/`,
4.326 em `core/`, 2.343 em `db/repositories/`, 1.369 em `types/`, 719 em `error/`.

## 2. Como está organizado

### 2.1 Superfície HTTP

79 registros de rota (`backend/src/api/router.rs:22-121`), montados sob `.nest("/api", ...)`
(`main.rs:45-47`) e prefixados com `/v1` no próprio router — logo todo caminho público é
`/api/v1/...`. O OpenAPI documenta 54 paths e 76 operações (`openapi.yaml:49-1959`).

| Área | Rotas (relativas a `/api/v1`) | # | Evidência |
|---|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/invite-tokens` | 5 | `router.rs:25-29` |
| Notificações | `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/{id}/read` | 3 | `router.rs:31-33` |
| Admin | `GET /admin/users`, `GET /admin/stats`, `POST /admin/reset-password` | 3 | `router.rs:35-37` |
| Workspaces | `GET\|POST /workspaces`, `GET\|PUT\|DELETE /workspaces/{id}`, `GET\|POST /workspaces/{id}/members`, `DELETE /workspaces/{id}/members/{user_id}`, `GET /workspaces/{id}/stats`, `GET\|PUT /workspaces/{id}/statuses`, `POST /workspaces/{id}/statuses/reset` | 12 | `router.rs:39-50` |
| Projetos | `GET\|POST /workspaces/{ws}/projects`, `GET\|PUT\|DELETE /workspaces/{ws}/projects/{id}` | 5 | `router.rs:52-56` |
| Sprints | `GET\|POST /workspaces/{ws}/sprints`, `GET\|PUT\|DELETE /workspaces/{ws}/sprints/{id}` | 5 | `router.rs:58-62` |
| Tarefas | `GET\|POST /workspaces/{ws}/tasks`, `POST .../tasks/bulk`, `GET\|PUT\|DELETE .../tasks/{id}`, `PATCH .../tasks/{id}/toggle`, `POST .../tasks/{id}/move`, `GET .../tasks/{id}/dependents` | 9 | `router.rs:64-72` |
| Atividades | `GET\|POST .../tasks/{id}/activities`, `DELETE .../activities/{aid}` | 3 | `router.rs:74-76` |
| Time entries | `GET\|POST .../tasks/{id}/time-entries`, `PUT\|DELETE .../time-entries/{eid}` | 4 | `router.rs:78-81` |
| Relatórios | `GET /workspaces/{id}/reports/time` | 1 | `router.rs:83` |
| API keys | `GET\|POST /api-keys`, `DELETE /api-keys/{id}` | 3 | `router.rs:85-87` |
| Arquivos | `GET\|POST /workspaces/{ws}/files`, `DELETE /workspaces/{ws}/files/{id}`, `GET /files/{id}` | 4 | `router.rs:89-92` |
| Archive | `GET /archive/{entity_type}`, `GET /archive/{entity_type}/{id}`, `POST /archive/{entity_type}/{id}/restore` | 3 | `router.rs:94-96` |
| Integrações | `GET\|POST .../tasks/{id}/integrations`, `GET\|PUT\|DELETE .../integrations/{iid}`, `POST .../integrations/{iid}/sync` | 6 | `router.rs:98-103` |
| ACL | `GET\|PUT /workspaces/{ws}/projects/{id}/permissions`, `GET .../tasks/{id}/permissions` | 3 | `router.rs:105-107` |
| Webhooks | `GET\|POST /webhooks`, `DELETE /webhooks/{id}` | 3 | `router.rs:109-111` |
| Dependências | `POST .../tasks/{id}/dependencies`, `DELETE .../dependencies/{dep}` | 2 | `router.rs:113-114` |
| Watchers | `POST .../tasks/{id}/watchers`, `DELETE .../watchers/{uid}` | 2 | `router.rs:116-117` |
| Busca | `GET /search` | 1 | `router.rs:119` |
| Meta | `GET /openapi.yaml`, `GET /docs` | 2 | `router.rs:121-122` |

Contagens: 79 rotas, 20 áreas, 0 recurso versionado por header. `/v1` é o único segmento de
versão existente; não há `/v2`, negociação por `Accept` nem depreciação.

### 2.2 Convenções que o contrato realmente segue

- **Sub-recurso aninhado sob o dono.** 53 das 79 rotas começam por `/workspaces/{ws_id}` (42)
  ou `/workspaces/{id}` (11). Isso
  põe o tenant na URL e elimina um middleware de tenant; a checagem vira "sou membro de `ws_id`?".
- **Recursos globais são a exceção**: `/notifications`, `/api-keys`, `/webhooks`, `/admin`,
  `/search`, `/archive`, `/files/{id}` (`router.rs:31-37,85-96,109,119`). `webhooks` é global mas
  cria uma linha **por workspace do usuário** (`core/webhook_ops.rs:34-48`) — o recurso global é
  um fan-out artificial; ver §5-F12.
- **Kebab-case em compostos**: `time-entries`, `api-keys`, `read-all`, `reset-password`.
  **Verbos só como ação**: `toggle`, `move`, `sync`, `restore`, `reset`. Tudo o mais é CRUD.
- **Verbos HTTP inconsistentes com a semântica**: `PUT` é usado onde o corpo é parcial — todos os
  campos de `UpdateTaskRequest` são `Option` (`types/request.rs:78-103`), então `PUT /tasks/{id}`
  é, na prática, um PATCH. `toggle` usa `PATCH` e `move` usa `POST` para a mesma classe de ação.
- **Corpo de update usa tripla opcionalidade**: `Option<T>` = "não mexer", `Option<Option<T>>` =
  "não mexer / limpar" (`types/request.rs:92-99`). Documentado em `:74-77`.

### 2.3 DTOs, envelope e paginação

Resposta de sucesso é sempre o mesmo envelope (`error/response.rs:29-45`):

```json
{ "success": true, "data": …, "total": 0, "offset": 0, "limit": 50 }
```

`total`/`offset`/`limit` só aparecem quando `ApiResponse::paginated` é usado
(`error/response.rs:60-68`); `ApiResponse::ok` os omite (`:47-55`). Não há `meta`, `links`,
`next_cursor` nem ETag.

| Elemento | Como está | Evidência |
|---|---|---|
| Paginação | `?offset=&limit=`; default 50; **sem cap** salvo em notificações/atividades (`.min(200)`) | `types/filter.rs:17-40`; `api/notifications.rs:32`; `api/activities.rs:47` |
| Paginação real | feita **em memória**: carrega todas as linhas, conta, e faz `skip/take` | `api/tasks.rs:100-104`; `api/search.rs:54-57` |
| Tipo `Pagination`/`PaginatedData` | definidos e **não usados** por nenhum handler (só um teste em `models.rs:72`) | `types/filter.rs:17-47` |
| Filtros de tarefa | 13 campos opcionais, todos em `TaskFilter` | `types/filter.rs:52-75` |
| Datas na entrada | `DateTime<Utc>` via serde em DTOs; nas queries viram `%Y-%m-%d %H:%M:%S` | `types/request.rs:54-61`; `db/repositories/task_repo.rs:44-45` |
| Datas na saída | `DateTime<Utc>` (RFC 3339) em `Task`; **string crua** `"YYYY-MM-DD HH:MM:SS"` em `Notification.created_at`/`created_at` de API key | `types/task.rs:94-97`; `types/notification.rs:49`; `core/api_key_ops.rs:17` |
| IDs | `Uuid::now_v7()` em toda criação (ordenável por tempo), serializado como string | `core/task_ops.rs:27,62`; `types/task.rs:59` |
| Concorrência | `version: u64` no recurso, `version` opcional no request → 409 se divergir | `types/task.rs:114-115`; `core/task_ops.rs:217-224` |
| Erros por campo | **não existem**. Validação retorna uma string única em `detail` | `error/app_error.rs:37-42`; `types/validate.rs:37-42` |
| Status HTTP de validação | 422 (não 400) | `error/category.rs:37` |

`types/filter.rs` é um bom retrato do estilo: `TaskFilter` é usado de verdade; `Pagination` e
`PaginatedData` foram modelados e nunca adotados. Custo zero em runtime, custo cognitivo real.

### 2.4 Erros

Um enum, nove variantes, todas com `detail` + `instance` + `Box<ErrorContext>`
(`error/app_error.rs:27-107`); `IntoResponse` monta RFC 9457 (`:125-170`):

```json
{ "type": "urn:task-manager:error:not-found", "title": "Not Found",
  "status": 404, "detail": "not found: task not found", "instance": "<uuidv7>" }
```

`instance` é um UUID novo por erro, usado só para correlacionar com o log estruturado
(`error/app_error.rs:146-155`). Categorias → status: 404/422/401/403/409/410/429/500/500
(`error/category.rs:33-44`). `Archived` (410) e `Database` (500) são definidos mas **nunca
construídos** (0 ocorrências de `AppError::archived(`/`AppError::database(` em `backend/src`).

O `detail` sai prefixado pela mensagem do `thiserror` (`"not found: {}"`, `app_error.rs:29`), o
que vaza o nome da variante para o cliente: `"validation error: hours must be positive"`.

## 3. Fluxos passo a passo

### 3.1 Pipeline de request

Camadas registradas em `router.rs:123-133`, na ordem em que aparecem no arquivo. Em Axum o
**último** `.layer()` é o mais externo, então a ordem efetiva de execução é a inversa:

| # | Camada | O que faz | Evidência |
|---|---|---|---|
| 1 | `Caches` extension | injeta `Caches` nas extensions | `router.rs:133` |
| 2 | pool extension | injeta `SqlitePool` | `router.rs:132` |
| 3 | `require_auth` | lê `Authorization: Bearer` ou cookie `session=`; **se não autenticar, deixa passar** | `router.rs:131`; `api/api_key_mw.rs:90-114` |
| 4-6 | extensions dos 3 rate limiters | injetam `Arc<...>` | `router.rs:128-130` |
| 7 | `rate_limit_mw` | login 5/60s por IP; escrita 10/60s; geral 100/60s | `router.rs:127`; `api/rate_limit.rs:127-186` |
| 8 | `log_request` | uma linha `tracing` por request | `router.rs:126`; `api/api_key_mw.rs:120-155` |
| 9 | handler | só aqui a autenticação é **exigida**, via extractor `AuthUser` | `api/api_key_mw.rs:44-58` |

Consequências diretas dessa arquitetura:

- Um handler que **não** declare `AuthUser` fica público. Existe exatamente um:
  `GET /workspaces/{ws}/tasks/{id}/time-entries` (`api/time_entries.rs:44-56`). O middleware não
  rejeita (`api_key_mw.rs:100-111`), então a listagem de horas é acessível sem credencial.
- O rate limit roda **antes** de saber quem é o usuário; requisição anônima cai no balde
  `"anonymous"` (`api/rate_limit.rs:108-126`).
- O comentário `// Layers (outermost first)` (`router.rs:123`) está invertido em relação ao
  comportamento do Axum. Quem ler o arquivo de cima para baixo entende errado a ordem.
- CORS é aplicado por fora (`main.rs:50`), e o default é `*` com `allow_methods(Any)`/`allow_headers(Any)`
  (`main.rs:25-29`). Não há compressão, timeout de request, request-id nem `TraceLayer`.

O handler padrão de recurso scoped começa sempre igual: parseia `auth.0.id` (que é `String`) para
`Uuid`, carrega **todos** os membros do workspace, opcionalmente carrega todas as ACLs do
workspace, e só então chama `core`. Isso aparece 42 vezes em `api/*.rs`
(ex.: `api/tasks.rs:68-79`, `api/sprints.rs:29-39`, `api/deps_watchers.rs:39-45`).

### 3.2 Escrita: `POST /workspaces/{ws}/tasks`

1. `create` (`api/tasks.rs:112-152`): parse do user id → `member_repo::list(ws)` → `task_ops::create`.
2. `task_ops::create` (`core/task_ops.rs:19-135`): `permissions::check(Workspace, Create)` →
   `validate_title` → `validate_description` → projeto existe **e pertence ao ws** → cada assignee
   é membro → `Uuid::now_v7()` → parent no ws → sprint no ws → cada dependência existe no ws →
   monta `Task` → `INSERT` → `cache.set` → `search_repo::upsert` (ignora erro) →
   `webhook_ops::dispatch` (ignora erro) → `info!`.
3. De volta ao handler: `activity_ops::add_system_event("created task '…'")` e, se houver
   assignees, `notification_ops::dispatch_assigned` — ambos com `let _ =`.
4. Resposta `201` + envelope (`api/tasks.rs:150`).

São **pelo menos 7 round-trips ao SQLite** por criação (membros, projeto, parent, sprint,
N dependências, insert, fts delete+insert, webhook select, activity insert, N notifications) e
**nenhuma transação**. Falha no meio deixa tarefa criada sem atividade/notificação/índice.

### 3.3 `PATCH /api/v1/workspaces/{ws}/tasks/{id}/toggle`

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant MW as require_auth + rate_limit
    participant H as api.tasks.toggle
    participant O as core.task_ops.toggle
    participant U as core.task_ops.update
    participant R as task_repo / search_repo
    participant DB as SQLite

    C->>MW: PATCH /tasks/{id}/toggle
    MW->>MW: Bearer/cookie → AuthUser; escrita 10/60s; geral 100/60s
    MW->>H: request
    H->>DB: SELECT * FROM workspace_members WHERE ws
    H->>DB: SELECT * FROM project_acls WHERE ws  (load_project_acls)
    H->>O: toggle(ws, task, user, members, acls)
    O->>DB: get_by_id → cache hit? senão SELECT tasks
    O->>O: new = if status=="done" {pending} else {done}
    O->>U: update(status=new, version=existing.version, resto default)
    U->>DB: get_by_id (2ª leitura, idem)
    U->>U: permissions::check(Task(task, project), Update)
    U->>U: version == existing.version ? senão 409
    U->>DB: SELECT workspace_statuses (para is_terminal)
    U->>U: closed_at = now | None
    U->>R: UPDATE tasks ... WHERE id=?  (sem predicado de version)
    U->>DB: INSERT/DELETE tasks_fts (upsert manual)
    U->>O: task
    O-->>H: task
    H->>DB: INSERT task_activities ("toggled status to X", old_value=null)
    H-->>C: 200 {success, data:task}
```

Observações que o diagrama expõe: (a) `get_by_id` é chamado **duas vezes** (cache resolve, mas o
segundo `permissions::check` só existe no `update`); (b) o evento gerado tem `old_value: None`
porque ninguém carregou o estado anterior no handler (`api/tasks.rs:318-323`) — diferente de
`PUT`, que carrega `before` e compara (`api/tasks.rs:189-256`); (c) `toggle` **não** notifica
mudança de status, enquanto `PUT` notifica (`api/tasks.rs:212-216`); (d) o `WHERE` do `UPDATE`
não inclui `version` (`db/repositories/task_repo.rs:231`).

### 3.4 `POST /api/v1/workspaces/{ws}/tasks/bulk`

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente
    participant H as api.tasks.bulk
    participant O as core.task_ops.bulk
    participant A as apply_bulk_action
    participant U as task_ops.update/delete
    participant DB as SQLite

    C->>H: {action, task_ids[], value}
    H->>DB: membros do ws; ACLs do ws
    H->>O: bulk(...)
    loop para cada task_id (sem limite de quantidade)
        O->>A: apply_bulk_action
        A->>DB: get_by_id (cache/DB)
        alt update_status, update_priority, assign, add/remove_assignee, move
            A->>U: update(1 campo, version=existing.version)
            U->>DB: get_by_id + permissão + UPDATE + fts + webhook
        else delete
            A->>U: delete (archive + fts delete + webhook)
        end
        A-->>O: Ok | Err(e)
        O->>O: success += 1 | errors.push({task_id, error})
    end
    O-->>H: BulkResult{success, errors[]}
    H-->>C: 200 {success:true, data:{success, errors}}
```

Semântica real: **parcial** (não atômica), **não transacional**, **sem limite** de `task_ids`,
**200 mesmo se todas falharem**, e **sem efeitos de atividade/notificação** — `task_ops::bulk`
não chama `activity_ops` nem `notification_ops` (`core/task_ops.rs:430-451`), ao contrário do
`PUT` unitário. O "transaction" do lote é o `success`/`errors` no corpo.

Idempotência: repetir `delete` numa tarefa já arquivada devolve `success` de novo porque
`get_by_id` não filtra `archived` (`core/task_ops.rs:144-156`; `task_repo.rs:67-75`).
`add_assignee` repetido é idempotente por checagem `contains` (`core/task_ops.rs:499-502`);
`add_dependency`/`add_watcher` também (`core/dep_ops.rs:26-28`, `core/watcher_ops.rs:22-24`).
Não existe chave de idempotência em nenhum endpoint.

### 3.5 Erro

`AppError::validation(...)` → `IntoResponse` → status da categoria (422), corpo
`ProblemDetails`, log `tracing::error!` com `operation/user_id/resource_id` (quase sempre vazios:
os builders `with_*` de `ErrorContext` são usados em pouquíssimos pontos) e `instance` UUIDv7
(`error/app_error.rs:125-170`). Erros de SQLx convertem via `From<sqlx::Error>`
(`error/app_error.rs:170-190`). O handler nunca escolhe
status: `Err(e) => e.into_response()` é o padrão em 100% dos handlers.

## 4. Decisões boas e por quê

1. **Envelope único com `success` + `data`.** Cliente tem um só parser; `total/offset/limit`
   opcionais evitam um segundo tipo de resposta (`error/response.rs:29-68`). Simples e pago.
2. **Problem Details (RFC 9457) em vez de `{error: "..."}`.** `type` é URN estável por categoria,
   `instance` correlaciona com log (`error/problem.rs:23-36`; `app_error.rs:158-166`). Custa ~300
   linhas de enum + matches; para 9 categorias é defensável.
3. **UUIDv7 em tudo.** Ordenável por tempo, sem colisão, sem sequence do banco, e o cliente pode
   gerar/antecipar ids. Custo: 36 bytes por UUID em cada FK e em cada índice TEXT (vs. 8 de um
   `INTEGER`) — aceitável em SQLite.
4. **`STRICT` em todas as tabelas + `PRAGMA foreign_keys(true)`.** O banco recusa tipo errado em
   vez de coagir silenciosamente (`backend/sql/v1-initial.sql:214-241`; `db/pool.rs:27`).
5. **Soft-delete uniforme** (`archived`, `archived_at`, `archived_by` em todas as entidades) com
   `DELETE` = arquivar (`core/task_ops.rs:400-428`) e rota de restore. Um conceito, aplicado a
   tudo; o preço é que quase toda query precisa de `AND archived = 0`.
6. **Versionamento otimista exposto no corpo.** `version` vai no recurso e volta no update; 409
   com mensagem explícita (`core/task_ops.rs:217-224`). Bom contrato — a implementação é que não
   é atômica (§5-F4).
7. **Listas de associação como JSON em coluna TEXT** (`assignees`, `tags`, `depends_on`,
   `watchers`, `integrations`). Para "uma tarefa, poucos assignees" elimina 4 tabelas de junção e
   4 joins. Vira problema quando se filtra por assignee (`LIKE '%uuid%'`, `task_repo.rs:100-101`).
8. **FTS5 com `porter unicode61` e query `palavra* AND palavra*`.** 20 linhas de SQL criam o
   índice, 15 linhas fazem upsert/delete (`db/repositories/search_repo.rs:9-54`). Nada de
   Elastic/Lucene para buscar título de tarefa.
9. **OpenAPI como arquivo estático embutido** (`include_str!`, `spec/mod.rs:10`) servido por um
   handler de 6 linhas + Swagger UI de CDN (`spec/mod.rs:22-38`). Zero macro, zero build step,
   zero `utoipa` no grafo de compilação. O preço é drift (§5-F16).
10. **Runtime mínimo.** `main.rs` tem 113 linhas: env vars com default, pool, migração, seed,
    CORS, body limit de 55 MiB, `/_healthz`, `tokio::spawn` de limpeza de sessão a cada N horas,
    `serve(...).with_graceful_shutdown(sigint|sigterm)` e `PRAGMA optimize` antes de sair
    (`main.rs:10-78`; `:81-113`). É o tipo de bootstrap que dá para ler inteiro em 2 minutos.
11. **SQLite configurado com intenção**: WAL, `synchronous=NORMAL`, `busy_timeout=10s`,
    `foreign_keys=on`, `cache_size=-64000` (64 MiB), `temp_store=MEMORY`, `trusted_schema=OFF`,
    `defensive=ON`, `wal_autocheckpoint=1000` (`db/pool.rs:20-31,32-55`). Para 1 processo, esse
    conjunto é praticamente o checklist correto.
12. **Migração versionada com `BEGIN IMMEDIATE` + backup + integrity check antes/depois**
    (`db/migrations.rs:92-130`). Overkill para 1 tabela de controle? Um pouco — mas o custo é 253
    linhas e o ganho é não corromper o único arquivo de dados do usuário.

## 5. Complexidade/custo e riscos

### 5.1 Tabela operação → validações → transação → efeitos

| Operação | Validações no core | Transação | Efeitos colaterais |
|---|---|---|---|
| `task create` (`task_ops.rs:19`) | título, descrição, projeto∈ws, assignees∈membros, parent∈ws, sprint∈ws, dependência∈ws | ❌ | cache, FTS, webhook; atividade+notificação no handler |
| `task update` (`:187`) | título/descrição/tags, projeto/parent/sprint∈ws, assignees/watchers∈membros, dependências∈ws, `version` | ❌ | cache, FTS, webhook; 4 tipos de atividade + status/assignee notification (handler) |
| `toggle` (`:338`) | delega a `update` (sem validar título etc.) | ❌ | cache, FTS, webhook, 1 atividade sem `old_value` |
| `move` (`:371`) | delega a `update` | ❌ | cache, FTS, webhook, 1 atividade |
| `bulk` (`:430`) | uma ação por vez; sem limite de itens | ❌ | cache, FTS, webhook por item; **sem** atividade/notificação |
| `task delete` (`:400`) | `permissions::check(Delete)` | ❌ | archive, FTS delete, cache remove, webhook; atividade (handler) |
| `dep add/remove` (`dep_ops.rs:13,39`) | só "não é a própria tarefa" / existe | ❌ | nenhum (sem cache, sem webhook, sem atividade) |
| `watcher add/remove` (`watcher_ops.rs:13,35`) | nenhuma (não valida se é membro) | ❌ | nenhum |
| `sprint create/update/delete` (`sprint_ops.rs:16,117,170`) | título/descrição, `version` (update) | ❌ | cache; **projeto do sprint não é validado** |
| `project create/update/delete` (`project_ops.rs:16,113,173`) | nome, cor, descrição, `version` | ❌ | cache; **`parent_id` não é validado (nem ciclo)** |
| `workspace create` (`workspace_ops.rs:15`) | nada além do slug gerado | ❌ | cache + membro admin (2 inserts) |
| `workspace add/remove member` (`:102,138`) | papel do ator, duplicidade, usuário existe | ❌ | nenhum |
| `workspace delete` (`:222`) | papel do ator | ❌ | archive + N deletes de membros, cache remove |
| `time entry add/update/delete` (`time_entry_ops.rs:13,55,90`) | horas ∈ (0,24], dono no update | ❌ | nenhum (nem `spent_hours` da tarefa) |
| `statuses set_all` (`status_ops.rs:22` via `status_repo.rs:42`) | papel admin no handler | ✅ única `pool.begin()` do projeto | nenhum |

### 5.2 Falhas de projeto (com evidência)

**F1. Três camadas para CRUD de 6 linhas.** `api/sprints.rs:41-63` → `core/sprint_ops.rs:16-64` →
`sprint_repo::insert`. O handler só faz parse + `member_repo::list`; o core só faz `permissions::check`
+ `INSERT` + `cache.set`. O mesmo vale para projetos e workspaces. O ganho da separação seria
testabilidade do core — mas os testes de `core` usam SQLite in-memory real, então a camada não
isola nada. **Custo**: cada endpoint novo são 3 arquivos e 4 assinaturas com `members: &[...]`,
`cache: &DataCache`, `pool: &SqlitePool`.

**F2. Toda rota paga a carga de membros, sempre.** `member_repo::list` aparece 42 vezes em 9
arquivos de `api/` (6 em `workspaces.rs`, 9 em `tasks.rs`, 4 em `deps_watchers.rs`) — um handler
por chamada, sem memoização. Um `GET /tasks` faz: membros (1 query) + ACLs (1) + tarefas (1) +
FTS (1) + N upserts no cache. Multiplicar por qualquer lista é O(requests × membros).

**F3. Cache write-through sem TTL, sem limite, sem invalidação coerente.**
`DataCache` só tem `get/set/remove/get_all/invalidate_all` (`core/cache.rs:25-96`); nenhuma entrada
expira e `invalidate_all` só é chamado em testes (`:121-126`). Três consequências verificáveis:
(a) `get_by_id` devolve do cache **antes** de conferir `workspace_id` (`task_ops.rs:149-151` vs.
filtro em `:153-155`) → tarefa de outro workspace, se estiver em cache, é servida a quem é membro
do ws pedido; (b) `list` devolve o **subconjunto cacheado** se ele não estiver vazio
(`project_ops.rs:99-103`, `sprint_ops.rs:100-106`, `workspace_ops.rs:63-70`) → lista incompleta
após o primeiro request; (c) o cache é por processo: com 2 réplicas, cada uma tem uma verdade.
O comentário do módulo já admite que o cache "não substitui autorização" (`cache.rs:11-13`) — mas
ele **precede** a checagem de workspace, que é autorização de tenant. **A alternativa mais simples
é não ter cache**: SQLite com WAL e índice em `id` responde isso em microssegundos, e a API é
single-process.

**F4. "Optimistic locking" sem atomicidade.** O padrão é `SELECT` → compara `version` na aplicação
→ `UPDATE ... WHERE id=?` (`task_ops.rs:217-224` + `task_repo.rs:223-261`). Duas requisições
concorrentes leem `version=3`, ambas passam, ambas gravam `version=4`; a segunda sobrescreve a
primeira sem 409. O `UPDATE ... WHERE id=? AND version=?` + checar `rows_affected()` seria a mesma
quantidade de código e resolveria. Hoje o campo `version` documenta uma garantia que o SQL não dá.

**F5. Quase nenhuma transação.** `grep '\.begin()'` em `backend/src` retorna **1** ocorrência
(`db/repositories/status_repo.rs:42`). Toda operação composta — tarefa + FTS + webhook + atividade
+ notificações + cache — é uma sequência de statements independentes. Um erro no meio deixa
estado parcial e o handler devolve erro como se nada tivesse acontecido. Também não há
compensação nem outbox.

**F6. Efeitos colaterais na camada errada e engolidos.** Atividade e notificação nascem no
**handler**, não no core (`api/tasks.rs:131-148,202-256`), e todas as chamadas usam `let _ =`
(`:131,140,203,212,218,229,240,247`). Resultado: (a) o core sozinho (usado por seed, bulk,
deps) não gera histórico — `PUT` gera 1-4 atividades, `bulk` gera 0; (b) erro de notificação é
invisível; (c) um retry do cliente duplica atividade/notificação, porque não há chave de
idempotência. A regra "quem mudou o quê" está dividida entre handler (`before/after`) e core
(a mudança em si).

**F7. Regras duplicadas entre aplicação e banco.**
`closed_at` é calculado em Rust consultando `workspace_statuses` (`task_ops.rs:304-315`) **e** por
trigger SQL (`v1-initial.sql:268-285`). `updated_at` é setado em Rust (`task_ops.rs:317`) **e** por
trigger (`v1-initial.sql:259-266`). O índice FTS é mantido por `search_repo::upsert` manual
(`task_ops.rs:122-127,322-326`) **e** por três triggers (`v1-initial.sql:392-413`). Duas fontes
para a mesma verdade; a única razão de não haver linha duplicada é que o `upsert` faz
`DELETE`+`INSERT` (`search_repo.rs:14-20`).

**F8. Validação inconsistente entre create e update.** `create` valida `assignees` mas **não**
valida `watchers` (`task_ops.rs:48-55` vs. `:281-290` no update); `create` **não** chama
`validate_tags` (só `:214-216`, no update), então o limite de 20 tags / 50 chars é contornável criando
a tarefa com 500 tags. `status` nunca é validado contra `workspace_statuses` em nenhum dos dois.
`project.parent_id` não é validado (nem pertence ao ws, nem ciclo) (`project_ops.rs:16-60`).

**F9. Dependências sem ciclo e sem índice.** `dep_ops::add_dependency` checa só "não é eu mesmo"
(`dep_ops.rs:19-21`); A→B→A é aceito, e `list_dependents` faz `depends_on LIKE '%uuid%'` com
filtro em Rust (`task_repo.rs:204-221`). Não há checagem de que `depends_on` pertence ao mesmo
workspace nessa rota (o `create/update` valida; a rota dedicada não). Também não há "bloquear
conclusão enquanto dependência aberta": a dependência é decorativa.

**F10. Busca custa O(tarefas do usuário).** `search_ops` roda o FTS (ok), mas depois, para **cada
workspace do usuário**, faz `SELECT * FROM tasks WHERE workspace_id=?` e filtra em Rust
(`search_ops.rs:55-70`). O parâmetro `types` só trata `"tasks"` — `projects`/`sprints` são
aceitos e ignorados (`:52`), embora o OpenAPI prometa os três (`openapi.yaml:1638-1651`). A rota
também devolve itens arquivados? Não: filtra `archived = 0` (`:57`), mas `fts_ids` vem de um
índice que não distingue workspace.

**F11. Relatórios e stats: superfície maior que a implementação.** `reports/time` devolve
`by_user/by_project/by_sprint` **sempre vazios** (`core/report_ops.rs:26-33`) e ignora os filtros
`user_id/project_id/sprint_id` que o `repo` aceita. `GET /workspaces/{id}/stats` descarta o
`auth` (`api/stats.rs:21`) e expõe contagem de tarefas/pessoas de qualquer workspace a qualquer
autenticado. `global_stats` e `/admin/*` autorizam por `auth.0.username != "admin"`
(`api/stats.rs:34`; `api/admin.rs:28,55`) — não por papel. O admin default nasce com senha
`admin123` (`seed.rs:35-37`).

**F12. Rotas que não fazem o que o nome diz.** `archive/{entity_type}` ignora `entity_type`
(`api/archive.rs:34-52`, parâmetro `_entity_type`) e só opera workspaces. `webhooks` é global mas
materializa uma linha por workspace (`webhook_ops.rs:34-48`); `delete` verifica posse olhando
apenas o **primeiro** workspace do usuário (`webhook_ops.rs:67-83`) [INFERENCE: falha para
webhooks do segundo workspace em diante]. `DELETE /api-keys/{id}` apaga por id sem checar dono
(`api/api_key_mw.rs:231-240`; `core/api_key_ops.rs:60-66`).

**F13. Rate limit de escrita 10/60s com estado que só cresce.** `HashMap<String, Vec<Instant>>`
por chave, retendo timestamps da janela (`api/rate_limit.rs:34-57`); as chaves nunca são removidas
do mapa. Com 10 req/min, o único jeito de editar 200 tarefas é `/bulk` — que por sua vez não tem
limite de itens (`task_ops.rs:439-451`). Ou seja: o limite empurra o cliente para a rota sem
atomicidade.

**F14. Paginação em memória + ausência de `LIMIT` no SQL.** `task_repo::list` monta SQL dinâmico
sem `LIMIT` (`task_repo.rs:80-140`) e o handler corta depois (`api/tasks.rs:100-104`). O `total`
vem de `tasks.len()`, não de `COUNT(*)`. Para 5.000 tarefas, `GET /tasks?limit=20` materializa
5.000 structs, serializa o cache de todas e devolve 20. `list_dependents` e `search` idem.

**F15. Duplicação de código de erro e de parse.** `AppError` repete o mesmo `match` de 9 variantes
em 3 funções (`app_error.rs:97-150`, ~55 linhas) para extrair `instance`, `context`, `category` e
`title`. O parse `auth.0.id.parse::<Uuid>()` + `AppError::internal("invalid user ID")` aparece 46
vezes em `api/*.rs` (`api/tasks.rs:51-58`, `api/workspaces.rs:28-31`, `api/acl.rs:39-42`, …). Um
`FromRequestParts for UserId` resolveria os dois de uma vez.

**F16. OpenAPI manual já divergiu.** 3.420 linhas escritas à mão para 76 operações
(`openapi.yaml`). Diff rota-a-rota contra `router.rs`:

| Divergência | Evidência |
|---|---|
| `GET /workspaces/{ws}/sprints/{sprint_id}` existe no código e **não** está no spec | `router.rs:60`; `openapi.yaml:729-775` (só `put`/`delete`) |
| `PUT /workspaces/{ws}/tasks/{id}/time-entries/{eid}` existe no código e **não** está no spec | `router.rs:80`; `openapi.yaml:1440-1467` (só `delete`) |
| `TaskPriority.default: medium` no spec; no código o default é `none` | `openapi.yaml:2656`; `types/task.rs:12-15` |
| `DELETE /api-keys/{id}` documenta `ApiResponseEmpty`; o handler devolve `data: null` | `openapi.yaml:1531-1556`; `api/api_key_mw.rs:235` |
| Spec promete busca em `tasks,projects,sprints`; só `tasks` é implementado | `openapi.yaml:1638-1651`; `search_ops.rs:52` |

**F17. Detalhes de runtime que custam caro depois.** `RequestBodyLimitLayer` de 55 MiB
(`main.rs:49`) num app cujo maior payload legítimo é um anexo; cookie de sessão sem `Secure`
(`auth/handlers.rs:67`); `tracing_subscriber::fmt()` sem JSON (`main.rs:3-8`), então log
estruturado e coleta por campo não existem; `PRAGMA user_version` gravado em **toda** conexão
(`db/pool.rs:50-52`) concorrendo com a tabela `_schema_version` (`migrations.rs:39-46`) — duas
fontes para a versão do schema; `application_id` também é setado nos dois lugares
(`pool.rs:50`; `migrations.rs:51`).

## 6. O que levar para o meraki

1. **Copiar o contrato, não as camadas.** Envelope `{success, data, total?, offset?, limit?}`,
   Problem Details com `instance` para correlação, UUIDv7, `version` no recurso, soft-delete com
   restore. São decisões que o cliente sente; o `api → core → repo` não.
2. **Cortar a camada `core` quando ela for forwarding.** Regra prática: se a função `_ops` só faz
   `check` + `insert` + `cache` (sprints, projetos, workspaces — §5.1), ela é um `repo` com
   permissão. Duas camadas (`api` + `db`) com `permissions` como função pura e testes de
   integração são suficientes. Manter `core` só para operações com regra de verdade (task
   create/update, bulk, dep graph).
3. **Versionamento otimista atômico desde o dia 1**: `UPDATE ... WHERE id=? AND version=?` e 409
   quando `rows_affected()==0`. Custa 3 linhas a mais que o padrão do task-manager e elimina
   §5-F4.
4. **Uma transação por operação de escrita**, envolvendo recurso + histórico + índice de busca.
   Notificação/webhook podem ficar fora (best-effort) desde que sejam **explícitos** — mas
   atividade e índice têm de ser atômicos com o dado.
5. **Não ter cache de leitura** enquanto o banco for SQLite local. O `DataCache` custa ~120 linhas,
   produz 3 bugs de correção (§5-F3) e não tem nada que um índice não resolva. Se um dia precisar,
   cache com TTL + invalidação por recurso, não `HashMap` global por processo.
6. **Efeitos num só lugar**: o core recebe `before` e devolve `(after, events)`, e um dispatcher
   grava atividade + notificação + webhook. Nada de `let _ =` espalhado em handler (§5-F6).
7. **Paginação no SQL**: `LIMIT/OFFSET` + `COUNT(*)` separado (ou keyset por `(created_at, id)`).
   O padrão do task-manager (carregar tudo e cortar) é o que mata a latência em 5k linhas.
8. **Bulk com limite e semântica declarada**: `max_items` (ex. 100), resposta com
   `applied/failed`, e 207 ou 200 com `errors` — mas documentado. Nunca 200 silencioso para tudo
   falhando.
9. **Anti-recomendação**: não repetir `openapi.yaml` escrito à mão. Ou derivar dos tipos (utoipa /
   aide) ou aceitar um contrato mínimo versionado por teste (rota registrada ⇔ rota no spec).
   Manualmente, 2 operações já faltam e 3 descrições já divergem (§5-F16).
10. **Uma decisão de autorização, num lugar**: `permissions::check(resource, action, actor)`
    como função pura é bom (§4-6 do doc de arquitetura); o que não se deve copiar é o
    `username == "admin"` (`api/stats.rs:34`), as rotas que ignoram `auth`
    (`api/stats.rs:21`, `api/time_entries.rs:44`) e o handler público de time-entries.

## 7. Apêndice de arquivos-chave

| Arquivo | Linhas | Papel |
|---|---|---|
| `backend/src/main.rs` | 113 | bootstrap: env, pool, migração, seed, CORS, body limit, shutdown gracioso |
| `backend/src/api/router.rs` | 134 | 79 rotas + 8 camadas + 3 rate limiters |
| `backend/src/api/api_key_mw.rs` | 240 | `require_auth` (opt-in), `AuthUser`, log de request, CRUD de API keys |
| `backend/src/api/rate_limit.rs` | 258 | sliding window in-memory: geral/login/escrita |
| `backend/src/api/tasks.rs` | 429 | 9 handlers de tarefa; orquestra atividade + notificação |
| `backend/src/api/workspaces.rs` | 236 | 12 handlers de workspace/membros/status |
| `backend/src/api/deps_watchers.rs` | 156 | 4 handlers; permissão no handler, não no core |
| `backend/src/api/time_entries.rs` | 90 | 4 handlers; `list` sem extractor de auth |
| `backend/src/api/archive.rs` | 66 | 3 rotas genéricas; `entity_type` ignorado |
| `backend/src/core/task_ops.rs` | 552 | create/get/list/update/toggle/move/delete/bulk + `list_dependents` |
| `backend/src/core/permissions.rs` | 479 | RBAC(4 papéis) + ACL por projeto + bypass de assignee/creator |
| `backend/src/core/cache.rs` | 216 | `DataCache<T>`/`Caches` write-through em `RwLock<HashMap>` |
| `backend/src/core/dep_ops.rs` / `watcher_ops.rs` | 58 / 54 | mutação de arrays JSON; sem permissão, sem efeitos |
| `backend/src/core/notification_ops.rs` | 119 | dispatch assigned/comment/status + leitura/mark-all |
| `backend/src/core/search_ops.rs` | 79 | FTS + varredura de todas as tarefas dos workspaces do usuário |
| `backend/src/core/stats.rs` / `report_ops.rs` | 248 / 33 | agregações SQL diretas; relatório com blocos vazios |
| `backend/src/db/pool.rs` | 57 | PRAGMAs via `after_connect`, `busy_timeout=10s`, `max_connections=10` |
| `backend/src/db/migrations.rs` | 253 | runner próprio: `BEGIN IMMEDIATE`, backup, integrity check |
| `backend/sql/v1-initial.sql` | 419 | 16 tabelas `STRICT`, 24 índices, FTS5 + 3 triggers de sync |
| `backend/src/db/repositories/task_repo.rs` | 384 | SQL dinâmico de filtros, `UPDATE` sem predicado de `version` |
| `backend/src/db/repositories/search_repo.rs` | 69 | upsert/delete/search FTS5 (`palavra*` + `AND`) |
| `backend/src/error/app_error.rs` | 301 | 9 variantes + `IntoResponse` + 3 `match` de 9 braços repetidos |
| `backend/src/error/response.rs` / `problem.rs` | 69 / 36 | envelope `ApiResponse` e RFC 9457 |
| `backend/src/types/filter.rs` / `request.rs` / `validate.rs` | 79 / 238 / 117 | filtros, DTOs de escrita, limites de campo |
| `backend/src/spec/mod.rs` | 40 | `include_str!("../../../openapi.yaml")` + Swagger UI via CDN |
| `openapi.yaml` | 3.420 | 54 paths / 76 operações, escritos à mão, 5 divergências conhecidas |
| `backend/src/seed.rs` | 89 | cria `admin/admin123`, workspace e projeto "General" no boot |
