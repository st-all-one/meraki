# htmx 4 — Layout TickTick de 3 Colunas

O layout do Task Manager (similar ao TickTick) usa três colunas que se comunicam via htmx 4. Cada coluna é uma zona de troca independente.

## Estrutura do Grid

```html
<!-- workspace/layout.html -->
<div id="layout-grid">
  <!-- COLUNA E — Sidebar (árvore de tarefas) -->
  <div id="col-left">
    <div id="task-tree"
         hx-get="/ws/{{ ws_id }}/tasks"
         hx-trigger="load"
         hx-swap="innerHTML">
      <!-- Conteúdo carregado via htmx -->
    </div>
  </div>

  <!-- COLUNA M — Centro (detalhe da tarefa) -->
  <div id="col-center">
    <div id="task-detail"
         hx-get="/ws/{{ ws_id }}/task?task_id={{ selected_id }}"
         hx-trigger="load"
         hx-swap="innerHTML">
      <!-- Conteúdo carregado via htmx -->
    </div>
  </div>

  <!-- COLUNA D — Direita (metadados) -->
  <div id="col-right">
    <div id="sprint-info"
         hx-get="/ws/{{ ws_id }}/sprint"
         hx-trigger="load"
         hx-swap="innerHTML">
    </div>
    <div id="time-entries"
         hx-get="/ws/{{ ws_id }}/time-entries"
         hx-trigger="load">
    </div>
  </div>
</div>
```

## Fluxo de Comunicação entre Colunas

Quando uma ação acontece em uma coluna, ela pode disparar atualizações em múltiplas colunas:

```
Ação do usuário (coluna E)
       │
       ▼
  POST /ws/{ws_id}/tasks/{id}/toggle
       │
       ├──▶ Resposta principal: substitui #task-tree (coluna E)
       ├──▶ <hx-partial hx-target="#sprint-info">  (coluna D)
       └──▶ <hx-partial hx-target="#time-entries">  (coluna D)
```

## Exemplo 1: Selecionar tarefa na árvore

Quando o usuário clica em uma tarefa na coluna E, a coluna M deve mostrar o detalhe:

```html
<!-- Na árvore de tarefas (coluna E) -->
<div class="task-item"
     hx-get="/ws/{{ ws_id }}/task?task_id={{ task.id }}"
     hx-target="#task-detail"
     hx-swap="innerHTML"
     hx-trigger="click"
     hx-on:htmx:after:swap="
       document.querySelector('#task-detail .task-title')?.focus()
     ">
  <span>{{ task.title }}</span>
</div>
```

**Handler Rust:**

```rust
async fn task_detail(
    Path(ws_id): Path<Uuid>,
    Query(params): Query<HashMap<String, String>>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let task_id = params.get("task_id").and_then(|s| Uuid::parse_str(s).ok());

    match task_id {
        Some(id) => {
            let task = sqlx::query_as::<_, FlatTaskDetail>(
                "SELECT * FROM tasks WHERE id = ?1 AND workspace_id = ?2"
            )
            .bind(id)
            .bind(ws_id)
            .fetch_optional(&pool)
            .await;

            match task {
                Ok(Some(t)) => Html(render_task_detail(&t)),
                Ok(None) => Html("<p class='opacity-50'>Tarefa não encontrada</p>".into()),
                Err(_) => Html("<p class='text-error'>Erro ao carregar tarefa</p>".into()),
            }
        }
        None => Html(render_empty_detail()),
    }
}
```

## Exemplo 2: Toggle (check/uncheck) com atualização multi-coluna

Quando o usuário marca uma tarefa como concluída:
- A árvore (coluna E) deve refletir a mudança
- O contador de sprint (coluna D) deve atualizar

```html
<!-- Checkbox na árvore de tarefas -->
<input type="checkbox"
       class="checkbox checkbox-xs"
       {% if task.done %}checked{% endif %}
       hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/toggle"
       hx-target="#task-tree"
       hx-swap="innerHTML"
       hx-trigger="click">
```

**Handler Rust** (retorna fragmento multi-target usando `hx-partial`):

```rust
async fn task_toggle(
    Path((ws_id, task_id)): Path<(Uuid, Uuid)>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    // Alterna status
    sqlx::query(
        "UPDATE tasks SET
           status = CASE WHEN status = 'done' THEN 'pending' ELSE 'done' END,
           closed_at = CASE WHEN status = 'pending' THEN datetime('now') ELSE NULL END,
           updated_at = datetime('now')
         WHERE id = ?1 AND workspace_id = ?2"
    )
    .bind(task_id)
    .bind(ws_id)
    .execute(&pool)
    .await
    .ok();

    // Retorna múltiplos fragmentos
    let task_tree = render_task_tree(&pool, ws_id).await;
    let sprint_info = render_sprint_info(&pool, ws_id).await;

    Html(format!(
        r#"<hx-partial hx-target="#task-tree">{}</hx-partial>
           <hx-partial hx-target="#sprint-info">{}</hx-partial>"#,
        task_tree, sprint_info
    ))
}
```

## Exemplo 3: Filtrar tarefas (Hoje/Amanhã/Semana/Todas)

Os filtros na coluna E recarregam apenas a árvore:

```html
<div class="flex gap-1 flex-wrap">
  <button class="btn btn-xs"
          hx-get="/ws/{{ ws_id }}/tasks?filter=today"
          hx-target="#task-tree"
          hx-swap="innerHTML"
          hx-trigger="click">
    Hoje
  </button>
  <button class="btn btn-xs"
          hx-get="/ws/{{ ws_id }}/tasks?filter=tomorrow"
          hx-target="#task-tree"
          hx-swap="innerHTML"
          hx-trigger="click">
    Amanhã
  </button>
  <button class="btn btn-xs"
          hx-get="/ws/{{ ws_id }}/tasks?filter=week"
          hx-target="#task-tree"
          hx-swap="innerHTML"
          hx-trigger="click">
    Semana
  </button>
</div>
```

## Estratégia de Carregamento (Lazy Loading)

```
Página carrega (workspace/layout.html)
  │
  ├──▶ hx-trigger="load" em #task-tree → GET /ws/{id}/tasks
  ├──▶ hx-trigger="load" em #task-detail → GET /ws/{id}/task?task_id=
  ├──▶ hx-trigger="load" em #week-calendar → GET /ws/{id}/week-calendar
  ├──▶ hx-trigger="load" em #tag-filter → GET /ws/{id}/tags
  ├──▶ hx-trigger="load" em #sprint-info → GET /ws/{id}/sprint
  └──▶ hx-trigger="load" em #time-entries → GET /ws/{id}/time-entries
```

Isso significa que o layout inicial é leve e cada seção carrega de forma independente.

## Herança Explícita com `:inherited` (htmx 4)

No htmx 4, atributos não herdam automaticamente. Use `:inherited`:

```html
<!-- htmx 2: implícito -->
<div hx-target="#task-detail">
  <button hx-get="/task/1">Carregar</button>
</div>

<!-- htmx 4: explícito -->
<div hx-target:inherited="#task-detail">
  <button hx-get="/task/1">Carregar</button>
</div>
```

No Task Manager, isso é útil para o container de cada projeto na árvore:

```html
<div hx-target:inherited="#task-detail"
     hx-swap:inherited="innerHTML">
  <!-- Todos os filhos herdam target e swap -->
  {% for task in tasks %}
    <div hx-get="/ws/{{ ws_id }}/task?task_id={{ task.id }}">
      {{ task.title }}
    </div>
  {% endfor %}
</div>
```

## Próximo: [04-task-crud.md](04-task-crud.md) — CRUD de tarefas com htmx 4
