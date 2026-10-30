# Interdependências do HTML

## 1. HTML ↔ CSS

### Separação de Responsabilidades
```
HTML = Estrutura + Semântica
CSS  = Apresentação + Layout
```

### Regras
- **Nunca** usar atributos presentacionais legados (`align`, `bgcolor`, `border`, `color`, `width`, `height` em elementos não-replaced)
- **Nunca** usar elementos presentacionais obsoletos (`<font>`, `<center>`, `<big>`, `<tt>`, `<strike>`)
- Toda apresentação deve ser feita via CSS

### CSS Targeting HTML
```css
/* Por tag */
article { ... }
button { ... }

/* Por classe */
.card { ... }

/* Por atributo */
input[type="email"] { ... }
[data-user-id] { ... }

/* Por estado HTML */
:checked    { ... }     /* checkbox/radio checked */
:disabled   { ... }     /* elemento desabilitado */
:valid      { ... }     /* input válido */
:invalid    { ... }     /* input inválido */
:required   { ... }     /* campo obrigatório */
:optional   { ... }     /* campo opcional */
:in-range   { ... }     /* valor dentro do range */
:out-of-range { ... }  /* valor fora do range */
:placeholder-shown { ... } /* placeholder visível */
:blank      { ... }     /* input vazio */
:user-invalid { ... }   /* usuário interagiu e é inválido */
:modal      { ... }     /* dialog aberto como modal */
:open       { ... }     /* details/popover aberto */
:popover-open { ... }   /* popover aberto */
```

### CSS Pseudo-Elements que interagem com HTML
```css
::before, ::after       { ... }  /* Gera conteúdo via content */
::placeholder           { ... }  /* Placeholder de input/textarea */
::marker                { ... }  /* Bullet/número de list item */
::backdrop              { ... }  /* Fundo de dialog modal / popover auto */
::slotted()             { ... }  /* Conteúdo projetado em slot */
::part()                { ... }  /* Shadow DOM exposed part */
::details-content       { ... }  /* Conteúdo expansível de details */
```

### CSSOM
- CSS pode ser inserido via `<style>` no `<head>` ou `<body>` (com `blocking="render"`)
- CSS externo via `<link rel="stylesheet">`
- CSS pode ser condicional: `<link media="print" ...>`, `@media`, `@container`

## 2. HTML ↔ JavaScript (DOM API)

### Cada Elemento HTML tem uma Interface DOM

| Elemento | Interface DOM |
|----------|--------------|
| `<html>` | `HTMLHtmlElement` |
| `<body>` | `HTMLBodyElement` |
| `<div>` | `HTMLDivElement` |
| `<a>` | `HTMLAnchorElement` |
| `<img>` | `HTMLImageElement` |
| `<input>` | `HTMLInputElement` |
| `<form>` | `HTMLFormElement` |
| `<button>` | `HTMLButtonElement` |
| `<dialog>` | `HTMLDialogElement` |
| `<details>` | `HTMLDetailsElement` |
| `<template>` | `HTMLTemplateElement` |
| `<slot>` | `HTMLSlotElement` |
| `<canvas>` | `HTMLCanvasElement` |
| `<video>` | `HTMLVideoElement` |
| `<audio>` | `HTMLAudioElement` |
| `<select>` | `HTMLSelectElement` |
| `<textarea>` | `HTMLTextAreaElement` |
| `<table>` | `HTMLTableElement` |

### Content Attributes vs IDL Attributes
```html
<!-- Content attribute (HTML) -->
<input type="text" value="hello" id="myInput" />

<!-- IDL attribute (JavaScript) é o reflexo, pode diferir -->
<script>
  const input = document.getElementById('myInput');
  input.getAttribute('value');  // "hello" (content attribute)
  input.value;                   // "hello" (IDL attribute — pode ser diferente)
  input.value = 'world';        // Altera IDL, não content attribute
  input.getAttribute('value');  // "hello" (content attribute inalterado)
</script>
```

### Eventos HTML ↔ JavaScript

| Evento | Elemento | Dispara quando |
|--------|----------|----------------|
| `submit` | `<form>` | Formulário submetido |
| `reset` | `<form>` | Formulário resetado |
| `change` | `<input>`, `<select>`, `<textarea>` | Valor alterado e perdeu foco |
| `input` | `<input>`, `<textarea>` | Valor alterado (cada tecla) |
| `invalid` | `<input>` | Validação falhou |
| `formdata` | `<form>` | Dados do form sendo construídos |
| `click` | Qualquer | Elemento clicado |
| `focus` / `blur` | Elementos focáveis | Ganhou/perdeu foco |
| `toggle` | `<details>` | Estado open mudou |
| `close` | `<dialog>` | Dialog fechado |
| `cancel` | `<dialog>` | Esc pressionado (pode prevenir) |
| `beforetoggle` | `<dialog>`, `popover` | Antes de abrir/fechar |
| `load` | `<img>`, `<script>`, `<link>` | Recurso carregado |
| `error` | `<img>`, `<script>`, `<link>` | Erro no carregamento |
| `animationstart/end` | Qualquer | CSS animation events |

### Web Components APIs
```javascript
// Custom Elements
class MyElement extends HTMLElement {
  constructor() { super(); }          // 1. Constructor
  connectedCallback() {}               // 2. Inserido no DOM
  disconnectedCallback() {}            // 3. Removido do DOM
  adoptedCallback() {}                 // 4. Movido para novo documento
  attributeChangedCallback(name, old, new) {} // 5. Atributo mudou
  static get observedAttributes() { return ['attr1']; }
}
customElements.define('my-element', MyElement);

// Shadow DOM
const shadow = element.attachShadow({ mode: 'open' }); // ou 'closed'
shadow.innerHTML = `<slot></slot>`;

// Templates
const template = document.getElementById('tmpl');
const clone = template.content.cloneNode(true);
document.body.appendChild(clone);
```

### Data Attributes
```html
<div id="user" data-user-id="42" data-role="admin">João</div>
<script>
  const user = document.getElementById('user');
  user.dataset.userId;    // "42"
  user.dataset.role;      // "admin"
  user.dataset.userId = 99; // define
</script>
```

## 3. HTML ↔ ARIA

### Implicit ARIA Roles

Cada elemento HTML tem um ARIA role implícito:

| Elemento HTML | ARIA Role Implícito |
|---------------|---------------------|
| `<header>` | `banner` (se top-level) |
| `<nav>` | `navigation` |
| `<main>` | `main` |
| `<aside>` | `complementary` |
| `<section>` | `region` (se nomeado) |
| `<article>` | `article` |
| `<footer>` | `contentinfo` (se top-level) |
| `<search>` | `search` |
| `<form>` | `form` (se nomeado) |
| `<button>` | `button` |
| `<a href>` | `link` |
| `<h1>`-`<h6>` | `heading` + nível |
| `<img alt>` | `img` |
| `<img alt="">` | `presentation` |
| `<table>` | `table` |
| `<ul>` / `<ol>` | `list` |
| `<li>` | `listitem` |
| `<input type="text">` | `textbox` |
| `<input type="checkbox">` | `checkbox` |
| `<input type="radio">` | `radio` |
| `<input type="range">` | `slider` |
| `<select>` | `combobox` ou `listbox` |
| `<textarea>` | `textbox` |
| `<dialog>` | `dialog` |
| `<details>` | `group` |
| `<summary>` | `button` |
| `<progress>` | `progressbar` |
| `<meter>` | `meter` |
| `<output>` | `status` |
| `<nav>` | `navigation` |
| `<blockquote>` | `blockquote` |
| `<figure>` | `figure` |
| `<figcaption>` | `caption` |
| `<fieldset>` | `group` |
| `<legend>` | `caption` |
| `<hr>` | `separator` |
| `<img usemap>` | `img` + `hasPopup` |

### Primeira Regra do ARIA
**Não use ARIA se um elemento HTML nativo já provê a semântica necessária.**

```html
<!-- EVITAR: ARIA redundante -->
<div role="navigation">...</div>
<button role="button">OK</button>

<!-- USAR: HTML nativo -->
<nav>...</nav>
<button>OK</button>
```

### Quando ARIA é necessário
1. Widgets complexos sem equivalente HTML (tabs, tree, menu, combobox)
2. Atualizações dinâmicas (live regions, alerts)
3. Quando HTML nativo não expõe estado necessário (aria-expanded)
4. Fallback quando label visual não é possível (aria-label)

### Regras ARIA Importantes
- ARIA **não muda** a aparência visual, apenas a árvore de acessibilidade
- ARIA **não adiciona** comportamento de teclado (precisa JavaScript)
- Não sobrescrever roles implícitas sem necessidade
- `role="presentation"` ou `role="none"` remove semântica do elemento
- `aria-*` attributes só funcionam quando combinados com role apropriado
- Use `role="alert"` para mensagens de erro importantes
- Use `aria-live` regions para conteúdo que atualiza sem recarregar página

## 4. Fluxo de Renderização

```
HTML (DOM)
  │
  ▼
  +  CSS (CSSOM)
  │
  ▼
Render Tree (DOM + CSSOM + Acessibility Tree)
  │
  ▼
Layout (Box Model)
  │
  ▼
Paint (Pixels)
```

A Acessibility Tree é construída paralelamente ao Render Tree, combinando DOM + ARIA attributes.

## 5. Resumo das Interdependências

| Tecnologia | Papel | Depende de HTML para |
|------------|-------|---------------------|
| **CSS** | Apresentação visual | Estrutura DOM, classes, atributos, estados |
| **JavaScript** | Comportamento dinâmico | DOM API, eventos, formulários, Web Components |
| **ARIA** | Semântica acessível | Roles implícitos, estados, relacionamentos |
| **HTML** | Estrutura e significado | — (base de tudo) |
