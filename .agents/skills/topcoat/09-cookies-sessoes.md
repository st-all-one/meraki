# Cookies e sessões

> Cookies passam por um jar por request, registrado com `.cookies()`. Sessões
> implementam o ciclo de token sobre cookies (ou transporte próprio): o app guarda
> apenas o hash, nunca o token.

## 1. Jar de cookies

```rust
use topcoat::router::module_router;
use topcoat::cookie::RouterBuilderCookieExt;

let router = module_router!()
    .cookies()
    .build();
```

```rust
use topcoat::{
    Result,
    context::Cx,
    cookie::{Cookie, Cookies, cookies},
    router::route,
};

#[route(POST)]
async fn toggle_theme(cx: &Cx) -> Result<String> {
    let jar = cookies(cx);
    let next = match jar.get("theme") {
        Some(c) if c.value() == "dark" => "light",
        _ => "dark",
    };
    jar.add(Cookie::build(("theme", next)).path("/").build());
    Ok(next.to_owned())
}
```

- `cookies(cx)` panic sem a layer `.cookies()`.
- `get` vê mudanças pendentes; `add` enfileira `Set-Cookie`; `remove` enfileira
  expiração.
- Escritas acontecem ao final do handler e **sobrevivem** a erro/redirect.
- Depois que o streaming começa, o jar é selado: `add`/`remove`/`commit` **panicam**;
  ler continua funcionando.
- `remove` precisa do mesmo nome/path/domain usados na escrita.
- `add` aceita `(nome, valor)` quando não precisa de atributos.

## 2. Atributos e defaults

O jar puro **não** aplica `Secure`/`HttpOnly`/`SameSite`/`Path`. Centralize:

```rust
use topcoat::{
    context::Cx,
    cookie::{Cookies, SameSite},
};

pub fn cookies(cx: &Cx) -> impl Cookies {
    topcoat::cookie::cookies(cx)
        .default_secure(true)
        .default_http_only(true)
        .default_same_site(SameSite::Lax)
        .default_path("/")
}
```

- `default_*` preenche só o que o cookie não define.
- `override_*` força o valor, ignorando o cookie.
- `map(|c| …)` aplica uma transformação a cada cookie.
- Use `override_*` para garantia; `default_*` quando o chamador pode escolher.

### `cookie!`

```rust
use topcoat::cookie::{Cookie, SameSite, cookie, time::Duration};

let c: Cookie = cookie!("theme" = "dark");

let session: Cookie = cookie! {
    "session" = "abc123";
    Path = "/";
    Secure;
    HttpOnly;
    SameSite = Lax;
    MaxAge = Duration::hours(1)
};
```

## 3. Prefixos RFC 6265bis

| Adaptador | Prefixo | Exige |
|---|---|---|
| `prefix_host` / `override_prefix_host` | `__Host-` | `Secure`, `Path=/`, sem `Domain` |
| `prefix_secure` / `override_prefix_secure` | `__Secure-` | `Secure` |

- Aceitam nome nu ou já prefixado ao ler/escrever/remover; devolvem nome nu.
- `override_*` garante os atributos; `default_*` só preenche.
- `__Host-` é o escopo mais forte: host exato, sem subdomínios, HTTPS.

## 4. Cookies assinados e privados

```rust
use topcoat::cookie::{Cookies, Key, cookie, cookies};

let key = Key::generate();
let signed = cookies(cx).signed(&key);      // autentica; cliente lê
signed.add(cookie!("user_id" = "42"));
let user_id = signed.get("user_id");        // None se ausente/adulterado

let private = cookies(cx).private(&key);    // cifra + autentica
private.add(cookie!("session" = "segredo"));
let value = private.get("session");         // None se ausente/adulterado
```

- Assinado ≠ secreto: o valor continua legível pelo cliente.
- Privado protege leitura e alteração.
- Ambos devolvem `None` para ausente **ou** inválido (não distinga).
- Podem ser combinados com prefixos/defaults.

### Chave compartilhada

```rust
use topcoat::{
    cookie::{Key, RouterBuilderCookieExt},
    router::{module_router, RouterBuilderDiscoverExt},
};

let router = module_router!()
    .discover()
    .cookies()
    .app_context(load_key()?)          // persistida, não gerada por arranque
    .build();
```

```rust
use topcoat::cookie::{Cookies, cookie, private_cookies};

private_cookies(cx).add(cookie!("session" = "segredo"; Path = "/"));
```

- `private_cookies(cx)`/`signed_cookies(cx)` exigem `Key` em app context; **panic**
  sem ela.
- O **mesmo tipo `Key`** é lido pelas duas funções: não há separação nativa por
  finalidade. Se precisar de chaves distintas, construa os jars explicitamente em
  funções próprias em vez de usar os helpers.
- `Key::generate()` a cada arranque invalida todos os cookies entre restarts e
  instâncias. Carregue de env/secret manager/arquivo com permissão restrita.
- Rotação de chave não é automática: mantenha duas chaves durante a transição e
  reescreva os cookies no próximo request.

### Cookie store tipado

```rust
use serde::{Deserialize, Serialize};
use topcoat::{
    Result,
    context::Cx,
    cookie::{cookie_store, private_cookies},
    router::route,
};

#[derive(Default, Serialize, Deserialize)]
struct Cart { items: Vec<String> }

#[route(POST)]
async fn add_item(cx: &Cx) -> Result<String> {
    let mut cart = cookie_store::<Cart, _>(private_cookies(cx), "cart")
        .parse_or_default()
        .update(|c| c.items.push("novo".into()))
        .commit()?;
    Ok(format!("{} itens", cart.items.len()))
}
```

- Serializa JSON em um cookie; use jar privado/assinado, nunca o puro.
- `parse_or_default` confunde ausente com corrompido.
- Sem `commit()`, nada é gravado; `rollback` descarta.
- Cuidado com tamanho: cookie tem limite (~4 KB por cookie no browser).

## 5. Sessões

Modelo:

- Token de **32 bytes** CSPRNG, enviado pelo cliente.
- O app guarda `TokenHash` (SHA-256), user id e expiração. **Nunca** o token bruto.
- Cookie default: `__Host-session`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`.
- Lifetime default: 30 dias.

Setup:

```rust
use topcoat::{
    cookie::RouterBuilderCookieExt,
    router::module_router,
    session::{RouterBuilderSessionExt, SessionConfig},
};

let router = module_router!()
    .cookies()
    .sessions(SessionConfig::default())
    .build();
```

### Ciclo

```rust
use topcoat::session;

// login
let session = session::start(cx).await?;        // token novo (anti-fixation)
persist(user.id, session.token_hash, session.expires_at).await?;

// request
let Some(hash) = session::token_hash(cx).await? else { return Ok(None) };
let user = load_user(cx, &hash).await?          // valide existência E expiração
    .filter(|s| s.expires_at > now());

// logout
if let Some(hash) = session::stop(cx).await? {
    delete_session(cx, hash).await?;
}

// sliding expiration
if let Some(s) = session::refresh(cx).await? {
    update_expiry(cx, s.token_hash, s.expires_at).await?;
}

// escalada/rotação
if let Some(r) = session::rotate(cx).await? {
    delete_session(cx, r.revoked).await?;
    persist(r.session.token_hash, r.session.expires_at).await?;
}
```

Regras:

- `token_hash` **não valida** nada: só devolve o hash do token apresentado.
- `start` sempre gera token novo; não reaproveite token de pré-login.
- `start` não apaga sessões antigas do mesmo usuário.
- `refresh` mantém o token e devolve novo `expires_at`; persista.
- `rotate` devolve `{ revoked, session }`; sem apagar `revoked`, o token antigo
  continua válido.
- `stop` só limpa a sessão atual; para revogar todas, apague os registros.
- Sessões dependem de cookies: `.cookies()` + `.sessions(..)`.
- Mudanças de sessão escrevem cookies: faça antes do streaming.

### Configuração

```rust
use std::time::Duration;
use topcoat::session::{SessionConfig, cookie::CookieTokenStore};

let config = SessionConfig::builder()
    .token_store(CookieTokenStore::new().name("id"))   // vira __Host-id
    .lifetime(Duration::from_hours(24 * 14))
    .build();
```

`lifetime` vira `Max-Age` do cookie e `expires_at` do registro.

### Transporte customizado

Implemente `TokenStore::{read, write, delete}` para usar `Authorization: Bearer`
(ou outro transporte). `Token::encode`/`Token::decode` usam base64 URL-safe. O
armazenamento continua sendo seu.

## 6. Autenticação recomendada

```rust
use topcoat::{
    Result,
    context::{Cx, memoize},
    router::error::RouterErrorExt,
    session,
};

#[memoize(as_ref)]
pub async fn current_user(cx: &Cx) -> Result<Option<User>> {
    let Some(hash) = session::token_hash(cx).await? else {
        return Ok(None);
    };
    load_valid_session(cx, &hash).await
}

pub async fn require_user(cx: &Cx) -> Result<&User> {
    let user = current_user(cx).await?;
    Ok(user.ok_or_unauthorized()?)
}
```

- Chame `require_user` em páginas, layouts, **shards, procedures, fragmentos e WS**.
- `#[memoize]` evita N lookups por request.
- Não use só `#[layer("/admin")]`: shards/procedures têm path próprio.
- `SameSite=Lax` + mutação apenas por métodos unsafe; `OriginPolicy` cobre o resto
  ([`13`](./13-seguranca.md)).
- Não autentique por GET que muda estado.

## 7. Armadilhas

| Sintoma | Causa | Correção |
|---|---|---|
| cookie não chega | jar puro sem `Path=/` | helper com defaults |
| cookie sumiu em produção | `Secure` sem HTTPS / host diferente | HTTPS + `__Host-` |
| `remove` não apaga | path/domain diferentes | use os mesmos da escrita |
| panic ao escrever cookie | streaming já começou | escreva antes de retornar a view |
| cookie adulterado aceito | jar puro/assinado usado como privado | use `private` |
| sessão válida após logout | `stop` sem apagar registro | delete por hash |
| todos deslogados no deploy | `Key::generate()` por processo | persistir a chave |
| sessão expira cedo | `refresh` sem persistir `expires_at` | atualize o registro |
| cookie grande demais | store JSON | reduza/mova para servidor |
