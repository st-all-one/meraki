# Roteamento e HTTP

> Dois jeitos de declarar a mesma árvore: **por módulos** (recomendado) ou com
> **paths explícitos** nos atributos. Ambos produzem o mesmo `Router`; layouts e
> layers casam por prefixo de path.

```rust
// src/app.rs
pub fn router() -> Router {
    module_router!().build()
}
```

## 1. Roteamento por módulos

```text
src/
├── app.rs              → /
├── app/
│   ├── about.rs        → /about
│   ├── _marketing.rs   → grupo (sem URL)
│   ├── _marketing/
│   │   └── pricing.rs  → /pricing
│   ├── posts.rs        → /posts
│   ├── posts/
│   │   ├── id.rs       → /posts/{post_id}  (via module_param!)
│   │   └── archive.rs  → /posts/archive
│   └── api/
│       └── health.rs   → /api/health
```

Regras:

- `module_router!()` mapeia o módulo que o contém para `/`. Cada `mod` descendente
  acrescenta um segmento.
- Nomes de módulo viram **kebab-case**: `blog_posts` → `/blog-posts`.
- Módulo com prefixo `_` é **grupo**: participa de layouts/layers mas não da URL.
- O nome da **função** não afeta a URL — apenas módulo + `module_param!`.
- `mod` vazio (sem handler) não gera rota; módulo só agrupa.

### Overrides de segmento

```rust
use topcoat::router::{module_router, segment};

mod docs {
    segment!(rename = "documentation");       // /documentation
    // segment!(kind = Group);               // sem URL
    // segment!(kind = Param);               // /{docs}
    // segment!(kind = CatchAll);            // /{*docs}
}
```

`segment!` precisa vir **antes** de qualquer handler do módulo; depois disso, panic.
`rename` não aplica kebab-case. `./` no módulo raiz não tem forma de barra final e
entra em panic.

### Parâmetro de módulo

```rust
// src/app/posts/id.rs
use topcoat::{
    Result,
    context::Cx,
    router::{module_param, page, path_param},
    view::{View, view},
};

module_param!(post_id: u64, error = bad_request);   // path /posts/{post_id}

#[page]
async fn post(cx: &Cx) -> Result<impl View> {
    let id = path_param::<PostId>(cx)?;              // &u64, memoizado
    Ok(view! { <h1>"Post " (id)</h1> })
}
```

- Sem tipo: `module_param!(slug)` → segmento `{slug}`, leitura `&str` decodificado.
- Com tipo: gera `PostId`; parse via `FromStr`, memoizado por request.
- `error = …` mapeia falha de parse para `bad_request`, `not_found`, `forbidden`,
  `unauthorized`, `redirect(..)`, `redirect_permanent(..)`. Sem `error`, a leitura
  devolve `Result<&T, &T::Err>`.
- Catch-all: `module_param!(*docs)` → `CatchAllSegments`; `module_param!(*ids: u32)`
  → `Result<&[u32], _>`. Precisa ser o último e casar ≥1 segmento.
- O nome do param vem da declaração, não do arquivo; o tipo é `PascalCase` do nome.
- Um módulo pode ter **um** `module_param!`.

> Ler `path_param::<T>` de um nome não declarado **entra em panic** (500).

## 2. Paths explícitos

```rust
use topcoat::{
    Result,
    router::{Router, page, route},
    view::{View, view},
};

#[page("/")]
async fn home() -> Result<impl View> {
    Ok(view! { <h1>"Home"</h1> })
}

#[route(GET "/api/health")]
async fn health() -> Result<&'static str> {
    Ok("ok")
}

pub fn router() -> Router {
    Router::builder().page(home).route(health).build()
}
```

- Path absoluto em `#[page]`/`#[layout]`/`#[layer]` **desliga** a derivação por módulo
  e exige registro explícito (`.page()`, `.route()`, `.layout()`, `.layer()`) ou
  `.discover()`.
- `#[page("./export")]` estende o path do módulo (relativo).
- `Router::builder().discover().build()` coleta handlers absolutos, procedures,
  shards e fontes por link-time.
- `module_router!()` também pode receber `.page(handler)`/`.route(handler)`.

### Sintaxe de path

| Segmento | Casa | Exemplo |
|---|---|---|
| `/users` | estático | `/users` |
| `/{id}` | um segmento não vazio | `/posts/42` |
| `/{*path}` | cauda, ≥1 segmento | `/docs/a/b` |
| `/(marketing)` | grupo; fora da URL | layout/layer em `/pricing` |

- Raiz `/`; sem segmentos vazios internos; a barra final faz parte do path.
- Nomes de param/grupo: começam com letra ASCII ou `_`; letras, dígitos, `_`.

### Trailing slash

Default: redireciona 308 para a forma declarada, preservando query/método/body.

```rust
use topcoat::router::{Router, TrailingSlash};

let router = Router::builder()
    .trailing_slash(TrailingSlash::Serve)   // aceita as duas formas
    // .trailing_slash(TrailingSlash::Strict) // outra forma → 404
    .build();
```

Não afeta `/`, catch-alls nem paths com as duas formas registradas.

## 3. Handlers

| Atributo | Retorno | Métodos |
|---|---|---|
| `#[page]` | `Result<impl View>` | `GET` (+`HEAD`); aceita `POST`, `[GET, POST]`, `*` |
| `#[route(GET)]` | `T: AsyncIntoResponse` | método obrigatório no atributo |
| `#[layout]` | `Result<impl View>` | envolve páginas |
| `#[layer]` | `Result<Response>` | envolve dispatch |

```rust
#[page]
async fn home(cx: &Cx) -> Result<impl View> { … }

#[route(POST)]
async fn create(cx: &Cx, topcoat::router::content::Json(input): Json<Input>) -> Result<Json<Output>> { … }
```

- Página/rota aceitam `cx: &Cx` (opcional) e **no máximo um** extractor de body
  (`Form`, `Json`, `Multipart`, `WebSocketUpgrade`, `Body`), em qualquer ordem.
- Duplicata de path+método faz panic no `build()`; método específico vence `*`.
- `HEAD` é derivado de `GET` salvo declaração explícita.
- Handler retornando `Result<()>`/`Result<&'static str>`/`Json<T>` é rota de API.

### Layer

```rust
use topcoat::{
    Result,
    context::Cx,
    router::{Body, Next, layer, response::Response},
};

#[layer]
async fn timing(cx: &Cx, body: Body, next: Next<'_>) -> Result<Response> {
    let start = std::time::Instant::now();
    let response = next.run(cx, body).await?;
    println!("{} em {:?}", topcoat::router::request::uri(cx).path(), start.elapsed());
    Ok(response)
}
```

Para injetar valor de request:

```rust
#[layer]
async fn set_locale(cx: &Cx, body: Body, next: Next<'_>) -> Result<Response> {
    let locale = negotiate(accept_language(cx), &["pt-BR", "en"]);
    next.run(&cx.with(locale), body).await
}
```

- Layer que muda contexto **precisa** passar o filho a `next.run`; o pai não vê.
- Registrar layers de aplicação **antes** de `.runtime()` ([`08`](./08-runtime.md)).

### Ordem e matching de layouts/layers

- Casam por **prefixo de path registrado**, não pelo URL servido. `/(marketing)`
  conta; `/docs/admin` não envolve `/docs/{x}`.
- Layouts: menos específico por fora, mais específico por dentro. `/` envolve tudo.
  Layouts envolvem páginas; a doc não define envolvimento de `#[route]` que devolve
  view — assuma que não é envolvido.
- Layers no mesmo path: registro explícito → último registrado é o mais externo.
  Descobertos exigem paths únicos (ordem de link-time instável).
- Só `Layer::path() == None` (layer montada manualmente) envolve 404/405.
- Layer com path nunca roda em miss; um miss chega como `Err` ao `next.run` de um
  layer pathless.

## 4. Query

```rust
use topcoat::{
    Result,
    context::Cx,
    router::{page, query_params},
    view::{View, view},
};

#[query_params(error = bad_request)]
struct PostsQuery {
    page: Option<u32>,
    q: Option<String>,
}

#[page]
async fn posts(cx: &Cx) -> Result<impl View> {
    let q = query_params::<PostsQuery>(cx)?;
    Ok(view! { <p>"página " (q.page.unwrap_or(1))</p> })
}
```

- O macro deriva `Deserialize`; ausente/vazio → `None` para `Option`.
- Parse memoizado; qualquer função com `&Cx` lê.
- Sem `serde(default)` implícito: use `Option` ou defaults no tipo.
- `error = …` decide o status em entrada inválida; `redirect("?")` é um padrão.

## 5. `href!`

```rust
use topcoat::router::{href, page, path_param};

path_param!(pub post_id: u64);

#[page] async fn posts() -> topcoat::Result<impl topcoat::view::View> { … }
#[page] async fn post() -> topcoat::Result<impl topcoat::view::View> { … }

topcoat::view::view! {
    <a href=(href!(posts))>"Posts"</a>
    <a href=(href!(post, PostId(42)).query(Page { n: 2 }).fragment("top"))>"Post"</a>
}
```

- Params casam **por nome**, na ordem do path; tipo errado/ausente → panic.
- Use `.resolve(cx)` quando precisar de `String` (redirect).
- `.query(serializable)`, `.fragment(display)`, `.relative()` (default),
  `.absolute()` (exige `.base_url(..)` no router), `.form(UrlForm)`.
- `.is_current(cx)` compara path exato (barra incluída); query só se `.query()` foi
  usado; fragmento ignorado. Bom para `aria-current` e `class!`.
- Limites: 8 params e 8 itens de query. Valores que renderizam vazio, `.` ou `..`
  panicam. `/`, `%`, `\`, `?`, `#` são percent-encoded.
- Link externo ou `#fragment` é string comum. Nav dinâmica: guarde
  `&(dyn HrefTarget + Sync)` e chame `href!(*target)`.

## 6. Erros, redirects e rewrites

```rust
use topcoat::{
    Result,
    context::Cx,
    router::{error::{SeeOther, RouterErrorExt, see_other}, href, page, route},
    view::{View, view},
};

#[page]
async fn dashboard(cx: &Cx) -> Result<impl View> {
    let user = current_user(cx).await.ok_or_unauthorized()?;
    Ok(view! { <h1>"Olá " (&user.name)</h1> })
}

#[route(POST)]
async fn login(cx: &Cx) -> Result<SeeOther> {
    // autentica e cria sessão…
    Ok(see_other(href!(dashboard).resolve(cx)))   // POST → 303
}
```

| Função | Efeito |
|---|---|
| `not_found()`, `forbidden()`, `unauthorized()`, `bad_request(msg)` | status com corpo padrão; `msg` é pública |
| `redirect(uri)` / `redirect_permanent(uri)` | 307 / 308 |
| `see_other(uri)` | 303 (PRG) |
| `internal_server_error(e)` | 500 preservando a causa no log |
| `ok_or_not_found()` etc. | converte `Option`/`Result` |

- Erro desconhecido → 500 sem vazar mensagem.
- `error_boundary` + `downcast_ref` para fallback; declare `(StatusCode::…)` no
  fallback, senão vira 200.
- `not_found!()` cria catch-all que devolve `NotFoundError` e passa pelos layouts;
  `not_found!("/")` **não** cobre `/` (catch-all exige ≥1 segmento).
- `rewrite(path, body).method(Method::GET).with(value)` redespacha sem nova request;
  contexto/cache novos, mudanças de resposta pendentes descartadas. Ciclo ou >8
  rewrites → 500. Útil para form → GET com estado (`Saved`).
- `original_uri(cx)`/`original_method(cx)` leem a request do cliente após rewrite.

## 7. Arquivos estáticos

Prefira o asset system ([`11`](./11-assets-estilo.md)) para URLs com hash. Para
arquivos com URL fixa ou criados em runtime, feature `fs`:

```rust
use topcoat::router::{RouterBuilderDirectoryExt, module_router};

let router = module_router!()
    .public_dir("./public")                       // /logo.svg → ./public/logo.svg
    // .serve_dir("/downloads/{*file}", "./files")
    .build();
```

- `public_dir` relativo ao CWD do processo e deixa `/` livre.
- `serve_dir` exige catch-all final; não casa o diretório em si.
- Traversal (`..`, `%2F`) é bloqueado, mas dotfiles são servidos e symlinks seguem
  ([`13-seguranca.md`](./13-seguranca.md)).
- `TowerRoute`/`TowerLayer` para montar serviços existentes ([`12`](./12-integracoes.md)).

## 8. Servir

```rust
let router = module_router!().discover().build();
topcoat::start(router).await.unwrap();            // HOST/PORT, default 127.0.0.1:3000
```

- `topcoat::serve(listener, router)` aceita `Listener` próprio (Unix socket etc.;
  remova o socket antigo antes de bindar).
- `Router::handle(request)` converte `Request` → `Response` sem `serve` (Cloudflare
  Worker, testes, embedding).
- Erros de duplicata, params inválidos e assets ausentes panicam no build/primeiro
  render — trate como erro de programação, não de usuário.
