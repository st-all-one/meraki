# Testes

> Topcoat não traz um test client dedicado, mas expõe tudo o que é preciso:
> `Router::handle(Request) -> Response` para testes HTTP e `Cx::new`/`Cx::default`
> para render puro. Testes de render são rápidos e determinísticos.

## 1. Testar uma renderização

```rust
use std::sync::Arc;
use topcoat::{
    context::{AppContext, Cx},
    view::{ViewExt, view},
};

#[tokio::test]
async fn escaping_is_applied() {
    let mut app = AppContext::new();
    app.insert(Config { site: "Teste" });

    let cx = Cx::new(Arc::new(app));
    let html = view! {
        cx =>
        <p>("<script>alert(1)</script>")</p>
    }
    .single()
    .await
    .unwrap()
    .render(&cx);

    assert!(html.contains("&lt;script&gt;"));
    assert!(!html.contains("<script>"));
}
```

- `Cx::default()` quando não há app context.
- `AppContext::new()` + `insert(value)` para app context sem router.
- `.single().await?` resolve views não-live; `.render(cx)` devolve `String`.
- Para testar um componente específico, chame-o dentro de `view! { cx => component(..) }`.
- `ViewHandle::render(cx)` (após `.single()`) é síncrono.

Com vários valores, prefira `CxTestBuilder`:

```rust
use topcoat::context::CxTestBuilder;

let cx = CxTestBuilder::new()
    .app_context(Config { site: "Teste" })
    .request_context(Locale::default())
    .build();
```

Ele registra app/request context sem router e é o mesmo utilitário usado nos
testes internos do framework.

Limite: views com `live!`/`suspense` são live; `.single()` panic. Para esses casos,
teste via HTTP (abaixo) ou use `.first()` e valide o primeiro frame.

## 2. Testar HTTP com `Router::handle`

```rust
use topcoat::router::{Body, HeaderMap, Method, Router, StatusCode, request::Request, to_bytes};

async fn call(
    router: &Router,
    method: Method,
    uri: &str,
    body: impl Into<Body>,
) -> (StatusCode, HeaderMap, String) {
    let request: Request = Request::builder()
        .method(method)
        .uri(uri)
        .body(body.into())
        .unwrap();

    let response = router.handle(request).await;
    let (parts, body) = response.into_parts();
    let bytes = to_bytes(body, usize::MAX).await.unwrap();
    (parts.status, parts.headers, String::from_utf8_lossy(&bytes).into_owned())
}
```

```rust
#[tokio::test]
async fn health_returns_ok() {
    let router = crate::app::router().build();
    let (status, _, body) = call(&router, Method::GET, "/api/health", Body::empty()).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, "ok");
}
```

- `Router::handle` **não** aplica o servidor HTTP real; aplica router, layers,
  origin policy, páginas e stream.
- Corpo de resposta: `response.into_parts()` + `to_bytes(body, limit)`.
- Para testar JSON: envie `Body::from(json)` + header `content-type`.
- Para formulários: `serde_urlencoded` ou body `"a=1&b=2"` + content-type.
- `handle_with(request, values)` injeta valores de request context iniciais
  (útil para simular valores injetados por layer).

### Cookies e sessão

```rust
let (_, headers, _) = call(&router, Method::POST, "/login", Body::from("…")).await;
let cookie = headers.get("set-cookie").unwrap().to_str().unwrap();

let request = Request::builder()
    .method(Method::GET)
    .uri("/account")
    .header("cookie", cookie)
    .body(Body::empty())
    .unwrap();
let response = router.handle(request).await;
assert_eq!(response.status(), StatusCode::OK);
```

- Não há cookie jar automático no cliente de teste; repasse `set-cookie`.
- Teste também o caso **sem** cookie e com cookie inválido.
- Para CSRF, envie `sec-fetch-site: cross-site` e espere 403.

## 3. O que testar (prioridade)

| Área | Caso |
|---|---|
| Auth | página protegida sem sessão → 303/401; com sessão → 200 |
| Shards | endpoint sem sessão → 401/403; args inválidos → 400 |
| Procedures | autorização por recurso; erro de negócio vs erro HTTP |
| Escaping | input `<script>` em texto e atributo |
| URLs | `href!` resolve o path esperado; params inválidos panicam no build |
| Erros | 404 com layouts; `error_boundary` mantém status |
| PRG | POST válido → 303 + Location; inválido → 422/400 |
| Body limit | payload > 2 MiB → 413 |
| Cookies | atributos Secure/HttpOnly/SameSite; remoção com path |
| Sessão | rotação revoga o token antigo; expiração rejeitada |
| Assets | URL contém hash; conteúdo servido com cache imutável |
| i18n | locale negociado; chave Fluent presente |
| Streaming | primeiro frame contém fallback; última emissão vence |

Não escreva testes que só verificam que "compila" ou que o body não está vazio.
Prefira invariantes observáveis.

## 4. Testar shards/procedures

Endpoints gerados são POST em `/_topcoat/runtime/...`. Prefira **path explícito**
para testes estáveis:

```rust
#[shard("/api/search/results")]
async fn results(cx: &Cx, query: String) -> Result<impl View> { … }
```

```rust
let body = serde_json::json!({ "args": { "query": "x" }, "signals": {} });
let request = Request::builder()
    .method(Method::POST)
    .uri("/api/search/results")
    .header("content-type", "application/json")
    .body(Body::from(body.to_string()))
    .unwrap();
```

Formato exato do envelope (args/signals/identity) é interno; se depender dele,
congele um teste de contrato e revise ao atualizar o framework.

## 5. Testar e-mail

```rust
use topcoat::mail::{MailConfig, MemoryTransport, RouterBuilderMailExt};

let transport = MemoryTransport::new();
let router = crate::app::router()
    .mail(MailConfig::builder().transport(transport.clone()).build())
    .build();

call(&router, Method::POST, "/contact", Body::from("…")).await;
assert_eq!(transport.sent().len(), 1);
```

- `FileTransport` para inspecionar `.eml` manualmente.
- Não teste entrega real em CI.

## 6. Testar com app real

- `demos/admin` tem apenas teste de sincronização do registry e um teste de
  formatação — **sem HTTP/e2e**. Não é modelo suficiente para auth.
- `examples/*` são aplicáveis: cada um é uma app pequena; extraia `router()` para
  `pub` e teste com `handle`.
- Para browser/e2e, use Playwright/Ferramentas externas; o runtime não expõe um
  test harness próprio.

## 7. CI

```sh
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --workspace
topcoat fmt --check
topcoat l10n check
```

- `topcoat fmt --check` é obrigatório se o projeto usa macros formatadas.
- Testes de render puro rodam sem servidor e são os mais baratos.
- Testes HTTP com `handle` cobrem layers/origin sem abrir socket.
- Um smoke manual (`topcoat dev` + navegar) continua necessário para streaming,
  runtime e assets.

## 8. Armadilhas

| Armadilha | Causa | Correção |
|---|---|---|
| teste de página falha com panic de `.single()` | view live | teste por HTTP/`.first()` |
| 403 em todo POST de teste | sem `sec-fetch-site`/`Origin` e política estrita | envie header same-origin |
| cookie não persiste | cliente de teste sem jar | repasse `set-cookie` |
| 404 em shard | sem `.discover()` no router de teste | registre |
| asset 404 | sem bundle no perfil de teste | `AssetBundle::load_dir` de fixture |
| locale ausente | layer não aplicada no router de teste | registre a layer |
| teste depende de relógio | sessão/expx | injete clock ou use margem |
