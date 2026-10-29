# Exemplos e demo

> Os 28 `examples/` são apps mínimas por feature; `demos/admin` é a referência de
> aplicação completa. Rode da raiz do repo com `cargo topcoat dev -p <nome>`.

## 1. Como rodar

```sh
cargo topcoat dev -p hello-world
cargo topcoat dev -p admin
cargo run -p routerless
```

| Exemplo | Comando especial |
|---|---|
| `cloudflare-worker` | `rustup target add wasm32-unknown-unknown` + `npx wrangler dev` dentro da pasta |
| `admin` | migrations antes: `cargo run -p admin -- toasty migration generate` / `apply` |
| demais | `cargo topcoat dev -p <nome>` |

## 2. Inventário

| Exemplo | Feature demonstrada | Padrão notável |
|---|---|---|
| `hello-world` | app mínima | `view!` + `#[component]` |
| `routerless` | render sem HTTP | `AppContext::new`, `Cx::new`, `.render(cx)` |
| `manual-router` | registro explícito | `Router::builder().layout/page/route` |
| `module-router` | paths por módulo | `_marketing`, `href!` |
| `path-query-params` | path/query tipados | `path_param!`, `#[query_params(error = redirect("?"))]`, `.query(..)` |
| `request-response` | extractor/response próprios | `FromRequest`, `IntoResponse`, `Option<Json>`, multipart |
| `error` | erros com marca | `error_boundary` + downcast + `not_found!()` |
| `context` | `Cx` em funções | `uri(cx)`, `headers(cx)` |
| `app-context` | estado compartilhado | `app_context::<T>`, `AtomicU64` |
| `session` | login/logout | `.cookies().sessions(..)`, `token_hash`, `HashMap<TokenHash, _>` |
| `cookie` | cookie assinado | `signed_cookies`, `cookie_store(...).update(...).commit()` |
| `asset` | asset com hash | `asset!`, `AssetBundle::load()` |
| `tailwind` | CSS gerado | `tailwind::stylesheet!()` + build.rs |
| `font` | Fontsource + manual | `fontsource_font!`, `font! { @font-face }` |
| `icon` | SVG/Iconify | `IconData::unescaped_unchecked`, `iconify::include!` |
| `l10n` | Fluent/negociação | `messages!`, `negotiate` |
| `mail` | e-mail em arquivo | `MailConfig` + `FileTransport` |
| `ui` | showcase de componentes | UI vendorizada + sinais |
| `htmx` | contador htmx | `hx_request`, `HxResponseTrigger` |
| `alpine-ajax` | contador Alpine | `ajax_request`, `x-target`, fallback PRG |
| `datastar` | sinais + SSE | `Signals<Counter>`, `PatchSignals`, `PatchElements` |
| `runtime` | Rust ↔ JS | `signal`, `$()`, `@click`, `#[shard]`, `#[record]` |
| `live` | streaming | `live!`/`emit!`, `connected`, chat |
| `suspense` | fallback/erro/redirect | `suspense`, `error_boundary` |
| `sse` | ticks + job | `Event::id/retry`, `KeepAlive`, `last_event_id` |
| `websocket` | echo | `WebSocketUpgrade::on_upgrade`, `Message` |
| `toasty-todo` | ORM + PRG | `toasty::Model`, SQLite, `see_other` |
| `cloudflare-worker` | edge | `Router::handle` em `#[event(fetch)]`, `OnceLock<Router>` |

## 3. Trechos úteis

### Sessão (examples/session)

```rust
// app context guarda registros em memória
struct Sessions(Mutex<HashMap<TokenHash, Record>>);

#[route(POST)]
async fn login(cx: &Cx, Form(input): Form<Credentials>) -> Result<SeeOther> {
    let user = authenticate(&input).await?;
    let session = session::start(cx).await?;
    sessions(cx).lock().unwrap().insert(session.token_hash, Record {
        user: user.id,
        expires_at: session.expires_at,
    });
    Ok(see_other(href!(home).resolve(cx)))
}
```

### Cookie assinado + store (examples/cookie)

```rust
let jar = topcoat::cookie::signed_cookies(cx);
let mut prefs = cookie_store::<Prefs, _>(jar, "prefs")
    .parse_or_default()
    .update(|p| p.theme = "dark".into())
    .commit()?;
```

### Datastar (examples/datastar)

```rust
#[route(POST)]
async fn increment(
    cx: &Cx,
    Signals(counter): Signals<Counter>,
) -> Result<Sse<impl Stream<Item = Result<Event>> + use<>>> {
    let count = counter.count + 1;
    let entry = view! { cx => <li>"Counted to " (count)</li> }.single().await?;
    let events = stream::iter([
        PatchSignals::json(&Counter { count }).map(Into::into),
        Ok(PatchElements::new(entry.render(cx))
            .selector("#log")
            .mode(ElementPatchMode::Append)
            .into()),
    ]);
    Ok(Sse::new(events))
}
```

### Worker (examples/cloudflare-worker)

```rust
#[event(fetch)]
async fn fetch(req: HttpRequest, _env: Env, _ctx: ExecutionContext) -> Result<HttpResponse> {
    static ROUTER: OnceLock<Router> = OnceLock::new();
    let router = ROUTER.get_or_init(|| app::router().build());

    let body = req.into_body().bytes().await?;
    let request = http::Request::builder()
        .method(req.method())
        .uri(req.uri())
        .body(Body::from(body))?;

    Ok(router.handle(request).await)
}
```

- Worker não tem `serve` nem WebSocket do runtime; bufferize o body.
- Assets: embuta o manifesto e use `hosted_at`/`load_dir` compatível.

### Live chat (examples/live)

- `live!` emite a lista no HTTP e retorna o token.
- Com `connected(cx)`, assina um `broadcast` e reemite a cada mudança.
- No reconnect, relê o estado; jobs duráveis ficam fora do corpo live.

## 4. Demo `admin`

Arquitetura (6 mil linhas):

```
src/
├── main.rs            # SQLite, subcomando toasty, migrações, seed, router
├── app.rs             # module_router!().discover().assets().cookies().sessions().runtime()
├── app/
│   ├── _admin/        # grupo sem segmento: dashboard, orders, products, customers
│   ├── _common/       # helpers (see_back, money_input)
│   ├── login.rs, logout.rs, language.rs, theme.rs
├── components/        # Topcoat UI + charts/list_pagination próprios
├── features/          # auth, catalog, customer, order, stats, locale, theme, user
├── db.rs, seed.rs
└── tests/registry_sync.rs
```

Padrões que valem copiar:

- `module_router!().discover().assets(..).cookies().sessions(..).runtime()`.
- Layer `set_locale` injeta `Locale` com `Cx::with`.
- Layout raiz com `tailwind::stylesheet!()`, `font::link(GEIST)`,
  `runtime::script()`, `dev::script()`.
- `_admin` como grupo; detalhes com `module_param!`; breadcrumb por layer.
- `#[memoize] current_user` + `require_user` com `ok_or_redirect`.
- Login usa `rewrite(...).method(GET)` para preservar e-mail/erros com 422.
- Shards com `live!`/`suspense`/signals; listas com filtro e paginação.
- Toasty com migrações embutidas; `db::latency()` simula 500 ms para skeletons.
- LIKE escapado (`% _ \`) em busca.
- i18n Fluent por módulo.
- Teste de sincronização do registry compara tema/componentes instalados com
  `topcoat_ui::Registry`; sem testes HTTP/e2e (lacuna).

Comandos:

```sh
cargo run -p admin -- toasty migration generate --name init
cargo run -p admin -- toasty migration apply
cargo topcoat dev -p admin
cargo test -p admin
cargo topcoat l10n check -p admin
```

## 5. O que os exemplos **não** cobrem

- Testes end-to-end de auth/CSRF.
- Rate limiting, MFA, verificação de e-mail, RBAC.
- Deploy real (TLS, proxy, CDN, chaves).
- Migrações em produção e rollback.
- Observabilidade (métricas/traces).
- Multi-tenant e jobs em background.

Trate-os como receitas de feature, não como arquitetura de produção.
