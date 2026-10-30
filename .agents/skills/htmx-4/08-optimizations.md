# htmx 4 — Otimizações e UX

## 1. Indicadores de Carregamento

O htmx 4 mantém o sistema de classes CSS `htmx-request` e `htmx-indicator`:

```html
<button class="btn btn-primary"
        hx-post="/ws/{{ ws_id }}/tasks"
        hx-target="#task-tree">
  <span class="inline-block hx-request:hidden">Criar Tarefa</span>
  <span class="loading loading-spinner loading-xs hidden hx-request:inline-block"></span>
</button>
```

Com hx-indicator em elemento pai:

```html
<div hx-indicator="#tree-loader">
  <div id="task-tree"
       hx-get="/ws/{{ ws_id }}/tasks"
       hx-trigger="load">
    <span class="loading loading-spinner loading-xs"></span>
  </div>
  <span id="tree-loader" class="htmx-indicator">
    <span class="loading loading-spinner loading-sm"></span>
  </span>
</div>
```

No htmx 4, você pode usar `hx-disable` (antigo `hx-disabled-elt`) para desabilitar elementos durante a requisição:

```html
<button class="btn btn-primary"
        hx-post="/ws/{{ ws_id }}/tasks"
        hx-target="#task-tree"
        hx-disable="this">
  Criar Tarefa
</button>
```

## 2. Morph Swaps (innerMorph / outerMorph)

Para preservar estado de elementos durante swaps (como foco, scroll, vídeos), use morph swaps:

```html
<!-- innerMorph: preserva o conteúdo interno que não mudou -->
<div id="task-tree"
     hx-get="/ws/{{ ws_id }}/tasks?filter=today"
     hx-target="this"
     hx-swap="innerMorph">
</div>

<!-- outerMorph: preserva o próprio elemento -->
<div id="task-detail"
     hx-get="/ws/{{ ws_id }}/task?task_id={{ id }}"
     hx-target="this"
     hx-swap="outerMorph">
</div>
```

Isso é útil para a **árvore de tarefas**: se uma única tarefa muda de status, o morph swap atualiza apenas o item modificado, mantendo o scroll e outros estados.

### hx-preserve

Para elementos que nunca devem ser substituídos:

```html
<div id="player" hx-preserve="true">
  <audio src="podcast.mp3" autoplay></audio>
</div>
```

### hx-morph-skip

Para sub-árvores que não devem ser tocadas pelo morph:

```html
<div class="alpine-widget" hx-morph-skip>
  <!-- Alpine.js mantém seu estado interno -->
</div>
```

## 3. Polling (atualização periódica)

Para atualizar a árvore de tarefas automaticamente:

```html
<div id="task-tree"
     hx-get="/ws/{{ ws_id }}/tasks"
     hx-trigger="every 30s"
     hx-swap="innerMorph">
</div>
```

Para polling controlado (self-replacing):

```html
<!-- A própria resposta substitui o elemento -->
<div id="live-status"
     hx-get="/ws/{{ ws_id }}/tasks/recent"
     hx-trigger="load delay:5s"
     hx-swap="outerHTML">
  Última atualização: {{ now }}
</div>
```

Se o servidor retornar o mesmo div com `hx-trigger="load delay:5s"`, o polling continua. Para parar, retorne um div sem trigger.

## 4. Lazy Loading com `hx-trigger="revealed"`

Carregue conteúdo apenas quando ele aparecer na tela:

```html
<div hx-get="/ws/{{ ws_id }}/tasks/archive"
     hx-trigger="revealed"
     hx-target="this"
     hx-swap="outerHTML">
  <span class="loading loading-spinner loading-xs"></span>
</div>
```

## 5. View Transitions (animação entre páginas/estados)

Ative globalmente:

```html
<meta name="htmx-config" content='{"transitions":true}'>
```

Ou por swap:

```html
<div hx-get="/ws/{{ ws_id }}/tasks"
     hx-target="#task-tree"
     hx-swap="innerHTML transition:true">
</div>
```

CSS personalizado:

```css
/* Workspace layout */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
}

/* Transição para task detail */
::view-transition-old(task-detail) {
  animation: 200ms ease-out both fade-out;
}
::view-transition-new(task-detail) {
  animation: 200ms ease-in both fade-in;
}
```

## 6. hx-boost (links behavem como SPA)

Para navegação entre workspaces sem reload completo:

```html
<nav>
  <a hx-boost="true"
     hx-target="body"
     hx-select="#layout-grid"
     href="/ws/{{ other_ws.id }}">
    {{ other_ws.name }}
  </a>
</nav>
```

`hx-boost` faz com que o link use AJAX. `hx-select="#layout-grid"` extrai só o grid, mantendo scripts e estilos.

## 7. Debounce e Throttle em Busca

```html
<input type="text"
       name="q"
       placeholder="Buscar tarefas..."
       hx-get="/search"
       hx-trigger="input delay:500ms, keyup[key=='Enter']"
       hx-target="#search-results"
       hx-swap="innerHTML">
```

- `input delay:500ms` — espera 500ms após o usuário parar de digitar
- `keyup[key=='Enter']` — também dispara ao pressionar Enter

## 8. hx-sync para evitar requisições duplicadas

```html
<form hx-post="/ws/{{ ws_id }}/tasks"
      hx-sync="this:replace">
  <!-- Apenas uma requisição por vez -->
</form>

<button hx-get="/ws/{{ ws_id }}/tasks"
        hx-sync="closest div:drop">
  <!-- Dropa requisições se uma já estiver em andamento -->
</button>
```

Modos:

| Modo | Comportamento |
|------|---------------|
| `drop` | Ignora novo evento se requisição ativa |
| `replace` | Cancela requisição ativa, inicia nova |
| `queue` | Enfileira (com `first`/`last`/`all`) |

## 9. Estratégia de Cache no Servidor

Requisitado htmx enviará o header `HX-Current-URL`. Server pode usar para cache condicional:

```rust
async fn task_tree(
    Path(ws_id): Path<Uuid>,
    headers: HeaderMap,
    Extension(pool): Extension<SqlitePool>,
    Extension(caches): Extension<Caches>,
) -> impl IntoResponse {
    let etag = format!("tasks-{}", get_mtime(&pool, ws_id).await);

    if headers.get("if-none-match")
        .and_then(|v| v.to_str().ok())
        == Some(&etag)
    {
        return StatusCode::NOT_MODIFIED.into_response();
    }

    let tree = render_task_tree(&pool, ws_id).await;
    (
        StatusCode::OK,
        [("ETag", &etag)],
        Html(tree),
    ).into_response()
}
```

## Próximo: [09-rust-axum-patterns.md](09-rust-axum-patterns.md) — Padrões Rust/Axum
