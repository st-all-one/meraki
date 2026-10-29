# Contexto (`Cx`), estado e memoização

> `Cx` é o handle clonável da requisição. Ele dá acesso à request HTTP, aos
> valores de aplicação (por tipo), aos valores de request (por escopo) e ao cache
> de memoização do request.

## 1. O que é `Cx`

- Um handle `Clone` para estado compartilhado por tudo que serve uma request.
- **Keyed por tipo Rust exato**: um valor por tipo. Dois `String` colidem; use
  newtypes (`struct TenantId(String)`).
- Valores de app: `Send + Sync + 'static`, sem `Clone` obrigatório.
- Valores de request: anexados com `cx.with(..)`; visíveis só no escopo filho.
- Compartilha identidade (`Cx::id`), cache de memoize e cookies.

```rust
pub struct Database(pub sqlx::PgPool);

fn db(cx: &Cx) -> &Database {
    topcoat::context::app_context::<Database>(cx)   // panic se não registrado
}
```

Registre no router:

```rust
let router = module_router!()
    .app_context(Database(pool))
    .app_context(Config::from_env()?)
    .build();
```

`app_context` duplicado no mesmo router → panic.

## 2. Helpers de request

```rust
use topcoat::{
    context::Cx,
    router::request::{headers, method, uri, parts, extensions, original_uri},
};

fn summary(cx: &Cx) -> String {
    let ua = headers(cx).get("user-agent")
        .and_then(|v| v.to_str().ok()).unwrap_or("?");
    format!("{} {} ({ua})", method(cx), uri(cx).path())
}
```

| Helper | Retorno |
|---|---|
| `headers(cx)` | `&HeaderMap` |
| `method(cx)`, `uri(cx)` | método/URI atuais (após rewrite) |
| `parts(cx)` | method, uri, version, headers juntos |
| `extensions(cx)` | extensões tipadas da request |
| `original_*` | request como o cliente enviou |
| `client_ip(cx)` | IP confiável (só com `TrustedProxies`) |
| `remote_addr(cx)` | peer direto (proxy, se houver) |

`client_ip` ignora `X-Forwarded-For` salvo configuração explícita:

```rust
use topcoat::router::{TrustedProxies, ForwardedHeader};

let router = module_router!()
    .trusted_proxies(TrustedProxies::new().networks(["10.0.0.0/8"]))
    .build();
```

`nearest(n)` é posicional: use só se **todos** os requests passarem pelos mesmos N
proxies; caso contrário, um cliente pode forjar o header.

## 3. App context vs request context

| | App | Request |
|---|---|---|
| Registro | `.app_context(v)` no router | `cx.with(v)` / `cx.with_many([..])` |
| Escopo | toda a aplicação | request/layer/escopo filho |
| Leitura | `app_context::<T>(cx)` / `try_app_context` | `request_context::<T>(cx)` / `try_request_context` |
| Ausente | panic (ou `None` no `try_`) | panic (ou `None` no `try_`) |
| `#[memoize]` rastreia | não | sim (bindings observados) |

```rust
use topcoat::context::{Cx, request_context};

#[derive(Clone)]
pub struct Tenant(pub String);

fn tenant(cx: &Cx) -> &Tenant {
    request_context::<Tenant>(cx)
}

#[layer]
async fn resolve_tenant(cx: &Cx, body: Body, next: Next<'_>) -> Result<Response> {
    let tenant = Tenant(host_to_tenant(cx));
    next.run(&cx.with(tenant), body).await
}
```

Propriedades de `with`:

- Substitui o tipo **no filho**; o pai mantém o valor original.
- Herda app context, cookies, identidade e cache.
- `with_many` é açúcar para vários `with`.
- Registro dentro do corpo de uma função memoizada **não** conta como dependência.

## 4. Funções, não middlewares

Topcoat desencoraja "middleware de autorização por grupo". O padrão é uma função
guard que qualquer superfície chama:

```rust
use topcoat::{
    Result,
    context::{Cx, memoize},
    router::{error::RouterErrorExt, href},
};

pub struct User {
    pub id: u64,
    pub name: String,
}

#[memoize(as_ref)]
pub async fn current_user(cx: &Cx) -> Result<Option<User>> {
    let Some(hash) = topcoat::session::token_hash(cx).await? else {
        return Ok(None);
    };
    // sua busca: valide existência E expiração
    load_session_user(cx, &hash).await
}

pub async fn require_user(cx: &Cx) -> Result<&User> {
    let user = current_user(cx).await?;
    Ok(user.ok_or_redirect(href!(login).resolve(cx))?)
}
```

Por que:

- Funciona em página, layout, componente, shard, procedure, fragmento htmx e
  callback de WebSocket.
- `#[memoize]` garante **uma** consulta por request mesmo com layout + página +
  componente pedindo o usuário.
- Um `#[layer]` "protegendo `/admin/*`" **não** protege shards/procedures (paths
  diferentes) nem GET que muda estado.

Layers continuam úteis para: locale, tenant, request id, timing, headers comuns.

## 5. `#[memoize]`

```rust
use topcoat::context::{Cx, memoize};

#[memoize]
async fn get_user(cx: &Cx, id: i64) -> User {
    db::load_user(id).await
}

#[memoize(as_ref)]
async fn find_post(cx: &Cx, slug: &str) -> Result<Post> {
    db::find_post(slug).await
}
```

Semântica:

- Cache **por request**; nunca entre requests.
- Chave: hash dos argumentos (exceto `cx`) + identidade da função; **sem igualdade**
  — `Hash` custom incompleto pode reusar valor errado.
- Requisitos: parâmetro literal `cx: &Cx`, sem `self`, args `Hash`, retorno
  `Send + Sync + 'static`.
- Retorno muda: `T` → `&T`; com `as_ref`, `Option<T>` → `Option<&T>`,
  `Result<T, E>` → `Result<&T, &E>`.
- Chamadas async concorrentes com a mesma chave compartilham **um** futuro.
- Recursão com os mesmos argumentos panic (evita deadlock); com argumentos
  diferentes, cada um tem entrada própria.
- Bindings de request context **observados** (inclusive `None`) condicionam o
  reuso; dependências propagam por chamadas memoizadas aninhadas.
- App context não é rastreado (não muda por request).
- `identity()`/`element_id()`/`signal()` dentro de memoized panic (sem escopo de
  render).
- Args são hasheados, não clonados; `&str` não aloca entrada.

Quando usar: lookup de usuário/sessão, config parseada, chamadas de rede repetidas
por layout+página, contagens. Não use para dados que precisam persistir entre
requests (use cache próprio) nem para "mutar uma vez" (o valor é compartilhado).

## 6. Trabalho que sobrevive ao handler

```rust
#[route(POST)]
async fn enqueue(cx: &Cx) -> Result<&'static str> {
    let cx = cx.clone();                       // handle owned
    tokio::spawn(async move {
        let db = topcoat::context::app_context::<Database>(&cx);
        record(db, "queued").await;
    });
    Ok("queued")
}
```

- O router descarta o handle dele ao enviar a resposta; clone para stream/spawn.
- Um `Cx` clonado continua lendo contexto depois do handler, mas **não** altera
  headers já enviados.
- Escrita de cookie depois de o jar ser selado → panic ([`09`](./09-cookies-sessoes.md)).
- Para streaming, clones de `Cx` são o caminho; use `+ use<>` em closures/streams
  para não capturar contexto implícito ([`07`](./07-streaming.md)).

## 7. Cookies e contexto

`cookies(cx)` devolve o jar da request, registrado por `.cookies()`. Sem a layer,
panic. O jar também vive no `Cx` e é compartilhado por todos os clones.

## 8. Armadilhas

| Armadilha | Efeito | Correção |
|---|---|---|
| `app_context::<T>` sem registro | panic → 500 | registre no router ou use `try_` |
| Dois valores do mesmo tipo | panic no registro | newtypes |
| Contar com herdado em layer | valor não aparece na página | passe `&cx.with(v)` a `next.run` |
| `cx.with` esperando mudar o pai | não muda | derive filho e use-o |
| `#[memoize]` com `Hash` incompleto | resultado errado | derive `Hash` em todos os campos relevantes |
| `memoize` de `Result<T, E>` sem `as_ref` | recebe `&Result` | use `as_ref` para `?` |
| Chamar `identity()` em helper fora de render | panic | receba `&Cx` derivado (`cx.keyed`) |
| `client_ip` sem `TrustedProxies` | `None` ou peer | configure proxies |
