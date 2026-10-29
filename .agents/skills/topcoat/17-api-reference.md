# Referência de API

> Superfície pública da fachada `topcoat` 0.11.0. Assinaturas resumidas; a fonte
> de verdade é o rustdoc + código dos crates. APIs de runtime são experimentais.

## 1. Features

| Feature | Habilita |
|---|---|
| `asset` | `asset!`, `Asset`, `AssetBundle`, `AssetConfig` |
| `compression` | compressão gzip/br no router |
| `cookie` | jar, `cookie!`, prefixos, assinados/privados, store |
| `font` | `font!`, `Font`, `link` |
| `font-fontsource` | `fontsource_font!` |
| `icon` | `icon`, `IconData` |
| `icon-iconify` | `iconify::include!`, `BuildConfig` |
| `router` | páginas, rotas, layouts, layers, `Cx`, `href!` |
| `runtime` | sinais, `$()`, procedures, shards, link |
| `serve` | `start`, `serve`, WebSocket server |
| `session` | `session::*` |
| `view` | `view!`, componentes, streaming |
| `discover` | `.discover()`, inventário link-time |
| `l10n` | `Locale`, `negotiate` |
| `l10n-fluent` (`messages!`, `t!`), `l10n-number`, `l10n-datetime` | formatação |
| `mail`, `mail-smtp` | `mail!`, transportes |
| `tailwind` | `tailwind::stylesheet!`, `BuildConfig` |
| `ui` | registry/CLI Topcoat UI |
| `fs` | `public_dir`, `serve_dir` |
| `sse`, `websocket`, `multipart`, `sitemap`, `tower` | integrações |
| `htmx`, `alpine-ajax`, `datastar` | integrações de fragmento/sinais |
| `anyhow`, `jiff` | interoperabilidade |

Defaults: `asset compression cookie font icon router runtime serve session view discover`.

## 2. Macros

| Macro | Forma | Notas |
|---|---|---|
| `view!` | `view! { … }` / `view! { cx => … }` | HTML + Rust; `cx =>` clona |
| `view!` (runtime) | `$()`, `@event`, `:attr` | requer runtime |
| `attributes!` | `attributes! { name="x" … }` | `Attributes`; `cx =>` exige `&Cx` |
| `class!` | `class!("a", "b" if cond, opt)` | lista de classes |
| `expr!` | `expr!(…) -> Expr<T>` | vocabulário Rust/JS |
| `raw!` | `raw!("js ${ident}", rust_expr)` | JavaScript; fallback opcional |
| `emit!` | `emit! { … }?` | dentro de `live!` |
| `live!` | `live! { … }` / `live! { cx => … }` | retorna `Result<EmitToken>` |
| `href!` | `href!(handler, Params…)` | `Href` |
| `path_param!` | `path_param!(name[: T][, error = …])` | tipo `PascalCase` |
| `module_param!` | idem + define segmento | um por módulo |
| `cookie!` | `cookie!("n" = v; Path = "/"; Secure)` | `Cookie` |
| `mail!` | `mail! { from, to, subject, html: { cx => … } }?` | `Result<Mail>` |
| `messages!` | `messages!("./l10n/{locale}.ftl")` | uma vez por módulo |
| `t!` | `t!("key", arg: value)` | tradução |
| `font!` / `font_face!` | `font!("Fam", @font-face { … })` | `Font` |
| `fontsource_font!` | `fontsource_font!(GEIST, weight: [400], host: Asset)` | `Font` |
| `iconify_icon!` | `iconify_icon!("feather:trash-2")` | `IconData` |
| `not_found!` | `not_found!()` / `not_found!("/prefix")` | catch-all 404 |
| `asset!` | `asset!("./x.png", rename: …)` | `Asset` |

## 3. Atributos de handler

| Atributo | Assinatura | Registro |
|---|---|---|
| `#[page]` / `#[page(METHOD)]` / `#[page("/path")]` | `async fn(cx?: &Cx, extractor?) -> Result<impl View>` | módulo ou `.page`/`.discover` |
| `#[route(METHOD)]` / `#[route(METHOD "/path")]` | `async fn(cx?, extractor?) -> Result<T: AsyncIntoResponse>` | `.route`/`.discover` |
| `#[layout]` / `#[layout("/path")]` | `async fn(cx?, slot: Slot<'_>) -> Result<impl View>` | `.layout`/`.discover` |
| `#[layer]` / `#[layer("/path")]` | `async fn(cx, body: Body, next: Next<'_>) -> Result<Response>` | `.layer`/`.discover` |
| `#[component]` | `async fn(props…, cx?) -> Result<impl View>` | chamada no markup |
| `#[shard]` / `#[shard("/path")]` | `async fn(cx?, args…) -> Result<impl View>` | `.route`/`.discover` |
| `#[procedure]` / `#[procedure("/path")]` | `async fn(cx?, args…) -> Result<T>` | `.route`/`.discover` |
| `#[record]` | struct de campos nomeados | runtime |
| `#[query_params]` | struct | leitura com `query_params` |
| `#[memoize]` / `#[memoize(as_ref)]` | `fn(cx: &Cx, args…) -> T` | cache por request |
| `#[derive(Props)]` | struct de props | builder typestate |
| `#[key(expr)]` | loop em `view!` | identidade |

## 4. `RouterBuilder`

| Método | Efeito |
|---|---|
| `new()`, `build()` | criar/finalizar |
| `.page(h)`, `.route(h)`, `.layout(h)`, `.layer(h)` | registro explícito |
| `.discover()` | coleta link-time (trait `RouterBuilderDiscoverExt`) |
| `.app_context(v)` | valor global por tipo |
| `.origin_policy(p)` | CSRF/WS cross-origin |
| `.trusted_proxies(t)` | `client_ip` confiável |
| `.compression(Compression)` | gzip/br, nível e tamanho mínimo |
| `.trailing_slash(mode)` | `Redirect`/`Serve`/`Strict` |
| `.base_url(url)` | URLs absolutas em `href!` |
| `.assets(bundle/config)` | asset system |
| `.runtime()` | rerun/WS |
| `.max_runs_per_connection(n)` | default 64 |
| `.prefetch(mode)` | default `Intent` |
| `.cookies()` | jar |
| `.sessions(config)` | sessão |
| `.mail(config)` | e-mail |
| `.font(f)` / `.discover()` | fontes |
| `.public_dir(p)` / `.serve_dir(path, p)` | FS |
| `.route(TowerRoute…)`, `.layer(TowerLayer…)` | Tower |
| `.layer(BodyLimit::max(n).at(path))` | limite de body |

`Router`: `handle(Request) -> Response`, `handle_with(Request, values)`,
`serve`/`start` (feature `serve`).

## 5. Tipos e traits principais

| Tipo | Papel |
|---|---|
| `Cx` | contexto da request (Clone) |
| `Slot<'a>` = `Child<'a>` | conteúdo de layout |
| `Child<'a>` | filhos de componente (boxed) |
| `Attributes` | coleção de atributos |
| `Class<…>` / `StaticClass` | lista de classes |
| `View` / `ViewExt` (`single`, `first`, `boxed`) | render |
| `ViewHandle` / `BoxView` | handle/render/stream |
| `PartsWriter` | escrita escapada/validada |
| `Signal<T>` / `Expr<T>` | estado/expressão de runtime |
| `Asset` / `AssetBundle` / `AssetConfig` / `Manifest` | assets |
| `Font` / `FontSource` / `IconData` | tipografia/ícones |
| `Locale` / `Number` / `DateTime` | l10n |
| `Cookie` / `CookieJar` / `Key` | cookies |
| `Token` / `TokenHash` / `Session` / `Rotation` | sessão |
| `Mail` / `Receipt` / `Transport` | e-mail |
| `Body` / `Bytes` / `Response` / `StatusCode` / `HeaderMap` | HTTP |
| `OriginPolicy` / `TrustedProxies` / `BodyLimit` / `Compression` | borda |
| `CxTestBuilder` | `Cx` para testes sem HTTP |

Traits de view customizada: `NodeViewParts`, `AttributeValueViewParts`,
`AttributeKeyViewParts`, `AttributeViewParts`, `ElementNameViewParts`.

## 6. Módulos reexportados

```
topcoat::asset          asset!, AssetBundle, AssetConfig
topcoat::context        Cx, app_context, request_context, memoize
topcoat::cookie         Cookies, cookie!, Key, cookie_store, prefixos
topcoat::font           Font, font!, font_face!, link, fontsource
topcoat::icon           IconData, icon, iconify
topcoat::l10n           Locale, locale!, negotiate, messages!, t!, Number, DateTime
topcoat::mail           mail!, send, MailConfig, transportes
topcoat::router         page/route/layout/layer, Slot, href!, params, content, error, tower
topcoat::runtime        signal, Signal, Expr, expr!, shard, procedure, link, connected
topcoat::session        start, stop, refresh, rotate, token_hash, TokenStore
topcoat::tailwind       stylesheet!, BuildConfig
topcoat::view           view!, attributes!, class!, components, streaming
topcoat::htmx           hx_request, Hx*
topcoat::alpine_ajax    ajax_request, ajax_target(s)
topcoat::datastar       Signals, PatchElements, PatchSignals, ExecuteScript
```

## 7. Funções por área

### Router/request

- `request::{headers, method, uri, parts, extensions, client_ip, remote_addr}`
- `original_{headers, method, uri, parts}`
- `path_param::<T>(cx)`, `query_params::<T>(cx)`
- `body_limit(cx)`, `to_bytes(body, limit)`
- `error::{not_found, bad_request, unauthorized, forbidden, redirect,
  redirect_permanent, see_other, rewrite, internal_server_error}`
- `RouterErrorExt::{ok_or_*}`

### Runtime

- `signal(cx, || init)`, `connected(cx)`, `connected_untracked(cx)`
- `prefetch_mode(cx)`, `link_attrs(cx, href, mode)`, `link(href, label, prefetch)`
- `Expr::{evaluate, from, dynamic, is_static, into_evaluated_and_js}`
- `Js::source`, `JsBuilder::{expression, source, raw, surrogate, build}`

### Cookies/sessão

- `cookies(cx)`, `signed_cookies(cx)`, `private_cookies(cx)`
- `Cookies::{get, add, remove, map, default_*, override_*, signed, private,
  prefix_host, prefix_secure}`
- `cookie_store::<T, _>(jar, name)`
- `session::{start, stop, refresh, rotate, token_hash}`
- `Token::{encode, decode}`

### L10n/mail/assets

- `locale(cx)`, `try_locale(cx)`, `accept_language(cx)`, `negotiate(req, avail)`
- `t::locales()`, `Translation::{resolve, resolve_in}`
- `send(cx, mail)`, `MailConfig::builder()`
- `AssetBundle::{load, load_dir, dir, catalog, get}`
- `AssetConfig::{serve, hosted_at, base_url, get, resolve, fmt_url}`
- `Manifest::parse`, `AssetCatalog::{get, assets}`
- `font::link(font, preload)`, `tailwind::stylesheet!()`

## 8. Defaults e limites

| Item | Default |
|---|---|
| Bind | `127.0.0.1:3000`, `HOST`/`PORT` |
| Body | 2 MiB |
| Trailing slash | redirect 308 |
| OriginPolicy | ligada; permite sem `Origin`/`Sec-Fetch-Site` |
| URL de página | relativa |
| Sessão | 30 dias; cookie `__Host-session` |
| WS | 64 renders por conexão; 429 |
| Prefetch | `Intent`; 30 s; 8 páginas; 2 concorrentes; 1 MiB |
| Asset cache | 1 ano, immutable |
| Compressão | gzip/br, mínimo 32 B |
| Runtime runs | 64 por socket |
| Shard/procedure path | gerado (instável) |

## 9. Retorno de handlers

| Tipo | Resposta |
|---|---|
| `impl View` | HTML |
| `&'static str`/`String` | `text/plain` |
| `Json<T>` | `application/json` |
| `(StatusCode, T)` | status + T |
| `(StatusCode, HeaderMap, T)` | status + headers + T |
| `Response` | pronto |
| `Sse<S>` | event stream |
| `Sitemap` | XML |
| `Body` | stream |
| `SeeOther`/`Redirect` | 303/307 |
| `Err(RouterError)` | status do erro |
| `Err(outro)` | 500 |

## 10. Compatibilidade

- Rust estável; edition do workspace.
- `topcoat` reexporta os crates; dependa só da fachada.
- Features ausentes → APIs ausentes em compile-time.
- `#[record]`, `$(...)`, procedures/shards/WebSocket são **experimentais**.
- Quebras entre 0.x: leia `crates/*/CHANGELOG.md` antes de atualizar.
