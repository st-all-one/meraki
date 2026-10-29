# Topcoat 0.11 — Guia de Implementação (Otimizado para IA)

> Framework Rust **full-stack** para HTML renderizado no servidor, com componentes
> async, roteamento derivado de módulos e reatividade no browser sem WASM.
> Versão de referência: **0.11.0** (crates `topcoat`, `topcoat-cli`).
> Objetivo: guia denso de **COMO fazer**; cobre a documentação oficial do repo
> `tokio-rs/topcoat` e as decisões que só aparecem no código.

> **Estado:** experimental. APIs quebram entre versões; auth, validações,
> background jobs, deploy e export estático ainda estão no roadmap.

## Exemplo canônico (ponto de partida)

Estrutura mínima gerada por `topcoat new`:

```
meu-app/
├── src/
│   ├── main.rs          # topcoat::start(router().build())
│   └── app.rs           # module_router! + páginas/layouts
├── assets/              # bundle gerado (não editar)
├── Cargo.toml
└── Topcoat.toml         # marcador para topcoat fmt (opcional)
```

`src/main.rs`:

```rust
use topcoat::Result;
use topcoat::router::{module_router, page};
use topcoat::view::{View, component, view};

fn router() -> topcoat::router::RouterBuilder {
    module_router!()
}

#[tokio::main]
async fn main() {
    topcoat::start(router().build()).await.unwrap();
}

#[page]
async fn home() -> Result<impl View> {
    Ok(view! {
        <!DOCTYPE html>
        <html>
            <head>topcoat::dev::script()</head>
            <body>
                hello(name: "World")
            </body>
        </html>
    })
}

#[component]
async fn hello(name: &str) -> Result<impl View> {
    Ok(view! { <h1>"Hello, " (name) "!"</h1> })
}
```

Esse é o núcleo de **todos** os tópicos: um router, uma página, um componente.
Middleware, runtime, sessões, assets e integrações adicionam camadas sobre ele.

### A mesma app com interatividade

```rust
use topcoat::{
    Result,
    context::Cx,
    view::{View, component, view},
};

#[component]
async fn counter(cx: &Cx) -> Result<impl View> {
    let count = topcoat::runtime::signal(cx, || 0usize);

    Ok(view! {
        // Roda no browser; nenhum round-trip.
        <button @click=$(|_e| count.set(count.get() + 1))>"+1"</button>
        <p>"Count: " $(count.get())</p>
    })
}
```

Para buscar dados no servidor quando um valor muda, troque por `#[shard]`:

```rust
use topcoat::{Result, context::Cx, view::{View, view}};

#[shard]
async fn results(cx: &Cx, query: String) -> Result<impl View> {
    let items = search(cx, &query).await?;   // banco/HTTP direto
    Ok(view! { <ul>for item in items { <li>(item)</li> }</ul> })
}

// na view: results(query: $(query.get()))
```

## Modelo mental (leia antes de escrever código)

1. **HTML no servidor.** `#[page]` devolve uma `View`; o router serializa para HTML.
   Não existe "API layer" obrigatória: componentes podem consultar o banco.
2. **`view!` é HTML com Rust dentro.** Texto entre aspas, `(expr)` interpola,
   `if`/`for`/`match`/`let` funcionam em filhos e atributos.
3. **Componentes são async e concorrentes.** Irmãos renderizam em paralelo; a saída
   respeita a ordem do código. A ordem de execução é indefinida — sem efeitos
   colaterais entre irmãos.
4. **`Cx` é o handle da requisição.** Tudo é keyed por tipo. Auth e dados
   compartilhados passam por funções (`require_user(cx)`), não por middleware.
5. **Reatividade é opt-in.** `signal(cx, …)` + `$()` para browser; `#[shard]` para
   re-render no servidor; `#[procedure]` para chamar função async remota.
6. **Servidor e browser falam o mesmo vocabulário.** `$(...)` compila para Rust e
   JavaScript; o que não couber vira `raw!` (JS com fallback Rust) ou procedure.
7. **Segurança não é herdada por composição.** Shards/procedures são rotas: guards de
   página/layout não rodam neles.

## Fluxo de uma requisição

```
GET /posts/42
  → OriginPolicy (bloqueia mutação cross-origin)
  → layers (locale, tenant, timing…)
  → layouts (do menos específico ao mais específico)
  → #[page] async fn(cx) -> Result<impl View>
      → view! constrói views lazy
      → componentes irmãos resolvem concorrentemente
      → regiões live!/suspense emitem frames
  → Response (status/headers declarados na view vencem)
```

Re-render no browser:

```
sinal muda → $() atualiza DOM (sem HTTP)
sinal lido no servidor → POST de rerun (page) ou POST do shard
procedure → POST JSON → função async → Ok/Err
```

## Navegação

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 00 | [00-index.md](./00-index.md) | Exemplo canônico, modelo mental, mapa |
| 01 | [01-quickstart.md](./01-quickstart.md) | CLI, presets, migrations, `topcoat dev`, setup manual, features |
| 02 | [02-roteamento.md](./02-roteamento.md) | `module_router!`, páginas/rotas, layouts, layers, params, `href!`, erros |
| 03 | [03-contexto.md](./03-contexto.md) | `Cx`, app/request context, `with`, `#[memoize]`, guards |
| 04 | [04-request-response.md](./04-request-response.md) | Extratores, body limit, respostas, redirects, rewrites |
| 05 | [05-views.md](./05-views.md) | Gramática de `view!`, atributos, classes, metadados, escaping |
| 06 | [06-componentes.md](./06-componentes.md) | `#[component]`, props, `Child`, keys, identidade, concorrência |
| 07 | [07-streaming.md](./07-streaming.md) | `live!`/`emit!`, `suspense`, `error_boundary`, `connected` |
| 08 | [08-runtime.md](./08-runtime.md) | Sinais, expressões, records, procedures, shards, links, WebSocket |
| 09 | [09-cookies-sessoes.md](./09-cookies-sessoes.md) | Cookies, prefixos, assinados/privados, sessão, auth |
| 10 | [10-servicos.md](./10-servicos.md) | E-mail, localização/Fluent, formatação |
| 11 | [11-assets-estilo.md](./11-assets-estilo.md) | Assets/bundle/CDN, Tailwind, fontes, ícones, Topcoat UI |
| 12 | [12-integracoes.md](./12-integracoes.md) | htmx, Alpine AJAX, Datastar, SSE, WebSocket, multipart, sitemap, Tower, fs |
| 13 | [13-seguranca.md](./13-seguranca.md) | Escaping, CSRF, sessão, riscos e checklist |
| 14 | [14-performance.md](./14-performance.md) | Render, TTFB, alocação, assets, benchmarks |
| 15 | [15-testing.md](./15-testing.md) | `Router::handle`, render puro, testes de auth/escaping, CI |
| 16 | [16-exemplos.md](./16-exemplos.md) | Os 28 examples e o demo `admin` |
| 17 | [17-api-reference.md](./17-api-reference.md) | Macros, traits, builders e features |
| 18 | [18-cheatsheet.md](./18-cheatsheet.md) | Referência de bolso |
| 19 | [19-melhores-praticas.md](./19-melhores-praticas.md) | Arquitetura, revisão, padrões |
| 20 | [20-faq-troubleshooting.md](./20-faq-troubleshooting.md) | Sintoma → causa → correção |
| 21 | [21-padroes-avancados.md](./21-padroes-avancados.md) | Deploy, edge, multi-tenant, observabilidade, limites |

## Ordem prática de implementação

1. `cargo install topcoat-cli`; `topcoat new app --recommended` (ou `--minimal`).
2. `topcoat dev`; edite `src/app.rs` e o módulo da rota.
3. Modele rotas por módulos (`src/app/…`); use `href!` para links.
4. Extraia o layout raiz (`#[layout]`) e as layers de request (locale, tenant).
5. Adicione componentes reutilizáveis (`#[component]`) e classes com `class!`.
6. Ligue interatividade: `signal` + `$()` + `@event`; `#[shard]` para dados do servidor.
7. Autentique com cookies/sessão e `require_user(cx)` em cada superfície.
8. Declare assets (`asset!`), Tailwind/fontes/ícones/UI.
9. Endureça: `OriginPolicy`, limites, redirects, validação de sinais/args.
10. Meça e faça streaming do que é lento; revise com `13` e `14`.

## Convenções deste guia

- Português (pt-BR); termos técnicos em inglês quando são API (`shard`, `layer`).
- Código em Rust com imports explícitos de `topcoat::<área>`.
- Trechos derivados da documentação e do código do repo 0.11.0, encurtados.
- Comandos assumem a raiz do projeto Topcoat.
- `SKILL.md` traz metadados; `VERSION` fixa a versão de referência.
