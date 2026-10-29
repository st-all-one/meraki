# Runtime no browser

> O runtime adiciona interação a páginas server-rendered. `signal` guarda estado,
> `$()` é uma expressão que roda em Rust no servidor e em JavaScript no browser,
> `@event`/`:attr` ligam eventos e atributos. Procedimentos e shards vão ao servidor.

> **Experimental.** O vocabulário de expressões é fechado e pode mudar.

## 1. Setup

```rust
use topcoat::{
    asset::{AssetBundle, RouterBuilderAssetExt},
    router::{RouterBuilder, RouterBuilderDiscoverExt, module_router},
    runtime::RouterBuilderRuntimeExt,
};

pub fn router() -> RouterBuilder {
    module_router!()
        .discover()                          // procedures, shards, fontes
        .assets(AssetBundle::load().unwrap()) // serve o script do runtime
        .runtime()                           // depois das layers de app
        .max_runs_per_connection(64)
}
```

No documento:

```rust
view! {
    <html>
        <head>
            topcoat::runtime::script()
        </head>
        <body>…</body>
    </html>
}
```

- `script()` **panic** se o router não chamou `.runtime()`.
- `.runtime()` converte o POST de rerun (`X-Topcoat-Runtime`) em `GET` e registra os
  valores de sinais. Registrar layers de app antes faz com que elas vejam o rerun
  como `GET`.
- `discover` registra procedures/shards; sem ele, endpoints ficam 404.
- O script é servido pelo bundle; `cargo run` sem bundle quebra a página.

## 2. Sinais

```rust
use topcoat::{
    Result,
    context::Cx,
    runtime::{Event, signal},
    view::{View, component, view},
};

#[component]
async fn counter(cx: &Cx) -> Result<impl View> {
    let count = signal(cx, || 0usize);

    Ok(view! {
        <button @click=$(|_e| count.set(count.get() + 1))>"+1"</button>
        <button @click=$(|_e| count.decrement())>"−1"</button>
        <p>"Count: " $(count.get())</p>
    })
}
```

API:

| Método | Onde | Efeito |
|---|---|---|
| `signal(cx, || init)` | servidor | cria `Signal<T>`; valor inicial |
| `read()` / `get()` | ambos | leitura **tracked** |
| `read_untracked()` / `get_untracked()` | servidor | leitura sem dependência |
| `set(v)` | browser | substitui o valor |
| `toggle()` / `increment()` / `decrement()` | browser | açúcar para bool/numérico |
| `push_str(s)` | browser | append em `String` |

Regras:

- `Signal<T>` é `Clone` barato (Arc). Pode ser parâmetro de componente/shard.
- **No servidor não há `set`**: mutação só existe no vocabulário de expressões; se
  avaliada no servidor, panic.
- Leitura tracked no **corpo** cria dependência de re-render do shard/página.
  Leitura dentro de `$()` só atualiza o browser.
- Identidade = hash de `Cx` + `Location::caller()`. Em loop, `#[key]`; em helper,
  `cx.keyed(id)`. Fora de escopo de render ou dentro de `#[memoize]`: panic.
- Restauração: o browser envia valores; se não desserializar no tipo exato, o `init`
  roda silenciosamente. **Nunca confie no valor restaurado.**
- Sinais criados em shard sobrevivem aos re-renders do shard.

## 3. Expressões

```rust
view! {
    <p>$(1 + 2)</p>
    <p>$(format_like(count.get()))</p>   // ❌ fora do vocabulário
    <p>$(if open.get() { "aberto" } else { "fechado" })</p>
}
```

`$(...)` equivale a `expr!(...)`; devolve `Expr<T>`:

- Servidor avalia sincronamente para o HTML inicial.
- Sem leitura de sinal → estática (só valor do servidor).
- Com leitura → ganha binding no browser e reavalia quando o sinal muda.
- `.dynamic()` força atualização do valor atual mesmo sem sinal (útil para limpar
  input a cada render).
- `.is_static()`, `.evaluate()`, `.from(..)` para casos programáticos.

### Vocabulário

| Tipo | Operações |
|---|---|
| `f64` | `+ - * /`, comparação, negação; `Display` Rust |
| inteiros | `+ - * / %`, comparação, negação; **panic** em overflow/divisão por zero, debug e release |
| `bool` | `!`, igualdade, `then`, `then_some` |
| `String`/`&str` | `len`, `is_empty`, `trim*`, `starts_with`, `ends_with`, `contains`, `to_owned`, comparação |
| `Option<T>` | `is_some/is_none`, `unwrap`, `expect` |
| `Result<T,E>` | `is_ok/is_err`, `ok/err`, `unwrap*`, `expect*` |
| `Vec`/array/slice | `len`, `is_empty`, `get`, `index`, `first`, `last`, `to_vec`, `to_owned`, `as_slice`, `clone` |
| tuplas | literais, `.0`/`.1`, `clone`; renderiza elementos concatenados |
| `#[record]` | literal de struct, acesso a campo, `clone`; sem comparação/render |
| `Signal` | `get`, `set`, açúcares |

Sintaxe: literais; operadores; métodos/campos/índice; `Some/None/Ok/Err`; literais de
struct/tupla; blocos com `let`; `if/else`; closures (inclusive `async`) e `.await`;
`loop`, `while`, `break`, `continue`, `return`.

Semântica espelha Rust: `len()` de string conta **bytes UTF-8**; comparação por code
point; trim Unicode `White_Space`; inteiro sem sufixo é `usize`; precisão total
inclusive `i128/u128`.

Paridade Rust↔JS é checada por `crates/topcoat-runtime/coherence`. Limitações
conhecidas: floats não finitos serializam como `null` em capturas; `Option<()>`;
`return`/`break` dentro de `if` em certos casos; DOM e side effects estão fora do
harness.

### Coerência Rust/JS

O framework valida a paridade com V8 em `crates/topcoat-runtime/coherence`:

```sh
cargo test -p topcoat-runtime-coherence
```

- Casos usam `coherent!(expr)` (Rust + JS) e `coherent!(direct => expr)`.
- Async: `coherent!(async => { … })` com `Awaitable` reproduzível.
- Panics Rust e `Panic` JS concordam; outros erros/tempo esgotado falham.
- Ao alterar o runtime do browser, rebuild do bundle JS e commit de
  `dist/coherence.js`.

Se você estende o vocabulário, adicione casos — não confie em “parece igual”.

### `raw!`

```rust
view! {
    $({
        let n = name.get();
        raw!("${n}.toUpperCase()", n.to_uppercase())
    })
}
```

- Primeiro argumento: fonte JavaScript; `${ident}` insere variáveis do escopo
  (hidratadas, não concatenadas).
- Segundo argumento (opcional): Rust equivalente para o servidor.
- Sem fallback, a expressão só roda no browser; num `$()` de topo, o servidor
  panic. Use dentro de closures de evento.
- **`raw!` não é HTML**: é JavaScript. Não existe `raw!` de markup; para HTML
  confiável use `Unescaped` ([`13`](./13-seguranca.md)).

## 4. Bind e eventos

```rust
view! {
    <input
        :value=$(name.get())
        @input=$(|e: Event| name.set(e.target.value))
    >
    <p>"Olá, " $(name.get())</p>
}
```

- `@evento=$(closure)` recebe `Event` (DOM); `@click="alert('hi')"` aceita JS puro
  como string.
- `:atributo=$(expr)` faz bind reativo; emite `data-topcoat-bind:<attr>`.
- `value`/`checked`/`selected` estáticos são **defaults**: se o usuário editou, o
  valor dele prevalece no rerender. `:value` sem sinal tem o mesmo efeito de
  `value`. Para sempre aplicar o valor atual, use `Expr::dynamic()`:

```rust
let draft = topcoat::runtime::Expr::from(String::new()).dynamic();
view! { <input :value=(draft)> }
```

- Eventos comuns: `click`, `input`, `change`, `submit`, `keydown`, `focus`,
  `blur`, etc. O nome vai para `data-topcoat-on:<evento>`.

## 5. Records

```rust
use topcoat::runtime::record;

#[record]
#[derive(Clone)]
struct Todo {
    id: u64,
    title: String,
    done: bool,
}
```

- Struct de campos nomeados, sem generics, sem `cfg` por campo.
- Campos reservados: `__proto__`, `clone`, `constructor`, `dehydrate`, `deref`,
  `deref_mut`, `then`, `toJSON`, `toString`, `valueOf`.
- Construção: `Todo { id: 1, title, done: false }`; campo de sinal:
  `todo.read().title`; `clone` se derive `Clone`.
- Não compara, não renderiza diretamente; renderize campos.
- **Todos os campos são enviados ao browser, inclusive privados.** Não coloque
  segredos em record capturado.
- Serde gerado rejeita campos desconhecidos.

## 6. Procedures

```rust
use topcoat::{Result, context::Cx, runtime::procedure};

#[procedure]
async fn double(value: usize) -> Result<usize> {
    Ok(value * 2)
}

#[procedure("/api/todos/save")]
async fn save(cx: &Cx, todo: Todo) -> Result<Todo> {
    let user = require_user(cx).await?;
    persist(cx, user, todo).await
}
```

Chamada no browser:

```rust
view! {
    <button @click=$(async |_e| {
        let saved = save(Todo { id: 0, title: draft.get(), done: false }).await;
        draft.set(saved.title);
    })>"Salvar"</button>
}
```

Regras:

- `async`, tipo de retorno declarado, sem `self`.
- `cx: &Cx` é omitido pelo chamador.
- Args e `Ok` usam o vocabulário de expressões (records incluídos).
- Endpoint é POST JSON; path gerado por arquivo+linha+coluna+nome — **instável**.
  Passe path absoluto para estabilidade (sem params/catch-all).
- `Err` vira falha de expressão (status HTTP); `Result` aninhado permite erro
  tratado no cliente.
- Avaliar `save(..)` no servidor durante render → panic.
- **Valide e autorize dentro da procedure.** Guards de página não rodam.
- Registro: `.route(save)` ou `.discover()`.

## 7. Shards

```rust
use topcoat::{Result, context::Cx, runtime::shard, view::{View, view}};

#[shard]
async fn results(cx: &Cx, query: String) -> Result<impl View> {
    let user = require_user(cx).await?;
    let limit = query.chars().take(100).collect::<String>();
    let items = search(cx, user, &limit).await?;
    Ok(view! { <ul>for i in items { <li>(i)</li> }</ul> })
}

// uso
view! {
    <input :value=$(q.get()) @input=$(|e: Event| q.set(e.target.value))>
    results(query: $(q.get()))
}
```

Semântica:

- Render inicial **inline** na página (sem request extra).
- Quando um argumento/sinal lido muda, o browser envia os args e o shard
  re-renderiza no servidor; o HTML é trocado in-place preservando foco/scroll/input.
- Mudanças no mesmo tick coalescem; a requisição mais nova aborta a anterior.
- Parâmetro `T` ou `Expr<T>`; `Signal<T>` compartilha handle (dependência só por
  leitura tracked no corpo).
- `#[shard("/caminho")]` fixa endpoint; path não aceita params/catch-all.
- Endpoint POST; args e sinais viajam no body. **Guards de página/layout não rodam.**
- Sinais do shard sobrevivem aos re-renders; trate-os como input.
- Path gerado muda quando a função se desloca (linha/coluna).
- Registro: `.route(..)`/`.discover()`.

### Escolher shard vs expressão

| Precisa de | Use |
|---|---|
| Cálculo/estado local | `signal` + `$()` |
| Dados do banco/HTTP | `#[shard]` |
| Efeito imperativo (salvar, cobrar) | `#[procedure]` |
| HTML contínuo por eventos | `live!` + `connected` |

## 8. Navegação e prefetch

```rust
use topcoat::runtime::{RouterBuilderRuntimeExt, link};

view! {
    link(href: href!(posts), "Posts", prefetch: PrefetchMode::Intent)
}
```

- Substitui `<a>` por navegação sem reload; preserva sinais comuns entre páginas.
- Modos: `Intent` (default; hover/focus/touch), `Viewport`, `Never`.
- Precedência: argumento do link → contexto da request → app (`.prefetch(..)`) →
  `Intent`. `prefetch_mode(cx)` lê o default; `link_attrs(cx, href, mode)` aplica
  a `<a>` custom.
- Prefetch é um **render completo no servidor** (layers e guards inclusos):
  TTL 30 s, até 8 páginas, 2 downloads simultâneos, buffer de 1 MiB, `no-store`
  desabilita reuso.
- Navegação reaproveita scripts já carregados; scripts inseridos por update não
  executam, e doctype/base divergente força reload completo.

## 9. WebSocket e limites

- Um WebSocket por documento/aba; multiplexa todas as regiões conectadas.
- Cada render conectado consome um slot; default 64 por conexão, excedente 429.
- Frames são NDJSON; redirects viram frames de navegação; erro de status vira
  `Error { status }`.
- Reconnect reinicia renders; estado local e assinaturas são recriados.
- Headers por run são allowlist (`Content-Type`, identidade de runtime); credenciais
  do handshake persistem.
- `X-Topcoat-Identity` é controlado pelo cliente: identifica render, **não**
  autentica.

## 10. Debug e pitfalls

| Sintoma | Causa | Correção |
|---|---|---|
| expressão não compila | fora do vocabulário | simplifique, `raw!` ou procedure |
| `raw!` panic no render | sem fallback Rust | passe o segundo argumento |
| sinal "reseta" sozinho | valor inválido restaurado | valide; `init` rodou |
| sinais trocados em lista | falta `#[key]` | adicione key |
| `signal` panic | fora de render ou memoized | mova para o corpo do componente/shard |
| shard 404 | sem `.discover()`/`.route()` | registre |
| shard 403/erro | sem auth dentro do shard | `require_user(cx)` |
| 429 no WS | >64 renders conectados | `max_runs_per_connection` ou menos regiões |
| estado não persiste entre páginas | sinais são por página | use cookie/session/servidor |
| input não limpa | `value` é default | `Expr::dynamic()` |
