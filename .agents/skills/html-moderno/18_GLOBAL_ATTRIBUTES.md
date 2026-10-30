# Atributos Globais HTML (Parte 2)

Complemento ao guia principal, cobrindo atributos globais não abordados em `01_ALL_TAGS.md` e `04_ACCESSIBILITY.md`.

---

## `accesskey`

Atalho de teclado para o elemento. Valor: um único caractere imprimível.

```html
<button accesskey="s">Salvar</button>
```

Combinações de tecla variam por browser/OS:

| Browser | Windows/Linux | Mac |
|---------|--------------|-----|
| Firefox | `Alt` + `Shift` + key | `Ctrl` + `Option` + key |
| Chrome/Edge | `Alt` + key | `Ctrl` + `Option` + key |
| Safari | — | `Ctrl` + `Option` + key |

> [!WARNING]
> `accesskey` tem problemas de conflito com atalhos do sistema/AT, suporte de teclado internacional e descoberta pelo usuário. Em geral, **evitar** para sites públicos. Prefira `aria-keyshortcuts`.

---

## `anchor` (experimental, non-standard)

Associa um elemento posicionado a um elemento âncora pelo `id`.

```html
<div class="anchor" id="example-anchor">⚓</div>
<div class="infobox" anchor="example-anchor">Info box</div>
```

```css
.infobox {
  position: fixed;
  left: anchor(right);
}
```

Usado com [CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning).

---

## `autocapitalize`

Controla capitalização automática em teclados virtuais.

| Valor | Efeito |
|-------|--------|
| `off` / `none` | Sem capitalização |
| `on` / `sentences` | Capitaliza início de frases (default Chrome/Safari) |
| `words` | Capitaliza início de cada palavra |
| `characters` | Tudo maiúsculo |

```html
<input type="text" autocapitalize="words" />
<textarea autocapitalize="sentences"></textarea>
```

Não afeta teclado físico. Não funciona em inputs `url`, `email`, `password`.

---

## `autocorrect`

Habilita/desabilita correção automática de digitação.

```html
<input type="text" autocorrect="on" />
<textarea autocorrect="off"></textarea>
```

- Default: `on` (fora de `<form>`), herdado de `<form>` (dentro)
- Não funciona em `password`, `email`, `url`

---

## `dir`

Direcionalidade do texto: `ltr`, `rtl`, ou `auto`.

```html
<p dir="rtl">هذا النص بالعربية</p>
<p dir="auto">Texto com direção detectada automaticamente</p>
```

Herda do pai se não especificado. `<bdo>` REQUER `dir`. `<bdi>` default é `auto`.

---

## `draggable`

Habilita arrasto via [HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API).

```html
<div draggable="true">Arraste-me</div>
```

Valores: `true` (pode arrastar), `false` (não pode). Default é `auto` (comportamento nativo: texto selecionado, imagens, links).

> [!WARNING]
> `draggable` é **enumerado**, não booleano. Use `draggable="true"`, não `<div draggable>`.

---

## `enterkeyhint`

Dica para o rótulo/ícone da tecla Enter em teclados virtuais.

| Valor | Rótulo típico |
|-------|--------------|
| `enter` | return / ↵ |
| `done` | Done / ✅ |
| `go` | Go / 🡢 |
| `next` | Next / ⇥ |
| `previous` | Previous / ⇤ |
| `search` | Search / 🔍 |
| `send` | Send |

```html
<input enterkeyhint="go" />
<input enterkeyhint="search" />
```

---

## `exportparts`

Exporta partes de um shadow tree aninhado para o light DOM, permitindo estilo via `::part()`.

```html
<nested-component exportparts="header, body, footer"></nested-component>
```

Para renomear: `exportparts="original:exportado"`.

```css
::part(exportado) { color: red; }
```

---

## `hidden`

Oculta o elemento (não renderizado). Atributo enumerado com possíveis valores:

| Valor | Efeito |
|-------|--------|
| (vazio) / `hidden` | Elemento oculto |
| `until-found` | Oculta até ser encontrado por find-in-page ou navegação por fragmento |

```html
<div hidden>Este elemento não aparece.</div>
<div hidden="until-found">Escondido até busca encontrá-lo.</div>
```

---

## `inputmode`

Dica para o tipo de teclado virtual.

| Valor | Teclado |
|-------|---------|
| `none` | Sem teclado virtual |
| `text` | Teclado padrão |
| `decimal` | Números com ponto decimal |
| `numeric` | Números |
| `tel` | Telefone |
| `search` | Com tecla "search" |
| `email` | Com @ e . |
| `url` | Com / e . |

```html
<input type="text" inputmode="numeric" pattern="[0-9]*" />
<input type="text" inputmode="email" />
```

---

## `is`

Especifica que um elemento HTML padrão deve se comportar como um [customized built-in element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

```html
<button is="fancy-button">Clique</button>
```

```js
customElements.define("fancy-button", FancyButton, { extends: "button" });
```

---

## `spellcheck`

Habilita/desabilita verificação ortográfica.

| Valor | Efeito |
|-------|--------|
| `true` / vazio | Verificar ortografia |
| `false` | Não verificar |

```html
<textarea spellcheck="true"></textarea>
<p contenteditable spellcheck="false">Sem correção</p>
```

---

## `translate`

Controla se o conteúdo do elemento deve ser traduzido.

```html
<p translate="no">OpenAI</p> <!-- Não traduzir -->
<p translate="yes">Hello World</p>
```

---

## `virtualkeyboardpolicy` (experimental)

Controla o comportamento do teclado virtual em `contenteditable`.

- `auto` (default): teclado aparece ao focar
- `manual`: teclado não aparece automaticamente

---

## `writingsuggestions` (experimental)

Habilita/desabilita sugestões de escrita (autocomplete/predictive text) em elementos editáveis.

```html
<textarea writingsuggestions="false"></textarea>
```
