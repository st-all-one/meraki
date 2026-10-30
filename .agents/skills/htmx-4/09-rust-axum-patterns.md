# htmx 4 — Padrões Rust/Axum para o Task Manager

## 1. Estrutura de Handler

Cada handler htmx segue este padrão:

```rust
// 1. Extrair parâmetros
// 2. Validar autenticação/autorização
// 3. Executar lógica de negócio
// 4. Renderizar template HTML
// 5. Aplicar headers htmx específicos
// 6. Retornar Response

async fn task_tree(
    Path(ws_id): Path<Uuid>,
    Extension(auth): Extension<AuthUser>,
    Extension(pool): Extension<SqlitePool>,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    // 1. Verificar acesso
    let member = validate_member_access(&pool, auth.user_id, ws_id).await?;

    // 2. Aplicar filtro
    let filter = params.get("filter").map(|s| s.as_str()).unwrap_or("all");
    let tasks = fetch_tasks(&pool, ws_id, filter).await;

    // 3. Renderizar HTML
    let html = render_task_tree(&tasks);

    // 4. Retornar
    Html(html)
}
```

## 2. Retornando Respostas com Headers htmx

```rust
use axum::{
    http::{header, StatusCode, HeaderMap, HeaderValue},
    response::{Html, IntoResponse, Response},
};

// Helper para respostas htmx
fn htmx_response(status: StatusCode, body: String) -> Response {
    (status, [("HX-Request", "true")], Html(body)).into_response()
}

fn htmx_redirect(path: &str) -> Response {
    (
        StatusCode::OK,
        [("HX-Redirect", path)],
        Html(""),
    ).into_response()
}

fn htmx_refresh() -> Response {
    (
        StatusCode::OK,
        [("HX-Refresh", "true")],
        Html(""),
    ).into_response()
}

fn htmx_push_url(url: &str, body: String) -> Response {
    (
        StatusCode::OK,
        [
            ("HX-Push-Url", url),
        ],
        Html(body),
    ).into_response()
}
```

## 3. Respostas Multi-Target com `<hx-partial>`

Padrão para ações que afetam múltiplas colunas:

```rust
struct MultiTarget {
    targets: Vec<(String, String)>,  // (selector, html)
}

impl IntoResponse for MultiTarget {
    fn into_response(self) -> Response {
        let body = self.targets.iter()
            .map(|(sel, html)| {
                format!(r#"<hx-partial hx-target="{}">{}</hx-partial>"#, sel, html)
            })
            .collect::<Vec<_>>()
            .join("\n");

        (StatusCode::OK, Html(body)).into_response()
    }
}

// Uso:
async fn task_toggle(
    Path((ws_id, task_id)): Path<(Uuid, Uuid)>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    toggle_task(&pool, task_id).await;

    MultiTarget {
        targets: vec![
            ("#task-tree".into(), render_task_tree(&pool, ws_id).await),
            ("#sprint-info".into(), render_sprint_info(&pool, ws_id).await),
        ],
    }
}
```

## 4. Extraindo o Elemento Alvo (hx-target)

Use o header `HX-Target` para comportamentos condicionais:

```rust
async fn generic_handler(
    headers: HeaderMap,
) -> impl IntoResponse {
    let target = headers
        .get("hx-target")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    match target {
        "task-tree" => handle_tree_update().await,
        "task-detail" => handle_detail_update().await,
        _ => handle_default().await,
    }
}
```

## 5. Detectando Requisições htmx

```rust
fn is_htmx_request(headers: &HeaderMap) -> bool {
    headers.get("hx-request")
        .and_then(|v| v.to_str().ok())
        .map(|v| v == "true")
        .unwrap_or(false)
}

fn hx_request_type(headers: &HeaderMap) -> &str {
    headers.get("hx-request-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("full")
}
```

## 6. Template Helper Functions

Funções que geram HTML fragmentado para serem reusadas entre handlers:

```rust
// Em www/src/routes/task.rs

/// Renderiza a árvore de tarefas como HTML
async fn render_task_tree(pool: &SqlitePool, ws_id: Uuid) -> String {
    let tasks = sqlx::query_as::<_, FlatTask>(
        r#"SELECT t.id, t.title, t.status, t.priority, t.position,
                  t.deadline, t.project_id, p.name as project_name,
                  (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.archived_at IS NULL) as sub_count
           FROM tasks t
           LEFT JOIN projects p ON p.id = t.project_id
           WHERE t.workspace_id = ?1
             AND t.archived_at IS NULL
             AND t.parent_id IS NULL
           ORDER BY COALESCE(p.position, 999), t.position"#
    )
    .bind(ws_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let mut html = String::from("<div class=\"space-y-0.5\">");
    for task in &tasks {
        html.push_str(&render_task_item(task));
    }
    html.push_str("</div>");
    html
}

/// Renderiza um item individual da árvore
fn render_task_item(task: &FlatTask) -> String {
    let priority_color = match task.priority.as_str() {
        "urgent" => "text-error",
        "high" => "text-warning",
        "medium" => "text-info",
        _ => "opacity-30",
    };

    format!(
        r#"<div class="task-item flex items-center gap-2 p-1 rounded
                    hover:bg-base-300 cursor-pointer text-sm"
              hx-get="/ws/{ws_id}/task?task_id={id}"
              hx-target="#task-detail"
              hx-swap="innerHTML">
            <span class="{priority_color}">●</span>
            <span class="flex-1 truncate">{title}</span>
            {deadline_badge}
            {sub_badge}
          </div>"#,
        ws_id = task.ws_id,
        id = task.id,
        priority_color = priority_color,
        title = escape_html(&task.title),
        deadline_badge = render_deadline_badge(task.deadline),
        sub_badge = render_sub_count(task.sub_count),
    )
}
```

## 7. Paginação com htmx (carregar mais)

```html
<button class="btn btn-ghost btn-sm w-full"
        hx-get="/ws/{{ ws_id }}/tasks?offset={{ offset }}&limit=50"
        hx-target="this"
        hx-swap="outerHTML"
        hx-trigger="click">
  Carregar mais...
</button>
```

```rust
async fn task_tree_paginated(
    Path(ws_id): Path<Uuid>,
    Query(params): Query<HashMap<String, String>>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let offset: i64 = params.get("offset").and_then(|s| s.parse().ok()).unwrap_or(0);
    let limit: i64 = 50;

    let tasks = sqlx::query_as::<_, FlatTask>(
        "SELECT * FROM tasks WHERE workspace_id = ?1
         ORDER BY position LIMIT ?2 OFFSET ?3"
    )
    .bind(ws_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let has_more = tasks.len() as i64 == limit;

    let mut html = String::new();
    for task in &tasks {
        html.push_str(&render_task_item(task));
    }

    if has_more {
        let next_offset = offset + limit;
        html.push_str(&format!(
            r#"<button class="btn btn-ghost btn-sm w-full"
                      hx-get="/ws/{}/tasks?offset={}&limit=50"
                      hx-target="this"
                      hx-swap="outerHTML">
                Carregar mais...
              </button>"#,
            ws_id, next_offset
        ));
    }

    Html(html)
}
```

## 8. Renderização Condicional (htmx vs Full Page)

Útil para fallback quando JavaScript está desabilitado:

```rust
async fn workspace_page(
    Path(ws_id): Path<Uuid>,
    headers: HeaderMap,
    Extension(pool): Extension<SqlitePool>,
    Extension(auth): Extension<AuthUser>,
) -> Response {
    if is_htmx_request(&headers) {
        // Requisição htmx: retorna só o fragmento
        let tree = render_task_tree(&pool, ws_id).await;

        MultiTarget {
            targets: vec![
                ("#task-tree".into(), tree),
            ],
        }.into_response()
    } else {
        // Requisição normal: retorna página completa
        let layout = WorkspaceLayout {
            ws_id,
            ws_name: get_workspace_name(&pool, ws_id).await,
            user_name: auth.user.username,
            font_size_scale: 1.0,
            program_version: env!("CARGO_PKG_VERSION").into(),
        };

        Html(layout.render().unwrap()).into_response()
    }
}
```

## 9. Error Handling no Axum

```rust
// Erro customizado
#[derive(Debug)]
enum HtmxError {
    NotFound(String),
    Validation(Vec<String>),
    Internal(anyhow::Error),
}

impl IntoResponse for HtmxError {
    fn into_response(self) -> Response {
        match self {
            HtmxError::NotFound(msg) => {
                (StatusCode::NOT_FOUND, Html(format!(
                    r#"<div class="alert alert-warning">{}</div>"#, msg
                ))).into_response()
            }
            HtmxError::Validation(errors) => {
                let html = errors.iter()
                    .map(|e| format!("<p>{}</p>", e))
                    .collect::<Vec<_>>()
                    .join("");
                (StatusCode::UNPROCESSABLE_ENTITY, Html(html)).into_response()
            }
            HtmxError::Internal(e) => {
                tracing::error!("Erro interno: {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, Html(
                    r#"<div class="alert alert-error">Erro interno do servidor</div>"#.into()
                )).into_response()
            }
        }
    }
}

impl From<sqlx::Error> for HtmxError {
    fn from(e: sqlx::Error) -> Self {
        HtmxError::Internal(e.into())
    }
}
```

## Próximo: [10-migration-from-v2.md](10-migration-from-v2.md) — Migrando do htmx 2 para 4
