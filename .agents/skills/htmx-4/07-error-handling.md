# htmx 4 — Tratamento de Erros

## Mudança Crítica no htmx 4

No htmx 2, respostas `4xx` e `5xx` eram ignoradas (não trocavam o DOM). No **htmx 4, toda resposta é trocada** (exceto `204` e `304`).

Isso significa que:
- Se o servidor retornar `422` com HTML de erro, esse HTML **vai aparecer no target**
- Se o servidor retornar `500` com HTML de fallback, **ele vai substituir o target**

## 1. Estratégia de Erro para o Task Manager

### Erros de validação (422)

Retorne HTML para um target específico de erros:

```html
<!-- Gatilho com hx-status -->
<form hx-post="/ws/{{ ws_id }}/tasks"
      hx-target="#task-tree"
      hx-status:422="swap:innerHTML target:#form-errors">

  <div id="form-errors" class="text-error text-sm mb-2"></div>
  <!-- campos -->
</form>
```

```rust
// Handler: erro de validação
if title.trim().is_empty() {
    let errors = r#"<div id="form-errors" class="alert alert-error">
      <p>O título é obrigatório</p>
    </div>"#;
    return (
        StatusCode::UNPROCESSABLE_ENTITY,
        [("HX-Retarget", "#form-errors")],
        Html(errors),
    ).into_response();
}
```

### Erro de servidor (500)

Para erros inesperados, use `hx-status:5xx` para redirecionar o swap:

```html
<button hx-get="/ws/{{ ws_id }}/tasks"
        hx-target="#task-tree"
        hx-status:5xx="swap:innerHTML target:#global-error">
  Carregar Tarefas
</button>
<div id="global-error" class="toast toast-top toast-end hidden"></div>
```

```rust
// Handler: erro interno
async fn task_tree(/* ... */) -> impl IntoResponse {
    match query_tasks().await {
        Ok(tasks) => Html(render_tree(tasks)),
        Err(e) => {
            tracing::error!("Erro ao carregar tarefas: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Html(r#"<div class="alert alert-error">
                  Erro ao carregar tarefas. Tente novamente.
                </div>"#),
            ).into_response()
        }
    }
}
```

### Erro não encontrado (404)

```html
<div hx-get="/ws/{{ ws_id }}/task?task_id=invalid"
     hx-target="#task-detail"
     hx-status:404="swap:innerHTML target:#task-detail">
  Carregar
</div>
```

```rust
async fn task_detail(/* ... */) -> impl IntoResponse {
    match fetch_task(id).await {
        Ok(Some(t)) => Html(render_detail(&t)),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Html(r#"<div class="flex items-center justify-center h-64 opacity-30">
              Tarefa não encontrada
            </div>"#),
        ).into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Html(r#"<div class="alert alert-error">Erro interno</div>"#),
        ).into_response(),
    }
}
```

## 2. Usando `hx-status` para controle granular

```html
<button hx-post="/ws/{{ ws_id }}/tasks"
        hx-target="#task-tree"
        hx-status:200="swap:innerHTML target:#task-tree"
        hx-status:422="swap:innerHTML target:#form-errors"
        hx-status:500="swap:none push:false"
        hx-status:503="swap:innerHTML target:#form-errors">
  Salvar
</button>
```

O formato `hx-status:XXX` aceita:
- `swap:` — estilo de swap
- `target:` — seletor CSS para redirecionar
- `select:` — parte da resposta para extrair
- `push:` — fazer push da URL
- `replace:` — substituir URL
- `transition:` — usar View Transition

## 3. Usando headers de resposta para controle

### HX-Retarget

Redireciona o swap para outro elemento:

```rust
// No handler Rust
(
    StatusCode::UNPROCESSABLE_ENTITY,
    [
        ("HX-Retarget", "#form-errors"),
    ],
    Html(error_html),
)
```

### HX-Reswap

Altera o estilo de swap para esta resposta específica:

```rust
(
    StatusCode::OK,
    [("HX-Reswap", "innerHTML")],
    Html(html),
)
```

### HX-Reselect

Extrai uma parte específica da resposta:

```rust
(
    StatusCode::OK,
    [
        ("HX-Reselect", "#task-content"),
    ],
    Html(full_page_html),  // Só #task-content será extraído
)
```

## 4. Notificações Toast via OOB

Para mostrar erros sem atrapalhar o fluxo, use OOB:

```rust
// Handler com toast de erro
async fn task_create(/* ... */) -> impl IntoResponse {
    if let Err(e) = create_task().await {
        return Html(format!(
            r#"<hx-partial hx-target="#task-tree">{}</hx-partial>
               <hx-partial hx-target="#toast-container" hx-swap="beforeend">
                 <div class="alert alert-error shadow-lg toast-animate">
                   <span>Erro ao criar tarefa: {}</span>
                 </div>
               </hx-partial>"#,
            tree_html, e
        ));
    }
    // ...
}
```

```html
<!-- Container de toasts fixo no layout -->
<div id="toast-container"
     class="toast toast-top toast-end z-50 pointer-events-none">
</div>

<style>
  .toast-animate {
    animation: slideIn 0.3s ease-out, fadeOut 0.3s 4.7s ease-in forwards;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
</style>
```

## 5. Eventos de erro para depuração

```javascript
// No app.js — log global de erros htmx
document.addEventListener('htmx:error', (evt) => {
    console.error('[htmx] Erro:', evt.detail.error);
});

document.addEventListener('htmx:response:error', (evt) => {
    console.warn('[htmx] Resposta de erro:', {
        status: evt.detail.ctx.response.status,
        target: evt.detail.ctx.target,
    });
});

document.addEventListener('htmx:before:swap', (evt) => {
    // Pode cancelar swaps de erro específicos
    if (evt.detail.ctx.response.status === 500) {
        evt.preventDefault();
        showToast('Erro no servidor. Tente novamente.');
    }
});
```

## 6. Configuração global para ignorar 4xx/5xx (compatibilidade)

Se quiser o comportamento do htmx 2 (não trocar erros):

```html
<script>
  htmx.config.noSwap = [204, 304, '4xx', '5xx'];
</script>
```

Mas o **recomendado** é usar `hx-status` por elemento para controle fino.

## Próximo: [08-optimizations.md](08-optimizations.md) — Otimizações
