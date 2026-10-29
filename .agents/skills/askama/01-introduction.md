# Introdução ao Askama

> **Askama** é um motor de templates para Rust baseado em [Jinja](https://jinja.palletsprojects.com/).
> Ele gera código Rust a partir de templates em **tempo de compilação**, garantindo segurança de tipos
> e performance excepcional.

## Por que Askama?

| Característica | Benefício |
|---|---|
| **Compilado em tempo de compilação** | Zero overhead em runtime, erros capturados antes de executar |
| **Type-safe** | O compilador Rust valida que as variáveis usadas no template existem e têm o tipo correto |
| **Sintaxe Jinja** | Familiar para quem já usou Django/Jinja/Twig/Tera |
| **Herança de templates** | Reaproveitamento de layout com `{% extends %}` e `{% block %}` |
| **Filtros integrados** | lower, upper, escape, json, join, truncate e muitos outros |
| **Custom filters** | Defina seus próprios filtros em Rust puro |
| **HTML escaping automático** | Seguro contra XSS por padrão |
| **Funciona com qualquer framework web** | Axum, Actix-Web, Rocket, Warp, Poem |
| **Roda em stable Rust** | Sem necessidade de nightly |
| **UTF-8 válido** | Templates e saída sempre UTF-8 |

## Feature Highlights

- Construção de templates com sintaxe familiar e fácil de usar
- Segurança proporcionada pelo sistema de tipos do Rust
- Código do template é compilado junto com seu crate para performance ótima
- Ferramentas de debug para auxiliar no desenvolvimento de templates
- Templates devem ser UTF-8 válido e produzem UTF-8 na renderização
- Funciona em Rust stable

## Suporte nos Templates

- Herança de templates (`{% extends %}`, `{% block %}`)
- Loops (`{% for %}`), condicionais (`{% if %}`) e inclusão (`{% include %}`)
- Macros (`{% macro %}`, `{% call %}`)
- Variáveis (sem mutabilidade — mas com `{% let mut %}`)
- Filtros nativos e a capacidade de criar os seus próprios
- Supressão de whitespace com marcadores `-`, `+`, `~`
- Escape HTML opcional (por template ou por expressão com `|safe`)
- Customização de sintaxe

## Instalação

Adicione ao seu `Cargo.toml`:

```toml
[dependencies]
askama = "0.16.0"
```

> **Nota:** A versão 0.16 é a mais recente no momento da escrita. Consulte o [crates.io](https://crates.io/crates/askama) para a versão atual.

### Features padrão

Por padrão, as seguintes features são ativadas:

```toml
default = ["config", "derive", "std", "urlencode"]
```

| Feature | Descrição |
|---|---|
| `config` | Habilita configuração via `askama.toml` |
| `derive` | Habilita `#[derive(Template)]` |
| `std` | Suporte a `std::io::Write` e `std::error::Error` |
| `urlencode` | Habilita filtros `urlencode` e `urlencode_strict` |

Para desativar as padrão e escolher manualmente:

```toml
askama = { version = "0.16.0", default-features = false, features = ["derive", "config"] }
```

### Feature "full" (desenvolvimento rápido)

```toml
askama = { version = "0.16.0", features = ["full"] }
```

Atalho que inclui: `default`, `code-in-doc` e `serde_json`.

## Seu Primeiro Template

### 1. Estrutura de diretórios

```
meu-projeto/
├── Cargo.toml
├── templates/
│   └── hello.html
└── src/
    └── main.rs
```

Crie o diretório `templates/` na raiz do seu crate.

### 2. Template (`templates/hello.html`)

```jinja
Hello, {{ name }}!
```

### 3. Código Rust (`src/main.rs`)

```rust
use askama::Template; // traz a trait para o escopo

#[derive(Template)] // gera o código de renderização
#[template(path = "hello.html")] // caminho relativo a templates/
struct HelloTemplate<'a> {
    name: &'a str, // O nome do campo DEVE corresponder à variável no template
}

fn main() {
    let hello = HelloTemplate { name: "world" };
    println!("{}", hello.render().unwrap());
    // Saída: Hello, world!
}
```

### 4. Compilar e executar

```bash
cargo run
```

Saída esperada:

```
Hello, world!
```

## Como Funciona

O `#[derive(Template)]` faz o seguinte em tempo de compilação:

1. Lê o arquivo de template especificado em `#[template(path = "...")]`
2. Faz o parsing do template (sintaxe Jinja)
3. Gera código Rust que renderiza o template usando os campos do struct
4. Implementa a trait `askama::Template` para seu struct

Se você cometer um erro (usar uma variável que não existe, por exemplo), o compilador Rust aponta o erro **em tempo de compilação** — não em runtime.

## Renderização

```rust
let template = HelloTemplate { name: "world" };

// Para String (mais rápido que to_string)
let rendered: String = template.render().unwrap();

// Para qualquer fmt::Write (buffer, arquivo, etc.)
let mut buf = String::new();
template.render_into(&mut buf).unwrap();

// Para qualquer io::Write (socket, arquivo, etc.)
let mut vec = Vec::new();
template.write_into(&mut vec).unwrap();
```

> ⚠️ **Performance:** Prefira `.render()` a `.to_string()`. O `to_string()` usa `fmt::Display` com dispatch dinâmico, enquanto `.render()` usa código monomorfizado — em média 100%-200% mais rápido.

## Próximos Passos

- [02-template-creation.md](02-template-creation.md) — Atributos do `#[template()]` em detalhes
- [03-template-enums.md](03-template-enums.md) — Templates com enums
- [07-template-syntax.md](07-template-syntax.md) — Sintaxe completa de templates
- [08-filters.md](08-filters.md) — Todos os filtros disponíveis
