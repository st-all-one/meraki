# Exemplo Moderno de Implementação Acessível

## Sobre Este Documento

Implementação completa de uma aplicação web moderna seguindo **todas** as boas práticas do guia de acessibilidade, cobrindo HTML semântico, ARIA, teclado, contraste, formulários, `inert`, live regions, Shadow DOM, SVG, preferências do SO, e testes.

---

## 1. Estrutura HTML Semântica (Landmarks + Skip Link)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minha Loja — Produtos em Destaque</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Pular para conteúdo principal</a>

  <header>
    <a href="/" aria-label="Página inicial" class="logo">
      <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="currentColor"/>
      </svg>
      <span>Minha Loja</span>
    </a>
    <nav aria-label="Principal">
      <ul>
        <li><a href="/" aria-current="page">Home</a></li>
        <li><a href="/produtos">Produtos</a></li>
        <li><a href="/contato">Contato</a></li>
      </ul>
    </nav>
    <button aria-label="Abrir carrinho" id="cart-toggle" aria-expanded="false" aria-controls="cart-drawer">
      <svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24">
        <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14H19v-2H7.42l.94-2H17l3-6H5.21L4.27 2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
      <span class="cart-count" aria-live="polite" aria-atomic="true">0</span>
    </button>
  </header>

  <main id="main-content">
    <h1>Produtos em Destaque</h1>

    <section aria-labelledby="filter-heading">
      <h2 id="filter-heading" class="sr-only">Filtros</h2>
      <form id="filter-form" novalidate>
        <fieldset>
          <legend>Categoria</legend>
          <label>
            <input type="checkbox" name="categoria" value="eletronicos" autocomplete="off"> Eletrônicos
          </label>
          <label>
            <input type="checkbox" name="categoria" value="vestuario" autocomplete="off"> Vestuário
          </label>
        </fieldset>
        <fieldset>
          <legend>Preço</legend>
          <label for="price-min">Mínimo</label>
          <input type="number" id="price-min" name="price-min" min="0" step="10" value="0" inputmode="numeric">
          <label for="price-max">Máximo</label>
          <input type="number" id="price-max" name="price-max" min="0" step="10" value="1000" inputmode="numeric">
        </fieldset>
        <button type="submit">Filtrar</button>
      </form>
    </section>

    <section aria-labelledby="products-heading">
      <h2 id="products-heading" class="sr-only">Lista de produtos</h2>
      <div id="product-grid" role="list" aria-live="polite" aria-atomic="true" aria-label="Produtos disponíveis">
        <!-- produtos inseridos via JS -->
      </div>
    </section>

    <nav aria-label="Paginação">
      <ul role="list">
        <li><a href="?page=1" aria-label="Página 1" aria-current="page">1</a></li>
        <li><a href="?page=2" aria-label="Página 2">2</a></li>
        <li><a href="?page=3" aria-label="Página 3">3</a></li>
      </ul>
    </nav>
  </main>

  <aside id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" inert>
    <h2 id="cart-title">Carrinho</h2>
    <button id="cart-close" aria-label="Fechar carrinho">&times;</button>
    <div role="region" aria-label="Itens no carrinho" aria-live="polite" id="cart-items">
      <p>Carrinho vazio</p>
    </div>
    <button id="checkout-btn">Finalizar compra</button>
  </aside>

  <footer>
    <p>&copy; 2025 Minha Loja. Todos os direitos reservados.</p>
  </footer>

  <div id="toast-container" aria-live="polite" aria-atomic="true"></div>

  <script type="module" src="app.js"></script>
</body>
</html>
```

---

## 2. CSS com Acessibilidade, Modos e Preferências do SO

```css
/* ============================================
   CSS Custom Properties (Tema Base)
   ============================================ */
:root {
  --color-text: #1a1a1a;
  --color-bg: #ffffff;
  --color-primary: #0055cc;
  --color-primary-hover: #003d99;
  --color-border: #ccc;
  --color-error: #cc0000;
  --color-success: #008000;
  --color-focus: #0055cc;
  --font-base: 1rem;
  --spacing-unit: 8px;
  --target-min: 44px;
}

/* ============================================
   Tema Escuro
   ============================================ */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #e0e0e0;
    --color-bg: #121212;
    --color-primary: #8ab4f8;
    --color-primary-hover: #a8c8fa;
    --color-border: #444;
    --color-error: #ff6b6b;
    --color-success: #69db7c;
    --color-focus: #8ab4f8;
  }
}

/* ============================================
   Alto Contraste
   ============================================ */
@media (prefers-contrast: more) {
  :root {
    --color-text: #000;
    --color-bg: #fff;
    --color-primary: #0000cc;
    --color-border: #000;
    --color-error: #cc0000;
    --color-success: #006600;
  }
}

@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root {
    --color-text: #fff;
    --color-bg: #000;
    --color-primary: #6699ff;
    --color-border: #fff;
  }
}

/* ============================================
   Cores Forçadas (Windows High Contrast)
   ============================================ */
@media (forced-colors: active) {
  :root {
    --color-text: CanvasText;
    --color-bg: Canvas;
    --color-primary: LinkText;
    --color-border: ButtonText;
    --color-error: CanvasText;
    --color-focus: Highlight;
  }

  *:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  .card, button, input, select, textarea {
    border: 1px solid ButtonText;
    background: Canvas;
    color: CanvasText;
  }

  .card {
    forced-color-adjust: none;
  }
}

/* ============================================
   Movimento Reduzido
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .card:hover {
    transform: none;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: none;
  }
}

/* ============================================
   Skip Link
   ============================================ */
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--spacing-unit);
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
  background: var(--color-primary);
  color: var(--color-bg);
  z-index: 1000;
  font-weight: 600;
}

.skip-link:focus {
  top: var(--spacing-unit);
}

/* ============================================
   Foco Visível
   ============================================ */
*:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

/* ============================================
   Screen Reader Only
   ============================================ */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ============================================
   Layout Base
   ============================================ */
body {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: var(--font-base);
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-bg);
  margin: 0;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--spacing-unit) * 2);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-unit);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.25rem;
}

nav ul {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
  list-style: none;
  padding: 0;
}

nav a {
  color: var(--color-primary);
  text-decoration: underline;
  padding: var(--spacing-unit);
  min-height: var(--target-min);
  display: inline-flex;
  align-items: center;
}

nav a[aria-current="page"] {
  font-weight: 700;
  text-decoration: none;
}

/* ============================================
   Botões
   ============================================ */
button {
  min-height: var(--target-min);
  min-width: var(--target-min);
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
  cursor: pointer;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-bg);
  font-size: var(--font-base);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-unit);
}

button:hover {
  background: var(--color-primary-hover);
}

/* ============================================
   Product Grid
   ============================================ */
#product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: calc(var(--spacing-unit) * 2);
  margin: calc(var(--spacing-unit) * 2) 0;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: calc(var(--spacing-unit) * 2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 var(--spacing-unit);
  font-size: 1.125rem;
}

.card .price {
  font-weight: 700;
  color: var(--color-primary);
  margin: var(--spacing-unit) 0;
}

/* ============================================
   Formulários
   ============================================ */
fieldset {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

legend {
  font-weight: 600;
  padding: 0 var(--spacing-unit);
}

label {
  display: block;
  margin-bottom: var(--spacing-unit);
  font-weight: 500;
}

input, select, textarea {
  font-size: var(--font-base);
  padding: var(--spacing-unit);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text);
  min-height: var(--target-min);
}

input[aria-invalid="true"] {
  border-color: var(--color-error);
  border-width: 2px;
}

.error-message {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 4px;
}

/* ============================================
   Carrinho (Dialog)
   ============================================ */
#cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 360px;
  height: 100%;
  background: var(--color-bg);
  border-left: 1px solid var(--color-border);
  padding: calc(var(--spacing-unit) * 2);
  display: flex;
  flex-direction: column;
  z-index: 500;
}

#cart-drawer[inert] {
  display: none;
}
```

---

## 3. JavaScript Modular com Acessibilidade

```javascript
// app.js — Módulo principal de acessibilidade

/* ============================================
   CONSTANTES
   ============================================ */
const SELECTORS = {
  skipLink: '.skip-link',
  productGrid: '#product-grid',
  cartToggle: '#cart-toggle',
  cartDrawer: '#cart-drawer',
  cartClose: '#cart-close',
  cartItems: '#cart-items',
  cartCount: '.cart-count',
  filterForm: '#filter-form',
  toastContainer: '#toast-container',
}

const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
}

/* ============================================
   ESTADO GLOBAL
   ============================================ */
let previousFocus = null

/* ============================================
   UTILITÁRIOS
   ============================================ */
function qs(sel, ctx = document) { return ctx.querySelector(sel) }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)] }

function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') el.className = v
    else if (k.startsWith('data')) el.dataset[k.slice(5).toLowerCase()] = v
    else el.setAttribute(k, v)
  }
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return el
}

function announce(message, priority = 'polite') {
  const container = qs(SELECTORS.toastContainer)
  const toast = createElement('div', { role: 'status', 'aria-live': priority })
  toast.textContent = message
  container.append(toast)
  setTimeout(() => toast.remove(), 6000)
}

/* ============================================
   PRODUTOS — DADOS MOCK
   ============================================ */
const products = [
  { id: 1, name: 'Notebook Pro', category: 'eletronicos', price: 4999 },
  { id: 2, name: 'Mouse Wireless', category: 'eletronicos', price: 199 },
  { id: 3, name: 'Camiseta Algodão', category: 'vestuario', price: 89 },
  { id: 4, name: 'Teclado Mecânico', category: 'eletronicos', price: 349 },
  { id: 5, name: 'Calça Jeans', category: 'vestuario', price: 199 },
  { id: 6, name: 'Fone Bluetooth', category: 'eletronicos', price: 299 },
]

let cart = []
let filteredProducts = [...products]

/* ============================================
   RENDER: GRADE DE PRODUTOS
   ============================================ */
function renderProducts(list) {
  const grid = qs(SELECTORS.productGrid)
  const previousCount = grid.childElementCount

  grid.innerHTML = ''

  if (list.length === 0) {
    grid.append(createElement('p', {}, ['Nenhum produto encontrado.']))
    return
  }

  for (const product of list) {
    const card = createElement('div', {
      role: 'listitem',
      className: 'card',
    }, [
      createElement('h3', {}, [product.name]),
      createElement('p', { className: 'price' }, [
        `R$ ${product.price.toFixed(2)}`,
      ]),
      createElement('button', {
        'data-product-id': product.id,
        'aria-label': `Adicionar ${product.name} ao carrinho`,
        className: 'add-to-cart',
      }, ['Adicionar ao carrinho']),
    ])
    grid.append(card)
  }

  // Só anuncia se o conteúdo mudou
  if (previousCount > 0 || list.length > 0) {
    announce(`${list.length} produto${list.length !== 1 ? 's' : ''} encontrado${list.length !== 1 ? 's' : ''}`)
  }
}

/* ============================================
   CARRINHO — DRAWER COM FOCUS TRAP + inert
   ============================================ */
function openCart() {
  const drawer = qs(SELECTORS.cartDrawer)
  const toggle = qs(SELECTORS.cartToggle)

  previousFocus = document.activeElement

  // Remove inert para tornar interativo
  drawer.removeAttribute('inert')
  drawer.setAttribute('aria-modal', 'true')
  toggle.setAttribute('aria-expanded', 'true')

  renderCartItems()

  // Focus trap: foca no título ou primeiro botão
  const firstFocusable = qs('button, input, a, [tabindex]:not([tabindex="-1"])', drawer)
  if (firstFocusable) firstFocusable.focus()
}

function closeCart() {
  const drawer = qs(SELECTORS.cartDrawer)
  const toggle = qs(SELECTORS.cartToggle)

  drawer.setAttribute('inert', '')
  drawer.removeAttribute('aria-modal')
  toggle.setAttribute('aria-expanded', 'false')

  // Restaura foco
  if (previousFocus && document.contains(previousFocus)) {
    previousFocus.focus()
  }
}

function renderCartItems() {
  const container = qs(SELECTORS.cartItems)

  if (cart.length === 0) {
    container.innerHTML = '<p>Carrinho vazio</p>'
    return
  }

  const list = createElement('ul', { role: 'list', 'aria-label': 'Itens no carrinho' })

  for (const item of cart) {
    const li = createElement('li', {}, [
      document.createTextNode(`${item.name} — R$ ${item.price.toFixed(2)}`),
      createElement('button', {
        'data-product-id': item.id,
        'aria-label': `Remover ${item.name} do carrinho`,
        className: 'remove-from-cart',
      }, ['Remover']),
    ])
    list.append(li)
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0)
  container.innerHTML = ''
  container.append(list)
  container.append(createElement('p', { className: 'cart-total' }, [
    `Total: R$ ${total.toFixed(2)}`,
  ]))
}

function updateCartCount() {
  const el = qs(SELECTORS.cartCount)
  el.textContent = cart.length
}

/* ============================================
   TOAST / NOTIFICAÇÃO
   ============================================ */
function showToast(message, type = 'success') {
  const container = qs(SELECTORS.toastContainer)
  const toast = createElement('div', {
    role: 'status',
    className: `toast toast-${type}`,
  }, [message])
  container.append(toast)
  setTimeout(() => {
    toast.remove()
  }, 4000)
}

/* ============================================
   EVENT LISTENERS
   ============================================ */

// Filtro de produtos
qs(SELECTORS.filterForm).addEventListener('submit', (e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  const selectedCategories = formData.getAll('categoria')
  const minPrice = Number(formData.get('price-min')) || 0
  const maxPrice = Number(formData.get('price-max')) || Infinity

  filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategories.length === 0
      || selectedCategories.includes(p.category)
    const matchesPrice = p.price >= minPrice && p.price <= maxPrice
    return matchesCategory && matchesPrice
  })

  renderProducts(filteredProducts)
})

// Abrir/fechar carrinho
qs(SELECTORS.cartToggle).addEventListener('click', () => {
  const drawer = qs(SELECTORS.cartDrawer)
  const isOpen = !drawer.hasAttribute('inert')
  if (isOpen) closeCart()
  else openCart()
})

qs(SELECTORS.cartClose).addEventListener('click', closeCart)

// Fechar carrinho com Escape
qs(SELECTORS.cartDrawer).addEventListener('keydown', (e) => {
  if (e.key === KEYS.ESCAPE) {
    closeCart()
  }
})

// Focus trap no carrinho
qs(SELECTORS.cartDrawer).addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return

  const focusable = qsa(
    'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    qs(SELECTORS.cartDrawer)
  )
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
})

// Adicionar ao carrinho (delegação)
qs(SELECTORS.productGrid).addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart')
  if (!btn) return

  const productId = Number(btn.dataset.productId)
  const product = products.find((p) => p.id === productId)
  if (!product) return

  cart.push(product)
  updateCartCount()
  announce(`${product.name} adicionado ao carrinho`)
  showToast(`${product.name} adicionado ao carrinho!`)
})

// Remover do carrinho (delegação)
qs(SELECTORS.cartItems).addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-from-cart')
  if (!btn) return

  const productId = Number(btn.dataset.productId)
  const index = cart.findIndex((item) => item.id === productId)
  if (index === -1) return

  const removed = cart.splice(index, 1)[0]
  updateCartCount()
  renderCartItems()
  announce(`${removed.name} removido do carrinho`)
  showToast(`${removed.name} removido do carrinho!`, 'info')
})

// Keyboard support para add-to-cart
qs(SELECTORS.productGrid).addEventListener('keydown', (e) => {
  if (e.key !== KEYS.ENTER && e.key !== KEYS.SPACE) return
  const btn = e.target.closest('.add-to-cart')
  if (!btn) return
  e.preventDefault()
  btn.click()
})

/* ============================================
   INICIALIZAÇÃO
   ============================================ */
renderProducts(filteredProducts)
updateCartCount()

// Garante que o carrinho comece fechado
qs(SELECTORS.cartDrawer).setAttribute('inert', '')
```

---

## 4. Web Component Acessível (Shadow DOM + delegatesFocus)

```javascript
// components/product-card.js

const template = document.createElement('template')
template.innerHTML = `
  <style>
    :host {
      display: block;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 8px;
      padding: 16px;
      font-family: system-ui, sans-serif;
    }

    :host(:focus-within) {
      outline: 2px solid var(--color-focus, #0055cc);
      outline-offset: 2px;
    }

    h3 {
      margin: 0 0 8px;
      font-size: 1.125rem;
    }

    .price {
      font-weight: 700;
      color: var(--color-primary, #0055cc);
      margin: 8px 0;
    }

    button {
      min-height: 44px;
      min-width: 44px;
      padding: 8px 16px;
      cursor: pointer;
      border: 1px solid var(--color-primary, #0055cc);
      background: var(--color-primary, #0055cc);
      color: white;
      font-size: 1rem;
      border-radius: 4px;
    }

    button:hover {
      opacity: 0.9;
    }

    @media (forced-colors: active) {
      :host {
        border: 1px solid ButtonText;
        background: Canvas;
        color: CanvasText;
      }
      button {
        border: 1px solid ButtonText;
        background: ButtonFace;
        color: ButtonText;
      }
    }
  </style>
  <h3><slot name="name"></slot></h3>
  <p class="price"><slot name="price"></slot></p>
  <button part="add-button"><slot name="action">Adicionar</slot></button>
`

class ProductCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open', delegatesFocus: true })
    this.shadowRoot.append(template.content.cloneNode(true))
  }

  static get observedAttributes() {
    return ['aria-label', 'disabled']
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'disabled') {
      const btn = this.shadowRoot.querySelector('button')
      btn.disabled = newVal !== null
      btn.setAttribute('aria-disabled', newVal !== null)
    }
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }

  set disabled(val) {
    if (val) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
  }
}

customElements.define('product-card', ProductCard)
```

Uso no HTML:

```html
<product-card aria-label="Notebook Pro — R$ 4.999">
  <span slot="name">Notebook Pro</span>
  <span slot="price">R$ 4.999,00</span>
  <span slot="action">Comprar</span>
</product-card>
```

---

## 5. Formulário com Validação Acessível

```javascript
// Validation patterns reutilizáveis
const VALIDATORS = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  required: (v) => v.trim().length > 0,
  minLength: (min) => (v) => v.trim().length >= min,
  pattern: (re) => (v) => re.test(v),
}

function validateField(input) {
  const field = input.closest('.field') || input
  const errorEl = field.querySelector('.error-message')
    || field.querySelector(`[id="${input.getAttribute('aria-errormessage')}"]`)
    || document.getElementById(input.getAttribute('aria-errormessage'))

  let valid = true
  let message = ''

  if (input.required && !VALIDATORS.required(input.value)) {
    valid = false
    message = 'Este campo é obrigatório.'
  } else if (input.type === 'email' && input.value && !VALIDATORS.email(input.value)) {
    valid = false
    message = 'Informe um e-mail válido.'
  }

  input.setAttribute('aria-invalid', String(!valid))
  if (errorEl) {
    errorEl.textContent = message
    errorEl.hidden = valid
  }

  return valid
}

function validateForm(form) {
  const inputs = qsa('input[required], input[type="email"], [aria-invalid]', form)
  let firstInvalid = null
  let isValid = true

  for (const input of inputs) {
    if (!validateField(input)) {
      isValid = false
      if (!firstInvalid) firstInvalid = input
    }
  }

  if (!isValid) {
    // Foca no primeiro erro
    firstInvalid.focus()

    // Anuncia resumo de erros
    const summary = form.querySelector('[role="alert"]')
    if (summary) {
      summary.focus()
      announce('Erros encontrados no formulário. Corrija os campos destacados.')
    }
  }

  return isValid
}

// Validação em tempo real
document.addEventListener('blur', (e) => {
  const input = e.target.closest('input, select, textarea')
  if (input && input.form && input.form.id === 'filter-form') {
    validateField(input)
  }
}, true)
```

---

## 6. Testes de Acessibilidade (CI + Unitários)

```javascript
// product-card.test.js — Teste com jest-axe
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('ProductCard não tem violações de a11y', async () => {
  const { container } = render(
    `<product-card aria-label="Mouse — R$ 199">
      <span slot="name">Mouse</span>
      <span slot="price">R$ 199,00</span>
    </product-card>`
  )
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

```javascript
// cypress/e2e/a11y.cy.js — Teste E2E
describe('Acessibilidade da Loja', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.injectAxe()
  })

  it('Homepage sem violações críticas', () => {
    cy.checkA11y(null, { includedImpacts: ['critical'] })
  })

  it('Skip link leva ao main', () => {
    cy.get('a.skip-link').focus()
    cy.realPress('Enter')
    cy.focused().should('have.id', 'main-content')
  })

  it('Carrinho gerencia foco corretamente', () => {
    cy.get('#cart-toggle').click()
    cy.focused().should('be.within', '#cart-drawer')
    cy.realPress('Escape')
    cy.focused().should('have.id', 'cart-toggle')
  })

  it('Filtro anuncia resultados', () => {
    cy.get('#filter-form button[type="submit"]').click()
    cy.get('#product-grid').should('contain', '6 produtos encontrados')
  })

  it('Teclado navega pelos produtos', () => {
    cy.get('.add-to-cart').first().focus()
    cy.realPress('Enter')
    cy.get('.cart-count').should('contain', '1')
  })
})
```

---

## 7. Pipeline CI de Acessibilidade

```yaml
# .github/workflows/a11y.yml
name: Acessibilidade
on: [pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci

      - name: Lint a11y
        run: npx eslint --plugin jsx-a11y src/

      - name: Testes unitários com axe
        run: npx jest --coverage --testMatch "**/*.a11y.test.js"

      - name: Build
        run: npm run build

      - name: Start server
        run: npm run start & npx wait-on http://localhost:3000

      - name: Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_TOKEN: ${{ secrets.LHCI_GITHUB_TOKEN }}

      - name: Pa11y CI
        run: npx pa11y-ci

      - name: Cypress a11y
        run: npx cypress run --spec "cypress/e2e/a11y/**"
```

---

## 8. Checklist Integrado (Todas as Boas Práticas)

### HTML Semântico
- [ ] `<main>` único por página
- [ ] `<nav>`, `<header>`, `<footer>`, `<aside>`, `<section>` com labels
- [ ] Headings hierárquicos (`h1`→`h2`→`h3`)
- [ ] Skip link presente e funcional
- [ ] `lang="pt-BR"` no `<html>`
- [ ] `<title>` descritivo por página

### ARIA
- [ ] `aria-label`/`aria-labelledby` em landmarks sem heading
- [ ] `aria-expanded` + `aria-controls` em toggles
- [ ] `aria-modal="true"` + `inert` em dialogs
- [ ] `aria-live="polite"` em regiões dinâmicas
- [ ] `aria-atomic="true"` quando contexto completo é necessário
- [ ] `aria-invalid` + `aria-errormessage` em campos com erro
- [ ] `role="list"` + `role="listitem"` quando `display` quebra semântica

### Teclado
- [ ] Todos os widgets operáveis por teclado
- [ ] Roving tabindex em widgets compostos
- [ ] Focus trap em modais
- [ ] Foco retorna ao elemento de origem ao fechar
- [ ] `tabindex` positivo nunca usado
- [ ] `:focus-visible` visível em todos os elementos

### Cor e Contraste
- [ ] Texto normal ≥ 4.5:1
- [ ] Texto grande ≥ 3:1
- [ ] UI components ≥ 3:1
- [ ] Informação não transmitida só por cor
- [ ] Modo escuro testado
- [ ] `prefers-contrast: more` implementado
- [ ] `forced-colors: active` testado (WHCM)

### Preferências do SO
- [ ] `prefers-reduced-motion: reduce`
- [ ] `prefers-reduced-transparency: reduce`
- [ ] `prefers-color-scheme: dark`
- [ ] `prefers-contrast: more`

### Formulários
- [ ] Todo input tem `<label>` explícito
- [ ] `fieldset` + `legend` para grupos
- [ ] `aria-describedby` para instruções
- [ ] `autocomplete` em campos comuns
- [ ] Mensagens de erro com `role="alert"`
- [ ] Validação em tempo real com `aria-invalid`

### Multimedia
- [ ] `alt` descritivo em imagens informativas
- [ ] `alt=""` em imagens decorativas
- [ ] SVG inline: `role="img"` + `<title>` ou `aria-label`
- [ ] SVG decorativo: `aria-hidden="true"` + `focusable="false"`
- [ ] Canvas com fallback textual e `aria-label`

### Web Components
- [ ] `delegatesFocus: true` em interactive widgets
- [ ] Atributos ARIA encaminhados do host para o shadow
- [ ] Slots preservam semântica do conteúdo projetado
- [ ] `part` exportado para estilização externa

### Testes
- [ ] eslint-plugin-jsx-a11y no pipeline
- [ ] jest-axe em componentes
- [ ] cypress-axe nos fluxos críticos
- [ ] Lighthouse CI com score ≥ 90
- [ ] Pa11y CI com WCAG2AA
- [ ] Teste manual com NVDA + Chrome
- [ ] Teste manual com VoiceOver + Safari
- [ ] Teste manual com TalkBack + Android
- [ ] Teste com zoom 400%
- [ ] Teste apenas com teclado
- [ ] Teste com WHCM ativo
- [ ] Teste com `prefers-reduced-motion: reduce`

---

## 9. Referências

| Recurso | Link |
|---------|------|
| WCAG 2.2 Specification | https://www.w3.org/TR/WCAG22/ |
| WAI-ARIA Authoring Practices | https://www.w3.org/WAI/ARIA/apg/ |
| ARIA Spec | https://www.w3.org/TR/wai-aria-1.2/ |
| axe-core | https://github.com/dequelabs/axe-core |
| Radix UI (componentes acessíveis) | https://www.radix-ui.com/ |
| Headless UI | https://headlessui.com/ |
| MDN Accessibility | https://developer.mozilla.org/en-US/docs/Web/Accessibility |
| WebAIM Contrast Checker | https://webaim.org/resources/contrastchecker/ |
| WICG inert polyfill | https://github.com/WICG/inert |
