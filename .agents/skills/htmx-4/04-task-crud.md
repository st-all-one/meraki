# htmx 4 — CRUD de Tarefas

## Create: Criar nova tarefa

### Modal de criação (disparado da coluna E)

```html
<!-- Botão "Nova Tarefa" -->
<button class="btn btn-primary btn-sm"
        hx-get="/ws/{{ ws_id }}/task-form"
        hx-target="#modal-container"
        hx-swap="innerHTML"
        hx-trigger="click"
        hx-on:htmx:after:swap="document.getElementById('task-modal')?.showModal()">
  + Nova Tarefa
</button>

<!-- Container do modal -->
<div id="modal-container"></div>
```

### Handler do formulário

```rust
async fn task_form(
    Path(ws_id): Path<Uuid>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let projects = sqlx::query_as::<_, FlatProject>(
        "SELECT id, name FROM projects WHERE workspace_id = ?1 AND archived_at IS NULL ORDER BY name"
    )
    .bind(ws_id)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let html = format!(r#"
<dialog id="task-modal" class="modal modal-open">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <h3 class="font-bold text-lg mb-4">Nova Tarefa</h3>
    <form hx-post="/ws/{ws_id}/tasks"
          hx-target="#task-tree"
          hx-swap="innerHTML"
          hx-on:htmx:after:swap="document.getElementById('task-modal')?.close()">

      <input name="title" class="input input-bordered w-full mb-2"
             placeholder="Título da tarefa" required autofocus>

      <select name="project_id" class="select select-bordered w-full mb-2">
        <option value="">Sem projeto</option>
        {}
      </select>

      <select name="priority" class="select select-bordered w-full mb-2">
        <option value="none">Prioridade: Nenhuma</option>
        <option value="low">Prioridade: Baixa</option>
        <option value="medium" selected>Prioridade: Média</option>
        <option value="high">Prioridade: Alta</option>
        <option value="urgent">Prioridade: Urgente</option>
      </select>

      <input name="deadline" type="date" class="input input-bordered w-full mb-4">

      <button type="submit" class="btn btn-primary w-full">Criar Tarefa</button>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>fechar</button>
  </form>
</dialog>
"#,
        projects.iter().map(|p| format!(
            r#"<option value="{}">{}</option>"#, p.id, p.name
        )).collect::<Vec<_>>().join("\n")
    );

    Html(html)
}
```

### Handler de criação

```rust
async fn task_create(
    Path(ws_id): Path<Uuid>,
    Extension(pool): Extension<SqlitePool>,
    Form(form): Form<CreateTaskForm>,
) -> impl IntoResponse {
    let task_id = Uuid::now_v7();

    sqlx::query(
        "INSERT INTO tasks (id, workspace_id, project_id, title, priority, deadline, status, position)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending',
           (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE workspace_id = ?2))"
    )
    .bind(task_id)
    .bind(ws_id)
    .bind(form.project_id)
    .bind(form.title.trim())
    .bind(form.priority)
    .bind(form.deadline)
    .execute(&pool)
    .await
    .ok();

    // Retorna a árvore atualizada
    let tree = render_task_tree(&pool, ws_id).await;
    Html(tree)
}
```

## Read: Carregar detalhe da tarefa

```html
<!-- Na árvore → substitui #task-detail na coluna central -->
<div class="task-item"
     hx-get="/ws/{{ ws_id }}/task?task_id={{ task.id }}"
     hx-target="#task-detail"
     hx-swap="innerHTML"
     hx-trigger="click">
  {{ task.title }}
</div>
```

```rust
async fn task_detail(
    Path(ws_id): Path<Uuid>,
    Query(params): Query<HashMap<String, String>>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    let task_id = params.get("task_id")
        .and_then(|s| Uuid::parse_str(s).ok());

    let Some(id) = task_id else {
        return Html(render_empty_detail());
    };

    let task = sqlx::query_as::<_, FlatTaskDetail>(
        "SELECT * FROM tasks WHERE id = ?1 AND workspace_id = ?2"
    )
    .bind(id)
    .bind(ws_id)
    .fetch_optional(&pool)
    .await;

    match task {
        Ok(Some(t)) => Html(render_task_detail_html(&t)),
        Ok(None) => Html("<p class='opacity-50'>Tarefa não encontrada</p>".into()),
        Err(_) => Html("<p class='text-error'>Erro ao carregar</p>".into()),
    }
}
```

## Update: Editar tarefa inline (sem modal)

O detalhe da tarefa (coluna M) contém campos editáveis que disparam `hx-post` individualmente:

```html
<!-- Título editável no detalhe -->
<div class="form-control">
  <input name="title"
         class="input input-bordered w-full"
         value="{{ task.title }}"
         hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/update"
         hx-trigger="change"
         hx-swap="none"
         hx-on:htmx:after:request="
           this.classList.add('input-success');
           setTimeout(() => this.classList.remove('input-success'), 2000)
         ">
</div>

<!-- Status (dropdown) -->
<select name="status"
        class="select select-bordered w-full"
        hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/update"
        hx-trigger="change"
        hx-target="#task-tree"
        hx-swap="innerHTML">
  <option value="pending" {% if task.status == "pending" %}selected{% endif %}>A fazer</option>
  <option value="in_progress" {% if task.status == "in_progress" %}selected{% endif %}>Em andamento</option>
  <option value="done" {% if task.status == "done" %}selected{% endif %}>Concluído</option>
  <option value="waiting" {% if task.status == "waiting" %}selected{% endif %}>Esperando</option>
  <option value="canceled" {% if task.status == "canceled" %}selected{% endif %}>Cancelado</option>
</select>

<!-- Prioridade -->
<select name="priority"
        class="select select-bordered w-full"
        hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/update"
        hx-trigger="change"
        hx-target="#task-tree"
        hx-swap="innerHTML">
  <option value="none" {% if task.priority == "none" %}selected{% endif %}>Nenhuma</option>
  <option value="low" {% if task.priority == "low" %}selected{% endif %}>Baixa</option>
  <option value="medium" {% if task.priority == "medium" %}selected{% endif %}>Média</option>
  <option value="high" {% if task.priority == "high" %}selected{% endif %}>Alta</option>
  <option value="urgent" {% if task.priority == "urgent" %}selected{% endif %}>Urgente</option>
</select>

<!-- Descrição (textarea) -->
<textarea name="description"
          class="textarea textarea-bordered w-full"
          hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/update"
          hx-trigger="blur"
          hx-swap="none"
          hx-on:htmx:after:request="
            this.classList.add('textarea-success');
            setTimeout(() => this.classList.remove('textarea-success'), 2000)
          ">{{ task.description }}</textarea>
```

### Handler de update parcial

```rust
#[derive(Deserialize)]
struct UpdateTaskForm {
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<String>,
    deadline: Option<String>,
    content_notes: Option<String>,
}

async fn task_update(
    Path((ws_id, task_id)): Path<(Uuid, Uuid)>,
    Extension(pool): Extension<SqlitePool>,
    Form(form): Form<UpdateTaskForm>,
) -> impl IntoResponse {
    // Constrói SET dinâmico — só atualiza campos presentes
    let mut sets = Vec::new();
    let mut idx = 2u32;

    if let Some(ref title) = form.title {
        sets.push(format!("title = ${}", idx));
        idx += 1;
    }
    if let Some(ref status) = form.status {
        sets.push(format!("status = ${}", idx));
        idx += 1;
    }
    // ... etc

    if !sets.is_empty() {
        sets.push("updated_at = datetime('now')".into());
        let sql = format!(
            "UPDATE tasks SET {} WHERE id = $1 AND workspace_id = $2",
            sets.join(", ")
        );
        // Executa usando sqlx (com bindings posicionais)
    }

    // Se o status mudou, atualiza também a árvore e sprint
    if form.status.is_some() {
        let tree = render_task_tree(&pool, ws_id).await;
        let sprint = render_sprint_info(&pool, ws_id).await;
        return Html(format!(
            r#"<hx-partial hx-target="#task-tree">{}</hx-partial>
               <hx-partial hx-target="#sprint-info">{}</hx-partial>"#,
            tree, sprint
        ));
    }

    // Se só título/descrição, não precisa recarregar
    Html("".into())
}
```

## Delete: Arquivar/remover tarefa

```html
<button class="btn btn-error btn-outline btn-sm"
        hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/archive"
        hx-target="#task-tree"
        hx-swap="innerHTML"
        hx-confirm="Tem certeza que deseja arquivar esta tarefa?"
        hx-on:htmx:after:swap="
          document.querySelector('#task-detail').innerHTML = '<div class=\"flex items-center justify-center h-64 opacity-30 text-sm\">Selecione uma tarefa</div>'
        ">
  Arquivar
</div>
```

```rust
async fn task_archive(
    Path((ws_id, task_id)): Path<(Uuid, Uuid)>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    sqlx::query(
        "UPDATE tasks SET archived_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ?1 AND workspace_id = ?2"
    )
    .bind(task_id)
    .bind(ws_id)
    .execute(&pool)
    .await
    .ok();

    let tree = render_task_tree(&pool, ws_id).await;
    Html(tree)
}
```

## Resumo dos padrões CRUD

| Operação | Trigger | Target | Swap | Resposta |
|----------|---------|--------|------|----------|
| Criar | submit do form | `#task-tree` | `innerHTML` | Árvore atualizada |
| Ler (selecionar) | click | `#task-detail` | `innerHTML` | HTML do detalhe |
| Atualizar (título) | change | `none` | — | Feedback visual |
| Atualizar (status) | change | `#task-tree` + `#sprint-info` | `innerHTML` | Múltiplos `<hx-partial>` |
| Deletar | click | `#task-tree` | `innerHTML` | Árvore atualizada |

## Próximo: [05-multi-target.md](05-multi-target.md) — Atualizações multi-alvo
