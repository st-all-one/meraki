# Request e Response

> Handlers recebem `cx: &Cx` e, opcionalmente, **um** extractor de body. O tipo de
> retorno decide a resposta: uma `View` (página), um `IntoResponse`/`Json<T>`
> (API), `Sse`, `Sitemap`, `Body` ou uma tupla com status/headers.

## 1. Extratores de body

| Extrator | Content-Type | Método | `Option<T>` |
|---|---|---|---|
| `Json<T>` | `application/json` ou `application/*+json` | qualquer | `None` só sem `Content-Type`; JSON malformado → 400 |
| `Form<T>` | `application/x-www-form-urlencoded` | POST/PUT/PATCH | em GET/HEAD lê a query string; `None` só sem query |
| `Multipart` | `multipart/form-data` | POST | `None` sem Content-Type; malformado → 400 |
| `Body` | qualquer | qualquer | streaming, **sem** limite automático |
| `Js` / `Wasm` | tipos próprios | qualquer | respostas estáticas de `text/javascript`/`application/wasm` |
| `WebSocketUpgrade` | handshake | GET | 405 se não-GET; 400 se handshake inválido |

Regras:

- Apenas **um** extractor de body por handler (o body é consumido uma vez).
- `cx` pode vir antes, depois ou não vir.
- `Form` e `Json` derivam `Deserialize`; erros viram `BadRequestError`.
- `Option<T>` cobre ausência, **não** entrada malformada.
- Para upload com limite próprio, use `Multipart` + `BodyLimit` ([`12`](./12-integracoes.md)).

```rust
use serde::{Deserialize, Serialize};
use topcoat::{Result, context::Cx, router::{content::Json, route}};

#[derive(Deserialize)]
struct NewUser { name: String, email: String }

#[derive(Serialize)]
struct User { id: u64, name: String, email: String }

#[route(POST)]
async fn create_user(cx: &Cx, Json(input): Json<NewUser>) -> Result<Json<User>> {
    let user = db(cx).create(input).await?;      // sua camada
    Ok(Json(user))
}
```

## 2. Limite de body

- Default: **2 MiB** por request; excedeu → 413 (`ContentTooLargeError`).
- `Body` cru **não** é limitado (streaming). Se ler manualmente, aplique:
  `to_bytes(body, body_limit(cx))` ou um `Bytes` extractor.
- Configuração por path:

```rust
use topcoat::router::{BodyLimit, module_router};

let router = module_router!()
    .layer(BodyLimit::max(20 * 1024 * 1024).at("/upload"))
    .build();
```

- A camada mais interna vence; `BodyLimit::disable()` existe mas é opt-in.
- `multipart` conta o total de bytes entre fields, não por field.

## 3. Respostas

### Tipos comuns

| Retorno | Resultado |
|---|---|
| `impl View` (em `#[page]`) | HTML com status/headers declarados na view |
| `&'static str`, `String` | `text/plain` 200 |
| `Json<T>` | `application/json` |
| `(StatusCode, T)` | status + corpo de `T` |
| `(StatusCode, HeaderMap, T)` | status + headers + corpo |
| `Response` | resposta pronta |
| `Body` | corpo streaming |
| `Sse<S>` | `text/event-stream` |
| `Sitemap` | `application/xml` |
| `()` | 200 vazio (útil com redirect por erro) |

Tuplas: opcionais de status e headers, **body por último**. Extensões de response
também são aceitas.

```rust
use topcoat::router::{HeaderMap, StatusCode, header, response::Response};

fn created() -> (StatusCode, HeaderMap, &'static str) {
    let mut headers = HeaderMap::new();
    headers.insert(header::LOCATION, "/users/1".parse().unwrap());
    (StatusCode::CREATED, headers, "created")
}
```

### Página → resposta

- `#[page]` devolve `Result<impl View>`; o router renderiza.
- Se precisar do HTML: `view.single().await?` (`ViewExt`) e depois
  `.render(cx)`/`render_response(cx)`.
- `.single()` panic em view live; `.first()` descarta atualizações posteriores.
- `.boxed()` para unificar tipos/recursão.
- HTML renderizado para `String` **descarta** `StatusCode`/`HeaderMap` declarados
  na view.

### Status e headers na view

```rust
use topcoat::router::{HeaderValue, StatusCode, header};
use topcoat::view::view;

view! {
    (StatusCode::NOT_FOUND)
    ((header::CACHE_CONTROL, HeaderValue::from_static("no-store")))
    <h1>"Não encontrado"</h1>
}
```

- Primeiro status vence; para cada header, a primeira declaração fornece todos os
  valores.
- Layout: antes de `(slot)` sobrescreve a página; depois fornece default.
- Regras completas em [`05-views.md`](./05-views.md#7-metadados-http).

## 4. Redirects e PRG

```rust
use topcoat::{
    Result,
    context::Cx,
    router::{error::{SeeOther, redirect, see_other}, href, route},
};

#[route(POST)]
async fn save(cx: &Cx) -> Result<SeeOther> {
    // valida, grava…
    Ok(see_other(href!(dashboard).resolve(cx)))   // 303 + Location
}
```

- `see_other` (303) é o padrão após POST.
- `redirect` (307) preserva método; `redirect_permanent` (308).
- Redirect por erro: `ok_or_redirect(url)?` ou `Err(redirect(url).into())`.
- **Valide destinos** antes de usar input do usuário: os helpers não checam origem
  (`//evil.example` passa). Veja [`13-seguranca.md`](./13-seguranca.md#6-open-redirect).
- Não existe helper de redirect "seguro por padrão"; escreva um:

```rust
fn local_only(target: &str) -> Result<&str, topcoat::Error> {
    (target.starts_with('/') && !target.starts_with("//"))
        .then_some(target)
        .ok_or_else(|| topcoat::router::error::bad_request("invalid redirect").into())
}
```

## 5. Rewrites

Diferente de redirect: **não** responde 3xx; roda outro handler no servidor.

```rust
use topcoat::{Result, context::{Cx, try_request_context}, router::{Body, Method, error::rewrite, href, page, route}};

struct Saved;

#[route(POST)]
async fn save_settings(cx: &Cx) -> Result<()> {
    // grava…
    Err(rewrite(href!(settings).resolve(cx), Body::empty())
        .method(Method::GET)
        .with(Saved)
        .into())
}

#[page]
async fn settings(cx: &Cx) -> Result<impl topcoat::view::View> {
    let saved = try_request_context::<Saved>(cx).is_some();
    Ok(topcoat::view::view! {
        if saved { <p>"Salvo"</p> }
    })
}
```

Semântica:

- Path/query novos, body novo, headers preservados salvo `.headers(...)`.
- Contexto e cache novos; mudanças de resposta pendentes descartadas.
- Todas as layers casadas rodam de novo; layers pathless também.
- `with(value)` carrega valor para esta e próximas dispatchs.
- Ciclo (mesmo método+path+query) ou >8 rewrites → 500 sem detalhes.
- `original_*` mantém a request do cliente.

Use rewrite para: formulário inválido com 422 + dados preservados, A/B de rota,
alias interno, re-render pós-ação sem perder o body. Use redirect para PRG real.

## 6. API + página no mesmo app

```rust
#[route(GET)]                       // /api/health no módulo api::health
async fn health() -> Result<&'static str> { Ok("ok") }

#[route([GET, POST])]               // dois métodos
async fn both() -> Result<&'static str> { Ok("ok") }

#[route(*)]                         // qualquer método
async fn any() -> Result<&'static str> { Ok("ok") }
```

- Método específico vence `*` no mesmo path.
- Métodos diferentes no mesmo path são válidos; métodos sobrepostos panicam.
- Rotas não são envolvidas por layouts (só páginas), mas layers casadas rodam.
- Conteúdo de API não é escapado; HTML de página é.

## 7. SSE, WebSocket, multipart, sitemap

Detalhes e exemplos completos em [`12-integracoes.md`](./12-integracoes.md):

```rust
use topcoat::router::content::sse::{Event, KeepAlive, Sse};

#[route(GET)]
async fn ticks(cx: &Cx) -> Result<Sse<impl futures_util::Stream<Item = Result<Event, topcoat::Error>>>> {
    let cx = cx.clone();                         // streams não emprestam Cx
    let stream = futures_util::stream::iter(0..10).map(move |i| Ok(Event::default().data(i)));
    Ok(Sse::new(stream).keep_alive(KeepAlive::new()))
}
```

- Não é possível mudar status/headers depois que o streaming começou.
- SSE/WebSocket precisam de `Cx` clonado; `+ use<>` evita captura implícita.
- WebSocket: autentique **antes** de `on_upgrade`.
- Multipart: consuma/descarte cada field antes de pedir o próximo.

## 8. Armadilhas

| Sintoma | Causa | Correção |
|---|---|---|
| 400 em `Json` | falta `Content-Type: application/json` | envie o header ou use `Option<Json>` |
| `Option<Json>` ainda 400 | body malformado não é "ausente" | trate erro no handler/extractor |
| 413 em upload | limite global 2 MiB | `BodyLimit::max(n).at("/upload")` |
| `Form` vazio em GET | extractor lê query em GET | envie query string |
| redirect inesperado | `redirect` é 307 | use `see_other` para PRG |
| view sem status | renderizou para `String` | use `render_response`/`.single()` |
| body grande sem limite | leu `Body` cru | `to_bytes(body, body_limit(cx))` |
| 405 em WebSocket | método não-GET | use GET + upgrade |
