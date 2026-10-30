# Constraint Validation API

Validação de formulários HTML sem JavaScript (via atributos) e com JavaScript (via API).

> [!IMPORTANT]
> Validação client-side **não substitui** validação server-side. Usuários podem modificar HTML no devtools ou enviar requisições HTTP diretamente.

## 1. Atributos de Validação Intrínsecos

Input types com validação intrínseca:

| Input type | Restrição | Violação |
|-----------|-----------|----------|
| `url` | Deve ser URL absoluta | `typeMismatch` |
| `email` | Deve ser email válido | `typeMismatch` |

### Atributos de Validação

| Atributo | Tipos suportados | Descrição | Violação |
|----------|-----------------|-----------|----------|
| `pattern` | text, search, url, tel, email, password | Regex JS (flags global/ignoreCase/multiline desligadas) | `patternMismatch` |
| `min` | range, number, date, month, week, datetime-local, time | Valor mínimo | `rangeUnderflow` |
| `max` | range, number, date, month, week, datetime-local, time | Valor máximo | `rangeOverflow` |
| `required` | text, search, url, tel, email, password, date, number, checkbox, radio, file, select, textarea | Campo obrigatório | `valueMissing` |
| `step` | date, month, week, time, datetime-local, number, range | Intervalo de incremento | `stepMismatch` |
| `minlength` | text, search, url, tel, email, password, textarea | Mínimo de caracteres | `tooShort` |
| `maxlength` | text, search, url, tel, email, password, textarea | Máximo de caracteres | `tooLong` |

## 2. Constraint Validation API (JavaScript)

### Métodos

| Método | Comportamento |
|--------|--------------|
| `element.checkValidity()` | Retorna boolean. Valida estaticamente |
| `element.reportValidity()` | Retorna boolean + mostra erro ao usuário |
| `element.setCustomValidity(msg)` | Define mensagem de erro customizada. String vazia = válido |
| `form.checkValidity()` | Valida todos os campos do formulário |
| `form.reportValidity()` | Valida e reporta todos os campos |

### Propriedade `validity` (ValidityState)

```js
element.validity.valueMissing     // required não preenchido
element.validity.typeMismatch     // tipo incorreto (email, url)
element.validity.patternMismatch  // não corresponde ao pattern
element.validity.tooLong          // excede maxlength
element.validity.tooShort         // abaixo de minlength
element.validity.rangeUnderflow   // abaixo de min
element.validity.rangeOverflow    // acima de max
element.validity.stepMismatch     // não respeita step
element.validity.badInput         // entrada não parseável
element.validity.customError      // setCustomValidity() ativo
element.validity.valid            // tudo ok (booleano)
```

### Constraint Customizada (Exemplo: CEP por país)

```html
<form>
  <label for="postal-code">CEP:</label>
  <input type="text" id="postal-code" />
  <label for="country">País:</label>
  <select id="country">
    <option value="ch">Suíça</option>
    <option value="fr">França</option>
    <option value="de">Alemanha</option>
  </select>
  <input type="submit" value="Validar" />
</form>
```

```js
function checkPostalCode() {
  const constraints = {
    ch: ["^\\d{4}$", "CEP suíço deve ter 4 dígitos"],
    fr: ["^\\d{5}$", "CEP francês deve ter 5 dígitos"],
    de: ["^\\d{5}$", "CEP alemão deve ter 5 dígitos"],
  };
  const country = document.getElementById("country").value;
  const field = document.getElementById("postal-code");
  const constraint = new RegExp(constraints[country][0]);
  field.setCustomValidity(
    constraint.test(field.value) ? "" : constraints[country][1]
  );
}
```

### Limitar Tamanho de Arquivo

```js
const fs = document.getElementById("file-upload");
function checkFileSize() {
  if (fs.files.length > 0 && fs.files[0].size > 75 * 1000) {
    fs.setCustomValidity("Arquivo deve ser menor que 75 kB");
    fs.reportValidity();
    return;
  }
  fs.setCustomValidity("");
}
```

## 3. CSS Pseudo-classes

```css
:valid          /* valor válido */
:invalid        /* valor inválido */
:required       /* tem atributo required */
:optional       /* não tem required */
:in-range       /* dentro de min/max */
:out-of-range   /* fora de min/max */
:placeholder-shown /* placeholder visível */
:user-valid     /* usuário interagiu + válido */
:user-invalid   /* usuário interagiu + inválido */
```

## 4. Notas Importantes

- `form novalidate` desabilita validação interativa
- `form.submit()` não dispara constraint validation (usar `submitButton.click()`)
- `readonly` fields não participam de constraint validation
- `minlength`/`maxlength` só validam input do usuário, não value setado por JS
- Elementos que suportam `setCustomValidity()`: `<input>`, `<textarea>`, `<select>`, `<button>`, `<output>`, `<fieldset>`
