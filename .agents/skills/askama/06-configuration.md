# Configuração

Askama lê configurações opcionais de um arquivo `askama.toml` na raiz do crate
(ao lado do `Cargo.toml`). A feature `"config"` (ativada por padrão) é necessária.

## Arquivo `askama.toml`

```toml
[general]
# Diretórios para procurar templates, relativos à raiz do crate
dirs = ["templates"]
# Controle de whitespace: "preserve" (padrão), "suppress" ou "minimize"
whitespace = "preserve"
```

## Diretórios de Templates (`dirs`)

Suporta glob patterns:

```toml
[general]
dirs = ["templates/*"]     # apenas subdiretórios imediatos
```

```toml
[general]
dirs = ["templates/**"]    # todas as subpastas recursivamente
```

```toml
[general]
dirs = ["templates", "src/templates"]  # múltiplos diretórios
```

## Controle de Whitespace

Askama considera tabs, espaços, newlines e carriage returns como whitespace.

### Modos

| Modo | Comportamento Padrão | Operador para inverter |
|---|---|---|
| `"preserve"` (padrão) | Preserva todo whitespace | `-` suprime |
| `"suppress"` | Suprime antes/depois de blocks | `+` preserva |
| `"minimize"` | Suprime tudo exceto 1 caractere | `~` minimiza |

### Operadores Inline

Use dentro dos delimitadores para controle local:

```jinja
{%- if foo %}       {# Suprime whitespace ANTES do block #}
  {{- bar -}}       {# Suprime whitespace ANTES e DEPOIS da expressão #}
{% else if bar -%}  {# Suprime whitespace DEPOIS do block #}
  nothing
{%- endif %}
```

### Operador `+` (preservar)

Quando o modo padrão é `"suppress"`, use `+` para preservar:

```jinja
<a href="/" {#+ #}
   class="something">text</a>
```

### Operador `~` (minimizar)

Suprime todo whitespace exceto um caractere (se houver um newline, mantém o newline):

```jinja
{% if something ~%}
Hello
{%~ endif %}
```

### Precedência

A ordem de precedência, da maior para a menor:

1. **Operador inline** (`-`, `+`, `~`) — maior prioridade
2. **Derive** (`#[template(whitespace = "suppress")]`)
3. **Configuração** (`askama.toml`)

Entre operadores inline conflitantes:
1. Suppress (`-`) vence Minimize (`~`) vence Preserve (`+`)

### Configuração por Template

```rust
#[derive(Template)]
#[template(whitespace = "suppress")]
pub struct SomeTemplate;
```

Isso sobrescreve a configuração do `askama.toml` para este template específico.

## Sintaxes Customizadas

Você pode definir sintaxes alternativas no `askama.toml`:

```toml
[general]
default_syntax = "foo"

[[syntax]]
name = "foo"
block_start = "%{"
comment_start = "#{"
expr_end = "^^"

[[syntax]]
name = "bar"
block_start = "%%"
block_end = "%%"
comment_start = "%#"
expr_start = "%{"
```

### Atributos Customizáveis

| Atributo | Padrão | Mínimo |
|---|---|---|
| `block_start` | `{%` | 2 caracteres |
| `block_end` | `%}` | 2 caracteres |
| `comment_start` | `{#` | 2 caracteres |
| `comment_end` | `#}` | 2 caracteres |
| `expr_start` | `{{` | 2 caracteres |
| `expr_end` | `}}` | 2 caracteres |

Se um atributo for omitido, o valor da sintaxe `"default"` é usado.

### Usando Sintaxe Customizada

```rust
#[derive(Template)]
#[template(path = "hello.html", syntax = "foo")]
struct HelloTemplate<'a> {
    name: &'a str,
}
```

## Escapers Customizados

Configure escapers diferentes para extensões de arquivo específicas:

```toml
[[escaper]]
path = "::tex_escape::Tex"
extensions = ["tex"]
```

### Como Funciona

- `path`: Caminho Rust para um tipo que implementa `askama::filters::Escaper`
- `extensions`: Lista de extensões que ativam este escaper

### Escapers Padrão

| Extensões | Escaper |
|---|---|
| `html`, `htm`, `xml`, `j2`, `jinja`, `jinja2` | HTML |
| `md`, `yml`, `txt`, `none`, vazio | Text (sem escaping) |

### Exemplo: JS como Texto

Para tratar arquivos `.js` como texto (sem escaping):

```toml
[[escaper]]
path = "askama::filters::Text"
extensions = ["js"]
```

### Usando Escaper Customizado em Filters

```jinja
{{ some_string|escape("tex") }}
```

### Implementando um Eskaper Customizado

```rust
use askama::filters::Escaper;

struct TexEscaper;

impl Escaper for TexEscaper {
    fn write_escaped<W: std::fmt::Write>(
        &self,
        mut w: W,
        s: &str,
    ) -> std::fmt::Result {
        for c in s.chars() {
            match c {
                '&' => w.write_str(r"\&")?,
                '%' => w.write_str(r"\%")?,
                '$' => w.write_str(r"\$")?,
                '#' => w.write_str(r"\#")?,
                '_' => w.write_str(r"\_")?,
                '{' => w.write_str(r"\{")?,
                '}' => w.write_str(r"\}")?,
                '~' => w.write_str(r"\textasciitilde{}")?,
                '^' => w.write_str(r"\textasciicircum{}")?,
                _ => w.write_char(c)?,
            }
        }
        Ok(())
    }
}
```

Veja o exemplo completo em:
https://github.com/askama-rs/askama/tree/main/examples/warp-app

## Configuração Completa de Exemplo

```toml
[general]
dirs = ["templates", "src/templates"]
whitespace = "preserve"
default_syntax = "default"

[[syntax]]
name = "default"
block_start = "{%"
block_end = "%}"
comment_start = "{#"
comment_end = "#}"
expr_start = "{{"
expr_end = "}}"

[[escaper]]
path = "askama::filters::Html"
extensions = ["html", "htm", "xml"]

[[escaper]]
path = "askama::filters::Text"
extensions = ["md", "yml", "txt", "none", ""]
```
