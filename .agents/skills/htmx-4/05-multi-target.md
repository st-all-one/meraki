# htmx 4 — Atualizações Multi-Alvo

No Task Manager, uma única ação do usuário frequentemente precisa atualizar **múltiplas colunas**. htmx 4 oferece duas formas de fazer isso:

| Técnica | Quando usar | Vantagem |
|---------|-------------|----------|
| `<hx-partial>` | Controle explícito de target + swap por fragmento | Flexível, sem depender de `id` |
| `hx-swap-oob` | Elementos identificados por `id` no DOM | Simples, conciso |

## 1. Usando `<hx-partial>` (htmx 4)

O elemento `<hx-partial>` permite que a resposta do servidor especifique **vários destinos** em um único response.

### Exemplo: Marcar tarefa como concluída

Quando o usuário marca uma tarefa como `done`, precisamos:
1. Atualizar a **árvore** (coluna E) — tarefa some da lista `pending`
2. Atualizar o **sprint info** (coluna D) — contador de conclusão muda
3. Limpar o **detalhe** (coluna M) — se a tarefa estava sendo visualizada

**Resposta do servidor:**

```html
<!-- Atualiza a árvore de tarefas -->
<hx-partial hx-target="#task-tree">
  <div class="space-y-0.5">
    <!-- Árvore completa renderizada novamente -->
    <div class="project-group">
      <div class="task-item">...</div>
    </div>
  </div>
</hx-partial>

<!-- Atualiza o sprint info -->
<hx-partial hx-target="#sprint-info">
  <div class="stats">
    <div class="stat">
      <span class="stat-title">Concluídas</span>
      <span class="stat-value">5/12</span>
    </div>
  </div>
</hx-partial>

<!-- Caso a tarefa concluída estivesse visível, limpa o detalhe -->
<hx-partial hx-target="#task-detail">
  <div class="flex items-center justify-center h-64 opacity-30 text-sm">
    Selecione uma tarefa na árvore ao lado
  </div>
</hx-partial>
```

**Handler Rust:**

```rust
async fn task_toggle(
    Path((ws_id, task_id)): Path<(Uuid, Uuid)>,
    Extension(pool): Extension<SqlitePool>,
) -> impl IntoResponse {
    // 1. Altera o status no banco
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

    // 2. Renderiza cada fragmento
    let task_tree = render_task_tree(&pool, ws_id).await;
    let sprint_info = render_sprint_info(&pool, ws_id).await;
    let empty_detail = render_empty_detail();

    // 3. Monta resposta multi-target
    Html(format!(
        r#"<hx-partial hx-target="#task-tree">{}</hx-partial>
           <hx-partial hx-target="#sprint-info">{}</hx-partial>
           <hx-partial hx-target="#task-detail">{}</hx-partial>"#,
        task_tree, sprint_info, empty_detail
    ))
}
```

### Comportamento quando só há `<hx-partial>` na resposta

Se a resposta contém **apenas** `<hx-partial>` (sem conteúdo principal), o htmx 4 **não** realiza o swap principal. Isso é intencional — o servidor está dizendo "só quero atualizar esses destinos específicos". O target original do `hx-target` é ignorado.

Se você **também** quiser limpar/alterar o target principal, adicione `swapEmpty:true`:

```html
<button hx-post="/toggle"
        hx-target="#task-tree"
        hx-swap="innerHTML swapEmpty:true"
        ...>
```

Ou envie um `<hx-partial>` para o target principal também.

## 2. Usando `hx-swap-oob` (Out-of-Band)

Alternativa para quando os elementos têm `id` fixo no DOM:

**Resposta do servidor:**

```html
<!-- Swap no elemento #task-tree (OOB) -->
<div id="task-tree" hx-swap-oob="true">
  <div class="space-y-0.5">
    <!-- Árvore atualizada -->
  </div>
</div>

<!-- Swap no elemento #sprint-info (OOB, com append) -->
<div id="sprint-info" hx-swap-oob="innerHTML">
  <div class="stats">...</div>
</div>

<!-- Conteúdo principal vai para o target original -->
<div>Detalhe limpo</div>
```

**Importante no htmx 4:** No htmx 2, OOB swaps aconteciam **antes** do conteúdo principal. No htmx 4, o conteúdo principal é trocado **primeiro**, depois os OOB (em ordem do documento). Isso evita dependências e torna o comportamento mais previsível.

## 3. `hx-select-oob` — Extrair elementos do response

Se você não quer que o servidor inclua `hx-swap-oob` nos elementos, pode usar `hx-select-oob` no gatilho:

```html
<button hx-post="/ws/{{ ws_id }}/tasks/{{ task.id }}/toggle"
        hx-target="#task-tree"
        hx-swap="innerHTML"
        hx-select-oob="#sprint-info, #task-detail">
  Alternar
</button>
```

Isso extrai `#sprint-info` e `#task-detail` da resposta e faz swap OOB, mesmo que eles não tenham `hx-swap-oob` no HTML.

## 4. Padrão: Atualizar contadores na Sidebar

Sempre que uma tarefa é criada, alterada ou removida, o contador no sprint (coluna D) deve refletir. O padrão recomendado:

```rust
// Helper para construir resposta multi-target
fn multi_target(parts: Vec<(&str, &str)>) -> String {
    parts.iter()
        .map(|(target, html)| {
            format!(r#"<hx-partial hx-target="{}">{}</hx-partial>"#, target, html)
        })
        .collect::<Vec<_>>()
        .join("\n")
}

// Uso
let response = multi_target(vec![
    ("#task-tree", &task_tree),
    ("#sprint-info", &sprint_info),
    ("#task-detail", &empty_detail),
]);
Html(response)
```

## 5. Quando usar cada técnica

| Situação | Técnica |
|----------|---------|
| Atualizar árvore + sprint + detalhe | `<hx-partial>` |
| Notificação flutuante que aparece em qualquer lugar | `hx-swap-oob` |
| Servidor não controla os IDs | `<hx-partial>` com `hx-target` CSS |
| Extrair seções específicas de um response grande | `hx-select-oob` no gatilho |
| Atualizar um badge/contador na navbar | `hx-swap-oob` (simples) |

## Próximo: [06-forms.md](06-forms.md) — Formulários com htmx 4
