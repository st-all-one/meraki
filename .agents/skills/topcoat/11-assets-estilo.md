# Assets, Tailwind, fontes, ícones e UI

> O asset system declara arquivos em Rust, gera URLs com hash de conteúdo e serve
> com cache imutável. Tailwind, fontes e ícones são features opcionais que
> participam do mesmo bundle; Topcoat UI é código copiado para o projeto.

## 1. `asset!`

```rust
use topcoat::{Result, asset::{Asset, asset}, router::page, view::{View, view}};

const FERRIS: Asset = asset!("./ferris.png");

#[page]
async fn about() -> Result<impl View> {
    Ok(view! {
        <img src=(FERRIS) alt="Ferris">
        <script type="module" src=(asset!("https://cdn.example.com/lib.js"))></script>
    })
}
```

Renderiza `/_topcoat/assets/ferris-<16hex>.png`. O hash é do conteúdo; a URL pode
ser cacheada para sempre.

### Resolução de caminho

| Path | Base |
|---|---|
| `"./x.png"` / `"../x.png"` | arquivo-fonte que chama `asset!` |
| `"assets/x.png"` (nu) | `CARGO_MANIFEST_DIR` do crate |
| `"/opt/app/x.png"` | absoluto, como está |
| `"https://…"` | baixado/cacheado pelo bundler |

### Opções

```rust
const LOGO: Asset = asset!(
    "https://example.com/logo.png",
    rename: "logo",
    extension: "png",
    content_type: "image/png",
    checksum: "sha256:…",
);
```

- `rename`: troca o stem; útil para evitar conflito de nomes/content-type.
- `checksum`: falha o bundle se o arquivo remoto mudar.
- `content_type`: sobrescreve o `mime_guess`.

## 2. Bundle

- `asset!` grava uma declaração no binário; o bundler **varre o binário**.
  Declarações não linkadas não entram.
- `topcoat dev` re-bundleia após cada build.
- Manual:

```sh
topcoat asset list
topcoat asset bundle --release
topcoat asset bundle --bin meu-app
topcoat asset bundle --package meu-pacote --profile my-profile
topcoat asset bundle --out dist/assets
topcoat asset clean
```

- Default: `<target>/<profile>/assets`; cache remoto em `<target>/topcoat/cache/assets`.
- **Cada perfil tem seu bundle.** Use o mesmo perfil que vai rodar.
- Não reutilize bundle de outro build, mesmo com fontes iguais.

### Carregar

```rust
use topcoat::{
    asset::{AssetBundle, RouterBuilderAssetExt},
    router::{RouterBuilderDiscoverExt, module_router},
};

let router = module_router!()
    .discover()
    .assets(AssetBundle::load()?)          // <exe_dir>/assets
    // .assets(AssetBundle::load_dir("dist/assets")?)
    .build();
```

- `load()` só olha ao lado do executável.
- Asset não presente no catálogo → panic no render. Binário e bundle **do mesmo
  build**.
- `.assets(..)` registra uma rota GET por arquivo em `/_topcoat/assets`.

### CDN

```rust
use topcoat::asset::{AssetBundle, AssetConfig, RouterBuilderAssetExt};

let router = module_router!()
    .assets(AssetConfig::hosted_at(
        "https://static.example.com/assets",
        AssetBundle::load()?,
    ))
    .build();
```

- Sem rotas locais; URL = `{base}/{arquivo}`.
- Suba o bundle junto com o binário correspondente.
- Sem FS? Embuteda o manifesto:

```rust
use topcoat::asset::{AssetConfig, Manifest};

let manifest = Manifest::parse(include_str!("../dist/assets/manifest.toml"))?;
let router = module_router!()
    .assets(AssetConfig::hosted_at("https://cdn.example.com", manifest))
    .build();
```

### Cache e custo real

- `Cache-Control: public, max-age=31536000, immutable` + `Content-Type`.
- Sem ETag/304, sem `Range`, sem variantes pré-comprimidas.
- Cada request lê o arquivo inteiro em memória (`tokio::fs::read`).
- Compressão é middleware do router (gzip/br), por resposta; imagens/SSE ficam de
  fora. Servir por CDN/edge é o caminho para produção.
- Cache remoto é indexado só pela URL e não revalida: mudanças exigem
  `topcoat asset clean` (ou `checksum` para falhar).
- **SRI não é gerado**: o hash no nome não serve como `integrity`. Para scripts de
  CDN, calcule `sha384` no build e emita `integrity="…" crossorigin="anonymous"`.

## 3. Tailwind

Feature `tailwind`; sem Node.

`build.rs`:

```rust
fn main() {
    topcoat::tailwind::BuildConfig::new()
        // .input("styles.css")
        // .minify(true)
        .render()
        .unwrap();
}
```

Layout:

```rust
view! {
    <link rel="stylesheet" href=(topcoat::tailwind::stylesheet!())>
}
```

- Sem `render()` no `build.rs`, `stylesheet!()` aponta para arquivo inexistente.
- O scanner detecta **classes literais**. Nomes montados por `format!` não são
  detectados; use `class!` com literais ou um safelist.
- `.input("styles.css")` escolhe a entrada.
- `output()` custom não é suportado por `stylesheet!`; use `asset!`.
- O binário Tailwind é baixado pela rede (versão fixa; checksum não é verificado
  por default). Em CI/offline, pré-instale/cacheie.
- `@source` deve cobrir componentes vendorizados se `--components-dir` mudar.

## 4. Fontes

### Declarar

```rust
use topcoat::font::{Font, font, font_face};

const INTER: Font = font!("Inter", @font-face {
    src: url("/fonts/inter.woff2") format("woff2");
    font-weight: 100 900;
    font-display: swap;
});

const ICONS: Font = font_face!("Icons", src: url("./icons.woff2") format("woff2"));
```

### Fontsource

```rust
use topcoat::{asset::Asset, font::{Font, fontsource::fontsource_font}};

const GEIST: Font = fontsource_font!(
    GEIST,
    weight: [400, 500, 600, 700],
    style: Normal,
    host: Asset,              // bundle local; default é CDN
);
```

- Sem `host: Asset`, usa jsDelivr `@latest` — conteúdo mutável numa URL imutável.
  Para produção, hospede localmente.
- Sem `weight`, inclui **todos** os pesos/estilos (18 faces); cada face vira um
  `<link rel=preload>`. `fontsource_font_face!` declara uma face específica.
- `crossorigin="true"` emitido pelo `preload_link` é um valor inválido de CORS
  (o correto seria `anonymous`). Evite depender dele ou corrija no componente.
- Descritores (`font-weight`, `font-style`, `font-display`, `unicode-range`,
  `font-tech`) são aceitos no `@font-face`; use `unicode-range` para subset.

### Registrar e carregar

```rust
use topcoat::font::{RouterBuilderFontExt, link};

let router = module_router!()
    .discover()              // registra fontes declaradas
    .build();

view! { link(font: GEIST) }  // preloads + stylesheet
```

- `link(font:, preload: bool)`; `preload=false` remove os preloads.
- Fonte não registrada e sem `.discover()` → panic no render.
- CSS da fonte tem URL própria com hash e cache imutável.

## 5. Ícones

```rust
use topcoat::{icon::{IconData, icon}, view::view};

const CHECK: IconData = IconData::new("…svg…");   // ou iconify
view! {
    icon(data: CHECK, label: "Concluído")         // role=img + aria-label
    icon(data: CHECK)                             // decorativo (aria-hidden)
}
```

- SVG inline: sem request extra, mas repetido por ocorrência.
- `size` default `1em`; `vertical-align: -0.125em`; `attrs` disponível.
- `IconData::unescaped_unchecked` desliga escaping/validação: só com SVG
  confiável.

### Iconify

```rust
// build.rs
fn main() {
    topcoat::icon::iconify::BuildConfig::new()
        .icon_set("feather")
        .stage()
        .unwrap();
}
```

```rust
use topcoat::icon::iconify;

const TRASH: topcoat::icon::IconData = iconify::include!("feather:trash-2");
// ou o set inteiro: iconify::include!("feather")
```

- `stage()` precisa rodar para **cada** set usado.
- Sets sem versão fixa nunca são atualizados; fixe a versão.
- Ícones `hidden`, com rotação/flip podem ser omitidos/erro.

## 6. Topcoat UI

CLI:

```sh
topcoat ui init [--theme <nome>]
topcoat ui add button [--all] [--overwrite]
topcoat ui list [--installed]
topcoat ui remove button
```

- `--components-dir` troca `src/components`; `--package` seleciona o pacote no
  workspace.
- `init` escreve o tema em `styles.css` e o registro em `components.toml`.
- `add` instala dependências e edita `src/components.rs`/`mod.rs`; não tenha os dois.

- Componentes são **copiados** para `src/components`; edite à vontade.
- `components.toml` registra versões; commite-o.
- `topcoat ui list` compara com o registry por hash, não com seu arquivo local.
- `add --overwrite` destrói edições locais; revise o diff.
- `remove` não remove dependências.
- Requer Tailwind + Iconify; compile o `styles.css` e carregue a fonte.
- Convenções de props: `variant`/`size` (enums), `attrs: Attributes`,
  `child: Child<'_>`, helpers `*_variants`; componentes interativos usam
  `Expr<bool>`/`element_id`.
- Tema escuro: ancestral `.dark`. Sombras desabilitadas por default; instruções no
  `styles.css` instalado.

## 7. Checklist de assets

- [ ] Todos os arquivos declarados com `asset!`; nenhuma URL `/assets/x` manual.
- [ ] `AssetBundle::load()?` no router (ou `load_dir`/`hosted_at`).
- [ ] `topcoat asset bundle` no pipeline de release, no mesmo perfil do binário.
- [ ] Bundle publicado junto do binário (ou CDN com o mesmo manifest).
- [ ] Tailwind `build.rs` com `render()`; classes literais.
- [ ] Fontes com `host: Asset` e pesos explícitos.
- [ ] Iconify `stage()` para cada set.
- [ ] `components.toml` commitado; `ui list` revisado.
- [ ] Cache imutável; HTML referencia URL com hash (não versão manual).

## 8. Armadilhas

| Sintoma | Causa | Correção |
|---|---|---|
| panic "asset not found" | bundle ausente/desatualizado | `topcoat asset bundle` no perfil certo |
| 404 em CSS | `stylesheet!` sem `render()` | build.rs |
| classes somem em produção | nome dinâmico | literais/safelist |
| fonte 404 | não registrada | `.discover()`/`.font(..)` |
| fontes pesadas | Fontsource sem pesos | `weight: [..]` + `host: Asset` |
| ícone ausente | set não staged | `stage()` no build.rs |
| edição da UI perdida | `add --overwrite` | versione no git |
| cache remoto velho | cache por URL | `topcoat asset clean` |
