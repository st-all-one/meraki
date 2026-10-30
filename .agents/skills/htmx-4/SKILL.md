---
name: htmx-4
description: >
  htmx 4 with Rust/Axum: HTML-over-the-wire and HATEOAS, 3-column layout,
  CRUD with hx-*, multi-target (OOB) swaps, forms, error handling,
  optimizations, migration from v2. Load when building hypermedia UIs with
  server-rendered fragment updates.
category: libraries
version: "4"
tags: [htmx, hypermedia, htmx4, axum, rust, hx-get, hx-post, oob]
license: MIT
---

# htmx 4 (with Rust/Axum)

## Use When
- Multi-column dashboards with independent fragment updates
- `hx-get`/`hx-post`/`hx-target`/`hx-swap`/`hx-trigger`/`hx-oob` patterns
- Forms with validation and inline error feedback
- Multi-target (out-of-band) swaps for sidebar/center/detail
- Rust Axum handlers, templates, SSE
- Migrating from htmx v2

## Core Rules
- Server returns **HTML fragments**, not JSON, for htmx requests.
- Use `hx-target` + `hx-swap`; default swap is `innerHTML`.
- `hx-boost` for progressive enhancement of links/forms.
- Validate on the server; return proper status + swap errors into place.
- Use `hx-trigger` modifiers (`changed`, `delay`, `throttle`) deliberately.
- OOB updates: return `<div id="x" hx-swap-oob="true">…</div>`.
- Avoid `hx-on` inline with strict CSP; use delegated listeners.
- htmx v4 changes: attribute/behavior and extension differences vs v2 — check migration doc.

## Core Patterns
```html
<div class="layout">
  <aside id="sidebar"
         hx-get="/sidebar" hx-trigger="load, taskChanged from:body" hx-swap="innerHTML">…</aside>
  <main id="center"
        hx-get="/tasks" hx-trigger="load, taskChanged from:body" hx-swap="innerHTML">…</main>
  <section id="detail">…</section>
</div>

<form hx-post="/tasks" hx-target="#center" hx-swap="innerHTML">
  <input name="title" required>
  <button type="submit">Add</button>
</form>
```

```rust
// Axum: return a fragment
async fn create(State(db): State<Db>, Form(input): Form<NewTask>) -> Html<String> {
    let task = db.insert(input).await.unwrap();
    Html(format!("<li id=\"task-{}\">{}</li>", task.id, task.title))
}
```

## File Map
| File | Content |
|---|---|
| `01-introduction.md` | Philosophy, HATEOAS, 3-column architecture |
| `02-setup.md` | Axum project, templates, htmx CDN, assets |
| `03-three-column-layout.md` | Sidebar/center/detail partial updates |
| `04-task-crud.md` | Create/read/update/delete via htmx |
| `05-multi-target.md` | OOB swaps across regions |
| `06-forms.md` | Validation and error feedback |
| `07-error-handling.md` | Status codes, error fragments |
| `08-optimizations.md` | Indicators, caching, payload size |
| `09-rust-axum-patterns.md` | Handlers, extractors, SSE |
| `10-migration-from-v2.md` | v2 → v4 changes |

## Read Order
`01`→`02`→`03`→`04`; OOB `05`; forms/errors `06`+`07`; migration `10`.

## Prereqs
HTML, basic HTTP; Rust/Axum for server patterns.
