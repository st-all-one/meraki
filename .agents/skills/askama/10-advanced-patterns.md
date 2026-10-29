# Padrões Avançados e Boas Práticas

## Performance

### Métodos de Renderização

Sempre prefira os métodos nativos do Askama em vez de `to_string()` ou `format!()`:

| Método | Saída | Performance |
|---|---|---|
| `template.render()` | `Result<String>` | ✅ Mais rápido (código monomorfizado) |
| `template.render_into(&mut buf)` | `fmt::Write` | ✅ Mais rápido |
| `template.write_into(&mut vec)` | `io::Write` | ✅ Mais rápido |
| `template.to_string()` | `String` | ❌ 100%-200% mais lento (dispatch dinâmico) |
| `format!("{}", template)` | `String` | ❌ 100%-200% mais lento |

```rust
// ✅ Preferido
let html = template.render().unwrap();

// ✅ Para escrever em buffer existente
let mut buf = String::new();
template.render_into(&mut buf).unwrap();

// ❌ Evitar
let html = template.to_string();
```

### FastWritable

Para tipos customizados que são frequentemente renderizados, implemente `FastWritable`
para evitar o overhead do `fmt::Display`:

```rust
use std::fmt::{self, Write};
use askama::{FastWritable, NO_VALUES};

struct Name<'a> {
    forename: &'a str,
    surname: &'a str,
}

impl fmt::Display for Name<'_> {
    #[inline]
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.write_into(f, NO_VALUES)?;
        Ok(())
    }
}

impl FastWritable for Name<'_> {
    fn write_into(
        &self,
        dest: &mut dyn fmt::Write,
        _values: &dyn askama::Values,
    ) -> askama::Result<()> {
        dest.write_str(self.surname)?;
        dest.write_str(", ")?;
        dest.write_str(self.forename)?;
        Ok(())
    }
}
```

### Compilação Mais Rápida

Para acelerar compilações incrementais com muitos templates:

```toml
[profile.dev.package.askama_derive]
opt-level = 3
```

Com nightly Rust, paralelize a compilação:

```toml
[build]
rustflags = ["-Z", "threads=16"]
```

### Profile-Guided Optimization (PGO)

PGO pode melhorar a performance do Askama em até **15%**:

```bash
# Etapa 1: compilar com instrumentação
RUSTFLAGS="-Cprofile-generate=/tmp/pgo-data" cargo build --release

# Etapa 2: executar com dados de treinamento
./target/release/meu-app

# Etapa 3: compilar com os dados coletados
RUSTFLAGS="-Cprofile-use=/tmp/pgo-data" cargo build --release
```

## Estrutura de Projeto

```
meu-projeto/
├── Cargo.toml
├── askama.toml              # configuração (opcional)
├── templates/
│   ├── base.html            # template base
│   ├── pages/
│   │   ├── home.html
│   │   └── about.html
│   ├── components/
│   │   ├── header.html
│   │   └── footer.html
│   └── macros/
│       └── ui.html          # macros reutilizáveis
└── src/
    ├── main.rs
    ├── templates/
    │   ├── mod.rs           # re-exports dos templates
    │   ├── home.rs
    │   └── about.rs
    └── filters/
        └── mod.rs           # custom filters
```

### Organização de Templates

```rust
// src/templates/mod.rs
pub use home::HomeTemplate;
pub use about::AboutTemplate;

// src/templates/home.rs
#[derive(Template)]
#[template(path = "pages/home.html")]
pub struct HomeTemplate<'a> {
    pub title: &'a str,
    pub content: &'a str,
}
```

## Segurança

### XSS (Cross-Site Scripting)

Askama escapa automaticamente em templates `.html`, `.htm`, `.xml`:

```jinja
{{ user_input }}  {# Automaticamente escapado #}
```

Para conteúdo HTML confiável:

```jinja
{{ html_confiavel | safe }}  {# Desativa escaping #}
```

### JSON em Script Tags

```jinja
<script>
  var data = {{ data | json | safe }};
</script>
```

Use `json` + `safe` para evitar escaping duplo.

### SQL Injection

Askama não interage com bancos de dados. Use `sqlx` com parâmetros vinculados:

```rust
// ✅ Correto: parâmetros vinculados
sqlx::query("SELECT * FROM users WHERE id = $1").bind(id)

// ❌ Nunca faça isso dentro ou fora do template
// format!("SELECT * FROM users WHERE id = {}", id)
```

### Path Traversal

O `{% include %}` só aceita **string literals** conhecidas em tempo de compilação,
então não há risco de path traversal.

## Padrões de Design

### Template com Múltiplos Blocos

Use o atributo `blocks` para gerar sub-templates:

```rust
#[derive(Template)]
#[template(
    ext = "txt",
    source = "
        {% block titulo %}...{% endblock %}
        {% block conteudo %}...{% endblock %}
    ",
    blocks = ["titulo", "conteudo"]
)]
struct Pagina<'a> {
    titulo: &'a str,
    conteudo: &'a str,
}

// Renderiza blocos individuais
let pagina = Pagina { titulo: "Oi", conteudo: "Mundo" };
let titulo_html = pagina.as_titulo().render().unwrap();
let conteudo_html = pagina.as_conteudo().render().unwrap();
```

### Templates em Bibliotecas

```rust
// lib.rs
#[doc(hidden)]
pub use askama as __askama;

// Em um macro:
#[macro_export]
macro_rules! meu_componente {
    ($name:ident) => {
        #[derive($crate::askama::Template)]
        #[template(
            ext = "txt",
            source = "Hello, {{ name }}!",
            askama = $crate::__askama
        )]
        struct $name {
            name: String,
        }
    }
}
```

### Testando Templates

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hello_template() {
        let template = HelloTemplate { name: "world" };
        assert_eq!(template.render().unwrap(), "Hello, world!");
    }

    #[test]
    fn test_with_xss() {
        let template = HelloTemplate { name: "<script>alert('xss')</script>" };
        let rendered = template.render().unwrap();
        assert!(!rendered.contains("<script>"));
        assert!(rendered.contains("&lt;script&gt;"));
    }

    #[test]
    fn test_custom_filter() {
        // Testa o filtro isoladamente
        let result = filters::meu_filtro("hello", &Default::default()).unwrap();
        assert_eq!(result, "HELLO");
    }
}
```

### Renderização Condicional

```jinja
{% if show_admin_panel && user.is_admin %}
  <div class="admin-panel">
    {% include "admin/panel.html" %}
  </div>
{% endif %}
```

### Iteração com Estado

```jinja
<ul>
{% for item in items %}
  <li class="{{ "odd" if loop.index % 2 == 0 else "even" }}">
    {{ loop.index }}. {{ item.name }}
  </li>
{% endfor %}
</ul>
```

## Evitando Armadilhas Comuns

### Double Escaping

```jinja
{# ❌ ERRADO: se s1 é um template HTML, será double-escaped #}
{{ s1 }}

{# ✅ CORRETO: safe evita double-escaping #}
{{ s1 | safe }}
```

Ou implemente `HtmlSafe` para o tipo:

```rust
impl askama::filters::HtmlSafe for SectionOne<'_> {}
```

### Stack Overflow com `self`

Se uma expressão `{{ }}` resulta em `self`, pode causar recursão infinita:

```rust
// ❌ PERIGO: se a expressão resultar em `self`, causa stack overflow
#[derive(Template)]
#[template(source = "{{ self }}", ext = "txt")]
struct Perigoso;
```

### Extends sem Whitespace Control

```jinja
{# ❌ INVÁLIDO: extends não aceita whitespace control #}
{%- extends "base.html" +%}

{# ✅ CORRETO #}
{% extends "base.html" %}
```

### Variáveis com Nomes de Palavras-chave Rust

```rust
// ❌ INVÁLIDO (v0.13+)
struct MeuTemplate {
    match: String,  // match é keyword Rust
    __askama_hidden: String,  // prefixo reservado
}
```

## Integração Contínua

```yaml
# .github/workflows/ci.yml
- run: cargo test
- run: cargo clippy -- -D warnings
```

Template tests são tests Rust normais — nenhuma configuração extra necessária.
