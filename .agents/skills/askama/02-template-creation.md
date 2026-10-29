# Criando Templates

Um template Askama é composto por:

1. Uma **definição de struct** em Rust que fornece o contexto do template
2. Um **arquivo de template** UTF-8 (ou código inline) com a sintaxe Jinja

```rust
#[derive(Template)]                          // (1) gera o código
#[template(path = "hello.html")]             // (2) arquivo de template
struct HelloTemplate<'a> {                   // (3) struct de contexto
    name: &'a str,                           // campo = variável no template
}
```

## O Atributo `#[template()]`

O `#[template()]` aceita vários sub-atributos que controlam a geração de código:

| Atributo | Descrição | Exemplo |
|---|---|---|
| `path` | Caminho do arquivo de template (relativo a `templates/`) | `path = "hello.html"` |
| `source` | Código inline do template | `source = "{{ foo }}"` |
| `ext` | Extensão para inferir escaping | `ext = "txt"` |
| `in_doc` | Template no doc comment | `in_doc = true` |
| `print` | Debug: `none`, `ast`, `code`, `all` | `print = "all"` |
| `block` | Renderiza apenas um bloco específico | `block = "content"` |
| `blocks` | Gera sub-templates para múltiplos blocos | `blocks = ["title", "content"]` |
| `escape` | Força modo de escaping | `escape = "none"` |
| `syntax` | Nome da sintaxe customizada | `syntax = "foo"` |
| `config` | Caminho do arquivo de configuração | `config = "config.toml"` |
| `whitespace` | Controle de whitespace | `whitespace = "suppress"` |
| `askama` | Path para o módulo askama (para macros/libs) | `askama = $crate::__askama` |

---

### `path` (padrão)

Caminho relativo ao diretório `templates/` na raiz do crate.

```rust
#[derive(Template)]
#[template(path = "hello.html")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

A extensão do arquivo define o escape mode:
- `.html`, `.htm`, `.xml`, `.j2`, `.jinja`, `.jinja2` → HTML escaping
- `.md`, `.yml`, `.txt`, `.none`, sem extensão → Text escaping (nenhum)
- Extensões customizadas podem ser configuradas (veja [06-configuration.md](06-configuration.md))

---

### `source` (inline)

Útil para testes ou templates muito curtos. Obrigatório usar `ext` junto.

```rust
#[derive(Template)]
#[template(source = "Hello {{ name }}", ext = "txt")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

---

### `ext`

Define a extensão para inferir o escape mode. Use quando não usar `path`.

```rust
#[derive(Template)]
#[template(source = "Hello {{ name }}", ext = "txt")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

---

### `in_doc` — Template no doc comment

Habilite a feature `"code-in-doc"` no `Cargo.toml`:

```toml
askama = { version = "0.16.0", features = ["code-in-doc"] }
```

Depois, coloque o template dentro de um code block com tag `askama` (ou `jinja`, `jinja2`)
no doc comment do struct:

```rust
/// ```askama
/// <div>{{ lines|linebreaksbr }}</div>
/// ```
///
/// ```rust
/// assert_eq!(
///     Example { lines: "a\nb\nc" }.to_string(),
///     "<div>a<br/>b<br/>c</div>"
/// );
/// ```
#[derive(Template)]
#[template(ext = "html", in_doc = true)]
struct Example<'a> {
    lines: &'a str,
}
```

Note que `ext` é obrigatório quando se usa `in_doc`.

---

### `print` — Debug

Imprime a árvore sintática e/ou o código gerado durante a compilação.

```rust
#[derive(Template)]
#[template(path = "hello.html", print = "all")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

Valores:

| Valor | Saída |
|---|---|
| `none` (padrão) | Nada |
| `ast` | Árvore sintática (parse tree) |
| `code` | Código Rust gerado |
| `all` | Ambos |

Exemplo de saída `ast`:
```
[Lit("", "Hello,", " "), Expr(WS(false, false), Var("name")), Lit("", "!", "\n")]
```

Exemplo de saída `code` (gerado):
```rust
impl<'a> askama::Template for HelloWorld<'a> {
    fn render_into<AskamaW>(&self, __askama_writer: &mut AskamaW) -> askama::Result<()>
    where
        AskamaW: core::fmt::Write + ?Sized,
    {
        __askama_writer.write_str("Hello, ")?;
        // ... escaping de self.name ...
        __askama_writer.write_str("!")?;
        Ok(())
    }
    const SIZE_HINT: usize = 11usize;
}
```

---

### `block` — Renderizar bloco específico

Renderiza apenas o conteúdo de um bloco específico do template.
Útil para renderização parcial sem precisar extrair para um template separado.

```rust
#[derive(Template)]
#[template(path = "pagina.html", block = "sidebar")]
struct SidebarTemplate {
    items: Vec<String>,
}
```

```jinja
{# pagina.html #}
<!DOCTYPE html>
<html>
<head>{% block title %}Meu Site{% endblock %}</head>
<body>
  <div id="sidebar">{% block sidebar %}{% endblock %}</div>
  <div id="content">{% block content %}{% endblock %}</div>
</body>
</html>
```

---

### `blocks` — Múltiplos sub-templates

Gera automaticamente sub-templates para cada bloco listado,
acessíveis via `template.as_nome_do_bloco()`.

```rust
#[derive(Template)]
#[template(
    ext = "txt",
    source = "
        {% block title %}...{% endblock %}
        {% block content %}...{% endblock %}
    ",
    blocks = ["title", "content"]
)]
struct News<'a> {
    title: &'a str,
    message: &'a str,
}

let news = News {
    title: "Announcing Rust 1.84.1",
    message: "The Rust team has published a new point release.",
};
// Renderiza apenas o bloco 'title'
assert_eq!(news.as_title().render().unwrap(), "<h1>Announcing Rust 1.84.1</h1>");
```

---

### `escape` — Forçar modo de escaping

```rust
#[derive(Template)]
#[template(path = "hello.html", escape = "none")]  // sem escaping
struct HelloTemplate<'a> {
    name: &'a str,
}

#[derive(Template)]
#[template(path = "dados.xml", escape = "html")]   // forçar HTML escaping
struct XmlTemplate<'a> {
    conteudo: &'a str,
}
```

---

### `syntax` — Sintaxe customizada

Veja [06-configuration.md](06-configuration.md) para definir sintaxes customizadas.

```rust
#[derive(Template)]
#[template(path = "hello.html", syntax = "foo")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

---

### `config` — Arquivo de configuração

```rust
#[derive(Template)]
#[template(path = "hello.html", config = "config.toml")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

O caminho é relativo à raiz do crate.

---

### `whitespace` — Controle de whitespace

Pode ser definido por template, sobrescrevendo o `askama.toml`:

```rust
#[derive(Template)]
#[template(whitespace = "suppress")]
pub struct SomeTemplate;
```

Valores: `"preserve"` (padrão), `"suppress"`, `"minimize"`.

Veja [06-configuration.md](06-configuration.md#controle-de-whitespace) para detalhes.

---

### `askama` — Path para o módulo askama

Necessário quando o `#[derive(Template)]` é usado dentro de um macro ou
subprojeto onde o caminho para o crate `askama` não é direto.

```rust
#[doc(hidden)]
use askama as __askama;

#[macro_export]
macro_rules! new_greeter {
    ($name:ident) => {
        #[derive(Debug, $crate::askama::Template)]
        #[template(
            ext = "txt",
            source = "Hello, world!",
            askama = $crate::__askama
        )]
        struct $name;
    }
}

new_greeter!(HelloWorld);
assert_eq!(HelloWorld.render().unwrap(), "Hello, world!");
```

## Documentação como Código do Template

Com a feature `"code-in-doc"`, você pode colocar o template no doc comment
usando `in_doc = true` e um code block `askama`:

```rust
/// ```askama
/// <div>{{ content }}</div>
/// ```
#[derive(Template)]
#[template(ext = "html", in_doc = true)]
struct MyTemplate<'a> {
    content: &'a str,
}
```

Isso funciona com syntax highlighters que reconhecem `jinja` ou `jinja2`:

```rust
/// ```jinja
/// <div>{{ content }}</div>
/// ```
```

## Resumo — Quando usar cada atributo

| Cenário | Atributo |
|---|---|
| Template em arquivo separado | `path` |
| Template inline (testes, pequeno) | `source` + `ext` |
| Template no doc comment | `in_doc` + `ext` (precisa feature `code-in-doc`) |
| Debug da geração | `print = "ast"` / `"code"` / `"all"` |
| Renderizar parte do template | `block = "nome"` ou `blocks = [...]` |
| Desligar escaping HTML | `escape = "none"` |
| Forçar escaping HTML | `escape = "html"` |
| Sintaxe personalizada | `syntax = "nome"` + config em `askama.toml` |
| Config alternativa | `config = "caminho"` |
| Whitespace diferente do config | `whitespace = "suppress"` |
| Uso em macros/libs | `askama = $crate::__askama` |
