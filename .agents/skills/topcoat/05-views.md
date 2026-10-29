# Views (`view!`)

> `view!` monta HTML com a sintaxe do HTML e Rust dentro. Texto é literal entre
> aspas; `(expr)` interpola; `if`/`for`/`match`/`let` funcionam em filhos e em
> listas de atributos. Tudo que é interpolado é escapado conforme o contexto.

## 1. Gramática

```rust
use topcoat::view::{View, view};

fn page(items: &[Item], current: &str) -> impl View {
    view! {
        <!DOCTYPE html>
        <html lang="pt-BR">
            <head>
                <meta charset="utf-8">
                <link rel="stylesheet" href="/app.css">
            </head>
            <body>
                <nav>
                    for item in items {
                        <a
                            href=(item.url)
                            if item.url == current {
                                aria-current="page"
                                class="active"
                            }
                        >(item.label)</a>
                    }
                </nav>
                <hr>
                <footer>"© 2026"</footer>
            </body>
        </html>
    }
}
```

Regras:

- Elementos usam o nome real. Void (`area base br col embed hr img input link meta
  source track wbr`) sem fechamento; os demais precisam fechar.
- `<!DOCTYPE html>` só nessa grafia; `<br/>` renderiza `/>` literal.
- Nomes de atributo aceitam `-`, `:`, `.` (`data-id`, `hx-get`, `xmlns:xlink`) e
  keywords (`type`, `for`).
- Tags customizadas com hífen são aceitas (`<my-widget>`).
- Texto **só** entre aspas; `("texto")` é expressão `&str`.

### Nomes dinâmicos

```rust
let tag = "section";
let attr = "data-state";
view! { <(tag) (attr)="ready">"…"</(tag)> }
```

A expressão é avaliada **uma vez** e reutilizada. Nome inválido → panic; nomes
dinâmicos são **validados**, não escapados.

## 2. Controle de fluxo

```rust
view! {
    if user.is_some() { <a href="/account">"Conta"</a> }
    else { <a href="/login">"Entrar"</a> }

    for post in posts { <li>(post.title)</li> }

    match state {
        State::Empty => <p>"Vazio"</p>,
        State::Error(msg) => { <p class="error">(msg)</p> <button>"Retry"</button> },
        State::Ok if ready => <p>"Pronto"</p>,
        _ => "",
    }

    let title = post.title.trim();
    <h1>(title)</h1>
}
```

- `match`: corpo de bloco com vários nós não leva vírgula; corpo de nó único leva
  vírgula entre arms.
- `let pat = expr;` exige inicializador e `;`; `let … else` não é suportado.
- `break`/`continue` são rejeitados em posição de nó; aceitos em listas de atributos.
- `if`/`for`/`match` em atributos emitem **atributos**, não nós:

```rust
view! {
    <a href="/posts"
       if current { aria-current="page" class="active" }
       for (k, v) in extra_attrs { (k)=(v) }
    >"Posts"</a>
}
```

## 3. Atributos

| Forma | Comportamento |
|---|---|
| `name="lit"` | sempre presente; literal escapado em compile-time |
| `name=(bool)` | `true` presente vazio; `false` omite |
| `name=(Option<T>)` | `Some` presente; `None` omite |
| `name=(expr)` | valor escapado no render |
| `(key)=(value)` | nome e valor dinâmicos (validados/escapados) |
| `(attrs)` | spread de `Attributes`; consome |
| `:name=$(expr)` | bind reativo (runtime) |
| `@event=$(closure)` | handler de evento (runtime) |

- `disabled="false"` **desabilita** — literal está presente. Use `disabled=(flag)`.
- Atributos enumerados (`aria-expanded`, `contenteditable`) exigem string
  `"true"`/`"false"`; `bool` significaria presença/ausência.
- Atributo estático duplicado → erro de compilação.
- `Attributes` é `HashMap`: ordem não especificada e chaves case-sensitive
  (`class` e `CLASS` coexistem).

### `class!`

```rust
use topcoat::view::class;

view! {
    <button
        disabled=(pending)
        class=(class!("btn", "opacity-50" if pending, extra_class))
    >"Salvar"</button>
}
```

- Entradas ausentes (`None`, `false`) são puladas; lista vazia omite o atributo.
- Literais consecutivos são fundidos e escapados em compile-time.
- Fora do markup: `let classes = class!("a b");` é promovido, sem escape em runtime.
- `StaticClass` para constantes.
- Sem resolução de conflito Tailwind (`px-2` + `px-4` coexistem).
- Merge de classes encaminhadas:

```rust
let mut attrs = attrs;
let merged = class!("base", attrs.remove("class"));
view! { <div class=(merged) (attrs)></div> }
```

### `attributes!`

```rust
use topcoat::view::attributes;

let attrs = attributes! { id="x" class="card" data-open=(is_open) };
view! { <div (attrs)>"…"</div> }
```

- Mesmo corpo de atributos, mais `let`, `break`, `continue`.
- Aceita `cx =>` (não documentado), que exige `&Cx`.
- Valores ausentes viram `Absent`, mas a chave pode permanecer; use `remove`.
- Spread consome os `Attributes`.

## 4. Componentes no markup

```rust
use topcoat::{Result, view::{View, component, view}};

#[component]
async fn card(title: &str, #[default] child: Child<'_>) -> Result<impl View> {
    Ok(view! { <section><h2>(title)</h2>(child)</section> })
}

view! {
    card(
        title: "Perfil",
        <p>"Detalhes"</p>
        button(text: "OK")
    )
}
```

- Nomeados com `nome: valor`; filhos depois, sem vírgulas.
- Um componente com `child` também pode receber `child: view!{…}.into()`.
- Detalhes de props, `#[default]`, keys e concorrência em
  [`06-componentes.md`](./06-componentes.md).

## 5. Lazy e concorrência

- `view!` devolve uma `View` **lazy**: expressões rodam no render, não na construção.
- Captura por `move`: depois de usar um valor na view, ele não está mais disponível;
  clone antes se precisar.
- Componentes irmãos renderizam concorrentemente; a saída é emitida na ordem do
  código. Ordem de execução é indefinida.
- `view! { cx => … }` clona o `Cx` na construção (não é totalmente lazy).

## 6. Identidade e IDs

```rust
#[key(item.id)]
for item in items { item_card(item: item) }
```

- `#[key(expr)]` só em `for`; identifica componentes/shards/regiões entre renders.
- Sem key, consumir a identidade entra em **panic** (mensagem aponta arquivo:linha).
- `element_id(cx)` gera `tc-…` estável por instância; use para `label for`/`id`.
- Em helpers chamados em loop, passe `&cx.keyed(item.id)`.
- IDs de região/identidade aparecem como comentários no HTML.

## 7. Metadados HTTP

```rust
use topcoat::router::{HeaderValue, StatusCode, header};

view! {
    (StatusCode::NOT_FOUND)
    ((header::CACHE_CONTROL, HeaderValue::from_static("max-age=60")))
    <h1>"Não encontrado"</h1>
}
```

- `StatusCode` define o status; `HeaderMap` ou `(HeaderName, HeaderValue)` adiciona
  headers. Não renderizam conteúdo.
- Primeiro status vence; por header, a primeira declaração fornece todos os valores.
- No layout: antes de `(slot)` sobrescreve; depois fornece default.
- Renderizar para string descarta metadados; use `render_response`/`.single()`.
- `HeaderValue` bloqueia CRLF.

## 8. Escaping

| Contexto | Escapa | Onde |
|---|---|---|
| texto | `&`, `<`, `>` | `HtmlContext::Text` |
| valor de atributo | `&`, `"` | `AttributeValue` |
| comentário | `&`, `>`, `"` | `Comment` |
| nome de tag/atributo | — (valida e panic) | `AttributeKey`/`ElementName` |

- Literais são escapados em **compile-time**; view totalmente estática vira uma
  string promovida.
- Valores dinâmicos são escapados no render por tabela especializada.
- Escotilhas de confiança: `Unescaped::new_unchecked`,
  `ViewHandle::unescaped_unchecked`, `PartsWriter::push_*_unescaped`,
  `IconData::unescaped_unchecked`. Só com markup constante/sanitizado.
- O escaping **não** valida esquema de URL, CSS ou JS:
  `href=(user)`, `style=(v)`, `srcdoc=(html)` continuam perigosos
  ([`13-seguranca.md`](./13-seguranca.md#2-contextos-que-o-escaping-não-cobre)).

## 9. Tipos customizados

Implemente a trait da posição para renderizar seu tipo:

| Posição | Trait |
|---|---|
| nó | `NodeViewParts` |
| valor de atributo | `AttributeValueViewParts` (+ `attribute_present`) |
| nome de atributo | `AttributeKeyViewParts` |
| atributos completos | `AttributeViewParts` |
| nome de elemento | `ElementNameViewParts` |

```rust
use topcoat::{context::Cx, view::{NodeViewParts, PartsWriter}};

struct Badge(String);

impl NodeViewParts for Badge {
    fn into_view_parts(self, _cx: &Cx, parts: &mut PartsWriter<'_>) {
        parts.push_string(self.0);       // escapado
    }
}
```

Cada método recebe um `PartsWriter`; `push_*` escapam/validam, `push_*_unescaped`
são o opt-out.

## 10. Render fora de componente

```rust
async fn render(cx: &Cx) -> impl View {
    view! { cx => card(title: "Olá", <p>"Conteúdo"</p>) }
}
```

- Sem `cx =>`, o macro usa o `Cx` do corpo envolvente (componente/live).
- `emit!`/`live!` aceitam a mesma forma.

## 11. Acessibilidade e SEO

Topcoat não gerencia `<head>` nem a11y por você; o HTML é seu.

Acessibilidade:

- Use landmarks (`header`, `nav`, `main`, `footer`) e uma hierarquia de headings.
- Todo input tem `label` ligado por `element_id(cx)`; erros com
  `aria-describedby`/`aria-invalid`.
- `aria-current="page"` na navegação via `href!(..).is_current(cx)`.
- Ícones: `icon(data: ICON)` decorativo (`aria-hidden`); com `label` vira
  `role="img"` + `aria-label`.
- Regiões que atualizam sozinhas: `aria-live="polite"` no container de status,
  evitando anúncio duplicado a cada frame.
- Preserve foco: shards trocam HTML in-place; após navegação, mova o foco para o
  título/`main` se necessário.
- Teclado: diálogos, menus e `details` nativos; não dependa de `@click` em `div`.
- `<html lang=(locale(cx).id()) dir=(locale(cx).id().direction())>`.
- Contraste e estados de foco vêm das classes; teste com teclado e leitor.

SEO:

- `title` e metadados são props/`view!` do layout ou da página — não há API de
  head. Evite duplicar `<title>`.
- Canonical/OG com URL absoluta (`href!(page).absolute().resolve(cx)` + `.base_url`).
- `sitemap.xml` e `robots.txt` ([`12`](./12-integracoes.md)); status correto em
  404/erros.
- Conteúdo principal no HTML inicial; streaming não substitui SSR para crawlers
  que não executam JS (o HTML já vem completo).
- Não indexe páginas privadas: `noindex`/status adequado.

## 12. Armadilhas

| Armadilha | Efeito | Correção |
|---|---|---|
| texto sem aspas | erro de compilação | `"texto"` |
| `disabled="false"` | atributo presente | `disabled=(false)` |
| `attributes!` esperando ordem | ordem instável | não dependa dela |
| `#[key]` ausente em loop | panic de identidade | adicione key |
| `.single()` em view live | panic | use `.first()` ou trate streaming |
| status na view não aparece | renderizou para string | `render_response` |
| `cx =>` pensando ser lazy | clona na construção | construa dentro do ramo |
| atributo dinâmico com input | panic (500) | valide antes |
