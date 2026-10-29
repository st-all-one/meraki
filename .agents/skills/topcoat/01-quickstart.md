# Quickstart

> Do zero ao primeiro request: instalar a CLI, gerar o app, rodar o dev server e
> fazer a primeira edição. O ponto de entrada é sempre `topcoat::start(router)`
> ou `Router::handle(request)` quando outra plataforma recebe por você.

## 1. Instalação

```sh
cargo install topcoat-cli
topcoat help           # também funciona como: cargo topcoat <comando>
```

Garanta que `~/.cargo/bin` está no `PATH`. A CLI faz: `new`, `dev`, `fmt`,
`asset {list,bundle,clean}`, `ui {init,add,list,remove}`, `l10n check`.

## 2. Criar o app

```sh
topcoat new meu-app --recommended
```

> O diretório de destino **não pode existir**, nem vazio. O nome do pacote vem do
> diretório; use `--name` para outro nome; `--no-git` evita `git init`.

Presets:

| Preset | Inclui |
|---|---|
| `--recommended` | module routing, Toasty + SQLite, runtime, Tailwind, Topcoat UI, Iconify, Fontsource, exemplo todo |
| `--minimal` | module routing + CSS simples; sem banco, runtime, UI, ícones ou fontes |
| (nenhum) | wizard interativo por feature |

Flags (sobrescrevem o preset):

| Flag | Valores |
|---|---|
| `--routing` | `module`, `discover`, `manual` |
| `--database` | `toasty`, `none` (`--database-backend sqlite`) |
| `--interaction` | `topcoat`, `htmx`, `datastar`, `alpine-ajax`, `none` |
| `--tailwind` / `--no-tailwind` | Tailwind ou CSS simples |
| `--icons` | `iconify`, `custom`, `none` (+ `--icon-set`) |
| `--font` | `fontsource`, `none` (+ `--font-family`) |
| `--ui` / `--no-ui` | componentes Topcoat UI |
| `--example` / `--no-example` | exemplo todo |
| `--no-interactive` | nunca pergunta; falha se faltar escolha |

UI exige Tailwind + Iconify. Se desligar um, desligue o outro:
`topcoat new app --recommended --no-tailwind --no-ui`.

## 3. Rodar

O preset recomendado tem modelos de banco; crie as tabelas antes do primeiro run:

```sh
cd meu-app
cargo run -- toasty migration generate
cargo run -- toasty migration apply
topcoat dev
```

- URL: <http://127.0.0.1:3000>
- `HOST`/`PORT` sobrescrevem o bind: `HOST=0.0.0.0 PORT=8080 topcoat dev`.
- `topcoat dev` reconstrói, re-bundleia assets e recarrega; `r` força rebuild.
- Sem banco (`--minimal` ou `--database none`), pule as migrations.
- `cargo run` puro **não** gera o bundle de assets; use `topcoat dev` ou
  `topcoat asset bundle`.

## 4. Estrutura gerada (recomendado)

```
meu-app/
├── src/
│   ├── main.rs              # start, migrations embutidas, seed
│   ├── app.rs               # layout raiz + module_router!().discover()…
│   ├── app/
│   │   ├── _marketing.rs    # grupo sem segmento
│   │   ├── posts.rs         # /posts
│   │   ├── posts/id.rs      # /posts/{post_id}
│   │   └── api/health.rs    # /api/health
│   ├── components/          # Topcoat UI copiada + seus componentes
│   └── db.rs
├── assets/                  # bundle gerado
├── styles.css               # entrada Tailwind (se habilitado)
├── components.toml          # versões da UI vendorizada
├── build.rs                 # Tailwind/Iconify (se habilitado)
└── Cargo.toml
```

## 5. Setup manual

```sh
cargo new meu-app
cd meu-app
cargo add topcoat
cargo add tokio --features rt-multi-thread,macros
```

`src/main.rs`:

```rust
use topcoat::{
    Result,
    router::{module_router, page},
    view::{View, view},
};

#[tokio::main]
async fn main() {
    topcoat::start(module_router!().build()).await.unwrap();
}

#[page]
async fn home() -> Result<impl View> {
    Ok(view! {
        <!DOCTYPE html>
        <html>
            <head>topcoat::dev::script()</head>
            <body><h1>"Hello"</h1></body>
        </html>
    })
}
```

`topcoat::start` lê `HOST`/`PORT`, com default `127.0.0.1:3000`. `topcoat::dev::script()`
só é necessário para hot reload no dev.

## 6. Features

Defaults habilitados na fachada:

```
asset compression cookie font icon router runtime serve session view discover
```

`full` liga: `alpine-ajax anyhow datastar fs htmx icon-iconify jiff l10n
l10n-datetime l10n-fluent l10n-number mail mail-smtp multipart sitemap sse
tailwind tower ui websocket`.

Regras:

- Feature habilita **API**; método de builder **instala serviço**.
- Importe a trait de extensão antes de usar o método:
  `RouterBuilderAssetExt`, `RouterBuilderRuntimeExt`, `RouterBuilderCookieExt`,
  `RouterBuilderSessionExt`, `RouterBuilderDiscoverExt`, `RouterBuilderFontExt`,
  `RouterBuilderDirectoryExt`.
- `discover` (default) é pré-requisito de `.discover()`, procedures e shards.
- `serve` (default) é pré-requisito de `start`/`serve`; sem ele use `Router::handle`.

## 7. Primeira edição

Em `src/app.rs`, adicione uma página e um componente:

```rust
use topcoat::{Result, context::Cx, router::page, view::{View, component, view}};

#[page]
async fn about() -> Result<impl View> {
    Ok(view! {
        <h1>"About"</h1>
        note(text: "Editado no dev server")
    })
}

#[component]
async fn note(text: &str) -> Result<impl View> {
    Ok(view! { <p class="note">(text)</p> })
}
```

Se `about.rs` estiver em `src/app/about.rs`, a URL é `/about`; se você declarou
`#[page]` no próprio `app.rs`, é `/`. Detalhes em [`02-roteamento.md`](./02-roteamento.md).

## 8. Formatação

`cargo fmt` **não** formata o interior de macros. Formate os corpos com:

```sh
topcoat fmt            # view!, attributes!, class!, mail!, ...
topcoat fmt --check    # CI: sai != 0 se algo mudaria
topcoat fmt --rustfmt  # roda rustfmt antes
```

- `--stdin` para editores: formata de stdin para stdout; `--stdin --check` valida
  sem emitir.
- `--macros view,class` limita quais macros formatar; macros renomeadas no import
  não são reconhecidas.
- `--rustfmt` roda rustfmt antes; ambos precisam passar para escrever.
- Requisitos: `rustfmt` no `PATH`; defina `edition` no `rustfmt.toml` (o input é
  passado por pipe).
- `Topcoat.toml` na raiz funciona como marcador para editores (ex.: conform.nvim).

Integração com rust-analyzer (VS Code, Helix, Zed) — `rust-analyzer.toml`:

```toml
[rustfmt]
overrideCommand = ["topcoat", "fmt", "--stdin", "--rustfmt"]
```

## 9. Topcoat UI

```sh
topcoat ui init [--theme <nome>]
topcoat ui add button [--all] [--overwrite]
topcoat ui list [--installed]
topcoat ui remove button
```

- `init` cria `components.toml` e o tema em `styles.css`; commite ambos.
- Componentes vão para `src/components`; `--components-dir` escolhe outro.
- Em workspace, `--package <nome>` seleciona o pacote.
- `add` instala dependências e declara módulos em `src/components.rs` (ou `mod.rs`);
  conflito entre os dois precisa ser resolvido antes.
- Requer Tailwind + tema compilado; carregue `styles.css` e a fonte do tema.

## 10. Armadilhas do primeiro dia

| Sintoma | Causa | Correção |
|---|---|---|
| panic em `AssetBundle::load()` | rodou `cargo run` sem bundle | `topcoat dev` ou `topcoat asset bundle` |
| shard/procedure 404 | faltou `.discover()` | adicione antes de `.build()` |
| `runtime::script()` panic | router sem `.runtime()` | chame `.runtime()` (após as layers de app) |
| página em `/` mas URL 404 | `#[page("/x")]` absoluto não é registrado por `module_router!` | `.discover()` ou `.page(handler)` |
| 307/308 inesperado | trailing slash | declare a forma usada ou configure `trailing_slash` ([`02`](./02-roteamento.md)) |
| CSS Tailwind ausente | `build.rs` sem `render()` | veja [`11-assets-estilo.md`](./11-assets-estilo.md) |
| `toasty` desconhecido | preset sem banco | remova o subcomando ou regenere com `--database toasty` |
