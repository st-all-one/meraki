# Performance

> O caminho quente é: macro gera instruções → buffer escreve HTML → router envia
> String/frames. O design evita locks e alocações óbvias; o maior risco é a
> **barreira de primeiro byte** entre componentes irmãos.

## 1. Pipeline de render

1. `view!` é transformado em instruções em compile-time.
2. Texto e atributos **literais** são escapados e fundidos em strings promovidas.
3. Uma view totalmente estática vira `ViewHandle::unescaped_unchecked("…")` — sem
   buffer nem alocação por render.
4. Posições dinâmicas viram instruções; no render, `PartsWriter` escreve no buffer
   com `size_hint` pré-calculado.
5. Números até `u64`/`isize` usam buffer fixo (sem heap); `i128/u128`/`f64` usam
   constantes/`write!`.
6. Componentes: fase *hoist* (avalia args/expressões em ordem) e *burst* (escreve
   resultados em ordem).
7. Buffer é thread-local; irmãos são futures unidas no mesmo task, sem locks.

Consequência prática: manter markup fixo literal e interpolar valores crus é mais
rápido do que montar strings.

```rust
// Melhor
view! { <li class="row">(item.id) " — " (item.name)</li> }

// Pior: aloca e escapa de novo
view! { <li class="row">(format!("{} — {}", item.id, item.name))</li> }
```

## 2. A barreira de TTFB

`JoinView` espera o **primeiro conteúdo de todas as unidades** para emitir o burst
inicial. Um componente lento atrasa o início da resposta inteira.

```rust
// Lento: os três precisam resolver antes do primeiro byte
view! { header() sidebar() slow_report() }

// Melhor: o relatório vira região
view! {
    header()
    sidebar()
    suspense(fallback: view! { <p>"Carregando…"</p> }, slow_report())
}
```

Regras:

- Isole em `suspense`/`live!` qualquer I/O que possa passar de ~50–100 ms.
- Componentes rápidos podem ficar no fluxo normal; paralelismo já os sobrepõe.
- O fallback deve ser barato e render imediato.
- `SuspenseMode::Wait` **não** ajuda TTFB (espera); use `Stream`.

## 3. Alocação e estruturas

| Item | Custo | Dica |
|---|---|---|
| view estática | zero/uma `String` promovida | mantenha literais |
| `Child` | um `Box::pin` por child | evite filhos vazios em loops grandes |
| loop com corpo async | `Vec` + `Box::pin` por iteração | prefira corpo síncrono quando possível |
| `attributes!` | `HashMap`; ordem instável | use atributos estáticos se não precisar de spread |
| `element_id`/regiões | formata identidade + comentário | não crie IDs sem necessidade |
| `Href::resolve`/`is_current` | `String`/`Vec` por link | em navs grandes, pré-calcule |
| `class!` | omite ausentes; literais promovidos | não monte classes com `format!` |
| cookie jar | parse lazy | não toque no jar se não usar |

`view!` captura por move; não clone para "usar depois" sem necessidade. Views são
lazy: construir uma view que nunca renderiza não executa as expressões (exceto
`cx =>`, que clona na construção).

## 4. Streaming e respostas

- `suspense`/`live!` enviam frames; o primeiro frame é HTML e o restante vem como
  envelopes de swap.
- `Sse` fica fora da compressão para evitar buffering; use `KeepAlive`.
- WebSocket multiplexa renders conectados; 64 por conexão (default). Muitas
  regiões conectadas → mais trabalho e mais memória.
- Cada swap reescreve uma `String` com `size_hint` do replacement + envelope.
- Status/headers não mudam após o commit; planeje a resposta antes de streamar.

## 5. I/O e dados

- Componentes irmãos paralelizam I/O; use isso para consultas independentes.
- `#[memoize]` deduplica por request (layout + página + componentes) e coalesce
  chamadas async concorrentes. É a primeira ferramenta contra N+1 de layout.
- Não use `memoize` para dados que devem persistir entre requests.
- Cuidado com `Hash` caro: a chave hasheia todos os args (sem igualdade).
- Para listas, pagine e limite no SQL; o shard re-renderiza a lista inteira.

```rust
#[memoize(as_ref)]
async fn current_user(cx: &Cx) -> Result<Option<User>> { … }
```

## 6. Assets e entrega

- URLs com hash + `Cache-Control: immutable` (1 ano).
- Sem ETag/Range/pré-compressão: o arquivo é lido inteiro por request. Em produção,
  sirva por CDN/edge (`AssetConfig::hosted_at`).
- Compressão do router (gzip/br) recompacta por resposta; para CSS/JS estáticos e
  woff2, a borda costuma ser melhor.
- Fontes: limite pesos e use `host: Asset`; cada face gera preload.
- Ícones inline: zero requests, mas HTML maior; cuidado ao repetir centenas.
- Bundle: o bundler reutiliza entradas inalteradas e remove órfãos; downloads
  remotos em paralelo (8 por default). Cache remoto é por URL.

## 7. Compressão

Default: gzip + brotli, nível `Balanced` (qualidade 4), mínimo 32 bytes.

```rust
use topcoat::router::{Compression, CompressionLevel, module_router};

let router = module_router!()
    .compression(
        Compression::new()
            .gzip(true)
            .brotli(true)
            .level(CompressionLevel::Best)
            .min_size(1024),
    )
    .build();
```

- `Compression::off()` desliga; `Fastest`/`Balanced`/`Best`/`Precise(n)`.
- SSE fica fora; imagens/gRPC também não se beneficiam.
- Assets não vêm pré-comprimidos: a borda/CDN deve comprimir/cachear.
- Nível `Best` com brotli custa CPU por resposta; prefira na borda ou em conteúdo
  cacheável.

## 8. Prefetch e navegação

- `PrefetchMode::Intent` (hover/focus/touch) é o default; cada prefetch é um render
  completo no servidor (layers/guards inclusos).
- Limites do cliente: 30 s de TTL, 8 páginas, 2 downloads simultâneos, 1 MiB.
- Em páginas caras, considere `Never` ou `Viewport` com parcimônia.
- Navegação reusa scripts; não reexecuta scripts novos inseridos por update.

## 9. Medição

Benchmarks existentes (no repo do framework):

- `benchmarks/`: HTTP com `oha` comparando Topcoat, Next.js, Leptos e Axum+Maud;
  mede req/s, p50/p90/p99, bytes; compressão desligada; jemalloc.
- `crates/topcoat-view/benches/render.rs`: Criterion de `ViewHandle::render`
  (`static_page`, `text_escaping`, `numeric_table`, `attributes`, `product_grid`).

Não há resultados commitados e o script do harness depende de macOS. Meça o seu
app:

```rust
let t = std::time::Instant::now();
let html = view.single().await?.render(cx);
eprintln!("render: {:?} ({} bytes)", t.elapsed(), html.len());
```

Para TTFB, meça no cliente (curl `-w`), não só o render: a barreira e o streaming
só aparecem na resposta HTTP.

## 10. Checklist de tuning

- [ ] Literais em `view!`/`attributes!`; nada de `format!` para texto simples.
- [ ] Classes via `class!` ou `class="…"`, nunca concatenação.
- [ ] Componentes lentos isolados em `suspense`/`live!`.
- [ ] Consultas compartilhadas com `#[memoize]`.
- [ ] Sem N+1 em loops; paginação no banco.
- [ ] Assets por CDN; fonte com pesos limitados.
- [ ] Prefetch consciente do custo de render.
- [ ] Shards com argumentos limitados e queries indexadas.
- [ ] Compressão na borda; cache de HTML quando aplicável.
- [ ] Medição antes/depois com p50/p95/p99 e TTFB.

## 11. Anti-padrões

| Anti-padrão | Efeito |
|---|---|
| Um `suspense` envolvendo a página inteira | nenhum ganho de TTFB |
| Buscar o mesmo usuário em layout+página+componentes sem memoize | N queries |
| Montar HTML com `format!` e `Unescaped` | perde escaping e alocação otimizada |
| Loop com milhares de componentes assíncronos | milhares de boxes/futuros |
| `style=(format!(...))` | CSS inválido, sem cache, risco de injeção |
| Prefetch `Viewport` em listas enormes | rajada de renders |
| Shard para cada tecla sem debounce/limite | carga no servidor |
| Assets servidos pelo processo em produção | I/O + memória por request |
