# Filtros

Filtros pós-processam valores usando o pipe `|`:

```jinja
{{ "HELLO" | lower }}
{{ name | capitalize | fmt("{:?}") }}
{{ count | pluralize(singular="mouse", plural="mice") }}
```

Filtros podem ser **encadeados**: a saída de um vira entrada do próximo.

## Filtros Built-in

### `assigned_or`

```jinja
{{ variable_or_expression | assigned_or(fallback) }}
```

Se o valor está em seu estado "default" (string vazia, `0`, `None`, `Err`),
retorna o fallback. Caso contrário, retorna o valor:

```jinja
{% let greeting = Some("Hello") %}
{{ greeting.as_ref() | assigned_or("Hi") }}
{# Output: Hello #}
```

### `capitalize`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ text | capitalize }}
```

Primeira letra maiúscula, resto minúsculo:

```jinja
{{ "hello" | capitalize }}
{# Output: Hello #}
```

### `center`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ text | center(length) }}
```

Centraliza o valor em um campo de largura `length`:

```jinja
-{{ "a" | center(5) }}-
{# Output: -  a  - #}
```

### `default`

```jinja
{{ variable | default(valor) }}
{{ variable | default(valor, true) }}  {# modo assigned_or #}
```

Compatibilidade com Jinja. Sem o segundo argumento (ou `false`), comporta-se como
`defined_or`. Com `true`, como `assigned_or`.

> ⚠️ Prefira usar `defined_or` ou `assigned_or` explicitamente.

### `defined_or`

```jinja
{{ variable | defined_or(fallback) }}
```

Retorna fallback se a variável **não está definida**:

```jinja
{% let greeting = "Hello" %}
{{ greeting | defined_or("Hi") }}
{# Output: Hello #}

{{ inexistente | defined_or("Hi") }}
{# Output: Hi #}
```

### `deref`

```jinja
{{ expression | deref }}
```

Dereferencia o valor (gera `*valor` no código):

```jinja
{% let s = String::from("a") | ref %}
{% if s | deref == String::from("b") %}
{% endif %}
```

### `escape` / `e`

```jinja
{{ text | e }}
{{ text | escape }}
{{ text | escape("tex") }}  {# com escaper específico #}
```

Escapa caracteres HTML:

```jinja
{{ "Escape <>&" | e }}
{# Output: Escape &amp;lt;&amp;gt;&amp;amp; #}
```

Útil para templates com `escape = "none"` onde você quer escapar apenas algumas expressões.

### `filesizeformat`

```jinja
{{ bytes | filesizeformat }}
{{ bytes | filesizeformat(precision = 3) }}
```

Formata número de bytes em representação legível:

```jinja
{{ 1024 | filesizeformat }}
{# Output: 1.02 KB #}

{{ 1024 | filesizeformat(precision = 3) }}
{# Output: 1.024 KB #}
```

### `fmt`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ expression | fmt("format_string") }}
```

Formata usando `format!()`. O **primeiro** argumento é o valor, o **segundo** é o formato:

```jinja
{{ value | fmt("{:?}") }}
```

A ordem é invertida em relação ao `format!()` normal para permitir composição:

```jinja
{{ value | capitalize | fmt("{:?}") }}
```

### `format`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ "format_string" | format(vars...) }}
```

Formata usando `format!()`. A **string de formato** é o primeiro argumento:

```jinja
{{ "{:?}" | format(var) }}
```

### `indent`

```jinja
{{ text | indent(width) }}
{{ text | indent(width, first, blank) }}
```

Indenta linhas com espaços:

```jinja
{{ "hello\nfoo\nbar" | indent(4) }}
{# Output:
hello
    foo
    bar
#}
```

O primeiro argumento pode ser uma string em vez de número:

```jinja
{{ "hello\n\nbar" | indent("  ", true, true) }}
{# Output:
  hello
  
  bar
#}
```

Argumentos opcionais:
- `first` (bool): indentar a primeira linha (padrão: false)
- `blank` (bool): indentar linhas em branco (padrão: false)

### `join`

```jinja
{{ iterable | join(separator) }}
```

Junta iterável em string:

```rust
// array = &["foo", "bar", "bazz"]
```

```jinja
{{ array | join(", ") }}
{# Output: foo, bar, bazz #}
```

### `linebreaks`

```jinja
{{ text | linebreaks }}
```

Converte quebras de linha em HTML:
- newline simples → `<br>`
- newline duplo → `<p>`...`</p>`

```jinja
{{ "hello\nworld\n\nfrom\naskama" | linebreaks }}
{# Output: <p>hello<br />world</p><p>from<br />askama</p> #}
```

### `linebreaksbr`

```jinja
{{ text | linebreaksbr }}
```

Converte **todas** as quebras de linha em `<br>`:

```jinja
{{ "hello\nworld\n\nfrom" | linebreaksbr }}
{# Output: hello<br />world<br /><br />from #}
```

### `paragraphbreaks`

```jinja
{{ text | paragraphbreaks }}
```

Converte apenas newlines duplos em `<p>`, ignorando newlines simples:

```jinja
{{ "hello\nworld\n\nfrom\n\n\n\naskama" | paragraphbreaks }}
{# Output: <p>hello\nworld</p><p>from</p><p>askama</p> #}
```

### `lower` / `lowercase`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ text | lower }}
{{ text | lowercase }}
```

Converte para minúsculas:

```jinja
{{ "HELLO" | lower }}
{# Output: hello #}
```

### `pluralize`

```jinja
{{ integer | pluralize }}
{{ integer | pluralize(singular, plural) }}
```

Seleciona singular/plural baseado no valor:

```jinja
cat{{ count | pluralize }}
{# count=1 → cat, count=2 → cats #}

dog{{ count | pluralize("go") }}
{# count=1 → doggo, count=2 → dogs #}

{{ count | pluralize("mouse", "mice") }}
{# count=1 → mouse, count=2 → mice #}
```

### `ref`

```jinja
{{ expression | ref }}
```

Cria uma referência ao valor (gera `&valor` no código):

```jinja
{{ "a" | ref }}       → &"a"
{{ self.x | ref }}    → &self.x
```

### `reject`

```jinja
{{ iterable | reject(valor) }}
{{ iterable | reject(caminho::funcao) }}
```

Remove elementos que correspondem ao valor ou predicado:

```jinja
{# Com valor: #}
{% for elem in data|reject(1) %}{{ elem }},{% endfor %}
{# data = [1, 2, 3, 1] → Output: 2,3, #}

{# Com função predicado: #}
{% for elem in data|reject(crate::is_odd) %}{{ elem }},{% endfor %}
{# data = [1, 2, 3, 1] com is_odd → Output: 2, #}
```

### `safe`

```jinja
{{ expression | safe }}
```

Marca o valor como seguro (não escapa):

```jinja
{{ "<p>I'm Safe</p>" | safe }}
{# Output: <p>I'm Safe</p> #}
```

### `title` / `titlecase`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ text | title }}
{{ text | titlecase }}
```

Primeira letra de cada palavra em maiúscula, resto minúsculo:

```jinja
{{ "hello WORLD" | title }}
{# Output: Hello World #}
```

### `trim`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ text | trim }}
```

Remove whitespace do início e fim:

```jinja
{{ " hello " | trim }}
{# Output: hello #}
```

### `truncate`

```jinja
{{ text | truncate(length) }}
```

Limita o tamanho da string, adicionando `...` se truncado:

```jinja
{{ "hello" | truncate(2) }}
{# Output: he... #}
```

### `unique`

> Requer feature: `std`

```jinja
{{ iterable | unique }}
```

Remove duplicatas do iterador:

```jinja
{% for elem in data|unique %}{{ elem }},{% endfor %}
{# data = ["a", "b", "a", "c"] → Output: a,b,c, #}
```

### `upper` / `uppercase`

> Requer feature: `alloc` (padrão ativada)

```jinja
{{ text | upper }}
{{ text | uppercase }}
```

Converte para maiúsculas:

```jinja
{{ "hello" | upper }}
{# Output: HELLO #}
```

### `urlencode` / `urlencode_strict`

> Requer feature: `urlencode` (padrão ativada)

```jinja
{{ text | urlencode }}
{{ text | urlencode_strict }}
```

Codifica URL (percent-encoding):

```jinja
{{ "hello?world" | urlencode }}
{# Output: hello%3Fworld #}
```

Diferenças:
- `urlencode`: escapa tudo exceto letras ASCII, dígitos e `_.-~/`
- `urlencode_strict`: também escapa `/`

### `wordcount`

```jinja
{{ text | wordcount }}
```

Conta palavras:

```jinja
{{ "askama is sort of cool" | wordcount }}
{# Output: 5 #}
```

---

## Filtros Opcionais (Feature-gated)

### `json` / `tojson`

> Requer feature: `serde_json`

```jinja
{{ value | json }}
{{ value | json(indent) }}
```

Serializa para JSON (requer `serde::Serialize`):

```jinja
{{ data | json }}
{{ data | json(2) }}       {# com indentação de 2 espaços #}
{{ data | json("  ") }}    {# com string de indentação #}
```

Uso seguro em HTML:

```jinja
Bom:  <li data-extra="{{data | json}}">…</li>
Bom:  <li data-extra='{{data | json | safe}}'>…</li>
Bom:  <pre>{{data | json | safe}}</pre>
Bom:  <script>var data = {{data | json | safe}};</script>

Ruim: <script>var data = {{data | json}};</script>
Ruim: <script>var data = "{{data | json | safe}}";</script>
```

---

## Custom Filters

### Anatomia

```rust
use askama::Template;

#[derive(Template)]
#[template(source = "{{ s | myfilter }}", ext = "txt")]
struct MyFilterTemplate<'a> {
    s: &'a str,
}

// Módulo `filters` em escopo — Askama procura aqui automaticamente
mod filters {
    use askama::Values;

    // #[askama::filter_fn] é OBRIGATÓRIO a partir da v0.15
    #[askama::filter_fn]
    pub fn myfilter<T: std::fmt::Display>(
        value: T,                    // valor do pipe
        _env: &dyn Values,           // runtime values (sempre necessário)
    ) -> askama::Result<String> {
        let s = value.to_string();
        Ok(s.replace("oo", "aa"))
    }
}
```

### Estrutura Obrigatória

Todo custom filter DEVE ter:

1. **Primeiro argumento**: o valor sendo filtrado (`value: impl Display` ou similar)
2. **Segundo argumento**: `env: &dyn askama::Values`
3. **Retorno**: `askama::Result<T>` onde `T: Display` (para o último filter da chain)

### Argumentos Extras

```rust
#[askama::filter_fn]
pub fn myfilter<T: std::fmt::Display>(
    s: T,
    _env: &dyn askama::Values,
    n: usize,  // argumento obrigatório extra
) -> askama::Result<String> {
    let s = s.to_string();
    let replace = "a".repeat(n);
    Ok(s.replace("oo", &replace))
}
```

```jinja
{{ s | myfilter(4) }}
```

### Argumentos Opcionais

Use `#[optional]`:

```rust
#[askama::filter_fn]
pub fn example_filter(
    value: impl Display,
    env: &dyn askama::Values,
    required0: impl Display,
    #[optional(None)] optional0: Option<&str>,
    #[optional("default value")] optional1: &str,
) -> askama::Result<String> { ... }
```

### Evitando Problemas com Referências

Use trait bounds (`impl Display`, `impl ToString`) em vez de tipos concretos
para evitar problemas com referências:

```rust
// ❌ Problemático: só aceita &str
pub fn filter(value: &str, env: &dyn Values) -> askama::Result<String> { }

// ✅ Flexível: aceita &str, &&str, &&&str, String, etc.
pub fn filter(value: impl Display, env: &dyn Values) -> askama::Result<String> { }
```

### Chamando Custom Filters por Path

```jinja
{{ value | filters::my_filter }}           {# módulo filters #}
{{ value | crate::utils::my_filter }}      {# path completo #}
```

### HTML-Safe Types

Tipos que implementam `HtmlSafe` não são escapados automaticamente:

```rust
impl askama::filters::HtmlSafe for MeuTipo {}
```

Isso marca também `&MeuTipo` como safe.

### Output Safe

Para marcar a saída de um filter como segura:

```rust
use askama::filters::Safe;

fn strip(s: impl ToString) -> Result<Safe<String>, askama::Error> {
    Ok(Safe(s.to_string()))
}
```

Ou condicionalmente:

```rust
use askama::filters::MaybeSafe;

fn as_sign(i: i32) -> Result<MaybeSafe<&'static str>, askama::Error> {
    match i {
        i if i < 0 => Ok(MaybeSafe::NeedsEscaping("<0")),
        i if i > 0 => Ok(MaybeSafe::NeedsEscaping(">0")),
        _          => Ok(MaybeSafe::Safe("=0")),
    }
}
```

## Resumo de Features por Filtro

| Filtro | Feature Requerida |
|---|---|
| `capitalize`, `center`, `fmt`, `format`, `lower`, `title`, `trim`, `upper` | `alloc` (padrão) |
| `urlencode`, `urlencode_strict` | `urlencode` (padrão) |
| `unique` | `std` (padrão) |
| `json`, `tojson` | `serde_json` |
| `assigned_or`, `default`, `defined_or`, `deref`, `escape`, `e`, `filesizeformat`, `indent`, `join`, `linebreaks`, `linebreaksbr`, `paragraphbreaks`, `pluralize`, `ref`, `reject`, `safe`, `truncate`, `wordcount` | Nenhuma (sempre disponíveis) |
