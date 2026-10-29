# Streaming: `live!`, `suspense` e `error_boundary`

> Topcoat pode enviar HTML em partes. Use quando uma parte da página depende de
> trabalho lento (banco, HTTP, fila) e você não quer segurar o documento inteiro.

## 1. O problema: barreira de primeiro byte

Componentes irmãos renderizam concorrentemente, mas o HTML só começa a sair quando
**todos** os irmãos produzem seu primeiro conteúdo. Um componente de 500 ms atrasa
o `<head>` e o restante da página.

Solução: isolar o trecho lento numa **região** (`suspense` ou `live!`). A região
emite um placeholder imediatamente e continua depois.

## 2. `suspense`

```rust
use topcoat::{Result, view::{View, component, suspense, view}};

#[component]
async fn quote() -> Result<impl View> {
    let q = fetch_quote().await?;
    Ok(view! { <blockquote>(q)</blockquote> })
}

#[component]
async fn page() -> Result<impl View> {
    Ok(view! {
        <h1>"Citação do dia"</h1>
        suspense(
            fallback: view! { <p>"Carregando…"</p> },
            quote()
        )
    })
}
```

Semântica:

- O filho é pollado primeiro; se já estiver pronto, o fallback **nunca** aparece.
- Se não estiver, o fallback é enviado e a região é substituída quando o filho
  resolve.
- `mode: Option<SuspenseMode>`: `Stream` (default) mantém a região e envia frames;
  `Wait` espera o filho e não cria região/marcadores.
- Views dentro do suspense são isoladas; status/headers já enviados não mudam.
- `suspense_mode(cx)` lê o default do contexto.

```rust
view! {
    suspense(
        fallback: view! { <p>"…"</p> },
        stats(),
        mode: Some(SuspenseMode::Wait)
    )
}
```

## 3. `error_boundary`

```rust
use topcoat::{
    Result,
    router::{StatusCode, error::NotFoundError},
    view::{View, error_boundary, view},
};

view! {
    error_boundary(
        fallback: |error| {
            if error.downcast_ref::<NotFoundError>().is_none() {
                return Err(error);          // re-throw
            }
            Ok(view! {
                (StatusCode::NOT_FOUND)
                <h1>"Página não encontrada"</h1>
            })
        },
        page()
    )
}
```

- Captura falha de qualquer parte do filho.
- Retornar `Err(error)` delega ao boundary externo/router.
- Declare `(StatusCode::…)` no fallback; sem isso a resposta é 200.
- Só substitui conteúdo se o filho for live/streaming; um filho já concluído falha
  no primeiro conteúdo e não é trocado.
- Boundaries aninham: o mais interno decide.

## 4. `live!` e `emit!`

```rust
use topcoat::{
    Result,
    view::{View, component, emit, live, view},
};

#[component]
async fn quote_of_day() -> Result<impl View> {
    Ok(live! {
        emit! { <p>"Carregando…"</p> }?;
        let quote = fetch_quote().await?;
        emit! { <blockquote>(quote)</blockquote> }
    })
}
```

Regras:

- Cada `emit!` **substitui** o conteúdo atual da região no browser (não acrescenta).
- O corpo precisa emitir **ao menos uma vez**; a primeira emissão é esperada antes
  de o documento continuar. Comece com um placeholder imediato.
- O corpo retorna `Result<EmitToken>`; terminar com `emit!` satisfaz o tipo.
  Se não terminar com emissão, retorne `Ok(EmitToken)` explicitamente.
- `emit!` aceita a mesma sintaxe de `view!`, inclusive componentes.
- Emissões concorrentes (ex.: `join!`) competem; a última a chegar permanece.
  Ordene com `await` quando a ordem importa.
- Erros: `emit!` devolve `Result`; propague com `?` ou trate e emita fallback.
- Depois do streaming começar, status/headers não mudam; cookies tardios panicam.

### Progresso

```rust
view! {
    (live! {
        for percent in 0..100 {
            emit! { <p>"Processando " (percent) "%"</p> }?;
            step().await;
        }
        emit! { <p>"Concluído"</p> }
    })
}
```

## 5. `connected(cx)` e WebSocket

```rust
use topcoat::{
    Result,
    context::{Cx, app_context},
    router::page,
    runtime::connected,
    view::{View, emit, live, view},
};

#[page]
async fn chat(cx: &Cx) -> Result<impl View> {
    Ok(view! {
        (live! {
            let chat = app_context::<Chat>(cx);
            let mut changed = chat.subscribe();
            loop {
                let token = emit! {
                    <ul>for m in chat.messages() { <li>(m)</li> }</ul>
                }?;
                if !connected(cx) {
                    break Ok(token);
                }
                changed.recv().await.ok();
            }
        })
    })
}
```

Semântica:

- Durante o HTTP, `connected(cx)` devolve `false` e **pede** que o browser abra um
  WebSocket para rerenderizar a página/shard.
- No render conectado, devolve `true`.
- Um WebSocket por aba multiplexa páginas/shards conectados; default de **64**
  renders simultâneos por conexão (`max_runs_per_connection`), excedente → 429.
- O corpo `live!` **reinicia** no reconnect: leia estado atual, não inicie jobs
  duráveis nem acumule assinaturas.
- `connected_untracked(cx)` só consulta, sem pedir conexão.
- Para tempo real simples, prefira SSE ([`12`](./12-integracoes.md)); `connected` é
  para HTML que continua mudando.

## 6. Escolha da ferramenta

| Necessidade | Use |
|---|---|
| Placeholder enquanto carrega | `suspense` |
| Fallback de erro por seção | `error_boundary` |
| Progresso/etapas explícitas | `live!` + `emit!` |
| Atualização contínua por eventos | `live!` + `connected` |
| Dados do servidor por mudança de input | `#[shard]` ([`08`](./08-runtime.md)) |
| Stream unidirecional de eventos | `Sse` |
| Duplex | `WebSocketUpgrade` |

## 7. Composição

- Regiões podem conter regiões; emissões podem conter `live!`.
- Em `for`, use `#[key]` para dar identidade estável a regiões.
- Uma região é uma `View`: um componente pode retornar `live!` diretamente.
- `suspense` dentro de layout funciona; cuidado com status já emitido.

## 8. `Cx` em streams

```rust
#[route(GET)]
async fn feed(cx: &Cx) -> Result<Sse<impl futures_util::Stream<Item = Result<Event>>>> {
    let cx = cx.clone();                    // owned
    let stream = async_stream::stream! {
        let mut tick = tokio::time::interval(std::time::Duration::from_secs(1));
        loop {
            tick.tick().await;
            let n = read_count(&cx).await;
            yield Ok(Event::default().data(n.to_string()));
        }
    };
    Ok(Sse::new(stream))
}
```

- Um stream não pode emprestar o `Cx` do handler; clone e mova.
- Em closures/streams genéricos, `+ use<>` evita capturar o contexto implícito.
- Escritas de cookie/cabeçalho depois do commit panicam/ignoram-se.

## 9. Armadilhas

| Armadilha | Efeito | Correção |
|---|---|---|
| `live!` sem emitir | panic/validação | comece com `emit!` placeholder |
| esperar acumular emissões | só a última aparece | emita o estado completo |
| iniciar job no corpo live | duplica no reconnect | job fora, observe o estado |
| fallback de erro sem status | 200 em erro | declare `(StatusCode::…)` |
| cookie após streaming | panic | escreva antes de retornar a view |
| `suspense` em volta de tudo | nada muda no TTFB | isole só o trecho lento |
| `connected` fora de render | comportamento inesperado | use `connected_untracked` |
