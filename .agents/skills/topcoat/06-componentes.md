# Componentes

> `#[component]` transforma uma função async em um componente chamável no markup,
> com props nomeadas, filhos opcionais e injeção automática de `Cx`.

```rust
use topcoat::{Result, view::{Child, View, component, view}};

#[component]
async fn panel(
    title: &str,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    Ok(view! {
        <section class="panel">
            <h2>(title)</h2>
            (child)
        </section>
    })
}
```

Chamada:

```rust
view! {
    panel(
        title: "Perfil",
        <p>"Detalhes da conta"</p>
        button(text: "Editar")
    )
}
```

## 1. Assinatura

- A função **precisa** ser `async` e retornar `Result<impl View>` (o erro pode ser
  `topcoat::Result` ou outro erro que converta).
- Props são os parâmetros nomeados; `cx: &Cx` é detectado **pelo nome** e injetado.
- O nome do componente no markup é o nome da função.
- Um componente pode ser chamado de página, layout, shard, live ou de outro
  componente.
- Componentes são funções normais para o Rust: sem estado próprio além de sinais
  e contexto.

## 2. Props

### Obrigatórias e opcionais

```rust
#[component]
async fn alert(
    message: &str,
    #[default] tone: &str,               // default: Default::default() → ""
    #[default("info")] level: &str,      // default explícito
    #[into] count: usize,                // aceita impl Into<usize>
) -> Result<impl View> { … }
```

- Sem `#[default]`, a prop é **obrigatória** no call site.
- `#[default]` usa `Default::default()`; `#[default(expr)]` usa a expressão.
- `#[into]` aplica `Into` ao argumento (aceita `&str` para `String`, etc.).
- Props são avaliadas na fase *hoist*, em ordem de fonte, **antes** de qualquer
  corpo de componente rodar.
- Duplicar argumento nomeado ou colocar nomeado depois de filho é erro.
- `cx` não é prop.

### `Props` derivada

```rust
use topcoat::view::{Props, View};

#[derive(Props)]
struct CardProps<'a> {
    title: &'a str,
    #[default]
    subtitle: Option<&'a str>,
}

#[component]
async fn card(props: CardProps<'_>) -> Result<impl View> { … }
```

`#[derive(Props)]` gera o builder typestate: campos sem default precisam ser
setados antes de `build()`. Campos chamados `build` são rejeitados; setters
consomem `self`.

### `Child`

- `Child<'_>` representa conteúdo filho; `#[default]` permite chamar sem filhos.
- `Child` é **sempre encaixotado** (`Box::pin`), inclusive `Child::default()`.
- Filhos inline são passados depois dos nomeados, sem vírgulas.
- Passar `child:` explícito **e** filhos inline: o inline vence (substitui).
- `Slot<'_>` em layouts é um alias de `Child<'_>`.

```rust
view! {
    panel(title: "Sem filhos")
    panel(title: "Com", <p>"A"</p> <p>"B"</p>)
}
```

### Atributos encaminhados

```rust
use topcoat::view::{Attributes, class};

#[component]
async fn button(
    #[default] mut attrs: Attributes,
    #[default("primary")] variant: &str,
    #[default] child: Child<'_>,
) -> Result<impl View> {
    let classes = class!(
        "btn",
        "btn-primary" if variant == "primary",
        "btn-ghost" if variant == "ghost",
        attrs.remove("class"),
    );
    Ok(view! { <button class=(classes) (attrs)>(child)</button> })
}
```

- `attributes!`/`(attrs)` para repassar atributos; remova `class` e mescle com
  `class!` para não duplicar.
- Não há resolução de conflito Tailwind.
- `Attributes` é `HashMap`: ordem não especificada.

## 3. Recursão e tipos diferentes

```rust
#[component]
async fn tree(node: NodeView) -> Result<impl View> {
    Ok(view! {
        <li>(node.label)
            <ul>
                for child in node.children {
                    (tree(node: child).boxed())   // ViewExt::boxed
                }
            </ul>
        </li>
    })
}
```

- `impl View` diferentes não unificam; `.boxed()` resolve.
- Recursão direta precisa de boxing (direto ou via `Child`).
- Em listas heterogêneas de views, `BoxView<'static>` também funciona.

## 4. Concorrência (importante)

O macro separa duas fases:

1. **Hoist** — argumentos nomeados e expressões de fonte são avaliados em ordem.
2. **Burst** — os futuros dos componentes já resolvidos escrevem no buffer, em
   ordem de fonte.

Consequências:

- Componentes irmãos são pollados concorrentemente; I/O independente roda em
  paralelo.
- A saída HTML respeita a ordem do código, não a de conclusão.
- A ordem de execução dos corpos é **indefinida**: não dependa de outro componente
  ter rodado, nem compartilhe estado mutável entre irmãos.
- O primeiro byte espera o **primeiro conteúdo de todos** os irmãos. Para não
  segurar o TTFB, use `suspense`/`live!` ([`07`](./07-streaming.md)).
- Para efeitos ordenados, execute-os antes de construir a view e interpole o
  resultado.

```rust
// Correto: efeito antes da view
let user = load_user(cx, id).await?;
let posts = load_posts(cx, id).await?;
view! { user_header(user: &user) post_list(posts: &posts) }

// Errado: depender de ordem entre irmãos
view! { saver() reader() }
```

## 5. Identidade, keys e IDs

- Cada call site tem identidade estável derivada de arquivo/linha/coluna/ordinal.
- Em `for`, adicione `#[key(expr)]` para distinguir iterações:

```rust
view! {
    #[key(item.id)]
    for item in items { item_card(item: item) }
}
```

- Sem key, consumir identidade (sinais, `element_id`, regiões live) entra em
  **panic**. A mensagem aponta o loop e sugere `#[key(...)]`.
- Helpers que precisam de identidade devem receber `&cx.keyed(item.id)`.
- `element_id(cx)` gera `tc-<identidade>`; estável entre renders do mesmo
  componente e local:

```rust
#[component]
async fn field(cx: &Cx, label: &str) -> Result<impl View> {
    let id = topcoat::view::element_id(cx);
    Ok(view! {
        <label for=(&id)>(label)</label>
        <input id=(&id) name=(label)>
    })
}
```

- Não reutilize IDs manualmente; deixe o framework derivar.
- IDs de região/live também aparecem no HTML; não os edite.

## 6. Páginas como componentes

- Um `#[page]` pode ser chamado como componente em outro lugar? Evite: páginas
  carregam path e responsabilidade de resposta. Prefira extrair o corpo para um
  `#[component]` compartilhado.
- `#[layout]` recebe `Slot<'_>`; trate como `Child`.
- `#[shard]` é chamado como componente, mas tem endpoint próprio; trate como shard,
  não como componente puro ([`08`](./08-runtime.md)).

## 7. Organização

```
src/
├── components/
│   ├── mod.rs
│   ├── button.rs        # #[component] + variantes
│   ├── card.rs
│   └── field.rs
└── app/
    └── posts.rs
```

- Componentes de UI não devem depender de páginas; recebem dados e `Child`.
- `Cx` só quando precisam de request/sinais/identidade.
- `class!`/variantes no componente; layout no call site.
- Componentes vendorizados do Topcoat UI seguem esse formato ([`11`](./11-assets-estilo.md)).

## 8. Armadilhas

| Armadilha | Causa | Correção |
|---|---|---|
| prop faltando | sem `#[default]` | adicione default ou passe valor |
| filhos ignorados | usou `child:` e inline juntos | escolha uma forma |
| ordem de efeitos | irmãos concorrentes | efeitos antes da view |
| panic de identidade | loop sem `#[key]` | adicione key |
| `element_id` igual em loop | helper sem contexto keyed | `cx.keyed(id)` |
| recursão não compila | `impl View` infinito | `.boxed()` |
| `&str` não aceita `String` | prop sem `#[into]` | adicione `#[into]` |
| componente "lento" segura tudo | barreira do JoinView | `suspense`/`live!` |
