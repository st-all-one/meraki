# Padrões Modernos de HTML

## 1. Web Components

Três tecnologias trabalhando juntas:

### 1.1 Custom Elements
```javascript
class MyElement extends HTMLElement {
  constructor() { super(); }
  connectedCallback() { this.innerHTML = `<p>Hello World</p>`; }
}
customElements.define('my-element', MyElement);
```

### 1.2 Declarative Shadow DOM
```html
<my-element>
  <template shadowrootmode="open">
    <style>:host { display: block; color: red; }</style>
    <slot name="title"></slot>
    <p>Default content: <slot></slot></p>
  </template>
  <span slot="title">Título</span>
  Conteúdo principal
</my-element>
```

### 1.3 HTML Templates
```html
<template id="card-template">
  <div class="card">
    <slot name="title"></slot>
    <slot></slot>
  </div>
</template>
```

### 1.4 Slots
- `<slot name="xxx">` — named slot
- `<slot>` — default slot (sem nome)
- Atributo global `slot="xxx"` para associar elemento a um slot

### 1.5 Part & Exportparts
```html
<template shadowrootmode="open">
  <div part="container">...</div>
</template>
```
```css
/* De fora do shadow DOM */
my-element::part(container) { background: blue; }
```

## 2. Dialog API

### Modal Dialog
```html
<dialog id="modal">
  <form method="dialog">
    <p>Conteúdo do modal</p>
    <button value="cancel">Cancelar</button>
    <button value="confirm">Confirmar</button>
  </form>
</dialog>
<button command="show-modal" commandfor="modal">Abrir Modal</button>
```

**Métodos**: `showModal()` (modal), `show()` (não-modal), `close(returnValue)`

**Eventos**: `close`, `cancel` (Esc pressionado)

**Atributos**:
- `open` — estado visível
- `closedby="any | closerequest | none"` — controla fechamento
- `returnValue` — valor retornado

**CSS**: `::backdrop` (fundo escuro), `:modal` pseudo-classe

**Foco**: Automático no primeiro elemento focável ao abrir. Conteúdo fora do dialog fica inert automaticamente em `showModal()`.

### Invoker Commands (experimental)
```html
<button command="show-modal" commandfor="dialog-id">Abrir</button>
<button command="close" commandfor="dialog-id">Fechar</button>
```

## 3. Popover API (Atributo Global `popover`)

Controles de popover leves sem `<dialog>`.

### Valores
| Valor | Comportamento |
|-------|---------------|
| `popover="auto"` | Light-dismiss (clique fora fecha); fecha outros auto popovers |
| `popover="hint"` | Não fecha auto popovers; fecha outros hint popovers |
| `popover="manual"` | Sem light-dismiss; aberto/fechado explicitamente |

### Exemplo
```html
<button popovertarget="my-popover" popovertargetaction="toggle">Abrir</button>
<div id="my-popover" popover="auto">
  <p>Conteúdo do popover</p>
  <button popovertarget="my-popover" popovertargetaction="hide">Fechar</button>
</div>
```

**Ações**: `toggle`, `show`, `hide`

**CSS**: `:popover-open` pseudo-classe, `::backdrop` (apenas auto/hint)

**Ancoragem**: `anchor` global attribute + CSS `anchor()` function

## 4. Details/Summary (Disclosure Widget)

```html
<details name="accordion-group" open>
  <summary>Clique para expandir</summary>
  <p>Conteúdo oculto revelado.</p>
</details>
<details name="accordion-group">
  <summary>Segundo painel</summary>
  <p>Conteúdo do segundo painel.</p>
</details>
```

**Atributos**:
- `open` — estado expandido
- `name` — agrupa múltiplos `<details>` em accordion (apenas um abre por vez)

**Eventos**: `toggle`

**CSS**: `details[open]`, `details:open`, `::details-content`, `::marker`

## 5. Search Element

Container semântico para funcionalidade de busca/filtro. ARIA role implícita `search`.

```html
<search>
  <form action="/search">
    <label for="q">Buscar:</label>
    <input type="search" id="q" name="q" />
    <button type="submit">Ir</button>
  </form>
</search>
```

Substitui `role="search"` em `<form>`.

## 6. Formulários Modernos

### 6.1 Datalist (Autocomplete)
```html
<label for="browser">Escolha um browser:</label>
<input list="browsers" id="browser" name="browser" />
<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
  <option value="Edge">
  <option value="Safari">
</datalist>
```

### 6.2 Output (Resultado de Cálculo)
```html
<form oninput="r.value = parseInt(a.value) + parseInt(b.value)">
  <input type="range" id="a" value="50" /> +
  <input type="number" id="b" value="50" /> =
  <output name="r" for="a b">100</output>
</form>
```

### 6.3 Meter (Medidor)
```html
<meter min="0" max="100" low="30" high="70" optimum="80" value="65">
  65%
</meter>
```
Atributos: `value`, `min`, `max`, `low`, `high`, `optimum`, `form`

### 6.4 Progress (Progresso)
```html
<progress value="70" max="100">70%</progress>
<progress>Indeterminado...</progress> <!-- sem value = indeterminado -->
```

### 6.5 Contenteditable "plaintext-only"
```html
<div contenteditable="plaintext-only">
  Apenas texto puro, sem formatação.
</div>
```

### 6.6 Form Validation (Constraint Validation API)
```html
<form novalidate>
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required
         minlength="5" maxlength="100"
         pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
         oninvalid="this.setCustomValidity('Por favor insira um email válido')"
         oninput="this.setCustomValidity('')" />
  <span id="email-error" aria-live="polite"></span>
  <button type="submit">Enviar</button>
</form>
```

**Propriedades do `validity` object**: `valueMissing`, `typeMismatch`, `patternMismatch`, `tooLong`, `tooShort`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`, `customError`

**Métodos**: `checkValidity()`, `reportValidity()`, `setCustomValidity(msg)`

**CSS Pseudo-classes**: `:valid`, `:invalid`, `:user-invalid`, `:required`, `:optional`, `:in-range`, `:out-of-range`, `:placeholder-shown`, `:blank`

### 6.7 Autocomplete Tokens
```html
<input type="text" autocomplete="given-name" />
<input type="email" autocomplete="email" />
<input type="password" autocomplete="current-password" />
<input type="password" autocomplete="new-password" />
<input type="tel" autocomplete="tel" />
<input type="text" autocomplete="street-address" />
<input type="text" autocomplete="country" />
<input type="text" autocomplete="postal-code" />
<input type="text" autocomplete="cc-number" />
```

**Grupos**: `shipping`/`billing` — `autocomplete="shipping given-name"`

**WebAuthn**: `autocomplete="webauthn"` para passkeys

## 7. Responsive Images

### Resolution Switching (diferentes tamanhos)
```html
<img srcset="small.jpg 480w,
             medium.jpg 800w,
             large.jpg 1200w"
     sizes="(max-width: 600px) 480px,
            (max-width: 1000px) 800px,
            1200px"
     src="fallback.jpg"
     alt="Descrição" />
```

### Resolution Switching (diferentes densidades)
```html
<img srcset="1x.jpg,
             2x.jpg 2x,
             3x.jpg 3x"
     src="1x.jpg"
     alt="Descrição" />
```

### Art Direction (cortes diferentes)
```html
<picture>
  <source media="(max-width: 600px)" srcset="mobile-crop.jpg" />
  <source media="(max-width: 1000px)" srcset="tablet-crop.jpg" />
  <img src="desktop.jpg" alt="Descrição" />
</picture>
```

## 8. Script Loading Strategies

| Atributo | Comportamento | Uso |
|----------|--------------|-----|
| (nenhum) | Bloqueia parse, fetch + exec síncrono | Evitar |
| `async` | Fetch em paralelo, exec imediata (fora de ordem) | Analytics, ads |
| `defer` | Fetch em paralelo, exec após parse (em ordem) | Scripts que dependem do DOM |
| `type="module"` | Defer por padrão; suporta `import` | ES Modules modernos |

```html
<script defer src="app.js"></script>
<script async src="analytics.js"></script>
<script type="module" src="main.js"></script>
```

## 9. Microdata (Schema.org)

```html
<div itemscope itemtype="https://schema.org/Product">
  <h2 itemprop="name">Produto Exemplo</h2>
  <img itemprop="image" src="product.jpg" alt="Produto" />
  <p itemprop="description">Descrição do produto</p>
  <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
    <span itemprop="price">R$ 99,90</span>
    <meta itemprop="priceCurrency" content="BRL" />
  </div>
</div>
```

**Atributos globais**: `itemscope`, `itemtype`, `itemprop`, `itemid`, `itemref`

## 10. Microformats (mf2)

```html
<div class="h-card">
  <p class="p-name">João Silva</p>
  <p class="p-job-title">Engenheiro</p>
  <a class="u-url" href="https://exemplo.com">Site</a>
</div>
```

**Prefixos**: `h-*` (root), `p-*` (texto), `u-*` (URL), `dt-*` (data), `e-*` (HTML)

## 11. Data Attributes

```html
<div data-user-id="12345" data-role="admin" data-last-active="2025-01-01">
  João Silva
</div>
```
```javascript
// Acesso via dataset
element.dataset.userId   // "12345"
element.dataset.role     // "admin"
element.dataset.lastActive // "2025-01-01"
```

## 12. Lazy Loading

```html
<img src="image.jpg" loading="lazy" alt="..." />
<iframe src="embed.html" loading="lazy"></iframe>
```

**Valores**: `lazy` (carrega perto do viewport), `eager` (imediato, default)

## 13. Link Relations (Resource Hints)

```html
<link rel="preload" href="font.woff2" as="font" crossorigin />
<link rel="preload" href="hero.jpg" as="image" />
<link rel="prefetch" href="next-page.html" />
<link rel="preconnect" href="https://api.example.com" />
<link rel="dns-prefetch" href="https://cdn.example.com" />
<link rel="modulepreload" href="app.js" />
<link rel="stylesheet" href="styles.css" />
<link rel="icon" href="favicon.ico" sizes="any" />
<link rel="manifest" href="manifest.json" />
<link rel="canonical" href="https://exemplo.com/page" />
```
