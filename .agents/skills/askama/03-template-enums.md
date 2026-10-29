# Templates com Enums

Askama suporta `#[derive(Template)]` em **enums**, não apenas em structs.
Isso é poderoso para renderizar diferentes variantes de um tipo com templates diferentes.

## Enum com Template Único

Você pode usar `{% match self %}` para lidar com cada variante dentro de um único template:

```rust
#[derive(Debug, Template)]
#[template(path = "area.txt")]
enum Area {
    Square(f32),
    Rectangle { a: f32, b: f32 },
    Circle { radius: f32 },
}
```

```jinja
{%- match self -%}
    {%- when Self::Square(side) -%}
        {{side}}^2
    {%- when Self::Rectangle { a, b} -%}
        {{a}} * {{b}}
    {%- when Self::Circle { radius } -%}
        pi * {{radius}}^2
{%- endmatch -%}
```

> **Nota:** `Self::` é opcional no padrão — `Square(side)` também funciona.

## Enum com Template por Variante

Cada variante pode ter seu próprio template:

```rust
#[derive(Template, Debug)]
#[template(ext = "txt")]
enum AreaPerVariant {
    #[template(source = "{{self.0}}^2")]
    Square(f32),
    #[template(source = "{{a}} * {{b}}")]
    Rectangle { a: f32, b: f32 },
    #[template(source = "pi * {{radius}}^2")]
    Circle { radius: f32 },
}
```

## Atributos Herdados vs Específicos

Quando você usa `#[template]` na variante, os seguintes atributos são **herdados** do enum:

- `config`
- `escape`
- `ext`
- `syntax`
- `whitespace`

Os seguintes **NÃO são herdados** e precisam ser definidos por variante se necessário:

- `block`
- `print`

## Combinando Enum + Blocks

Uma abordagem intermediária: use um template único com `block` por variante:

```rust
#[derive(Template, Debug)]
#[template(path = "area_com_blocks.txt")]
enum AreaWithBlocks {
    #[template(block = "square")]
    Square(f32),
    #[template(block = "rectangle")]
    Rectangle { a: f32, b: f32 },
    #[template(block = "circle")]
    Circle { radius: f32 },
}
```

```jinja
{%- block square -%}
    {{self.0}}^2
{%- endblock -%}

{%- block rectangle -%}
    {{a}} * {{b}}
{%- endblock -%}

{%- block circle -%}
    pi * {{radius}}^2
{%- endblock -%}
```

## Usando `match` com Outros Tipos

### Option

```jinja
{% match item %}
  {% when Some with ("foo") %}
    Found literal foo
  {% when Some with (val) %}
    Found {{ val }}
  {% when None %}
    Nothing found
{% endmatch %}
```

### Result

```jinja
{% match result %}
  {% when Ok(val) %} Good: {{ val }}.
  {% when Err(err) %} Bad: {{ err }}.
{% endmatch %}
```

### Literais e Padrões Complexos

```jinja
{% match number %}
  {% when 1 | 4 | 86 %} Números especiais
  {% when n %} Número é {{ n }}
{% endmatch %}
```

### Placeholder `_` e Wildcard `..`

```jinja
{% match list_of_ints %}
  {% when [first, ..] %} A lista começa com {{ first }}
  {% when _ %} A lista está vazia.
{% endmatch %}
```

## Regras do `match`

1. **Deve ser exaustivo** — todos os casos possíveis devem ser cobertos
2. Use `{% else %}` como açúcar sintático para `{% when _ %}`
3. `{% else %}` deve vir **por último**
4. Pelo menos um `{% when %}` ou `{% else %}` é obrigatório
5. Pode-se usar `{% endwhen %}` opcionalmente para fechar um bloco `when`

```jinja
{% match answer %}
  {% when Ok(42) %} A resposta é 42.
  {% else %} Resposta errada?
{% endmatch %}
```

Com `{% endwhen %}` explícito:

```jinja
{% match number %}
  {% when 0 | 2 | 4 | 6 | 8 %}
    Par
  {% endwhen %}
  {% when 1 | 3 | 5 | 7 | 9 %}
    Ímpar
  {% endwhen %}
  {% else %}
    Desconhecido
{% endmatch %}
```

## Dicas

- Use `match` para **Option**, **Result**, **enum** e padrões complexos
- Para enums com muitas variantes, a abordagem `block` por variante mantém o template organizado
- A abordagem "template por variante" é útil quando as variantes têm estruturas muito diferentes
- Match blocks **não podem** conter conteúdo literal fora dos `{% when %}` — apenas whitespace e comentários
