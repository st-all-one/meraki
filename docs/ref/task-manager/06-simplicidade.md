# Simplicidade — o que levar do task-manager

> Síntese dos cinco documentos, com um filtro: **simplicidade é ter um dono por responsabilidade**, não ter menos arquivos. O task-manager acerta no desenho geral e erra ao repetir a mesma decisão em vários lugares. Este documento separa o que vale copiar do que só aumenta superfície.

## 1. O diagnóstico em uma frase

O projeto tem **poucas peças e muitas variações delas**: um erro, mas nove categorias; uma autorização, mas quatro formas de chamá-la; um `updated_at`, mas triggers e Rust escrevendo; um contrato OpenAPI, mas escrito à mão. A complexidade não está no volume — está na duplicação de donos.

## 2. As sete regras que o código já prova

| Regra | O que o projeto mostra | Como aplicar no meraki |
|---|---|---|
| **Um dono por invariante** | `updated_at` é escrito por trigger e por Rust; FTS por trigger e por `upsert` (`§02`) | Escolha: banco cuida de `updated_at` e FTS; Rust cuida de regra. Nunca os dois |
| **Uma transação por escrita** | 1 `begin()` no projeto; task + atividade + FTS em statements soltos (`§02`) | `pool.begin()` na função de operação; commit só no fim |
| **Versão como predicado, não como campo** | `version` é gravado, mas o `UPDATE` usa só `id` (`§02`) | `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`; `rows_affected()==0` → 409 |
| **Autorização num ponto só** | `permissions::check` é bom; handlers chamam de quatro jeitos e algumas rotas esquecem (`§03`) | Uma função pura `check(actor, resource, action, ctx)` chamada **dentro** do core |
| **Cache só depois de medir** | `DataCache` global causou vazamento entre workspaces (`§03`) | Comece sem cache; se precisar, chave por tenant e TTL |
| **Um formato de tempo** | `datetime('now')` (espaço) + parse RFC 3339 com fallback para `Utc::now()`; o fallback silencioso apaga a data real na leitura `[INFERENCE]` (`§02`) | RFC 3339 UTC em todo lugar; `DateTime<Utc>` no tipo; sem fallback silencioso |
| **Contrato derivado ou testado** | `openapi.yaml` manual já divergiu em 2 operações (`§04`) | Gere do código (utoipa/aide) ou teste router×spec no CI |

## 3. O que copiar (com adaptação)

1. **Schema `STRICT` com `CHECK` nos enums fechados.** Uma linha pega bind errado que o Rust não pega. `role IN ('admin','maintainer','member','viewer')` vale mais que um `match` defensivo.
2. **UUIDv7 como PK.** Ordena por tempo e dispensa sequência. Use as features `uuid`/`chrono` do SQLx para `bind` direto, em vez de `format!`/`parse` manual.
3. **Repositórios como funções sobre `&Pool`.** SQL explícito, row structs, sem ORM. O handler não vê SQL; o SQL não vê HTTP.
4. **Um erro de domínio que implementa `IntoResponse`.** `thiserror` para as variantes, `ProblemDetails` com `type`, `title`, `status`, `detail`, `instance`. Sem `anyhow` na borda.
5. **Handlers com assinatura curta.** `Result<impl IntoResponse, AppError>` em vez de `Response` + `match` em 73 handlers. O compilador garante que o erro foi tratado.
6. **Teste de integração in-process.** `build_app(pool, state) -> Router` extraído da `main`; SQLite `:memory:` com `max_connections(1)`; um helper de login/cookie. É o teste que pega permissão e isolamento.
7. **`deny(unwrap_used, expect_used, unsafe_code)`.** Custo zero, resultado verificável.
8. **Índice parcial casado com o predicado real.** `WHERE archived_at IS NULL` em vez de índice sobre `archived` + outro idêntico.
9. **PRAGMAs em `after_connect`.** WAL, `foreign_keys=ON`, `busy_timeout`; um lugar só.
10. **Um `Config::from_env()` tipado.** Hoje `std::env` é lido em seis arquivos, com defaults silenciosos (`§05`).

## 4. O que não copiar

| Padrão | Custo observado |
|---|---|
| Cache de leitura global | 216 linhas, vazamento de tenant e lista incompleta (`§03`) |
| ACL por projeto além do RBAC | allowlist que nega o resto e uma segunda fonte de verdade para a mesma decisão (`§03`) |
| Três rate limiters em `HashMap<Vec<Instant>>` | sem poda, balde `"anonymous"` global; uma dependência resolve (`§03`) |
| `ErrorContext`/builders/barrels | ~180 linhas sem mudança de comportamento (`§01`) |
| Runner de migração com rollback | 253 linhas, `down()` sem chamador, backup silencioso (`§05`) |
| Três composes + três Dockerfiles | já divergiram; um compose + um Dockerfile bastam (`§05`) |
| OpenAPI manual | drift silencioso; 2 rotas faltando (`§04`) |
| Bulk sem limite/transação | 200 mesmo com tudo falhando (`§04`) |
| `username == "admin"` como autorização | quebra ao renomear ou criar outro admin (`§03`) |

## 5. Receita mínima para o meraki

### 5.1 Cinco módulos, não seis camadas

```text
src/
  main.rs        # config, pool, router, shutdown
  http/          # rotas + extractors + resposta
  domain/        # regras puras: permissions, transições, validação
  db/            # queries + row mapping
  error.rs       # AppError + IntoResponse
```

`core` só existe quando há regra de verdade (criar/mover task, bulk, dependências). Se a função só faz `check → insert`, ela pertence ao `db` com uma chamada de permissão.

### 5.2 Assinaturas que evitam repetição

```rust
// handler
async fn create_task(
    ctx: WorkspaceCtx,              // ws_id + user_id + role, extraídos uma vez
    State(app): State<AppState>,
    Json(req): Json<CreateTask>,
) -> Result<Json<ApiResponse<Task>>, AppError>;

// domínio puro
fn check(actor: &Actor, resource: Resource, action: Action) -> Result<(), Denied>;

// escrita atômica
async fn update_task(pool: &Pool, id: Uuid, patch: Patch, version: u64) -> Result<Task, AppError>;
```

O `WorkspaceCtx` elimina três coisas de uma vez: conversão de `String` para `Uuid`, `member_repo::list` repetido e checagem de membership esquecida.

### 5.3 Escrita atômica com versão

```sql
UPDATE tasks
   SET title = ?, status = ?, updated_at = ?,
       version = version + 1
 WHERE id = ? AND workspace_id = ? AND version = ?;
```

`rows_affected() == 0` → `409 conflict` com o estado atual. Atividade e índice de busca entram na mesma transação; notificação e webhook saem por um dispatcher depois do commit.

### 5.4 Erro único

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("not found")] NotFound,
    #[error("forbidden")] Forbidden,
    #[error("conflict")] Conflict { current: serde_json::Value },
    #[error("validation: {0}")] Validation(String),
    #[error(transparent)] Db(#[from] sqlx::Error),
}
```

`IntoResponse` mapeia para RFC 9457. `Db` vira 500 com `detail` genérico; o detalhe real vai para o log com `instance`.

### 5.5 Schema mínimo (o suficiente para o meraki)

```sql
create table task (
  id          text primary key,
  workspace_id text not null references workspace(id),
  project_id  text not null references project(id),
  title       text not null,
  status      text not null check (status in ('backlog','doing','done','cancelled')),
  assignee_id text references user(id),
  rank        text not null,
  version     integer not null default 1,
  created_at  text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at text
) strict;
create index task_list on task(workspace_id, status, rank) where archived_at is null;
```

Uma tabela de junção só quando a lista for filtrada/agregada (`task_label`), não para `tags` que só aparecem no card.

## 6. Checklist de proteção proporcional

- [ ] Cookie `HttpOnly`, `SameSite=Lax` ou `Strict`, `Secure` em produção.
- [ ] Token opaco de 32 bytes, guardado como SHA-256; nunca em claro no banco.
- [ ] Argon2id com parâmetros fixos; senha mínima de 12; erro sempre `401` genérico.
- [ ] `require_member(ws, user) -> Role` antes de qualquer query de recurso.
- [ ] Toda query com `workspace_id`; nenhum `GET /recurso/{id}` global sem escopo.
- [ ] `UPDATE`/`DELETE` com predicado de dono ou de workspace.
- [ ] Uma transação por escrita; atividade dentro dela.
- [ ] Upload: MIME sniff, allowlist sem SVG/HTML, nome gerado, `Content-Disposition: attachment`.
- [ ] Webhook: `workspace_id` no dispatch, HMAC com timestamp, HTTPS, sem IP privado.
- [ ] 5xx sem detalhe interno; 4xx em `WARN`, 5xx em `ERROR`.
- [ ] Seed de produção sem senha fixa; falhar o boot se segredo estiver vazio.

## 7. O que o projeto ensina sobre "simples"

- **Simples não é ter poucas linhas, é ter um caminho.** O erro é ter quatro jeitos de autorizar, não ter 12 mil linhas.
- **O banco é a melhor camada de validação que você já tem.** `STRICT`, `CHECK`, FK e índice parcial custam uma linha e eliminam uma classe de bug.
- **Transação é a feature mais barata e mais esquecida.** Uma chamada `begin()` evita histórico divergente; a ausência dela é invisível em teste feliz.
- **Cache antes de medir é dívida de correção.** Neste projeto não há medição que justifique o cache — e ele criou dois bugs de isolamento.
- **Documentação demais vira mentira.** O wiki descreve seis camadas e um `TestClient` que o código não tem. Quatro artefatos curtos e atualizados valem mais.

## 8. Nota de escopo

Nada aqui foi executado: a revisão é leitura de código e configuração. Os números vêm dos documentos `§01–§05`, que citam `caminho:linha`. Se o objetivo for corrigir o task-manager, a ordem de maior retorno é: autorização nas rotas → versão no `WHERE` → transação de escrita → cache por tenant ou remoção → timestamp único → OpenAPI derivado.
