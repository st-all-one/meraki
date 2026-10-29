# Debug e Troubleshooting

Askama fornece ferramentas para depuração dos templates em **tempo de compilação**.

## Print da Árvore Sintática e Código Gerado

Use o atributo `print` no `#[template()]`:

```rust
#[derive(Template)]
#[template(path = "hello.html", print = "all")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

### Valores de `print`

| Valor | Saída |
|---|---|
| `none` (padrão) | Nada |
| `ast` | Árvore sintática do template |
| `code` | Código Rust gerado |
| `all` | Ambos |

A saída é impressa em **stderr** durante a compilação.

### Exemplo de saída `ast`

Para o template `Hello, {{ name }}!`:

```rust
[Lit("", "Hello,", " "), Expr(WS(false, false), Var("name")), Lit("", "!", "\n")]
```

### Exemplo de saída `code`

```rust
impl<'a> askama::Template for HelloWorld<'a> {
    fn render_into<AskamaW>(&self, __askama_writer: &mut AskamaW) -> askama::Result<()>
    where
        AskamaW: core::fmt::Write + ?Sized,
    {
        __askama_writer.write_str("Hello, ")?;
        match (
            &((&&askama::filters::AutoEscaper::new(
                &(self.name),
                askama::filters::Html,
            ))
                .askama_auto_escape()?),
        ) {
            (expr2,) => {
                (&&askama::filters::Writable(expr2)).askama_write(__askama_writer)?;
            }
        }
        __askama_writer.write_str("!")?;
        Ok(())
    }
    const SIZE_HINT: usize = 11usize;
}
```

## Erros Comuns de Compilação

### "Variable `x` not found"

O template referencia uma variável que não existe no struct:

```rust
#[derive(Template)]
#[template(source = "{{ nome }}", ext = "txt")]
struct MeuTemplate {
    name: String, // Erro: esperava `nome`, mas tem `name`
}
```

**Solução:** Renomeie o campo do struct para corresponder à variável usada no template,
ou altere o template para usar o nome correto.

### "No field `x` on type `Y`"

```jinja
{{ usuario.endereco.logradouro }}
```

O campo `endereco` não existe em `usuario`, ou `logradouro` não existe em `endereco`.

### Erros de Tipo

```rust
#[derive(Template)]
#[template(source = "{{ count | upper }}", ext = "txt")]
struct MeuTemplate {
    count: i32, // upper espera uma string!
}
```

**Solução:** Use o filtro apropriado ou converta o tipo no template:
`{{ count | to_string | upper }}`.

### Erro `Askama` não encontrado em macros

Quando usa `#[derive(Template)]` dentro de uma macro, o caminho para o crate
`askama` precisa ser especificado explicitamente:

```rust
#[doc(hidden)]
use askama as __askama;

#[macro_export]
macro_rules! meu_macro {
    ($name:ident) => {
        #[derive($crate::askama::Template)]
        #[template(
            ext = "txt",
            source = "Hello!",
            askama = $crate::__askama
        )]
        struct $name;
    }
}
```

## Erros de Runtime

### `Render` retorna `Err`

Sempre use `?` ou `unwrap()` com cuidado:

```rust
// Em produção, prefira tratamento de erro adequado
match template.render() {
    Ok(html) => Html(html),
    Err(e) => {
        log::error!("Erro ao renderizar template: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Erro interno").into_response()
    }
}
```

## Dicas de Troubleshooting

1. **Use `print = "all"`** para ver o código gerado e entender o que está errado
2. **Verifique a ortografia** dos nomes de variáveis — eles devem corresponder exatamente
3. **Tipos importam** — filtros esperam tipos específicos
4. **Escape mode** — se o HTML está aparecendo como texto, você pode precisar de `|safe`
5. **Caminho do template** — o diretório `templates/` deve estar na raiz do crate (ao lado do `Cargo.toml`)
6. **Extensão do arquivo** — determina o escape mode automático
7. **Match exaustivo** — todo `{% match %}` deve cobrir todos os casos
8. **`extends`** não aceita whitespace control: `{%- extends "base.html" +%}` é inválido

## Compilação Lenta?

Se os templates estão deixando a compilação lenta, otimize o perfil de debug:

```toml
[profile.dev.package.askama_derive]
opt-level = 3
```

Isso acelera a compilação incremental dos derives do Askama.

Com nightly Rust, você também pode usar:

```toml
[build]
rustflags = ["-Z", "threads=16"]
```

Isso melhora a compilação paralela em crates grandes com muitos templates.
