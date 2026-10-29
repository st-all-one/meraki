# Segurança

> Topcoat tem fundações boas: escaping automático, `OriginPolicy`, body limit,
> sessão com hash e nenhum `unsafe`. O que **não** existe são mecanismos que
> "protegem por composição": shards/procedures não herdam guards, não há token
> CSRF, redirects não checam origem e CSP estrita é incompatível com o runtime.

## 1. Modelo de confiança

Confie em:

- markup literal escrito por você (`view!`, `html:` de e-mail);
- dados carregados e validados no servidor;
- configuração do processo (env, chave de cookie, manifest de assets).

**Não** confie em:

- valores de sinais restaurados pelo browser;
- argumentos de `#[shard]`/`#[procedure]`;
- records capturados (todos os campos, inclusive privados, vão ao cliente);
- headers (`Origin`, `X-Forwarded-For`, `X-Topcoat-Identity`);
- cookies de jar puro (sem assinatura/criptografia);
- nomes/valores de atributo dinâmicos, URLs, CSS e JS interpolados.

## 2. Contextos que o escaping não cobre

O escaping de `view!` é **HTML**: protege contra quebrar a sintaxe do documento.
Ele não valida semântica.

| Contexto | Exemplo perigoso | Correção |
|---|---|---|
| URL | `href=(user_url)` com `javascript:alert(1)` | allowlist de esquema (`http`, `https`, `mailto`, `/`) |
| CSS | `style=(user_css)` | não interpole CSS; use classes allowlisted |
| JavaScript | `@click="…(user)…"` | nunca; use `$()` ou `raw!` com `${ident}` hidratado |
| `srcdoc` | `srcdoc=(user_html)` | sanitize com biblioteca ou não use |
| nome de atributo | `(k)=(v)` com `onclick` | allowlist de nomes |
| nome de tag | `<(tag)>` vindo de input | allowlist |
| comentário | valor em `<!-- (x) -->` | não coloque input em comentário |

```rust
fn safe_url(url: &str) -> Option<&str> {
    let ok = url.starts_with('/')
        || url.starts_with("https://")
        || url.starts_with("http://")
        || url.starts_with("mailto:");
    ok.then_some(url)
}
```

## 3. Matriz de escaping

| Posição | Contexto | Escapa | Entrada inválida |
|---|---|---|---|
| nó de texto | `Text` | `& < >` | escapada |
| valor de atributo | `AttributeValue` | `& "` | escapada (atributos sempre entre aspas) |
| comentário | `Comment` | `& > "` | escapada (nota: `<` passa) |
| nome de atributo | `AttributeKey` | — | **panic** |
| nome de elemento | `ElementName` | — | **panic** |

- Literais: escaping em **compile-time**, promovidos a `static`/`Unescaped`.
- Dinâmicos: escaping em tempo de render, tabela + `memchr` por contexto.
- Nome inválido derivado de input → panic → 500 (DoS barato; não é sanitização).

### Escotilhas (trusted markup)

- `Unescaped::new_unchecked(&'static str)`
- `ViewHandle::unescaped_unchecked(&'static str)`
- `PartsWriter::push_string_unescaped` e variantes
- `IconData::unescaped_unchecked`

São funções **safe**: o compilador não impede XSS. Use apenas com markup
constante ou sanitizado; nunca com input.

> **Não existe `raw!` para HTML.** `raw!` é JavaScript de runtime. Para HTML cru,
> a API é `Unescaped`.

## 4. `OriginPolicy` e CSRF

Default: aplicada antes de layers/handlers; rejeita com 403:

- métodos unsafe cross-origin (POST/PUT/PATCH/DELETE);
- handshakes WebSocket cross-origin.

Não cobre:

- `GET`/`HEAD`/`OPTIONS` — **GET que muda estado é vulnerável**;
- requests **sem** `Origin` e **sem** `Sec-Fetch-Site` (assume não-browser);
- `exempt_paths` é independente de método: eximir um path de WS também exime POST.

```rust
use topcoat::router::{ForwardedHeader, OriginPolicy, TrustedProxies};

let router = module_router!()
    .origin_policy(
        OriginPolicy::new()
            .trust_origins(["https://app.example"])
            .exempt_paths(["/webhooks/stripe"]),   // método-agnóstico!
    )
    .trusted_proxies(TrustedProxies::new().networks(["10.0.0.0/8"]))
    .build();
```

Regras de uso:

1. Mutações só por métodos unsafe (POST/PUT/PATCH/DELETE).
2. `SameSite=Lax` em cookies de sessão; `__Host-` quando possível.
3. `exempt_paths` mínimo e auditado.
4. Ações destrutivas exigem confirmação/step-up e token próprio quando necessário.
5. Webhooks: valide assinatura HMAC, não só origem.
6. Não há helper de token CSRF: se o modelo exigir (ex.: form cross-site), implemente.

## 5. Autorização em shards e procedures

Shards/procedures são rotas POST (`/_topcoat/runtime/...`). Layers por path
(`/admin`) **não** os envolvem; guards de página/layout **não** rodam.

```rust
#[shard]
async fn account_rows(cx: &Cx, account: String) -> Result<impl View> {
    let user = require_user(cx).await?;                 // autenticação
    let account: u64 = account.parse().map_err(|_| bad_request("account"))?;
    ensure_member(cx, user, account).await?;             // autorização por recurso
    let rows = load_rows(cx, account).await?;
    Ok(view! { … })
}
```

Checklist por endpoint:

- [ ] Autentica (sessão/token) dentro do handler.
- [ ] Autoriza o recurso específico (não só "está logado").
- [ ] Valida tipo, faixa e tamanho de todo argumento.
- [ ] Não inclui segredos no HTML retornado.
- [ ] Respeita o mesmo body limit/rate limit da rota equivalente.
- [ ] Path explícito está sob prefixo protegido por layer (defesa em profundidade).

## 6. Open redirect

`redirect`, `see_other`, `ok_or_redirect` só percent-encode caracteres de controle.
`//evil.example` e `https://evil` passam.

```rust
fn local_redirect(target: &str) -> Result<String, topcoat::Error> {
    if target.starts_with('/') && !target.starts_with("//") {
        Ok(target.to_owned())
    } else {
        Err(topcoat::router::error::bad_request("invalid redirect").into())
    }
}
```

- Aplique em `?next=`, `return_to`, links de e-mail.
- Prefira IDs/rotas conhecidas a URLs arbitrárias.
- Após streaming, redirect vira navegação no browser; a validação é ainda mais
  crítica.

## 7. Cookies e sessão

- Jar puro **não aplica atributos**; use helper com `Secure`, `HttpOnly`,
  `SameSite=Lax`, `Path=/` ([`09`](./09-cookies-sessoes.md)).
- Dados do cliente: `private` (cifra+autentica); `signed` é legível.
- `Key` persistida; rotação planejada.
- Sessão: guarde **só hash**; valide lookup + expiração; `rotate` apaga o revogado.
- `SameSite=Lax` envia cookie em navegação GET top-level; não substitui CSRF.
- `token_hash` não valida expiração; o app valida.
- Nunca logue token bruto.

## 8. Estado do cliente

Sinais, argumentos e records são input:

- `Signal<T>` restaurado por compatibilidade de tipo; um `u64` pode ser qualquer.
- Records enviam todos os campos, inclusive privados.
- `X-Topcoat-Identity` identifica render, não usuário.
- `SignalValue` inválido faz o `init` rodar silenciosamente.

Padrões seguros:

```rust
// derive identidade do servidor, não do sinal
let user = require_user(cx).await?;

// valide e limite
let page = page.get().min(1000);

// allowlist
if !["asc", "desc"].contains(&sort.get().as_str()) { … }
```

## 9. CSP e runtime

- Respostas com streaming injetam script inline (`SWAP_SCRIPT`).
- O runtime compila expressões com `new Function`.
- Não há hook de nonce.

Consequência: `script-src` precisa de `'unsafe-inline'` e `'unsafe-eval'` nas
páginas que usam runtime/streaming. Se CSP estrita é requisito, evite runtime e
streaming nessas rotas ([INFERENCE] não há caminho documentado para nonce).

Outros headers úteis (você configura): `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `frame-ancestors`/`X-Frame-Options`.

## 10. Limites e proxies

- Body: 2 MiB default; 413; `Body` cru sem limite; multipart conta o total.
- WebSocket: limites de mensagem/frame configuráveis; 64 renders conectados por
  socket (429).
- Prefetch: 8 páginas / 2 concorrentes / 1 MiB / 30 s — renders extras no servidor.
- `TrustedProxies`: sem configuração, `client_ip` é `None` e headers são ignorados.
  `nearest(n)` só com topologia fixa.
- Reverse proxy: desligue buffering para SSE/WS; limite tamanho de request também
  na borda.

## 11. Arquivos e assets

- `asset!`: nomes com hash, catálogo confiável; não aceite manifest externo.
- `serve_dir`/`public_dir`: traversal bloqueado, mas dotfiles e symlinks seguem.
- Upload: nome do cliente é hostil; gere nome, valide tipo/tamanho, guarde fora do
  webroot.
- SRI para scripts de CDN: adicione manualmente (`integrity`).
- Fontsource via `@latest` é supply chain não fixada; hospede localmente.

## 12. Riscos rankeados para apps Topcoat

| # | Risco | Severidade | Default | Mitigação |
|---|---|---|---|---|
| S1 | shard/procedure sem auth | alto | não protege | `require_user` + autorização por recurso |
| S2 | estado do cliente confiado | alto | restaura por tipo | derivar do servidor, validar allowlist |
| S3 | CSRF sem token; GET mutável | médio-alto | `OriginPolicy` | mutações unsafe + SameSite + não mutar por GET |
| S4 | cookie jar puro | médio | sem atributos | helper com defaults / private |
| S5 | open redirect | médio | sem check | allowlist de path local |
| S6 | CSP com inline/eval | médio | necessário | aceitar ou isolar rotas |
| S7 | atributo dinâmico vira handler | médio | só valida nome | allowlist de nomes |
| S8 | URL/CSS/JS não validados | médio | escaping HTML | validar esquema/valor |
| S9 | panic por input | baixo-médio | 500 | validar antes; não derivar nome |
| S10 | dotfiles/symlinks em fs | baixo | servidos | diretório dedicado |

## 13. Checklist de revisão

- [ ] Toda superfície que devolve dado chama guard (página, layout, shard,
      procedure, fragmento, SSE, WS).
- [ ] Autorização é por recurso, não só por "logado".
- [ ] Nenhum segredo em `#[record]`, sinal ou HTML.
- [ ] Argumentos de shard/procedure validados e limitados.
- [ ] Mutações só em métodos unsafe; nenhum GET que muda estado.
- [ ] `OriginPolicy` ligada; `exempt_paths` auditado.
- [ ] Cookies com Secure/HttpOnly/SameSite/Path; dados do cliente em `private`.
- [ ] Sessão: hash + expiração; `rotate` revoga o anterior; chave persistida.
- [ ] Redirects só para paths locais; URLs externas em allowlist.
- [ ] `Unescaped` usado apenas com constantes/sanitizado.
- [ ] Nomes de atributo/tag dinâmicos em allowlist.
- [ ] Body limit por rota; uploads validados.
- [ ] CSP/HSTS/Referrer definidos; limitação na borda.
- [ ] Erros 500 não vazam mensagem; logs têm correlação.
- [ ] Dependências e assets remotos fixados (versão/checksum).
