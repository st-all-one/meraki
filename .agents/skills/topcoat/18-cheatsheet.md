# Cheatsheet

## Comandos

```sh
cargo install topcoat-cli
topcoat new app --recommended            # ou --minimal
topcoat new app --recommended --no-interactive --no-git
cargo run -- toasty migration generate
cargo run -- toasty migration apply
topcoat dev                              # HOST/PORT opcionais
topcoat fmt [--check] [--rustfmt]
topcoat asset bundle [--release|--profile p|--bin b|--package p|--out d]
topcoat asset list | clean
topcoat ui init | add button | list | remove button
topcoat l10n check
cargo fmt && cargo clippy --all-targets -- -D warnings
```

## Router

```rust
module_router!().discover().assets(AssetBundle::load()?).runtime().build()

#[page] async fn home(cx: &Cx) -> Result<impl View>
#[page("/x")] #[page(POST)] #[page([GET, POST])] #[page(*)]
#[route(GET "/api/health")] async fn health() -> Result<&'static str>
#[layout] async fn root(cx: &Cx, slot: Slot<'_>) -> Result<impl View>
#[layer] async fn auth(cx: &Cx, body: Body, next: Next<'_>) -> Result<Response>
```

| Path | Casa |
|---|---|
| `/users` | estático |
| `/{id}` | um segmento |
| `/{*path}` | cauda (≥1) |
| `/(group)` | grupo, fora da URL |

```rust
module_param!(post_id: u64, error = bad_request);
path_param!(slug); path_param!(*docs); path_param!(*ids: u32);
#[query_params(error = bad_request)] struct Q { page: Option<u32> }
href!(handler, PostId(1)).query(q).fragment("x").absolute().resolve(cx)
href!(page).is_current(cx)
```

## Views

```rust
view! {
    <!DOCTYPE html>
    <div class=(class!("card", "open" if open, extra)) data-id=(id)>
        "texto " (expr)
        if cond { <p>"a"</p> } else { <p>"b"</p> }
        for item in items { <li>(item.name)</li> }
        match state { S::A => <p>"a"</p>, S::B => { <p>"b"</p> <p>"c"</p> } }
    </div>
}
```

- Texto **sempre** entre aspas; `(expr)` interpola.
- `bool`/`Option` em atributo incluem/omitem; literal sempre presente.
- `class!` omite ausentes; `attributes!` + `(attrs)` espalha.
- `(StatusCode::NOT_FOUND)`, `((header::CACHE_CONTROL, v))`.
- `#[key(item.id)]` em loop com componentes/regiões.
- `element_id(cx)` para `id`/`for`.
- Escaping automático; `Unescaped` é opt-out de confiança.

## Componentes

```rust
#[component]
async fn panel(title: &str, #[default] child: Child<'_>) -> Result<impl View> {
    Ok(view! { <section><h2>(title)</h2>(child)</section> })
}

panel(title: "T", <p>"filho"</p> button(text: "ok"))
```

- `#[default]`, `#[default(expr)]`, `#[into]`.
- `cx: &Cx` injetado por nome; não é prop.
- Irmãos concorrentes; saída em ordem; sem efeitos entre irmãos.
- Recursão: `.boxed()`.

## Runtime

```rust
let count = signal(cx, || 0usize);

view! {
    <button @click=$(|_e| count.set(count.get() + 1))>"+1"</button>
    <input :value=$(name.get()) @input=$(|e: Event| name.set(e.target.value))>
    <p>$(count.get())</p>
}
```

- Servidor: `get/read` (tracked) e `*_untracked`; **sem `set`**.
- Browser: `set`, `toggle`, `increment`, `decrement`, `push_str`.
- `Expr::dynamic()` força valor atual.
- `raw!("js ${x}", rust)` = JS.
- `#record` envia todos os campos; sem segredos.

## Shard e procedure

```rust
#[shard("/api/results")]
async fn results(cx: &Cx, query: String) -> Result<impl View> {
    let user = require_user(cx).await?;          // SEMPRE
    Ok(view! { … })
}

#[procedure("/api/save")]
async fn save(cx: &Cx, todo: Todo) -> Result<Todo> {
    let user = require_user(cx).await?;          // SEMPRE
    persist(cx, user, todo).await
}
```

- Chamada: `results(query: $(q.get()))`, `save(todo).await`.
- Args/sinais são input; valide e limite.
- Registro: `.discover()`/`.route(..)`.
- Path gerado é instável; use path explícito.

## Streaming

```rust
suspense(fallback: view! { <p>"…"</p> }, slow())
error_boundary(fallback: |e| Ok(view! { (StatusCode::NOT_FOUND) <h1>"404"</h1> }), page())
live! { emit! { <p>"…"</p> }?; … emit! { (value) } }
```

- `live!` precisa emitir ≥1; última emissão vence.
- `connected(cx)` abre WS; corpo reinicia no reconnect.
- Cookie/status depois do commit: não.

## Autorização

```rust
#[memoize(as_ref)]
async fn current_user(cx: &Cx) -> Result<Option<User>> { … }

async fn require_user(cx: &Cx) -> Result<&User> { … }
```

Chame em página, layout, shard, procedure, fragmento, SSE e WS.

## Cookies

```rust
fn cookies(cx: &Cx) -> impl Cookies {
    topcoat::cookie::cookies(cx)
        .default_secure(true).default_http_only(true)
        .default_same_site(SameSite::Lax).default_path("/")
}

cookie!("name" = "value"; Path = "/"; Secure; HttpOnly; SameSite = Lax)
cookies(cx).add/remove/get
cookies(cx).signed(&key) / .private(&key)
cookie_store::<T, _>(jar, "name").parse_or_default().update(..).commit()?
```

- Escritas antes do streaming.
- `remove` com mesmo path/domain.
- `Key` persistida.

## Sessão

```rust
let s = session::start(cx).await?;            // login
let hash = session::token_hash(cx).await?;    // request
let old = session::stop(cx).await?;           // logout
let s = session::refresh(cx).await?;          // sliding
let r = session::rotate(cx).await?;           // privilégio
```

- Guarde só `TokenHash`; valide expiração.
- `rotate`: apague `revoked`.

## Assets

```rust
const LOGO: Asset = asset!("./logo.png");
view! { <img src=(LOGO)> }
let router = module_router!().assets(AssetBundle::load()?).build();
// CDN:
AssetConfig::hosted_at("https://cdn.example.com", AssetBundle::load()?)
```

- Bundle do mesmo build; `load_dir` para `--out`.
- Tailwind: `build.rs` → `BuildConfig::new().render()?`; layout → `stylesheet!()`.
- Fonte: `fontsource_font!(GEIST, weight: [400,700], host: Asset)`.
- Ícone: `icon(data: ICON, label: "…")`.
- UI: `topcoat ui add button`; edite; `components.toml` commitado.

## Segurança (defaults)

| Item | Default |
|---|---|
| HTML | escapado por contexto |
| Nomes dinâmicos | validados (panic) |
| Cross-origin unsafe | 403 |
| GET | **não** verificado |
| Body | 2 MiB |
| Cookie de sessão | `__Host-`, Secure, HttpOnly, Lax |
| Jar comum | sem atributos |
| CSRF token | **não existe** |
| CSP | precisa `unsafe-inline`/`unsafe-eval` |

Valide: URL antes de `href`, nomes de atributo, redirects, args de shard,
records/sinais.

## Erros

```rust
not_found() forbidden() unauthorized() bad_request("msg")
redirect(url) redirect_permanent(url) see_other(url)
rewrite(path, Body::empty()).method(Method::GET).with(v)
ok_or_not_found()? ok_or_forbidden()? ok_or_redirect(url)?
error_boundary(fallback: |e| … , child)
```

- 500 não vaza mensagem.
- Fallback de erro precisa de `(StatusCode::…)`.
- Rewrite: ≤8, sem ciclo.

## Performance

- Literais no markup; sem `format!` para texto.
- I/O lento em `suspense`/`live!` (barreira do primeiro byte).
- `#[memoize]` para lookup repetido.
- Assets por CDN; fontes com pesos limitados.
- Meça TTFB e p50/p95, não só render.
- Compressão: `.compression(Compression::new().level(CompressionLevel::Best))`.
- CORS: `TowerLayer::new(CorsLayer)`, sem helper nativo; cobre preflight.

## Limites

```text
body 2 MiB · WS 64 renders/conexão · prefetch 30 s/8/2/1 MiB
href! 8 params + 8 query · rewrites 8 · bundle por perfil
```
