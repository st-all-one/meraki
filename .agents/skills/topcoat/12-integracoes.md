# Integrações e protocolos

> Todas seguem o mesmo padrão: declarar/retornar um tipo, carregar o script do
> cliente quando houver, e lembrar que **autorização não é herdada**.

## 1. Visão geral

| Integração | Feature | O que faz | Script cliente |
|---|---|---|---|
| htmx | `htmx` | troca fragmentos via `hx-*` | htmx 2.x |
| Alpine AJAX | `alpine-ajax` | troca alvos `x-target` | alpine-ajax + Alpine |
| Datastar | `datastar` | sinais + patches SSE | datastar (module) |
| SSE | `sse` | stream unidirecional | `EventSource` |
| WebSocket | `websocket` | duplex | nativo |
| Multipart | `multipart` | upload streaming | form HTML |
| Sitemap | `sitemap` | XML para crawlers | — |
| Tower | `tower` | montar serviços/middleware | — |
| FS | `fs` | diretório estático | — |

## 2. htmx

```rust
use topcoat::{
    Result,
    context::Cx,
    htmx::{HxRetarget, HxReswap, SwapOption, hx_request},
    router::{Slot, href, layout, route},
    view::{View, ViewExt, ViewHandle, view},
};

// O layout decide entre documento completo e fragmento.
#[layout]
async fn root(cx: &Cx, slot: Slot<'_>) -> Result<impl View> {
    Ok(view! {
        if hx_request(cx) {
            (slot)
        } else {
            <!DOCTYPE html>
            <html>
                <head>
                    <script src=(topcoat::asset::asset!("https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"))></script>
                </head>
                <body><main>(slot)</main></body>
            </html>
        }
    })
}

#[route(POST "/counter")]
async fn increment(cx: &Cx) -> Result<(HxRetarget, HxReswap, ViewHandle)> {
    let body = view! { cx => <span id="count">(next_count(cx).await?)</span> }
        .single()
        .await?;
    Ok((
        HxRetarget::from("#count"),
        HxReswap(SwapOption::OuterHtml),
        body,
    ))
}
```

```rust
view! {
    <form hx-post=(href!(increment)) hx-target="#count" hx-swap="outerHTML">
        <span id="count">(count)</span>
        <button>"+1"</button>
    </form>
}
```

- `hx_request(cx)` distingue fragmento de página; o layout é o lugar natural para
  ramificar.
- `HxRetarget`, `HxReswap(SwapOption)`, `HxResponseTrigger::{receive, after_swap}`
  implementam `IntoResponseParts`: vão **antes do body** numa tupla de resposta.
- `HxResponseTrigger::receive(["item-saved"])` (iterável de eventos).
- `hx_target(cx)` lê o alvo; `header` expõe nomes `HX-*`.
- Carregue htmx 2.x você mesmo; `topcoat::dev::script()` é só hot reload.
- **Fragmento é endpoint**: revalide sessão/autorização em cada handler.
- Erros: retorne status 4xx/5xx e trate `hx-target-error` no cliente.

## 3. Alpine AJAX

```rust
use topcoat::{
    Result,
    context::Cx,
    router::{href, route},
    view::{View, ViewExt, ViewHandle, view},
};

#[route(POST "/counter")]
async fn increment(cx: &Cx) -> Result<ViewHandle> {
    view! { cx => <span id="count">(next_count(cx).await?)</span> }
        .single()
        .await
}
```

```rust
view! {
    <form x-target="count" x-post=(href!(increment))>
        <span id="count">(count)</span>
        <button>"+1"</button>
    </form>
}
```

- `ajax_request(cx)` + `ajax_targets(cx)`/`ajax_target(cx, id)` escolhem o fragmento
  quando o handler serve página e update.
- Carregue `alpine-ajax` **antes** de Alpine, ambos `defer`.
- Erros de validação: status 422 + `x-target.422` no cliente.
- `x-sync` atualiza alvos fora da área trocada.
- Fallback sem JS: `see_other` (PRG).

## 4. Datastar

```rust
use futures_util::stream;
use serde::{Deserialize, Serialize};
use topcoat::{
    Result,
    context::Cx,
    datastar::{ElementPatchMode, PatchElements, PatchSignals, Signals},
    router::{content::sse::{Event, Sse}, route},
    view::{ViewExt, view},
};

#[derive(Default, Serialize, Deserialize)]
struct Counter { count: u64 }

#[route(POST)]
async fn increment(
    cx: &Cx,
    Signals(counter): Signals<Counter>,
) -> Result<Sse<impl futures_core::Stream<Item = Result<Event>> + use<>>> {
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

- `Signals<T>` é uma tupla pública: extraia com `Signals(value)`.
- Lê do parâmetro `datastar` em GET e do body nos demais métodos.
- `PatchElements::{new(html), remove(selector), selector, mode}`;
  `PatchSignals::{json, only_if_missing}`; `ExecuteScript` para JS.
- Devolver `PatchElements`/`PatchSignals` emite **um** evento e fecha. Para vários
  patches, devolva `Sse` como acima.
- `Option<Signals>` só é `None` sem header; signals malformados ainda erram.
- Carregue `datastar` 1.x como `type="module"`.
- Feature `datastar` liga `sse`.
- Mesma ressalva: cada endpoint revalida auth; fragmentos não herdam guards.

## 5. SSE

```rust
use topcoat::{
    Result,
    context::Cx,
    router::{content::sse::{Event, KeepAlive, Sse}, route},
};

#[route(GET "/events")]
async fn events(cx: &Cx) -> Result<Sse<impl futures_util::Stream<Item = Result<Event>>>> {
    let last = topcoat::router::content::sse::last_event_id(cx).map(str::to_owned);
    let cx = cx.clone();
    let stream = async_stream::stream! {
        let mut i = last.and_then(|v| v.parse().ok()).unwrap_or(0);
        loop {
            i += 1;
            yield Ok(Event::default().id(i.to_string()).data(format!("tick {i}")));
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
    };
    Ok(Sse::new(stream).keep_alive(KeepAlive::new()))
}
```

- `Event` tem `event`, `id`, `data`, `json_data`, `retry`.
- `last_event_id(cx)` permite retomar após reconexão.
- Não empreste `Cx` no stream: clone e mova; use `+ use<>`.
- Status/headers não mudam após o primeiro byte.
- `KeepAlive` evita timeouts de proxies; SSE fica fora da compressão.
- Desligue buffering no proxy.

## 6. WebSocket

```rust
use topcoat::{
    Result,
    context::Cx,
    router::{content::websocket::{Message, WebSocket, WebSocketUpgrade}, route},
};

#[route(GET "/ws")]
async fn ws(cx: &Cx, upgrade: WebSocketUpgrade) -> Result<WebSocketUpgrade> {
    let user = require_user(cx).await?.clone();     // ANTES do upgrade
    Ok(upgrade.on_upgrade(move |socket: WebSocket| async move {
        while let Some(Ok(msg)) = socket.recv().await {
            if msg.is_text() {
                let _ = socket.send(Message::text(msg.to_text().unwrap())).await;
            }
        }
    }))
}
```

- Autentique **antes** de `on_upgrade`; o callback roda em outra task, sem `&Cx`
  emprestado.
- `protocols([..])` para subprotocolos; limites de mensagem/frame configuráveis.
- `Message`, `CloseFrame`, split `Stream`+`Sink` para leitura/escrita concorrentes.
- Não há WebSockets no runtime Cloudflare Worker.
- Status de erro antes do upgrade (401/403) é possível; depois, só fechar.

## 7. Multipart

```rust
use topcoat::{
    Result,
    router::{BodyLimit, content::multipart::Multipart, route},
};

#[route(POST)]
async fn upload(mut form: Multipart) -> Result<String> {
    let mut total = 0usize;
    while let Some(field) = form.next_field().await? {
        let name = field.name().unwrap_or("").to_owned();
        total += field.bytes().await?.len();
        println!("{name}: {total} bytes");
    }
    Ok(format!("{total} bytes"))
}
```

- Leia/descarte cada field antes do próximo.
- `bytes`, `text`, `chunk` para streaming; o limite global (2 MiB) vale para o total.
- Aumente por rota: `.layer(BodyLimit::max(20 << 20).at("/upload"))`.
- Malformado → 400; excedido → 413.
- Nome do arquivo vem do cliente: sanitize antes de tocar no FS.

## 8. Sitemap

```rust
use topcoat::{
    Result,
    router::{content::sitemap::Sitemap, route},
};

#[route(GET "/sitemap.xml")]
async fn sitemap() -> Result<Sitemap> {
    Ok(Sitemap::new()
        .url("https://example.com/")
        .url("https://example.com/about"))
}
```

- URLs relativas exigem `.base_url(..)` no router; senão panic no render.
- `SitemapUrl` adiciona `last_modified`, `change_frequency`, `priority`.
- Retorne com `Content-Type` XML (o tipo já faz).

## 9. Tower

```rust
use topcoat::router::{
    Method,
    tower::{TowerLayer, TowerRoute},
};

let router = module_router!()
    // serviço montado em um path (URI completo é repassado)
    .route(TowerRoute::new(Method::GET, "/legacy", axum_app))
    // middleware Tower como layer
    .layer(TowerLayer::new(tower_http::trace::TraceLayer::new()))
    .build();
```

- `TowerRoute::new(methods, path, service)`; `TowerRoute::any(path, service)` para
  todos os métodos.
- `TowerLayer` roda middleware Tower como layer; `TowerService` expõe Topcoat como
  serviço Tower.
- URI completo é repassado; `StripPrefixLayer` é opt-in.
- Um `RemoteAddr` precisa ser inserido manualmente ao usar `TowerService`.
- Retry middleware não é suportado (uma chamada interna por request).
- Catch-all não cobre o path do próprio prefixo; registre-o separado.

### CORS

Topcoat não tem helper nativo; use `tower-http` via `TowerLayer` (feature `tower`):

```rust
use topcoat::router::{Method, header, tower::TowerLayer};
use tower_http::cors::{AllowOrigin, CorsLayer};

let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::list([
        "https://app.example".parse()?,
    ]))
    .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
    .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
    .allow_credentials(true);

let router = module_router!()
    .layer(TowerLayer::new(cors))
    .build();
```

- O middleware responde ao **preflight** `OPTIONS`; sem ele, o router devolve 405.
- `CorsLayer::permissive()` só em dev: com `allow_credentials(true)` valide
  origens explicitamente e nunca use `Any` em produção.
- CORS não é CSRF: o navegador bloqueia leitura, mas a mutação pode ocorrer.
  Mantenha `OriginPolicy`/sessão.
- Em rotas públicas de API, limite origens por ambiente e exponha só headers
  necessários.

## 10. FS

```rust
use topcoat::router::{RouterBuilderDirectoryExt, module_router};

let router = module_router!()
    .public_dir("./public")
    // .serve_dir("/downloads/{*file}", "./files")
    .build();
```

- Feature `fs`; CWD do processo como base.
- `public_dir` deixa `/` livre; `serve_dir` exige catch-all final.
- Traversal bloqueado; dotfiles servidos e symlinks seguem — não aponte para
  diretórios com segredos.

## 11. Regras transversais

1. **Autorização**: fragmentos, SSE, WebSocket, multipart e procedures são
   endpoints. Revalide por recurso.
2. **CSRF**: `OriginPolicy` cobre métodos unsafe cross-origin; não cobre GET nem
   requests sem `Origin`/`Sec-Fetch-Site`.
3. **Body limit**: 2 MiB default; ajuste por rota.
4. **CSP**: htmx/Datastar/Alpine adicionam scripts; o runtime usa inline +
   `new Function` ([`13`](./13-seguranca.md)).
5. **Proxy**: desligue buffering para SSE/WS; configure `TrustedProxies` se usar IP.
6. **Testes**: exercite o fragmento e a página completa ([`15`](./15-testing.md)).
