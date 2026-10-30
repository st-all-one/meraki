# Web Components: CSS Moderno Aplicado

## Filosofia

Um Web Component bem construído é **auto-contido, temático, acessível e performático**. Este guia consolida todo o conhecimento do `css_guide/` em exemplos concretos de Web Components reutilizáveis.

## Princípios

1. **Shadow DOM para isolamento** — estilos não vazam, não colidem
2. **Custom properties para tema** — o usuário do componente controla aparência
3. **@property type-safe** — variáveis internas com tipos explícitos
4. **Subgrid para composição** — componente herda trilhas do grid pai
5. **Container queries** — componente se adapta ao contexto
6. **Acessibilidade nativa** — ARIA, foco, prefers-reduced-motion
7. **Performance por construção** — `contain`, `content-visibility`, `will-change` seletivo
8. **Interoperabilidade** — fallback progressivo, `@supports`

---

## Componente 1: <ui-card>

### HTML (Definição do Componente)

```javascript
class UICard extends HTMLElement {
  static observedAttributes = ["variant", "href"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const variant = this.getAttribute("variant") || "default";
    const href = this.getAttribute("href");
    const tag = href ? "a" : "article";

    this.shadowRoot.innerHTML = `
      <${tag}
        class="card"
        part="card"
        data-variant="${variant}"
        ${href ? `href="${href}"` : ""}
        ${!href ? 'tabindex="0" role="button"' : ""}
      >
        <slot name="media" part="media"></slot>
        <div class="card-body" part="body">
          <slot name="title" part="title"></slot>
          <slot name="description" part="description"></slot>
          <slot name="footer" part="footer"></slot>
        </div>
      </${tag}>
    `;
  }
}

customElements.define("ui-card", UICard);
```

### CSS (Construído com Subgrid)

```css
:host {
  --card-bg: var(--color-surface, oklch(98% 0.005 260));
  --card-text: var(--color-text, oklch(20% 0.03 260));
  --card-radius: var(--radius-md, 8px);
  --card-padding: var(--space-md, 16px);
  --card-shadow: 0 1px 3px oklch(0% 0 0 / 0.12);
  --card-border: 1px solid oklch(0% 0 0 / 0.08);
  --card-transition: 200ms ease;

  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
  gap: 0;
  contain: layout style;

  @supports not (grid-template-rows: subgrid) {
    grid-template-rows: auto 1fr auto;
    gap: 8px;
  }
}

.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: 1 / -1;
  gap: 0;
  background: var(--card-bg);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  border: var(--card-border);
  color: var(--card-text);
  text-decoration: none;
  cursor: default;
  scale: 1;
  transition: scale var(--card-transition), box-shadow var(--card-transition);

  @media (prefers-reduced-motion: no-preference) {
    &:hover {
      scale: 1.02;
      box-shadow: 0 4px 12px oklch(0% 0 0 / 0.15);
    }
  }

  @media print {
    box-shadow: none;
    border: 1px solid #ccc;
    break-inside: avoid;
  }
}

/* Link card */
.card[href] {
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-primary, oklch(50% 0.2 250));
    outline-offset: 2px;
  }

  @media print {
    &::after {
      content: " (" attr(href) ")";
      font-size: 0.8em;
      color: #666;
    }
  }
}

/* Selection dentro do card */
.card ::selection {
  background: var(--color-primary, oklch(50% 0.2 250));
  color: white;
}

/* Media slot */
::slotted([slot="media"]) {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--card-radius) var(--card-radius) 0 0;
  margin: calc(-1 * var(--card-padding));
  margin-bottom: 0;
  width: calc(100% + 2 * var(--card-padding));
  display: block;
}

/* Body area */
.card-body {
  display: grid;
  gap: 8px;
  align-content: start;
}

::slotted([slot="title"]) {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}

::slotted([slot="description"]) {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  color: color-mix(in oklch, var(--card-text) 70%, transparent);
}

::slotted([slot="footer"]) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding-block-start: 8px;
  border-block-start: 1px solid oklch(0% 0 0 / 0.08);
  margin-block-start: auto;
}
```

---

## Componente 2: <ui-dialog>

### HTML

```javascript
class UIDialog extends HTMLElement {
  static observedAttributes = ["open"];

  #dialog;
  #closeButton;
  #focusTrapped;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [dialogStyles];
  }

  connectedCallback() {
    this.render();
    this.#dialog = this.shadowRoot.querySelector("dialog");
    this.#closeButton = this.shadowRoot.querySelector(".close-btn");

    this.#closeButton.addEventListener("click", () => this.close());
    this.#dialog.addEventListener("click", (e) => {
      if (e.target === this.#dialog) this.close();
    });
    this.#dialog.addEventListener("close", () => {
      this.removeAttribute("open");
    });
    this.#dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.close();
    });
  }

  open() {
    this.#dialog.showModal();
    this.setAttribute("open", "");
    this.#trapFocus();
  }

  close() {
    this.#dialog.close();
    this.removeAttribute("open");
    this.#releaseFocus();
  }

  #trapFocus() {
    this.#focusTrapped = true;
    this.#dialog.querySelector('[autofocus]')?.focus()
      ?? this.#closeButton.focus();
  }

  #releaseFocus() {
    this.#focusTrapped = false;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <dialog part="dialog" aria-labelledby="dialog-title">
        <div class="header" part="header">
          <slot name="title" part="title">
            <span class="default-title" id="dialog-title">Dialog</span>
          </slot>
          <button class="close-btn" part="close-button"
                  aria-label="Fechar dialog">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                 aria-hidden="true">
              <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="body" part="body">
          <slot></slot>
        </div>
        <div class="footer" part="footer">
          <slot name="actions"></slot>
        </div>
      </dialog>
    `;
  }
}

customElements.define("ui-dialog", UIDialog);
```

### CSS (Com @starting-style + allow-discrete)

```css
:host {
  --dialog-bg: var(--color-surface, oklch(98% 0.005 260));
  --dialog-text: var(--color-text, oklch(20% 0.03 260));
  --dialog-radius: var(--radius-lg, 12px);
  --dialog-shadow: 0 8px 32px oklch(0% 0 0 / 0.15);
  --dialog-max-width: min(90vw, 540px);
  --dialog-overlay: oklch(0% 0 0 / 0.4);
}

dialog {
  all: revert;
  border: none;
  border-radius: var(--dialog-radius);
  padding: 0;
  max-width: var(--dialog-max-width);
  width: 100%;
  background: var(--dialog-bg);
  color: var(--dialog-text);
  box-shadow: var(--dialog-shadow);

  opacity: 0;
  transform: translateY(16px) scale(0.97);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    overlay 0.25s allow-discrete,
    display 0.25s allow-discrete;

  &[open] {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  @starting-style {
    &[open] {
      opacity: 0;
      transform: translateY(16px) scale(0.97);
    }
  }

  @media print {
    box-shadow: none;
    border: 1px solid #ccc;
    position: static;
    opacity: 1;
    transform: none;
  }
}

dialog::backdrop {
  background: var(--dialog-overlay);
  backdrop-filter: blur(4px);
  transition: background 0.25s;

  @starting-style {
    background: oklch(0% 0 0 / 0);
  }

  @media print {
    background: none;
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  dialog, dialog::backdrop {
    transition: none;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

::slotted([slot="title"]) {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: inherit;
  transition: background 0.2s;

  &:hover {
    background: oklch(0% 0 0 / 0.08);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary, oklch(50% 0.2 250));
    outline-offset: 2px;
  }
}

.body {
  padding: 16px 24px;
  line-height: 1.6;
}

.footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 24px 20px;
}
```

---

## Componente 3: <ui-split-panel>

### HTML (com subgrid real + @supports selector)

```javascript
class UISplitPanel extends HTMLElement {
  static observedAttributes = ["split", "min-primary", "min-secondary", "orientation"];

  #isDragging = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [splitStyles];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const split = this.getAttribute("split") || "30";
    const minPrimary = this.getAttribute("min-primary") || "200px";
    const minSecondary = this.getAttribute("min-secondary") || "150px";
    const orientation = this.getAttribute("orientation") || "horizontal";

    this.shadowRoot.innerHTML = `
      <div class="split" part="split"
           data-orientation="${orientation}"
           style="--split: ${split}%; --min-primary: ${minPrimary}; --min-secondary: ${minSecondary}">
        <div class="primary" part="primary">
          <slot name="primary"></slot>
        </div>
        <div class="divider" part="divider"
             role="separator" tabindex="0"
             aria-label="Redimensionar painel"
             aria-valuenow="${split}"
             aria-valuemin="20"
             aria-valuemax="80">
          <div class="handle" aria-hidden="true"></div>
        </div>
        <div class="secondary" part="secondary">
          <slot name="secondary"></slot>
        </div>
      </div>
    `;

    this.#attachDragListeners();
  }

  #attachDragListeners() {
    const divider = this.shadowRoot.querySelector(".divider");

    divider.addEventListener("mousedown", () => this.#isDragging = true);
    divider.addEventListener("touchstart", () => this.#isDragging = true, { passive: true });

    const onEnd = () => { this.#isDragging = false; };

    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);

    document.addEventListener("mousemove", (e) => {
      if (!this.#isDragging) return;
      this.#updateSplit(e.clientX, e.clientY);
    });

    document.addEventListener("touchmove", (e) => {
      if (!this.#isDragging) return;
      this.#updateSplit(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    divider.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 5 : 1;
      const orientation = this.getAttribute("orientation") || "horizontal";
      if (orientation === "horizontal") {
        if (e.key === "ArrowRight") this.#adjustSplit(step);
        if (e.key === "ArrowLeft") this.#adjustSplit(-step);
      } else {
        if (e.key === "ArrowDown") this.#adjustSplit(step);
        if (e.key === "ArrowUp") this.#adjustSplit(-step);
      }
    });
  }

  #updateSplit(clientX, clientY) {
    const rect = this.getBoundingClientRect();
    const orientation = this.getAttribute("orientation") || "horizontal";
    const pos = orientation === "horizontal" ? clientX : clientY;
    const total = orientation === "horizontal" ? rect.width : rect.height;
    const pct = ((pos - (orientation === "horizontal" ? rect.left : rect.top)) / total) * 100;
    const clamped = Math.min(80, Math.max(20, Math.round(pct)));
    this.setAttribute("split", clamped);
  }

  #adjustSplit(delta) {
    const current = parseInt(this.getAttribute("split")) || 50;
    this.#updateSplit(
      this.getBoundingClientRect().left + (this.getBoundingClientRect().width * (current + delta)) / 100,
      this.getBoundingClientRect().top + (this.getBoundingClientRect().height * (current + delta)) / 100
    );
  }
}

customElements.define("ui-split-panel", UISplitPanel);
```

### CSS (com @container style + orientation)

```css
:host {
  --split: 50%;
  --min-primary: 200px;
  --min-secondary: 150px;
  --divider-width: 4px;
  --divider-color: oklch(0% 0 0 / 0.12);
  --divider-hover: var(--color-primary, oklch(50% 0.2 250));

  display: block;
  contain: layout style;
  height: 100%;
}

.split {
  display: grid;
  gap: 0;
  height: 100%;
  align-items: stretch;
}

/* Horizontal (padrão) */
.split[data-orientation="horizontal"] {
  grid-template-columns:
    minmax(var(--min-primary), var(--split))
    var(--divider-width)
    minmax(var(--min-secondary), 1fr);
}

/* Vertical */
.split[data-orientation="vertical"] {
  grid-template-rows:
    minmax(var(--min-primary), var(--split))
    var(--divider-width)
    minmax(var(--min-secondary), 1fr);
}

/* Fallback para navegadores sem @container style */
@supports not (container-type: style) {
  .split {
    container-type: inline-size;
  }
}

@supports selector(:has(img)) {
  .split:has(.divider:focus-visible) {
    --divider-color: var(--divider-hover);
  }
}

.primary,
.secondary {
  overflow: auto;
  contain: layout style;
  padding: 16px;
}

.divider {
  position: relative;
  cursor: col-resize;
  background: var(--divider-color);
  border-radius: calc(var(--divider-width) / 2);
  transition: background 0.2s;
  outline: none;
  touch-action: none;

  .split[data-orientation="vertical"] & {
    cursor: row-resize;
  }

  &:hover,
  &:focus-visible {
    background: var(--divider-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--divider-hover);
    outline-offset: 2px;
  }
}

.handle {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 16px;
  height: 32px;
  border-radius: 4px;
  background: oklch(0% 0 0 / 0.15);
  opacity: 0;
  transition: opacity 0.2s;

  .split[data-orientation="vertical"] & {
    width: 32px;
    height: 16px;
  }

  .divider:hover &,
  .divider:focus-visible & {
    opacity: 1;
  }
}

@media print {
  .divider { display: none; }
  .split[data-orientation="horizontal"] {
    grid-template-columns: 1fr 1fr;
  }
  .split[data-orientation="vertical"] {
    grid-template-rows: auto auto;
  }
}
```

---

## Componente 4: <ui-tabs>

### HTML

```javascript
class UITabs extends HTMLElement {
  #tabs = [];
  #panels = [];
  #selectedIndex = 0;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [tabsStyles];
  }

  connectedCallback() {
    this.render();
    this.#registerSlots();
  }

  #registerSlots() {
    const slot = this.shadowRoot.querySelector("slot[name='tab']");
    const panelSlot = this.shadowRoot.querySelector("slot:not([name])");

    slot.addEventListener("slotchange", () => this.#sync());
    panelSlot.addEventListener("slotchange", () => this.#sync());

    this.#sync();
  }

  #sync() {
    const assigned = this.shadowRoot
      .querySelector("slot[name='tab']")
      .assignedElements({ flatten: true });

    const panels = this.shadowRoot
      .querySelector("slot:not([name])")
      .assignedElements({ flatten: true });

    this.#tabs = assigned;
    this.#panels = panels;

    this.#tabs.forEach((tab, i) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", i === this.#selectedIndex);
      tab.setAttribute("tabindex", i === this.#selectedIndex ? "0" : "-1");
      tab.addEventListener("click", () => this.#select(i));
      tab.addEventListener("keydown", (e) => this.#handleKey(e, i));
    });

    this.#panels.forEach((panel, i) => {
      panel.setAttribute("role", "tabpanel");
      panel.hidden = i !== this.#selectedIndex;
    });
  }

  #select(index) {
    this.#selectedIndex = index;
    this.#tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", i === index);
      tab.setAttribute("tabindex", i === index ? "0" : "-1");
    });
    this.#panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
  }

  #handleKey(e, i) {
    const dir = this.matches("[dir='rtl']") ? -1 : 1;
    let next = i;
    if (e.key === "ArrowRight") next = (i + dir + this.#tabs.length) % this.#tabs.length;
    if (e.key === "ArrowLeft") next = (i - dir + this.#tabs.length) % this.#tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = this.#tabs.length - 1;
    if (next !== i) {
      e.preventDefault();
      this.#select(next);
      this.#tabs[next]?.focus();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="tabs" part="tabs" role="tablist">
        <slot name="tab"></slot>
        <div class="indicator" part="indicator" aria-hidden="true"></div>
      </div>
      <div class="panels" part="panels">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("ui-tabs", UITabs);
```

### CSS

```css
:host {
  --tabs-border: oklch(0% 0 0 / 0.12);
  --tabs-active: var(--color-primary, oklch(50% 0.2 250));
  --tabs-text: var(--color-text, oklch(20% 0.03 260));
  --tabs-bg: var(--color-surface, oklch(98% 0.005 260));

  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0;
  contain: layout style;
}

.tabs {
  display: flex;
  gap: 0;
  border-block-end: 2px solid var(--tabs-border);
  position: relative;
}

::slotted([slot="tab"]) {
  all: unset;
  padding: 10px 20px;
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  color: var(--tabs-text);
  opacity: 0.6;
  transition: opacity 0.2s, color 0.2s;
  text-align: center;
  white-space: nowrap;
  user-select: none;

  &[aria-selected="true"] {
    opacity: 1;
    color: var(--tabs-active);
  }

  &:hover {
    opacity: 0.85;
  }

  &:focus-visible {
    outline: 2px solid var(--tabs-active);
    outline-offset: -2px;
    border-radius: 4px;
  }
}

.panels {
  padding-block: 16px;

  & ::slotted([role="tabpanel"]) {
    display: block;

    &[hidden] {
      display: none;
    }
  }
}

@media print {
  ::slotted([slot="tab"]) {
    opacity: 1;
    color: black;
    border-bottom: 2px solid #ccc;
  }

  ::slotted([slot="tab"][aria-selected="true"]) {
    border-bottom-color: black;
  }

  .panels ::slotted([role="tabpanel"]) {
    &[hidden] {
      display: block; /* mostra todos os painéis no print */
    }
  }
}
```

---

## Componente 5: <ui-toast>

### HTML (com @starting-style)

```javascript
class UIToast extends HTMLElement {
  static observedAttributes = ["variant", "open", "duration"];

  #timer;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [toastStyles];
  }

  connectedCallback() {
    this.render();
    if (this.hasAttribute("open")) this.#startTimer();
  }

  attributeChangedCallback(name) {
    if (name === "open") {
      if (this.hasAttribute("open")) this.#startTimer();
      else this.#clearTimer();
    }
  }

  #startTimer() {
    this.#clearTimer();
    const duration = parseInt(this.getAttribute("duration")) || 4000;
    this.#timer = setTimeout(() => this.removeAttribute("open"), duration);
  }

  #clearTimer() {
    if (this.#timer) clearTimeout(this.#timer);
  }

  show() {
    this.setAttribute("open", "");
  }

  hide() {
    this.removeAttribute("open");
  }

  render() {
    const variant = this.getAttribute("variant") || "info";

    this.shadowRoot.innerHTML = `
      <div class="toast" part="toast" data-variant="${variant}"
           role="alert" aria-live="polite">
        <span class="icon" part="icon" aria-hidden="true">
          <slot name="icon">${this.#iconFor(variant)}</slot>
        </span>
        <span class="message" part="message">
          <slot></slot>
        </span>
        <button class="dismiss" part="dismiss"
                aria-label="Descartar" onclick="this.getRootNode().host.hide()">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  #iconFor(variant) {
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      error:   '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 6v4m0 4v0M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2L2 18h16L10 2z" stroke="currentColor" stroke-width="2"/><path d="M10 8v4m0 2v0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      info:    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M10 8v4m0 2v0M9.5 6v0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
    return icons[variant] || icons.info;
  }
}

customElements.define("ui-toast", UIToast);
```

### CSS

```css
:host {
  --toast-bg: var(--color-surface, oklch(98% 0.005 260));
  --toast-text: var(--color-text, oklch(20% 0.03 260));
  --toast-radius: var(--radius-md, 8px);
  --toast-shadow: 0 4px 16px oklch(0% 0 0 / 0.12);
  --toast-success: oklch(55% 0.2 145);
  --toast-error: oklch(55% 0.25 25);
  --toast-warning: oklch(65% 0.2 85);
  --toast-info: var(--color-primary, oklch(50% 0.2 250));

  display: block;
  contain: layout style;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--toast-radius);
  background: var(--toast-bg);
  color: var(--toast-text);
  box-shadow: var(--toast-shadow);
  border-inline-start: 4px solid var(--toast-color, var(--toast-info));

  opacity: 0;
  translate: 100% 0;
  transition:
    opacity 0.3s ease,
    translate 0.3s ease,
    display 0.3s allow-discrete;

  :host([open]) & {
    opacity: 1;
    translate: 0 0;
  }

  @starting-style {
    :host([open]) & {
      opacity: 0;
      translate: 100% 0;
    }
  }

  @media print {
    box-shadow: none;
    border: 1px solid #ccc;
    opacity: 1;
    translate: 0 0;
  }
}

:host([variant="success"]) .toast { --toast-color: var(--toast-success); }
:host([variant="error"])   .toast { --toast-color: var(--toast-error); }
:host([variant="warning"]) .toast { --toast-color: var(--toast-warning); }
:host([variant="info"])    .toast { --toast-color: var(--toast-info); }

@media (prefers-reduced-motion: reduce) {
  .toast { transition: none; }
}

.icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: var(--toast-color, var(--toast-info));
}

.message {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
}

.dismiss {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: inherit;
  opacity: 0.5;
  transition: opacity 0.2s, background 0.2s;
  flex-shrink: 0;

  &:hover { opacity: 0.8; background: oklch(0% 0 0 / 0.08); }
  &:focus-visible {
    opacity: 1;
    outline: 2px solid var(--toast-color);
    outline-offset: 2px;
  }
}
```

---

## Componente 6: <ui-spinner>

### HTML

```javascript
class UISpinner extends HTMLElement {
  static observedAttributes = ["size", "color", "speed"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [spinnerStyles];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const size = this.getAttribute("size") || "24";
    const color = this.getAttribute("color") || "var(--color-primary, oklch(50% 0.2 250))";
    const speed = this.getAttribute("speed") || "0.8";

    this.shadowRoot.innerHTML = `
      <div class="spinner" part="spinner"
           role="status" aria-label="Carregando"
           style="--size: ${size}px; --color: ${color}; --speed: ${speed}s">
        <div class="arc" part="arc"></div>
      </div>
    `;
  }
}

customElements.define("ui-spinner", UISpinner);
```

### CSS

```css
@keyframes spin {
  to { rotate: 360deg; }
}

@keyframes arc-length {
  0% { stroke-dasharray: 1 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90 150; stroke-dashoffset: -124; }
}

:host {
  --size: 24px;
  --color: var(--color-primary, oklch(50% 0.2 250));
  --speed: 0.8s;

  display: inline-block;
  contain: layout style;
}

.spinner {
  width: var(--size);
  height: var(--size);
  position: relative;
}

.arc {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: calc(var(--size) * 0.1) solid oklch(0% 0 0 / 0.1);
  border-top-color: var(--color);
  animation:
    spin var(--speed) linear infinite;

  @media (prefers-reduced-motion: reduce) {
    border-top-color: var(--color);
    border-right-color: oklch(0% 0 0 / 0.1);
    animation: none;
  }
}

:host([size]) .arc {
  border-width: calc(var(--size) * 0.1);
}
```

### Uso

```html
<!-- Tamanhos e cores variados -->
<ui-spinner></ui-spinner>
<ui-spinner size="16" speed="0.6"></ui-spinner>
<ui-spinner size="48" color="oklch(55% 0.2 145)"></ui-spinner>

<!-- Em botão de loading -->
<ui-button disabled>
  <ui-spinner size="14" style="display: inline; vertical-align: middle;"></ui-spinner>
  Salvando...
</ui-button>
```

---

## Componente 7: <ui-badge>

### HTML

```javascript
class UIBadge extends HTMLElement {
  static observedAttributes = ["variant", "count", "max"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [badgeStyles];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const variant = this.getAttribute("variant") || "default";
    const count = this.getAttribute("count");
    const max = parseInt(this.getAttribute("max")) || 99;

    let display = "";
    if (count !== null) {
      const num = parseInt(count);
      display = num > max ? `${max}+` : count;
    }

    this.shadowRoot.innerHTML = `
      <span class="badge" part="badge" data-variant="${variant}"
            role="status" aria-label="${display || variant}">
        <slot>${display}</slot>
      </span>
    `;
  }
}

customElements.define("ui-badge", UIBadge);
```

### CSS

```css
:host {
  --badge-bg: var(--color-primary, oklch(50% 0.2 250));
  --badge-text: white;
  --badge-radius: 9999px;
  --badge-font: 0.75rem;
  --badge-padding: 0.15em 0.5em;

  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  contain: layout style;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5em;
  padding: var(--badge-padding);
  border-radius: var(--badge-radius);
  background: var(--badge-bg);
  color: var(--badge-text);
  font-size: var(--badge-font);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  user-select: none;
}

:host([variant="success"]) { --badge-bg: oklch(55% 0.2 145); }
:host([variant="error"])   { --badge-bg: oklch(55% 0.25 25); }
:host([variant="warning"]) { --badge-bg: oklch(65% 0.2 85); --badge-text: black; }
:host([variant="info"])    { --badge-bg: var(--color-primary, oklch(50% 0.2 250)); }
:host([variant="neutral"]) { --badge-bg: oklch(0% 0 0 / 0.08); --badge-text: inherit; }

/* Badge posicionado como notificação */
:host-context(.icon-wrapper) {
  position: absolute;
  top: -4px;
  right: -4px;
}
```

### Uso

```html
<!-- Variantes -->
<ui-badge>Novo</ui-badge>
<ui-badge variant="success">Ativo</ui-badge>
<ui-badge variant="error">3 erros</ui-badge>
<ui-badge variant="warning">Pendente</ui-badge>

<!-- Com contador numérico -->
<ui-badge count="3"></ui-badge>
<ui-badge count="150" max="99"></ui-badge>

<!-- Em notificação -->
<div style="position: relative; display: inline-block;">
  <svg icon="bell" aria-hidden="true" width="24" height="24">...</svg>
  <ui-badge count="5" style="position: absolute; top: -4px; right: -4px;"></ui-badge>
</div>
```

---

## Padrão: Staggered Animation para Listas

```javascript
class UIStagger extends HTMLElement {
  static observedAttributes = ["delay", "duration"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [staggerStyles];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const delay = this.getAttribute("delay") || "50";
    const duration = this.getAttribute("duration") || "300";

    this.shadowRoot.innerHTML = `
      <div class="stagger-wrapper" part="wrapper"
           style="--stagger-delay: ${delay}ms; --stagger-duration: ${duration}ms;">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("ui-stagger", UIStagger);
```

```css
@keyframes stagger-fade-in {
  from {
    opacity: 0;
    translate: 0 12px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

:host {
  display: block;
  contain: layout style;
}

::slotted(*) {
  opacity: 0;
  animation: stagger-fade-in var(--stagger-duration, 300ms)
             ease forwards;
}

/* Delay incremental: cada filho espera mais que o anterior */
::slotted(:nth-child(1))  { animation-delay: calc(var(--stagger-delay, 50ms) * 0); }
::slotted(:nth-child(2))  { animation-delay: calc(var(--stagger-delay, 50ms) * 1); }
::slotted(:nth-child(3))  { animation-delay: calc(var(--stagger-delay, 50ms) * 2); }
::slotted(:nth-child(4))  { animation-delay: calc(var(--stagger-delay, 50ms) * 3); }
::slotted(:nth-child(5))  { animation-delay: calc(var(--stagger-delay, 50ms) * 4); }
::slotted(:nth-child(6))  { animation-delay: calc(var(--stagger-delay, 50ms) * 5); }
::slotted(:nth-child(7))  { animation-delay: calc(var(--stagger-delay, 50ms) * 6); }
::slotted(:nth-child(8))  { animation-delay: calc(var(--stagger-delay, 50ms) * 7); }
::slotted(:nth-child(9))  { animation-delay: calc(var(--stagger-delay, 50ms) * 8); }
::slotted(:nth-child(10)) { animation-delay: calc(var(--stagger-delay, 50ms) * 9); }

@media (prefers-reduced-motion: reduce) {
  ::slotted(*) {
    animation: none;
    opacity: 1;
  }
}
```

```html
<ui-stagger delay="60" duration="400">
  <ui-card>Item 1</ui-card>
  <ui-card>Item 2</ui-card>
  <ui-card>Item 3</ui-card>
  <ui-card>Item 4</ui-card>
</ui-stagger>
```

---

## Padrão: Tema Global para Web Components

```css
/* Tema global — afeta todos os Web Components no documento */
:root {
  color-scheme: light dark;

  /* Tokens semânticos */
  --color-primary: oklch(50% 0.2 250);
  --color-surface: oklch(98% 0.005 260);
  --color-text: oklch(20% 0.03 260);
  --color-error: oklch(55% 0.25 25);
  --color-success: oklch(55% 0.2 145);

  /* Espaçamento */
  --space-xs: clamp(0.25rem, 0.5vw, 0.5rem);
  --space-sm: clamp(0.5rem, 1vw, 0.75rem);
  --space-md: clamp(0.75rem, 2vw, 1.25rem);
  --space-lg: clamp(1rem, 3vw, 2rem);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Tipografia */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: "Cascadia Code", "Fira Code", monospace;

  /* Formulários */
  accent-color: var(--color-primary);

  /* Tema escuro */
  @media (prefers-color-scheme: dark) {
    --color-surface: oklch(15% 0.02 260);
    --color-text: oklch(90% 0.01 260);
    --color-primary: oklch(60% 0.2 250);
  }
}
```

---

## Padrão: SVG Icons em Shadow DOM

```javascript
/* Helper para renderizar SVG inline sem dependência externa */
const ICONS = {
  close:    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  check:    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  chevron:  '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 7l3 3 3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  spinner:  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>',
};

/* Uso: template literal com fallback no slot */
this.shadowRoot.innerHTML = `
  <button class="icon-btn" aria-label="${label}">
    ${ICONS.close}
  </button>
`;
```

**Regras para SVG em WC**:
- Sempre inline (sem fetch externo)
- `aria-hidden="true"` em ícones decorativos
- `stroke="currentColor"` para herdar cor do CSS (`color` property)
- `fill="none"` em ícones de linha
- Slot de fallback para customização pelo usuário

---

## Performance Checklist para Web Components

- [ ] `adoptedStyleSheets` em vez de `<style>` no innerHTML (evita re-parsing)
- [ ] `contain: layout style` no `:host` de cada componente
- [ ] `content-visibility: auto` + `contain-intrinsic-size` em lists grandes
- [ ] Animações apenas em `transform`, `opacity`, `scale`, `rotate`, `translate`
- [ ] `prefers-reduced-motion` respeitado em todas as animações
- [ ] `@starting-style` para animações de entrada
- [ ] `transition-behavior: allow-discrete` para `display`/`overlay`
- [ ] `will-change` apenas em elementos sob interação iminente
- [ ] Propriedade `scale`/`translate`/`rotate` independentes em vez de `transform`
- [ ] Shadow DOM para isolamento de estilo (sem vazamento)
- [ ] Slots nomeados para composição flexível
- [ ] `observedAttributes` mínimo — apenas o necessário para re-render
- [ ] `connectedCallback` lento — registrar eventos, não fazer fetch
- [ ] Evitar `disconnectedCallback` pesado — limpar timers/observers
- [ ] `@media print` em cada componente com `break-inside: avoid`
- [ ] `color-scheme: light dark` no host para scrollbar nativa correta

## Acessibilidade Checklist

- [ ] `role` e `aria-*` explícitos em todos os modos
- [ ] `:focus-visible` em vez de `:focus`
- [ ] Navegação por teclado (Tab, Arrow, Escape, Enter, Home, End)
- [ ] `aria-live` em regiões dinâmicas (toast, alert)
- [ ] `prefers-color-scheme` para tema escuro
- [ ] `prefers-contrast: more` respeitado
- [ ] `prefers-reduced-motion` para animações condicionais
- [ ] `color-scheme: light dark` no host
- [ ] Slots com fallback texto para ícones SVG
- [ ] `aria-label` em botões sem texto visível
- [ ] `role="separator"` em divisores interativos
- [ ] `accent-color` definido globalmente para controles nativos
- [ ] `::selection` estilizado para consistência visual
- [ ] `forced-colors: active` com `border` visível em modo alto contraste
- [ ] RTL suportado via propriedades lógicas e `dir` attribute detection
