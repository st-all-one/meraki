# Padrões avançados e operação

> Deploy, multi-tenant, jobs, observabilidade e limites. O framework ainda não
> documenta deploy; as seções marcadas `[INFERENCE]` combinam a API exposta com
> prática de operação — valide no seu ambiente.

## 1. Deploy (referência prática)

Topcoat é um servidor HTTP assíncrono comum: um binário + bundle de assets. O
roteiro mínimo:

1. Build de release no perfil que será executado:
   ```sh
   cargo build --release
   topcoat asset bundle --release --bin meu-app
   ```
2. Publique **binário + `assets/`** do mesmo build (ou CDN com o manifesto).
3. Configure `HOST=0.0.0.0` atrás do proxy e `PORT`.
4. Aponte o proxy para o processo; habilite TLS na borda.
5. Defina variáveis: chave de cookie persistida, URL do banco, SMTP, `RUST_LOG`.
6. Rode migrações como etapa separada antes de trocar o processo.
7. Health check: uma rota `#[route(GET "/health")]` que valida processo e, se
   quiser, banco.
8. Faça shutdown gracioso (SIGTERM) e dê tempo para requests/SSE/WS drenarem.
   `[INFERENCE]` A API de shutdown depende do listener/servidor usado.

### Nginx (borda)

```nginx
upstream topcoat { server 127.0.0.1:3000; }

server {
    listen 443 ssl http2;
    server_name app.example.com;

    # SSE / streaming: sem buffering
    proxy_buffering off;
    proxy_read_timeout 1h;

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_pass http://topcoat;
    }

    location /_topcoat/assets/ {
        proxy_pass http://topcoat;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

- WebSocket requer `Upgrade`/`Connection` e HTTP/1.1 no upstream.
- SSE requer `proxy_buffering off` (e timeouts longos).
- `X-Forwarded-For` só é confiável se **todos** os requests passarem pelo proxy;
  registre `TrustedProxies` com as redes corretas.
- Limite de body na borda também (além dos 2 MiB da app).

### Caddy

```caddy
app.example.com {
    reverse_proxy 127.0.0.1:3000 {
        flush_interval -1          # SSE
    }
}
```

Caddy faz TLS automático e passa `X-Forwarded-*`; configure `TrustedProxies` para
o loopback/rede do proxy.

### Containers

- Rode como usuário não-root, com FS somente leitura (exceto cache/log).
- Assets podem ir na imagem **ou** em volume/CDN; o manifesto precisa existir.
- Não gere chave de cookie no entrypoint; injete segredo.
- Um processo por container; escale horizontalmente sem estado em memória (sessões
  no banco, jobs em fila externa).

### Migrações e rollback

- Rode migrações como **job separado**, antes de subir a nova versão do processo.
- Use expand/contract: adicione colunas/tabelas compatíveis, faça deploy, depois
  remova o antigo em outro deploy.
- Faça backup/point-in-time antes de migrações destrutivas.
- Bundle de assets e binário são um par: rollback de app exige rollback do bundle
  (ou CDN com manifesto correspondente).
- `[INFERENCE]` Não há runner de migração além do CLI do Toasty; orquestre no seu
  pipeline e registre versão aplicada.

## 2. Configuração e segredos

```rust
pub struct Config {
    pub database_url: String,
    pub cookie_key: topcoat::cookie::Key,
    pub public_base_url: String,
}

fn config() -> Config {
    Config {
        database_url: std::env::var("DATABASE_URL").expect("DATABASE_URL"),
        cookie_key: load_key(),                 // arquivo/secret manager
        public_base_url: std::env::var("PUBLIC_BASE_URL").expect("PUBLIC_BASE_URL"),
    }
}

let config = config();
let base_url = config.public_base_url.clone();

let router = module_router!()
    .discover()
    .app_context(config)
    .base_url(base_url)
    .build();
```

- `base_url` habilita `Href::absolute` (links em e-mail, sitemap, canonical).
- Segredos nunca em `view!`, records, logs ou mensagens de erro.
- `.env` só em dev; produção via orquestrador/secret manager.
- Versione a **forma** da config (nomes), não valores.

## 3. Assets e CDN

```rust
let bundle = AssetBundle::load()?;   // ou Manifest::parse(include_str!(..))
let router = module_router!()
    .assets(AssetConfig::hosted_at("https://cdn.example.com/assets", bundle))
    .build();
```

- Suba `assets/` (ou só os arquivos + manifesto) no mesmo deploy do binário.
- Nomes têm hash: invalidação é automática; não use query string de versão.
- Cache imutável na borda; purge só se reutilizar nomes (não faça).
- Rollback de app exige rollback do bundle correspondente.
- `[INFERENCE]` Para SRI, adicione `integrity` manualmente nos `<script>`/`<link>`
  gerados; a API não calcula hash de integridade.

## 4. Multi-tenant

Padrão: resolver tenant na borda da request e derivar de **sessão**, não de input.

```rust
#[derive(Clone)]
pub struct Tenant(pub TenantId);

#[layer]
async fn tenant(cx: &Cx, body: Body, next: Next<'_>) -> Result<Response> {
    let host = topcoat::router::request::headers(cx)
        .get("host").and_then(|v| v.to_str().ok()).unwrap_or("");
    let tenant = lookup_tenant(host).ok_or_not_found()?;
    next.run(&cx.with(tenant), body).await
}
```

Regras:

- Toda query filtra por tenant; nunca aceite `tenant_id` de sinal/shard.
- Autorização é `(user, tenant, recurso)`; não só `user`.
- Shards/procedures resolvem tenant do contexto e revalidam.
- Assets/URLs por tenant: use path/grupo e cache separado.
- Evite `Mutex<HashMap>` global; use o banco/cache distribuído.

## 5. Background jobs

O framework não tem fila. Padrões:

1. **Tabela outbox** no banco + worker externo (recomendado).
2. Canal em memória para trabalho curto, com perda aceitável.
3. Fila externa (Redis/SQS) publicada após commit.

```rust
#[route(POST)]
async fn signup(cx: &Cx, Form(input): Form<Signup>) -> Result<SeeOther> {
    let user = create_user(cx, input).await?;
    enqueue_email(&user.email).await?;       // outbox/fila
    Ok(see_other(href!(home).resolve(cx)))
}
```

- Não envie e-mail pesado no request; `send` bloqueia o handler.
- Jobs precisam de idempotência (retry/at-least-once).
- `tokio::spawn` só para trabalho curto e tolerante a perda; clone `Cx` se precisar
  de contexto.
- `connected`/`live!` **não** substituem job durável: observam estado, não o criam.

## 6. Observabilidade

- **Logs**: request id no `Cx` (layer) + logs estruturados; nunca logue token,
  cookie, senha ou corpo sensível.
- **Erros**: `internal_server_error(e)` preserva a causa; capture no logger/tracer.
- **Métricas**: latência por rota, status, TTFB de páginas com streaming, tamanho
  de HTML, renders de shard, conexões WS, jobs.
- **Tracing**: instrumente layers e procedures; propague `traceparent`.
- **Health**: rota sem auth que não toca no banco + rota `ready` que toca.
- **Alertas**: taxa de 5xx, 429 de WS, fila, pool de banco.

```rust
#[layer]
async fn request_id(cx: &Cx, body: Body, next: Next<'_>) -> Result<Response> {
    let id = uuid::Uuid::new_v4();
    let response = next.run(&cx.with(RequestId(id.to_string())), body).await?;
    // log estruturado aqui
    Ok(response)
}
```

## 7. Edge / Worker

- `Router::handle(request)` serve sem `serve`.
- Bufferize o body; não há streaming de request no Worker.
- Sem WebSocket do runtime; use a API da plataforma se precisar.
- Assets: manifesto embutido + CDN.
- Banco: driver compatível com o runtime (TCP/HTTP), pool por isolate conforme a
  plataforma.
- Limite de CPU/tempo: evite render pesado; prefira fragmentos/shard.

## 8. Escala e capacidade

- App sem estado em memória: escale horizontalmente atrás do LB.
- Sessões no banco com índice único no hash; limpe expiradas periodicamente.
- Cookies assinados/privados exigem a mesma chave em todas as instâncias.
- Assets: CDN absorve; não escale o app para servir imagens.
- Banco: pool por instância; cuidado com N instâncias × pool.
- SSE/WS: conexões longas limitam escala por processo; dimensione e use timeouts.
- Prefetch aumenta tráfego de render; monitore.

## 9. Custom extractors e responders

```rust
use topcoat::{
    Result,
    router::{Body, request::{Request, parts}, response::Response},
};

pub struct Csv<T>(pub T);

impl<T> Csv<T> {
    pub async fn from_request(mut request: Request) -> Result<Self> { … }
}
```

- Bufferize com `to_bytes(body, body_limit(cx))`.
- Extraia **um** body por handler; não leia duas vezes.
- Para resposta custom, implemente `IntoResponse` (ou `AsyncIntoResponse` se
  assíncrono).
- Erros de parse viram seus tipos de erro → status correto.

## 10. Padrões de UI avançados

- **Ilhas manuais**: seção `live!` + `connected` para um widget independente.
- **Form progressive enhancement**: POST/PRG completo + `htmx`/`Alpine` por cima.
- **Busca**: input com `$()` + shard; limite e debounce; preserve foco/scroll.
- **Paginação**: shard com `Signal<usize>` e `suspense`.
- **Modais**: `element_id` + `Expr<bool>` + `<dialog>`; evite estado global.
- **Tabelas grandes**: server-side sort/filter via shard; nunca renderize tudo.
- **Tema**: cookie + classe no `<html>`; evite flash com script inline mínimo
  (considere CSP).

## 11. Migração incremental

De htmx/Alpine/Datastar para Topcoat (ou vice-versa):

- Comece por uma rota; mantenha o layout compartilhado.
- Fragmentos atuais podem virar páginas/shard; mantenha contratos de URL.
- Não misture dois runtimes de estado no mesmo widget.
- Teste o fallback sem JS antes de remover o antigo.
- Preserve `href!`/paths públicos com redirects durante a transição.

## 12. Limites e roadmap

O que **não** existe hoje:

- autenticação/RBAC/MFA pronta;
- validações de formulário integradas;
- OpenAPI;
- jobs em background;
- export estático/pré-render;
- WebTransport;
- otimização de imagem;
- suporte a Markdown;
- middlewares prontos (rate limit, etc.);
- guia oficial de deploy;
- ilhas (no sentido Fresh/Leptos).

Planeje essas lacunas explicitamente; não as esconda atrás de abstrações
prematuras. Ao adotar, pine versão e isole APIs experimentais.
