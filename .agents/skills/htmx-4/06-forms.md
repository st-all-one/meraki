# htmx 4 — Formulários

## Princípios

Com htmx, formulários são enviados via AJAX e o servidor retorna HTML para substituir partes da página. Não há necessidade de redirect pós-POST (PRG pattern).

## 1. Formulário de Login

```html
<form method="POST" action="/login"
      hx-post="/login"
      hx-target="body"
      hx-swap="innerHTML"
      hx-push-url="true"
      class="card bg-base-100 w-96 shadow-xl p-6">
  <h1 class="text-xl font-bold mb-1">Task Manager</h1>
  <p class="text-xs opacity-60 mb-4">Faça login para continuar</p>
  <div id="login-error" class="hidden"></div>
  <input name="username" class="input input-bordered w-full mb-2"
         placeholder="Usuário" required>
  <input type="password" name="password" class="input input-bordered w-full mb-4"
         placeholder="Senha" required>
  <button class="btn btn-primary w-full">Entrar</button>
</form>
```

**Handler Rust:**

```rust
async fn login_post(
    Form(form): Form<LoginForm>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    // 1. Autenticar
    let user = authenticate(&pool, &form.username, &form.password).await;

    match user {
        Ok(user) => {
            // 2. Criar sessão (cookie)
            let session = create_session(&pool, user.id).await;

            // 3. Retornar redirect com cookie via HX-Redirect ou HX-Location
            (
                StatusCode::OK,
                [
                    (header::SET_COOKIE, &session.cookie),
                    ("HX-Redirect", &format!("/ws/{}", user.default_ws)),
                ],
                Html(""),
            ).into_response()
        }
        Err(_) => {
            // 4. Retornar erro inline
            let html = r#"
<div id="login-error" class="alert alert-error text-sm mb-3 py-2">
  Usuário ou senha inválidos
</div>
            "#;
            (StatusCode::UNPROCESSABLE_ENTITY, Html(html)).into_response()
        }
    }
}
```

**Diferença htmx 4:** Respostas de erro (`422`, `500`) agora são trocadas por padrão. O HTML de erro acima aparece no target do formulário automaticamente.

## 2. Formulário de criação de tarefa (modal)

```html
<form hx-post="/ws/{{ ws_id }}/tasks"
      hx-target="#task-tree"
      hx-swap="innerHTML"
      hx-on:htmx:after:swap="
        document.getElementById('task-modal')?.close();
        this.reset();
      ">

  <input name="title" class="input input-bordered w-full mb-2"
         placeholder="Título da tarefa" required autofocus>

  <select name="project_id" class="select select-bordered w-full mb-2">
    <option value="">Sem projeto</option>
    {% for project in projects %}
      <option value="{{ project.id }}">{{ project.name }}</option>
    {% endfor %}
  </select>

  <select name="priority" class="select select-bordered w-full mb-2">
    <option value="none">Nenhuma</option>
    <option value="low">Baixa</option>
    <option value="medium" selected>Média</option>
    <option value="high">Alta</option>
    <option value="urgent">Urgente</option>
  </select>

  <input name="deadline" type="date" class="input input-bordered w-full mb-4">

  <div id="form-errors" class="text-error text-sm mb-2"></div>

  <button type="submit" class="btn btn-primary w-full">Criar Tarefa</button>
</form>
```

### Validação no servidor

```rust
async fn task_create(
    Path(ws_id): Path<Uuid>,
    Extension(pool): Extension<SqlitePool>,
    Form(form): Form<CreateTaskForm>,
) -> impl IntoResponse {
    // Validação
    let mut errors = Vec::new();

    if form.title.trim().is_empty() {
        errors.push("Título é obrigatório");
    }
    if form.title.len() > 1000 {
        errors.push("Título deve ter no máximo 1000 caracteres");
    }

    if !errors.is_empty() {
        // htmx 4 vai trocar esse HTML no target (#form-errors)
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Html(format!(
                r#"<div id="form-errors">{}</div>"#,
                errors.iter().map(|e| format!("<p>{}</p>", e)).collect::<Vec<_>>().join("")
            )),
        ).into_response();
    }

    // Criação
    let task_id = Uuid::now_v7();
    sqlx::query(
        "INSERT INTO tasks (...) VALUES (...)"
    )
    .bind(task_id)
    // ...
    .execute(&pool)
    .await
    .ok();

    // Usando hx-status:422 para redirecionar erros de validação
    // para #form-errors, e sucesso para #task-tree
    let tree = render_task_tree(&pool, ws_id).await;

    // Resposta com múltiplos targets
    let html = format!(
        r#"<hx-partial hx-target="#task-tree">{}</hx-partial>
           <hx-partial hx-target="#form-errors"><!-- limpa erros --></hx-partial>"#,
        tree
    );

    (StatusCode::OK, Html(html)).into_response()
}
```

## 3. hx-status: tratamento por código de status

No htmx 4, você pode configurar comportamento diferente por status HTTP:

```html
<form hx-post="/ws/{{ ws_id }}/tasks"
      hx-target="#task-tree"
      hx-swap="innerHTML"
      hx-status:422="swap:innerHTML target:#form-errors"
      hx-status:500="swap:none"
      hx-status:503="swap:innerHTML target:#form-errors">

  <!-- fields -->
  <div id="form-errors"></div>
</form>
```

Isso significa:
- **200**: troca em `#task-tree` (padrão)
- **422**: troca em `#form-errors` (erros de validação)
- **500**: não troca nada
- **503**: troca em `#form-errors` (serviço indisponível)

## 4. Formulário de update inline (edição direta)

Para campos editáveis inline no detalhe da tarefa:

```html
<!-- hx-swap="none" → sem troca de DOM, apenas feedback -->
<input name="title"
       class="input input-bordered w-full"
       value="{{ task.title }}"
       hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/update"
       hx-trigger="change"
       hx-swap="none"
       hx-on:htmx:after:request="
         if (event.detail.successful) {
           this.classList.add('input-success');
           setTimeout(() => this.classList.remove('input-success'), 2000);
         }
       ">

<!-- Textarea -->
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

### hx-trigger para formulários

| Trigger | Quando usar |
|---------|-------------|
| `change` | Input, select, checkbox — dispara ao perder foco com valor alterado |
| `blur` | Textarea — dispara ao perder foco (mesmo sem alteração) |
| `input delay:500ms` | Campo de busca — debounce de 500ms |
| `submit` | `<form>` — submissão padrão |
| `load` | Carregar conteúdo ao montar |
| `click` | Botões e divs |

## 5. Formulários com `hx-validate`

No htmx 4, o atributo `hx-validate` controla a validação nativa do browser:

```html
<form hx-post="/ws/{{ ws_id }}/tasks"
      hx-validate="true">

  <input name="title" required minlength="3" maxlength="1000"
         class="input input-bordered w-full"
         placeholder="Título da tarefa">

  <input name="deadline" type="date"
         class="input input-bordered w-full">

  <button type="submit">Criar</button>
</form>
```

## 6. hx-delete e formulários (mudança no htmx 4)

No htmx 4, `hx-delete` **não** inclui dados do formulário por padrão (assim como `hx-get`). Se precisar incluir:

```html
<form id="task-form">
  <input name="reason" type="hidden" value="duplicate">
</form>

<button hx-delete="/ws/{{ ws_id }}/tasks/{{ task.id }}"
        hx-include="closest form">
  Remover
</button>
```

## Próximo: [07-error-handling.md](07-error-handling.md) — Tratamento de erros
