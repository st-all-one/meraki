# Sintaxe de Templates

## Visão Geral da Sintaxe

| Sintaxe | Descrição |
|---|---|
| `{{ ... }}` | Expressão avaliada, escapada e impressa |
| `{{ ... \| ... }}` | Expressão com filtro(s) |
| `{% filter ... %} ... {% endfilter %}` | Filter block |
| `{# ... #}` | Comentário |
| `{% let ... = ... %}` ou `{% set ... = ... %}` | Atribuição de variável |
| `{% decl ... %}` ou `{% declare ... = ... %}` | Declarar variável sem valor |
| `{% if ... %} ... {% else if ... %} ... {% else %} ... {% endif %}` | If-Else |
| `{% match ... %} {% when ... %} ... {% else %} ... {% endmatch %}` | Match |
| `{% for ... in ... %} ... {% else %} ... {% endfor %}` | Loop For |
| `{% continue %}` | Continua para próxima iteração |
| `{% break %}` | Sai do loop |
| `{% include "..." %}` | Inclui outro template |
| `{% extends "..." %}` | Herança de template |
| `{% block ... %} ... {% endblock %}` | Definição de bloco |
| `{% macro ...(...) %} ... {% endmacro %}` | Definição de macro |
| `{{ ...(...) }}` | Invocação de macro |
| `{% call ...(...) %}{% endcall %}` | Call block de macro |
| `{% import "..." as ... %}` | Importar macros |
| `{% raw %} ... {% endraw %}` | Bloco raw (sem processamento) |

---

## Variáveis

As variáveis do template são definidas pelos campos do struct de contexto.

```rust
#[derive(Template)]
#[template(source = "{{ nome }}", ext = "txt")]
struct MeuTemplate<'a> {
    nome: &'a str,
}
```

### Acesso a Atributos

Use `.` para acessar campos ou métodos:

```jinja
{{ user.nome }}
{{ user.nome.len() }}
{{ item.preco }}
```

### Constantes

Use `crate::` para acessar constantes do seu código Rust:

```rust
pub const MAX_NB_USERS: usize = 2;
```

```jinja
<p>O limite é {{ crate::MAX_NB_USERS }}.</p>
{% set value = 4 %}
{% if value > crate::MAX_NB_USERS %}
    <p>{{ value }} é maior que MAX_NB_USERS.</p>
{% endif %}
```

---

## Atribuições (`{% let %}` / `{% set %}`)

```jinja
{% let name = user.name %}
{% let len = name.len() %}
```

### Shadowing

Como Rust, Askama permite sombrear variáveis:

```jinja
{% let foo = "bar" %}
{{ foo }}

{% let foo = "baz" %}
{{ foo }}
```

### Mutabilidade

Use `mut` para variáveis mutáveis:

```jinja
{% let mut foo = [1, 2].iter() %}
{{ foo.next().unwrap() }}
```

### Let Blocks

Atribuição com bloco de conteúdo:

```jinja
{% let x %}
{{ crate::some_function() }} = {{ a * b }}
{% endlet %}
```

### Declaração sem valor (`{% decl %}` / `{% declare %}`)

Cria a variável sem valor inicial, para atribuir depois:

```jinja
{% decl val %}
{% if len == 0 %}
  {% let val = "foo" %}
{% else %}
  {% let val = name %}
{% endif %}
{{ val }}
```

> ⚠️ A partir da v0.16, `let` sem valor não é mais permitido — use `decl`/`declare`.

### Regras de Empréstimo (Borrow)

Em alguns casos, o valor da inicialização é colocado atrás de uma referência:

| Situação | Referência? |
|---|---|
| Expressão composta (`x + 2`) | ❌ Não |
| Variável do template | ❌ Não |
| Com filtro (`x\|capitalize`) | ❌ Não |
| Acesso a campo (`x.y`) | ✅ Sim |
| Com `?` (`x?`) | ❌ Não |

### Atribuições Compostas

Com `mut`, é possível usar operadores compostos:

```jinja
{%- let mut counter = 0 -%}
{%- for i in 1..=10 -%}
    {%- mut counter += i -%}
    {{ counter }}
{% endfor -%}
```

Saída: `1 3 6 10 15 ...`

Todos os operadores compostos do Rust são suportados: `+=`, `-=`, `*=`, `/=`, etc.

---

## Filtros

Valores podem ser pós-processados com **filtros** usando o pipe `|`:

```jinja
{{ "HELLO" | lower }}
{{ name | capitalize | fmt("{:?}") }}
{{ count | pluralize(singular="mouse", plural="mice") }}
```

Os filtros são documentados em detalhes em [08-filters.md](08-filters.md).

### Filter Blocks

Aplica um filtro a um bloco inteiro:

```jinja
{% filter lower %}
  {{ t }} / HELLO / {{ u }}
{% endfilter %}
```

Filtros podem ser combinados:

```jinja
{% filter lower|capitalize %}
  {{ t }} / HELLO / {{ u }}
{% endfilter %}
```

Aqui, `lower` é aplicado primeiro, depois `capitalize`.

### Custom Filters

Definidos em um módulo `filters` em escopo, ou usando path completo:

```rust
mod filters {
    #[askama::filter_fn]
    pub fn myfilter<T: std::fmt::Display>(
        value: T,
        _env: &dyn askama::Values,
    ) -> askama::Result<String> {
        let s = value.to_string();
        Ok(s.replace("oo", "aa"))
    }
}
```

```jinja
{{ s | myfilter }}        {# procura no módulo filters #}
{{ s | crate::myfilter }} {# path completo #}
```

Filtros com argumentos:

```rust
#[askama::filter_fn]
pub fn myfilter<T: std::fmt::Display>(
    s: T,
    _env: &dyn askama::Values,
    n: usize,
) -> askama::Result<String> {
    let s = s.to_string();
    let replace = "a".repeat(n);
    Ok(s.replace("oo", &replace))
}
```

```jinja
{{ s | myfilter(4) }}
```

Argumentos nomeados também funcionam em custom filters:

```jinja
{{ s | myfilter(n = 4) }}
```

> **Nota:** Em filtros customizados com `#[askama::filter_fn]`, argumentos opcionais usam `#[optional]`:
> ```rust
> #[askama::filter_fn]
> pub fn exemplo(
>     value: impl Display,
>     env: &dyn askama::Values,
>     #[optional(None)] opt: Option<&str>,
> ) -> askama::Result<String> { ... }
> ```

---

## Controle de Whitespace

### Operadores

| Operador | Efeito |
|---|---|
| `{%-` | Suprime whitespace **antes** do block |
| `-%}` | Suprime whitespace **depois** do block |
| `{%+` | Preserva whitespace **antes** (modo suppress) |
| `+%}` | Preserva whitespace **depois** (modo suppress) |
| `{%~` | Minimiza whitespace **antes** (1 char) |
| `~%}` | Minimiza whitespace **depois** (1 char) |

### Exemplo

```jinja
{% if foo %}
  {{- bar -}}
{% else if bar -%}
  nothing
{%- endif %}
```

Isso remove todo whitespace dentro do if/else.

---

## Funções

### Como Métodos do Struct

```rust
#[derive(Template)]
#[template(source = "{{ saudacao(123) }}", ext = "txt")]
struct MeuTemplate {
    foo: fn(u32) -> String,
}

impl MeuTemplate {
    fn saudacao(&self, val: u32) -> String {
        format!("Olá {}", val)
    }
}
```

### Funções Estáticas (mesmo módulo)

```rust
fn foo(val: u32) -> String {
    format!("{}", val)
}

#[derive(Template)]
#[template(source = "{{ self::foo(123) }}", ext = "txt")]
struct MeuTemplate;
```

### Funções de Outros Módulos

```rust
// src/utils/mod.rs
pub fn foo(val: u32) -> String {
    format!("{}", val)
}

// src/template.rs
#[derive(Template)]
#[template(source = "{{ crate::utils::foo(123) }}", ext = "txt")]
struct MeuTemplate;
```

### Traits Implementadas

```rust
trait Hello {
    fn greet(name: &str) -> String;
}

#[derive(Template)]
#[template(source = r#"{{ Self::greet("world") }}"#, ext = "txt")]
struct MeuTemplate;

impl Hello for MeuTemplate {
    fn greet(name: &str) -> String {
        format!("Hello {}", name)
    }
}
```

### Chamando Closures

```rust
#[derive(Template)]
#[template(source = "{{ (closure)(12) }}", ext = "txt")]
struct MeuTemplate {
    closure: fn(i32) -> i32,
}
```

### Resolução de Nomes

```jinja
{{ method() }}             {# self.method()          #}
{{ self::function() }}     {# função do módulo atual #}
{{ super::b::f() }}        {# função do módulo pai  #}
```

---

## Criando Structs

Askama suporta criação de structs diretamente no template:

```jinja
{{ MyStruct { field1: 1, field2: "foo" }.to_string() }}
```

Com base struct:

```jinja
{{ MyStruct { field1: 1, ..other_struct } }}
{{ MyStruct { field1: 1, ..Default::default() } }}
```

---

## Herança de Templates

### Template Base

```jinja
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{% block title %}{{ title }} - My Site{% endblock %}</title>
    {% block head %}{% endblock %}
  </head>
  <body>
    <div id="content">
      {% block content %}<p>Placeholder</p>{% endblock %}
    </div>
  </body>
</html>
```

### Template Filho

```jinja
{% extends "base.html" %}

{% block title %}Index{% endblock %}

{% block head %}
  <style>
  </style>
{% endblock %}

{% block content %}
  <h1>Index</h1>
  <p>Hello, world!</p>
  {{ super() }}  {# renderiza o conteúdo do bloco pai #}
{% endblock %}
```

### Regras da Herança

- `{% extends %}` deve ser o **primeiro** tag no template filho
- O conteúdo de nível superior do template filho é ignorado
- `{{ super() }}` renderiza o conteúdo do bloco pai
- `{% extends %}` **não** aceita whitespace control (`{%- extends "..." %}` é inválido)
- Blocks só podem ser definidos no nível superior ou dentro de outros blocks
- Blocks **não** podem estar dentro de `if`/`else` ou `for`

### Block Fragments

Com o atributo `block`, você pode renderizar apenas um bloco específico:

```rust
#[derive(Template)]
#[template(path = "pagina.html", block = "sidebar")]
struct SidebarTemplate {
    items: Vec<String>,
}
```

---

## HTML Escaping

Por padrão, Askama escapa variáveis em templates `.html`, `.htm`, `.xml`, `.j2`, `.jinja`, `.jinja2`.

Caracteres escapados: `<`, `>`, `&`, `"`, `'`

```rust
#[derive(Template)]
#[template(source = "{{strvar}}")]
struct TestTemplate {
    strvar: String,
}

fn main() {
    let s = TestTemplate {
        strvar: "// my <html> is \"unsafe\" & should be 'escaped'".to_string(),
    };
    assert_eq!(
        s.render().unwrap(),
        "&#x2f;&#x2f; my &lt;html&gt; is &quot;unsafe&quot; &amp; \
         should be &#x27;escaped&#x27;"
    );
}
```

### Controlando Escaping

| Situação | Como fazer |
|---|---|
| Desligar escaping no template | `#[template(escape = "none")]` |
| Desligar escaping em uma expressão | `{{ var \| safe }}` |
| Forçar escaping em uma expressão | `{{ var \| escape }}` ou `{{ var \| e }}` |
| Forçar escaping específico | `{{ var \| escape("html") }}` |

---

## Estruturas de Controle

### For

```jinja
<h1>Users</h1>
<ul>
{% for user in users %}
  <li>{{ user.name }}</li>
{% else %}
  <li>No users</li>
{% endfor %}
</ul>
```

#### For com filtro

```jinja
{% for user in users if user.is_activated %}
  <li>{{ user.name }}</li>
{% endfor %}
```

#### Variáveis de Loop

| Variável | Descrição |
|---|---|
| `loop.index` | Iteração atual (começa em **1**) |
| `loop.index0` | Iteração atual (começa em **0**) |
| `loop.first` | `true` se é a primeira iteração |
| `loop.last` | `true` se é a última iteração |

```jinja
{% for user in users %}
   {% if loop.first %}
   <li>First: {{user.name}}</li>
   {% else %}
   <li>User#{{loop.index}}: {{user.name}}</li>
   {% endif %}
{% endfor %}
```

### If / Else If / Else

```jinja
{% if users.len() == 0 %}
  No users
{% else if users.len() == 1 %}
  1 user
{% elif users.len() == 2 %}
  2 users
{% else %}
  {{ users.len() }} users
{% endif %}
```

> `elif` é um alias para `else if`.

### If Let

```jinja
{% if let Some(user) = user %}
  {{ user.name }}
{% else %}
  No user
{% endif %}
```

### `is defined` / `is not defined`

```jinja
{% if x is defined %}
  x is defined!
{% endif %}
{% if y is not defined %}
  y is not defined
{% endif %}
```

Pode ser combinado com outras condições:

```jinja
{% if x is defined && x == "12" && y == Some(true) %}
...
{% endif %}
```

Usado em expressões:

```jinja
<script>
const x = {{ x is defined }};
</script>
```

> **Limitação:** Só funciona para variáveis do template ou campos do struct — não para campos de campos (`x.y is defined` não funciona).

### Match

```jinja
{% match item %}
  {% when Some with ("foo") %}
    Found literal foo
  {% when Some with (val) %}
    Found {{ val }}
  {% when None %}
{% endmatch %}
```

Veja [03-template-enums.md](03-template-enums.md) para mais detalhes.

### Include

```jinja
{% for i in iter %}
  {% include "item.html" %}
{% endfor %}
```

O caminho deve ser uma **string literal** (conhecida em tempo de compilação).
Askama procura primeiro relativo ao template atual, depois no diretório base.

### Continue e Break

```jinja
{% for user in users %}
  {% if user.is_banned %}
    {% continue %}
  {% endif %}
  {% if user.name == "admin" %}
    {% break %}
  {% endif %}
  <li>{{ user.name }}</li>
{% endfor %}
```

---

## Expressões

### Literais

```jinja
{{ "foo" }}   {# string literal #}
{{ 1 }}       {# integer literal #}
```

### Operadores

Askama suporta a maioria dos operadores binários do Rust:

```jinja
{{ 3 * 4 / 2 }}
{{ 11 - 15 / 3 }}
{{ (4 + 5) % 3 }}
```

A precedência segue a do Rust.

### Operadores Bitwise

Renomeados para evitar conflito com pipes de filtro:

| Operador Rust | Operador Askama |
|---|---|
| `&` | `bitand` |
| `\|` | `bitor` |
| `^` | `xor` |

```jinja
{% if my_bitset bitand 1 != 0 %}
    Bit 0 está setado!
{% endif %}
```

### Operador `as` (Type Conversion)

```jinja
{{ valor as i32 }}
{{ (count as f64) / 2.0 }}
```

Restrições:
- Apenas tipos primitivos (`i32`, `f64`, `bool`, etc.)
- Se o valor é uma referência, Askama faz auto-deref até o tipo base

### Operador `?` (Question Mark)

Apenas para tipos `Result`:

```jinja
{{ some_result? }}
{% let value = some_result? %}
```

Se for `Err`, o template falha com `askama::Error::Custom`.

> ⚠️ Não funciona com `Option` — apenas `Result`.

### Concatenação de Strings

Use `~` como operador de concatenação:

```jinja
{{ a ~ b ~ c }}
```

Equivalente a `{{ a }}{{ b }}{{ c }}`.

O `~` deve ser cercado por espaços para não ser confundido com operador de whitespace.

---

## Templates Dentro de Templates

É possível delegar a renderização a outro template:

```rust
#[derive(Template)]
#[template(source = "Section 1: {{ s1 }}", ext = "txt")]
struct RenderInPlace<'a> {
   s1: SectionOne<'a>,
}

#[derive(Template)]
#[template(source = "A={{ a }}\nB={{ b }}", ext = "txt")]
struct SectionOne<'a> {
   a: &'a str,
   b: &'a str,
}
```

Se o template interno renderiza HTML, use `|safe` para evitar double-escaping:

```jinja
{{ s1 | safe }}
```

Ou implemente `HtmlSafe` para o tipo:

```rust
impl askama::filters::HtmlSafe for SectionOne<'_> {}
```

---

## Comentários

```jinja
{# Um comentário #}
```

Comentários aninhados são suportados:

```jinja
{#
Comentário externo
  {# comentário aninhado #}
#}
```

---

## Macros

### Definição Básica

```jinja
{% macro heading(required_arg, optional_arg = "default subtitle") %}
    <h1>{{required_arg}}</h1>
    <h2>{{optional_arg}}</h2>
    {{ variable_in_scope }}
{% endmacro %}
```

### Invocação

```jinja
{{ heading("test", "good subtitle") }}
{{ heading("test") }}  {# usa o valor padrão para optional_arg #}
```

### Tipagem de Argumentos

```jinja
{%- macro test(value: Option<u32>, extra: Option<u32> = None) -%}
  {% if let Some(value) = value %}value is {{value}}{% endif %}
  {% if let Some(extra) = extra %}extra is {{extra}}{% endif %}
{% endmacro -%}
```

### Nome no End

```jinja
{% macro heading(required_arg) %}
    {# ... #}
{% endmacro heading %}
```

### Named Arguments

```jinja
{% macro heading(title, font_weight = "normal", font_size = 13) %}
    <h1 style="font-weight: {{ font_weight }}; font-size: {{ font_size }};">
        {{ title }}
    </h1>
{% endmacro %}

{{ heading("Super Heading", "bold", 13) }}
{{ heading(title = "Super Heading", font_weight = "bold") }}
{{ heading(title = "Super Heading", font_size = 42, font_weight = "bold") }}
```

Pode-se misturar argumentos posicionais e nomeados, desde que os nomeados venham **depois**:

```jinja
{{ heading("Super Heading", font_weight = "bold", font_size = 26) }}
```

### Imports & Scopes

```jinja
{% import "macros.html" as ui %}

{{ ui::heading("test") }}
```

### Macro Call Blocks

Permite que a macro receba um "corpo":

```jinja
{% macro centered() %}
    <center>
        {{ caller() }}
    <center>
{% endmacro %}

{% call centered() %}
    Texto centralizado
{% endcall %}
```

### Call Blocks com Argumentos

```jinja
{% macro dump_users(users) %}
    <ul>
    {%- for user in users %}
        <li><p>{{ user.username }}</p>{{ caller(user) }}</li>
    {%- endfor %}
    </ul>
{% endmacro %}

{% call(user) dump_users(list_of_users) %}
    <dl>
        <dt>Name</dt><dd>{{ user.realname }}</dd>
    </dl>
{% endcall %}
```

### Caller Opcional

```jinja
{% macro render_dialog(title, class="dialog") %}
    <div class="{{ class }}">
        <h2>{{ title }}</h2>
        <div class="contents">
            {% if caller is defined %}
                {{ caller() }}
            {% else %}
                Empty dialog
            {% endif %}
        </div>
    </div>
{% endmacro %}

{{ render_dialog("Empty Dialog") }}

{% call render_dialog("Nice Dialog") %}
    This is a simple dialog.
{% endcall %}
```

### Aninhando Macros com `caller`

```jinja
{% macro container() %}
    <div class="container">{{ caller() }}</div>
{% endmacro %}

{% macro outer_container() %}
    {% set outer_caller = caller %}
    <div class="outer-container">
        {% call container() %}
            {{ outer_caller() }}
        {% endcall %}
    </div>
{% endmacro %}
```

---

## Raw Block

Conteúdo dentro de `{% raw %}...{% endraw %}` não é processado:

```jinja
{% raw %}
  {{ Isto não será interpretado }}
  {# Nem isto #}
{% endraw %}
```

---

## Chamando Macros do Rust

É possível chamar macros Rust diretamente:

```jinja
{% let s = format!("{}", 12) %}
```

⚠️ **Atenção:** Askama não sabe se um argumento de macro é variável ou não.
Se precisar passar uma variável, faça o bind explícito:

```jinja
{% let entity = entity %}
{{ test_macro!(entity) }}
```

---

## Expressões com Referências e Dereferências

```jinja
{% let x = &"bla" %}
{% if *x == "bla" %}
  Just talking
{% endif %}

{% let x = &&"bla" %}
{% if *&**x == "bla" %}
  Multiple layers
{% endif %}
```

---

## Estruturas Recursivas

```rust
#[derive(Template)]
#[template(source = r#"
{{ name }} {
{% for item in children %}
   {{ item.render()? }}
{% endfor %}
}
"#, ext = "html", escape = "none")]
struct Item<'a> {
    name: &'a str,
    children: &'a [Item<'a>],
}
```
