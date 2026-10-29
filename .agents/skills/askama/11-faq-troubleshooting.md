# FAQ e Troubleshooting

## Perguntas Frequentes

### O Askama funciona em Rust stable?

Sim! Askama funciona em Rust stable desde a versão 0.1. Não requer nightly.

### Qual a versão mínima do Rust (MSRV)?

| Versão Askama | MSRV |
|---|---|
| 0.16 | 1.88 |
| 0.15 | 1.88 |
| 0.14 | 1.83 |
| 0.13 | 1.81 |

### Askama é compatível com templates Jinja/Django?

Askama é **baseado** no Jinja, mas **não é 100% compatível**. As principais diferenças:

- Askama é compilado (type-safe), Jinja é interpretado
- Askama não tem `{{ super() }}` com variáveis arbitrárias — precisa do `block`
- A sintaxe de filtros é similar, mas a implementação difere
- Askama não suporta `set` com escopo de bloco igual ao Jinja
- `for ... else` existe em ambos

### Preciso de um struct separado para cada template?

Sim — cada template tem seu próprio struct de contexto. Isso é intencional:
cada campo é verificado em tempo de compilação.

Para projetos pequenos, você pode usar o mesmo struct para templates similares,
mas isso anula a segurança de tipos.

### Posso usar async nos templates?

Não diretamente. O `render()` é síncrono. Para dados async, prepare os dados
antes de criar o struct:

```rust
async fn handler() -> Result<impl IntoResponse, AppError> {
    let users = fetch_users().await?;  // async
    let template = UserListTemplate { users };  // sync
    Ok(Html(template.render()?))
}
```

### Como faço para incluir um template condicionalmente?

Use `{% include %}` dentro de um `{% if %}`:

```jinja
{% if user.is_admin %}
  {% include "admin/panel.html" %}
{% else %}
  {% include "user/panel.html" %}
{% endif %}
```

O caminho deve ser uma string literal (conhecida em tempo de compilação).

### Como acesso variáveis do template em filtros customizados?

O segundo argumento do filtro é `env: &dyn askama::Values`. Use `askama::get_value`:

```rust
#[askama::filter_fn]
pub fn meu_filtro(value: impl Display, env: &dyn askama::Values) -> askama::Result<String> {
    if let Ok(extra) = askama::get_value::<String>(env, "extra") {
        Ok(format!("{} {}", value, extra))
    } else {
        Ok(value.to_string())
    }
}
```

### Como desativo o escaping HTML para um template inteiro?

```rust
#[derive(Template)]
#[template(path = "meu-template.html", escape = "none")]
struct MeuTemplate { ... }
```

### Como desativo o escaping para uma única expressão?

```jinja
{{ conteudo_html | safe }}
```

### Como forço escaping em um template sem escaping?

```jinja
{{ variavel | escape }}
{{ variavel | e }}
{{ variavel | escape("html") }}  {# escaper específico #}
```

### `{% let %}` e `{% set %}` são a mesma coisa?

Sim. Ambos criam variáveis. `set` existe para compatibilidade com Jinja.

### Como faço para criar uma variável sem valor inicial?

Use `{% decl %}` ou `{% declare %}`:

```jinja
{% decl x %}
{% if condicao %}
  {% let x = "valor1" %}
{% else %}
  {% let x = "valor2" %}
{% endif %}
{{ x }}
```

A partir da v0.16, `{% let %}` sem valor não é mais permitido.

## Erros Comuns e Soluções

### "Error: variable `X` not found"

**Causa:** A variável usada no template não existe no struct.

```rust
// No struct: nome_campo
// No template: {{ nome_errado }}
```

**Solução:** Renomeie o campo no struct ou altere o template.

### "Error: attempt to subtract with overflow"

**Causa:** Operação aritmética que resultou em overflow.

**Solução:** Use `.checked_sub()`, `.saturating_sub()` ou garanta que os valores
são válidos antes de passar ao template.

### "Error: `X` is not a member of `Y`"

**Causa:** O campo aninhado não existe no tipo.

```jinja
{{ user.endereco.cidade }}  {# endereco não tem campo cidade #}
```

### "error[E0277]: `?` couldn't convert the error"

**Causa:** O erro do Askama não é convertível automaticamente para o tipo de erro
da sua função.

**Solução:** Use `.map_err()` ou `.into()`:

```rust
template.render().map_err(|e| AppError::Render(e))?;
```

### "the trait `Template` is not implemented"

**Causa:** Esqueceu de adicionar `#[derive(Template)]` ou de importar a trait.

**Solução:**

```rust
use askama::Template;

#[derive(Template)]
#[template(path = "...")]
struct MeuTemplate { ... }
```

### "error: cannot find macro `template`"

**Causa:** A feature `"derive"` não está ativada.

**Solução:**

```toml
askama = { version = "0.16", features = ["derive"] }
```

### "error: cannot find value `askama` in this scope"

**Causa:** Usando `#[derive(Template)]` dentro de uma macro sem especificar o
caminho.

**Solução:** Adicione `askama = $crate::__askama` ao `#[template()]`:

```rust
#[template(ext = "txt", source = "...", askama = $crate::__askama)]
```

### Renderização retorna string vazia

**Causa:** Pode ser que o template base não tenha blocks definidos,
ou o template filho não esteja extendendo corretamente.

**Solução:** Verifique se:
1. O template base tem `{% block %}` definidos
2. O template filho usa `{% extends "base.html" %}` com o nome correto
3. O template filho tem `{% block nome %}...{% endblock %}` para os blocks

### "error[E0434]: can't capture dynamic environment in a fn item"

**Causa:** Tentou usar uma closure ou valor dinâmico no template.

**Solução:** Askama só aceita expressões que podem ser avaliadas em tempo de compilação.
Passe valores prontos no struct.

## Dicas Rápidas

| Problema | Solução |
|---|---|
| HTML aparecendo como texto | Use `{{ var \| safe }}` |
| Variável não encontrada | Verifique nome e letras maiúsculas/minúsculas |
| Template não encontrado | Verifique diretório `templates/` na raiz do crate |
| Compilação lenta | Adicione `opt-level = 3` para `askama_derive` no `Cargo.toml` |
| Erro em macro | Adicione `askama = $crate::__askama` ao template |
| Double escaping | Use `{{ var \| safe }}` ou implemente `HtmlSafe` |
| Filtro não encontrado | Verifique se o módulo `filters` está em escopo |
| Feature não disponível | `cargo add askama --features serde_json` (por exemplo) |

## Recursos

- [Documentação oficial](https://docs.rs/askama)
- [Repositório GitHub](https://github.com/askama-rs/askama)
- [Askama Playground](https://play.askama.rs/)
- [Exemplos oficiais](https://github.com/askama-rs/askama/tree/main/examples)
- [Crates.io](https://crates.io/crates/askama)
