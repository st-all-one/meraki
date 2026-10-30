# htmx 4 — Introdução e Mentalidade

## O que é htmx 4?

htmx 4 é uma biblioteca JavaScript que estende HTML com atributos `hx-*` para fazer requisições AJAX, acionar eventos, e atualizar o DOM — tudo sem escrever JavaScript. Diferente de SPAs (React, Vue, Leptos), htmx segue o modelo **HTML-over-the-wire**: o servidor envia HTML pronto, o cliente apenas troca fragmentos.

## Por que htmx 4 neste projeto?

O Task Manager (similar ao TickTick) usa uma arquitetura de **3 colunas**:

| Coluna | Conteúdo | Atualização |
|--------|----------|-------------|
| **E** (sidebar) | Árvore de tarefas, filtros, calendário semanal, tags | Parcial via htmx |
| **M** (centro) | Detalhe da tarefa selecionada | Substituição via htmx |
| **D** (direita) | Sprint, time entries, usuário | Carga inicial + OOB |

htmx permite que cada coluna seja atualizada independentemente sem recarregar a página inteira, mantendo a sensação de SPA sem a complexidade de um framework cliente.

## Mentalidade HATEOAS

Aplicações htmx seguem o princípio **Hypertext As The Engine Of Application State (HATEOAS)**:

- O servidor envia **HTML completo** (não JSON)
- O HTML contém os próprios hiperlinks e atributos htmx para ações futuras
- O cliente é um "thin client" — apenas troca fragmentos de HTML

```html
<!-- ❌ Abordagem JSON/SPA: cliente renderiza -->
<!-- GET /api/tasks → JSON → cliente monta HTML -->

<!-- ✅ Abordagem htmx: servidor envia HTML pronto -->
<button hx-get="/ws/abc/tasks" hx-target="#task-tree">
  Carregar Tarefas
</button>
<!-- Resposta: <div class="task">...</div> → cai direto no DOM -->
```

## O que muda do htmx 2 para o 4

| Mudança | htmx 2 | htmx 4 |
|---------|--------|--------|
| Engine HTTP | `XMLHttpRequest` | `fetch()` |
| Herança de atributos | Implícita | Explícita (`:inherited`) |
| Respostas de erro (4xx/5xx) | Ignoradas | Trocadas (swap) |
| Timeout padrão | 0 (infinito) | 60000ms |
| Extensões | `hx-ext` no HTML | Script direto, `hx-ext` removido |
| Eventos | Nomes antigos | Padrão `htmx:phase:action` |
| Atributos removidos | `hx-vars`, `hx-params`, `hx-prompt` | Usar alternativas |

## Filosofia para o Task Manager

```
Cliente (HTML + htmx)              Servidor (Rust + Axum)
┌─────────────────────┐            ┌─────────────────────┐
│  <div hx-get="/...">│ ── GET ──▶│  async fn handler() │
│                     │            │  query db           │
│  Resposta HTML      │ ◀─ HTML ──│  render Askama      │
│  substitui #target  │            │  return Html        │
└─────────────────────┘            └─────────────────────┘
```

- **Zero JSON** no tráfego HTML (a API REST em `/api` ainda usa JSON para integração externa)
- **Zero estado no cliente** (toda lógica está no servidor)
- **Interatividade local** via Alpine.js (modais, toggle de tema, redimensionamento)
- **Navegação** via htmx (troca de fragmentos, sem reload)

## Próximo: [02-setup.md](02-setup.md) — Instalação e configuração
