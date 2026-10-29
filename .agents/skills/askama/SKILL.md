---
name: askama
description: >
  Askama 0.16.0 — compile-time, type-safe Jinja-like templates for Rust:
  creation, enums, runtime values, syntax, filters, config, debugging, and web
  integration (Axum/Actix). Load when rendering HTML server-side in Rust with
  type checking at build time.
category: libraries
version: "0.16.0"
tags: [rust, askama, templates, type-safe, filters, ssr, axum]
license: MIT
---

# Askama 0.16.0

## Use When
- Server-side HTML rendering in Rust with compile-time checks
- Templates bound to typed structs/enums
- Adding filters, inheritance, or macros
- Integrating with Axum/Actix web handlers
- Debugging template compile errors

## Core Rules
- Templates are compiled into Rust; errors surface at build time.
- Bind template data via a struct implementing the generated template trait.
- Paths in `#[template(path = "...")]` are relative to `templates/` (configurable).
- Use `{{ value }}` which HTML-escapes by default; `|safe` only for trusted HTML.
- Prefer `{% match %}`/`{% when %}` over stringly logic.
- `{% include %}` / `{% extends %}` / `{% block %}` for composition.
- Keep logic in Rust; templates are presentation-only.
- Custom filters: implement `askama::filters::Filter` or register functions.

## Core Patterns
```rust
#[derive(Template)]
#[template(path = "user.html")]
struct UserTemplate<'a> {
    name: &'a str,
    items: &'a [Item],
    active: bool,
}

// user.html
// <h1>Hello {{ name }}</h1>
// {% if active %}<p>active</p>{% endif %}
// <ul>{% for item in items %}<li>{{ item.label }}</li>{% endfor %}</ul>

// Axum
async fn user() -> UserTemplate<'static> { /* … */ }
```

## File Map
| File | Content |
|---|---|
| `01-introduction.md` | What Askama is, type safety, setup |
| `02-template-creation.md` | Derive, data binding, first template |
| `03-template-enums.md` | Enums, discriminants, match |
| `04-runtime-values.md` | Options, Results, references, lifetimes |
| `05-debugging.md` | Compile errors, tracing, common fixes |
| `06-configuration.md` | `askama.toml`, dirs, syntax, escaping |
| `07-template-syntax.md` | Expressions, statements, loops, conditionals |
| `08-filters.md` | Built-in and custom filters |
| `09-integration-web.md` | Axum/Actix responses |
| `10-advanced-patterns.md` | Inheritance, composition, testing |
| `11-faq-troubleshooting.md` | FAQ and pitfalls |

## Read Order
`01`→`02`→`07`; filters `08`; web `09`; advanced `10`.

## Prereqs
Rust and Cargo; basic HTML/Jinja syntax.
