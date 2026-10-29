---
name: topcoat
description: >
  Topcoat 0.11.0 — experimental full-stack Rust: server-rendered HTML, async
  components, view! templates, module routing, layouts/layers, Cx context,
  memoize, signals and Rust/JS expressions, records, procedures, shards,
  streaming, cookies/sessions, mail/l10n, assets/Tailwind/fonts/icons/UI,
  htmx/Alpine AJAX/Datastar/SSE/WS/Tower. Load when building, reviewing, or
  debugging a Topcoat app.
category: frameworks
version: "0.11.0"
tags: [topcoat, rust, fullstack, ssr, html, components, signals, shards, security, performance]
license: MIT
---

# Topcoat 0.11.0

Experimental. Expect breaking changes; no static export, built-in auth/validation,
jobs, or OpenAPI.

## Use When
- Building HTML-first apps in Rust with async server components
- Routing by module tree (`module_router!`) or explicit paths
- Interaction via signals, `$()`, `@event`, `:bind`
- Server re-render with `#[shard]`/`#[procedure]` or streaming (`live!`)
- Sessions, cookies, mail, l10n, hashed assets, Tailwind, UI
- htmx, Alpine AJAX, Datastar, SSE, WebSocket, Tower
- Reviewing security/performance of a Topcoat app

## Core Rules
- `.discover()` is required for absolute paths, procedures, shards, fonts.
- `.runtime()` after app layers; `runtime::script()` in `<head>` (panics without it).
- Views are lazy, capture by move; siblings render concurrently, emit in source order.
- The first byte waits for **all** siblings: wrap slow I/O in `suspense`/`live!`.
- Use `href!(handler, Params…)`; never hand-write internal paths.
- Escaping is automatic per HTML context; `Unescaped`/`push_*_unescaped` need trusted markup.
- Signals, shard args, and procedure args are user input: validate and authorize
  **inside** shards/procedures (page/layout guards do not run).
- Context is keyed by exact Rust type; use newtypes for same-type values.
- `#[memoize]` is per request and keys args by hash, without equality.
- Cookies: write before streaming (later writes panic); the plain jar applies no attributes.
- Sessions: store only `TokenHash`; validate lookup + expiry per request.
- Mutations only via unsafe methods; `OriginPolicy` does not check GET.
- Binary and asset bundle must come from the same build; missing assets panic.
- `raw!` is JavaScript, not HTML.

## Key APIs
```rust
use topcoat::{Result, asset::{AssetBundle, RouterBuilderAssetExt}, context::Cx,
    router::{RouterBuilder, RouterBuilderDiscoverExt, module_router, page},
    runtime::{RouterBuilderRuntimeExt, signal}, view::{View, component, view}};

#[tokio::main]
async fn main() { topcoat::start(router().build()).await.unwrap(); }

pub fn router() -> RouterBuilder {
    module_router!().discover().assets(AssetBundle::load().unwrap()).runtime()
}

#[page]
async fn home(cx: &Cx) -> Result<impl View> {
    let n = signal(cx, || 0usize);
    Ok(view! {
        <!DOCTYPE html><html><head>topcoat::runtime::script()</head><body>
            <button @click=$(|_e| n.set(n.get() + 1))>"+1"</button>
            <p>"Count: " $(n.get())</p>
            card(title: "Hi")
        </body></html>
    })
}

#[component]
async fn card(title: &str) -> Result<impl View> {
    Ok(view! { <section><h2>(title)</h2></section> })
}

```

## File Map
| File | Content |
|---|---|
| `00-index.md` | Canonical example, mental model |
| `01-quickstart.md` | CLI, presets, migrations, dev, features |
| `02-roteamento.md` | Modules, pages/routes, layouts, layers, params, `href!` |
| `03-contexto.md` | `Cx`, app/request context, `with`, memoize, guards |
| `04-request-response.md` | Extractors, body limits, responses, redirects, rewrites |
| `05-views.md` | `view!`, attributes, classes, metadata, escaping, a11y/SEO |
| `06-componentes.md` | Components, props, `Child`, keys, concurrency |
| `07-streaming.md` | `live!`/`emit!`, `suspense`, `error_boundary`, `connected` |
| `08-runtime.md` | Signals, `$()`, records, procedures, shards, links, WS |
| `09-cookies-sessoes.md` | Jar, prefixes, signed/private, sessions, auth |
| `10-servicos.md` | Mail, l10n/Fluent, formatting |
| `11-assets-estilo.md` | Assets/CDN, Tailwind, fonts, icons, UI |
| `12-integracoes.md` | htmx, Alpine, Datastar, SSE, WS, multipart, sitemap, Tower, fs, CORS |
| `13-seguranca.md` | Escaping, CSRF, risks, checklist |
| `14-performance.md` | Render, TTFB, allocation, compression, benchmarks |
| `15-testing.md` | `Router::handle`, `CxTestBuilder`, CI |
| `16-exemplos.md` | 28 examples, `admin` demo |
| `17-api-reference.md` | Macros, traits, builders, features |
| `18-cheatsheet.md` | Pocket reference |
| `19-melhores-praticas.md` | Architecture, review, versioning |
| `20-faq-troubleshooting.md` | Symptom → cause → fix |
| `21-padroes-avancados.md` | Deploy, edge, multi-tenant, ops, limits |

## Read Order
`00`→`01`→`02`→`03`; rendering `05`+`06`+`07`; runtime `08`; security `13`;
performance `14`; deploy `21`.

## Prereqs
Stable Rust, Cargo, Tokio, basic HTML/CSS. Tailwind/Iconify/Fontsource optional;
no Node required.
