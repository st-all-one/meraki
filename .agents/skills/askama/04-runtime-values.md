# Valores em Tempo de Execução (Runtime Values)

Além dos campos do struct, Askama permite passar valores adicionais
**em tempo de execução** através do trait `Values`.

Isso é útil para:
- Injetar dados sem modificar o struct do template
- Valores que só são conhecidos em runtime (como o usuário logado)
- Testar templates com diferentes contextos

## O Trait `Values`

O trait `Values` já é implementado para:

- `HashMap<&str, Box<dyn Any>>`
- Tuplas `(&str, &dyn Any)`
- Slice de tuplas `&[(&str, &dyn Any)]`

## Exemplo com HashMap

```rust
use std::collections::HashMap;

let mut values: HashMap<&str, Box<dyn Any>> = HashMap::new();
values.insert("name", Box::new("Bibop"));
values.insert("age", Box::new(12u32));
```

## Exemplo com Tupla

```rust
let value = "valor".to_string();
let tuple: (&str, &dyn Any) = ("a", &value);
```

## Renderizando com Valores

```rust
template_struct.render_with_values(&values).unwrap();
```

## Acessando no Template

Dois métodos para acessar os valores no template:

### Filter `value`

```jinja
{% if let Ok(name) = "name"|value::<&str> %}
  name is {{ name }}
{% endif %}
```

### Função `askama::get_value`

```jinja
{% if let Ok(age) = askama::get_value::<u32>("age") %}
  age is {{ age }}
{% endif %}
```

## Tratamento de Erros

| Erro | Significado |
|---|---|
| `askama::Error::ValueMissing` | A chave não existe nos valores |
| `askama::Error::ValueType` | O tipo do valor não corresponde ao esperado |

```jinja
{% if let Ok(name) = "name"|value::<&str> %}
  name is {{ name }}
{% else %}
  name is not available
{% endif %}
```

## Acessando Runtime Values em Custom Filters

Filtros customizados também podem acessar os valores de runtime:

```rust
use std::any::Any;
use askama::{Template, Values};

mod filters {
    use super::*;

    #[askama::filter_fn]
    pub fn cased(value: impl ToString, values: &dyn Values) -> askama::Result<String> {
        let value = value.to_string();
        let case = askama::get_value(values, "case").ok();
        Ok(match case {
            Some(Case::Lower) => value.to_lowercase(),
            Some(Case::Upper) => value.to_uppercase(),
            None => value,
        })
    }
}

#[derive(Debug, Clone, Copy)]
pub enum Case {
    Lower,
    Upper,
}

#[test]
fn test_runtime_values_in_custom_filters() {
    #[derive(Template)]
    #[template(ext = "txt", source = "Hello, {{ user | cased }}!")]
    struct MyStruct<'a> {
        user: &'a str,
    }

    let values: (&str, &dyn Any) = ("case", &Case::Lower);
    assert_eq!(
        MyStruct { user: "wOrLd" }
            .render_with_values(&values)
            .unwrap(),
        "Hello, world!"
    );

    let values: (&str, &dyn Any) = ("case", &Case::Upper);
    assert_eq!(
        MyStruct { user: "wOrLd" }
            .render_with_values(&values)
            .unwrap(),
        "Hello, WORLD!"
    );

    // Sem valores: usa o valor original
    assert_eq!(
        MyStruct { user: "wOrLd" }.render().unwrap(),
        "Hello, wOrLd!"
    );
}
```

## Implementando `Values` para Tipos Customizados

Você pode implementar `Values` para seus próprios tipos:

```rust
use askama::Values;

struct MeuContexto {
    usuario: String,
    cargo: String,
}

impl Values for MeuContexto {
    fn get_value(&self, key: &str) -> Option<&dyn std::any::Any> {
        match key {
            "usuario" => Some(&self.usuario as &dyn Any),
            "cargo" => Some(&self.cargo as &dyn Any),
            _ => None,
        }
    }
}
```

## Boas Práticas

1. **Prefira campos do struct** para dados que são sempre necessários — o compilador valida a existência
2. **Use runtime values** para dados opcionais ou que variam por requisição
3. **Sempre trate o caso `Err`** no template — use `if let Ok(...)` ou `else`
4. **Documente as chaves esperadas** para evitar erros de tipo em produção
