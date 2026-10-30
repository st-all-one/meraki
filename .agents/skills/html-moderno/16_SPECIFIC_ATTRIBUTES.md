# Atributos HTML Específicos

Cobre: `capture`, `dirname`, `form`, `readonly`, `size`, `step`, `elementtiming`

---

## `capture`

Atributo para `<input type="file">` que especifica qual câmera/microfone usar.

| Valor | Descrição |
|-------|-----------|
| `user` | Câmera frontal / microfone do usuário |
| `environment` | Câmera traseira / microfone externo |

```html
<input type="file" accept="image/*" capture="user" />
<input type="file" accept="video/*" capture="environment" />
```

> [!NOTE]
> Funciona melhor em dispositivos móveis. Desktop tipicamente abre o file picker padrão.

---

## `dirname`

Envia a direcionalidade do texto (`ltr`/`rtl`) junto com o formulário. Aplicável a `<textarea>` e inputs `text`, `search`, `tel`, `url`, `email`, `password`, `submit`, `reset`, `button`.

```html
<form method="get" action="/submit">
  <textarea name="comment" dir="auto" dirname="comment-direction">سيب</textarea>
  <button type="submit">Enviar</button>
</form>
```

Dados enviados: `comment=%D8%B3%D9%8A%D8%A8&comment-direction=rtl`

Funciona combinado com `dir="auto"` para detecção automática, ou herda `dir` do elemento pai.

---

## `form` (Associação Explícita)

Associa um controle de formulário a um `<form>` **não ancestral** no mesmo documento. Aplicável a: `<button>`, `<fieldset>`, `<input>`, `<object>`, `<output>`, `<select>`, `<textarea>`.

```html
<form id="loginForm"></form>

<input form="loginForm" type="text" name="username" />
<input form="loginForm" type="password" name="password" />
<button form="loginForm" type="submit">Login</button>
```

- O valor é o `id` de um `<form>` no mesmo documento
- Não é herdado: `fieldset[form]` não associa seus filhos automaticamente
- Apenas elementos submittable (button, input, select, textarea) têm seus valores enviados

---

## `readonly`

Torna o campo não editável pelo usuário, mas ainda focável e submetido com o formulário. Diferença de `disabled`:

| | `readonly` | `disabled` |
|---|-----------|------------|
| Focável | Sim | Não |
| Submetido | Sim | Não |
| Participa de validação | Não | Não |

Aplicável a inputs textuais (`text`, `search`, `tel`, `url`, `email`, `password`, `date`, `month`, `week`, `time`, `datetime-local`, `number`) e `<textarea>`.

```html
<input type="text" value="Valor fixo" readonly />
<textarea readonly>Texto não editável</textarea>
```

> [!NOTE]
> `required` não tem efeito em campos `readonly`.

---

## `size`

Largura do `<input>` (em caracteres) ou altura do `<select>` (em opções visíveis).

```html
<input type="text" size="30" />
<select size="5">
  <option>Opção 1</option>
  <option>Opção 2</option>
  <option>Opção 3</option>
</select>
```

- CSS sobrepõe `size` para largura
- Não tem impacto em constraint validation
- `<select size="1">` com `multiple` pode parecer um select normal, mas não expande no foco — evitar

---

## `step`

Intervalo de incremento para inputs numéricos e de data. Defaults:

| Input type | Default step |
|-----------|-------------|
| `number`, `range` | 1 |
| `date` | 1 dia |
| `month` | 1 mês |
| `week` | 1 semana |
| `time` | 60 segundos |
| `datetime-local` | 60 segundos |

```html
<input type="number" min="0" step="2" max="10" />
<input type="time" step="900" /> <!-- 15 min intervals -->
```

- `step="any"` permite qualquer valor
- Step base = `min` (se definido), senão `value`, senão `0`
- Valores que não seguem o step geram `stepMismatch` na validação

---

## `elementtiming`

Marca elementos para rastreamento de performance via `PerformanceObserver` com tipo `"element"`.

```html
<img src="hero.jpg" alt="Hero" elementtiming="Imagem principal" />
<p elementtiming="texto-importante">Conteúdo crítico.</p>
```

Aplicável a: `<img>`, `<image>` (SVG), poster de `<video>`, elementos com `background-image`, e elementos com text nodes.

No DOM: refletido como `Element.elementTiming`.

```js
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(entry.identifier, entry.renderTime);
  });
});
observer.observe({ type: "element", buffered: true });
```
