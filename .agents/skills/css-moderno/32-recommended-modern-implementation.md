# Implementação Moderna Recomendada: Layout Completo

## Filosofia

Este documento consolida todo o `css_guide/` em um único **projeto de exemplo** funcional: um layout de dashboard responsivo, mobile-first, acessível e performático. Cada decisão aqui é justificada por um dos 31 arquivos anteriores.

```
Princípios aplicados:
01-layout-grid  → grid-template-areas, repeat(auto-fill, minmax)
02-subgrid      → grid-template-rows: subgrid em cards e formulários
03-performance  → content-visibility, contain, transform/opacity
04-interop      → @supports, fallback de subgrid, propriedades lógicas
05-variaveis    → @layer, @property, env(), tema light/dark
06-responsivo   → container queries, clamp(), unidades cqi
07-componentes  → card, media, dialog, tabs, accordion
08-property     → @property type-safe para animações e tema
09-funcoes      → oklch, color-mix, min/max/clamp
10-seletores    → :has(), :where(), especificidade gerenciada
11-tipografia   → font-display: swap, text-wrap, fluid type
12-stacking     → stacking context, scroll-snap, overscroll-behavior
13-acessibilidade → prefers-reduced-motion, focus-visible, color-scheme
14-animacoes    → @starting-style, allow-discrete, view transitions
15-wc           → web components com Shadow DOM e subgrid
16-flexbox      → flexbox para nav, toolbar, gaps
17-seletores    → seletores básicos e combinadores
18-box-model    → border-box global, margin collapsing
19-cascata      → @layer, !important evitado
20-display      → position, display values, flow-root
21-backgrounds  → gradients, multiple backgrounds, box-shadow
22-keyframes    → @keyframes para spinners e skeletons
23-transicoes   → transitions suaves, transition-behavior
24-cores        → oklch, hex, rgb moderno
25-transforms   → translate/scale/rotate independentes
26-at-rules     → @scope, @supports, @import com layer
27-print        → @page, @media print em todos os componentes
28-contadores   → counter() para listas numeradas
29-imagens      → object-fit, aspect-ratio, image-set
30-filtros      → backdrop-filter, drop-shadow
31-unidades     → dvw/dvh, cqi, clamp, unidades lógicas
```

---

## 1. Declaração de Camadas e Propriedades Globais

```css
@layer reset, base, components, utilities, print;

/* ── Propriedades Registradas (type-safe, animáveis) ── */

@property --color-bg {
  syntax: "<color>"; inherits: true;
  initial-value: oklch(98% 0.005 260);
}

@property --color-text {
  syntax: "<color>"; inherits: true;
  initial-value: oklch(20% 0.03 260);
}

@property --color-primary {
  syntax: "<color>"; inherits: true;
  initial-value: oklch(50% 0.2 250);
}

@property --color-surface {
  syntax: "<color>"; inherits: true;
  initial-value: oklch(100% 0 0);
}

@property --space-unit {
  syntax: "<length>"; inherits: false;
  initial-value: 4px;
}

@property --radius-sm {
  syntax: "<length>"; inherits: false;
  initial-value: 4px;
}

@property --radius-md {
  syntax: "<length>"; inherits: false;
  initial-value: 8px;
}

@property --hue-accent {
  syntax: "<angle>"; inherits: true;
  initial-value: 250deg;
}
```

---

## 2. Reset e Base

```css
@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :where(ul, ol) { list-style: none; }
  :where(img, video) { display: block; max-width: 100%; height: auto; }
  :where(button, input, select, textarea) { font: inherit; color: inherit; }
  :where(a) { color: inherit; text-decoration: none; }
  :where(h1, h2, h3, h4) { font-weight: 600; text-wrap: balance; }
}

@layer base {
  :root {
    color-scheme: light dark;
    accent-color: oklch(from var(--color-primary) 50% 0.25 h);

    --color-bg: oklch(98% 0.005 260);
    --color-text: oklch(20% 0.03 260);
    --color-primary: oklch(50% 0.2 250);
    --color-surface: oklch(100% 0 0);
    --color-border: oklch(0% 0 0 / 0.1);
    --color-muted: oklch(45% 0.03 260);
    --color-error: oklch(55% 0.22 30);
    --color-success: oklch(55% 0.2 145);

    --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --font-mono: "Cascadia Code", "Fira Code", monospace;

    --text-xs: clamp(0.75rem, 0.7rem + 0.1vw, 0.8rem);
    --text-sm: clamp(0.8rem, 0.75rem + 0.15vw, 0.875rem);
    --text-base: clamp(0.9rem, 0.85rem + 0.2vw, 1rem);
    --text-lg: clamp(1.05rem, 0.95rem + 0.4vw, 1.25rem);
    --text-xl: clamp(1.25rem, 1rem + 0.8vw, 1.6rem);
    --text-2xl: clamp(1.5rem, 1rem + 1.5vw, 2.2rem);

    --space-xs: clamp(4px, 0.5vw, 8px);
    --space-sm: clamp(8px, 1vw, 12px);
    --space-md: clamp(12px, 1.5vw, 20px);
    --space-lg: clamp(20px, 3vw, 32px);
    --space-xl: clamp(32px, 5vw, 48px);

    --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.06);
    --shadow-md: 0 2px 8px oklch(0% 0 0 / 0.1);
    --shadow-lg: 0 4px 24px oklch(0% 0 0 / 0.12);

    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: oklch(12% 0.02 260);
      --color-text: oklch(90% 0.01 260);
      --color-surface: oklch(16% 0.025 260);
      --color-border: oklch(100% 0 0 / 0.12);
      --color-muted: oklch(60% 0.02 260);
      --color-primary: oklch(60% 0.2 250);
    }
  }

  @media (prefers-contrast: more) {
    :root {
      --color-text: oklch(10% 0.05 260);
      --color-border: oklch(0% 0 0 / 0.3);
    }
  }

  body {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.6;
    color: var(--color-text);
    background: var(--color-bg);
    -webkit-font-smoothing: antialiased;
  }
}
```

---

## 3. Layout de Página (Mobile-First com Subgrid)

```css
@layer components {
  /* ── Page Layout ── */

  .app-shell {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "topbar"
      "content"
      "footer";
    min-height: 100dvh;
    gap: 0;
  }

  /* Tablet+ : sidebar aparece */
  @container layout (min-width: 640px) {
    .app-shell {
      grid-template-columns: [sidebar] 240px [main] 1fr;
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        "topbar  topbar"
        "sidebar content"
        "footer  footer";
    }
  }

  /* Desktop wide */
  @container layout (min-width: 1024px) {
    .app-shell {
      grid-template-columns: [sidebar] 260px [main] 1fr [aside] 220px;
      grid-template-areas:
        "topbar  topbar  topbar"
        "sidebar content aside"
        "footer  footer  footer";
    }
  }

  .app-topbar   { grid-area: topbar; }
  .app-sidebar  { grid-area: sidebar; }
  .app-content  { grid-area: content; }
  .app-aside    { grid-area: aside; }
  .app-footer   { grid-area: footer; }

  /* ── Topbar ── */

  .app-topbar {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding-block: var(--space-sm);
    padding-inline: var(--space-md);
    background: var(--color-surface);
    border-block-end: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
    contain: layout style;
  }

  .app-topbar-brand {
    font-size: var(--text-lg);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .app-topbar-nav {
    display: flex;
    gap: var(--space-xs);
    margin-inline-start: auto;
  }

  .app-topbar-nav a {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    transition: background 0.2s;
  }

  .app-topbar-nav a:hover {
    background: color-mix(in oklch, var(--color-primary) 10%, transparent);
  }

  .app-topbar-nav a[aria-current="page"] {
    color: var(--color-primary);
    font-weight: 600;
  }

  /* ── Sidebar ── */

  .app-sidebar {
    display: none;
    padding: var(--space-md);
    background: var(--color-surface);
    border-inline-end: 1px solid var(--color-border);
    position: sticky;
    top: var(--topbar-height, 56px);
    height: calc(100dvh - var(--topbar-height, 56px));
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    contain: layout style;
  }

  @container layout (min-width: 640px) {
    .app-sidebar { display: block; }
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-nav a {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    transition: background 0.2s, color 0.2s;
  }

  .sidebar-nav a:hover {
    background: color-mix(in oklch, var(--color-primary) 8%, transparent);
  }

  .sidebar-nav a[aria-current="page"] {
    background: color-mix(in oklch, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
    font-weight: 600;
  }

  /* ── Content (subgrid principal) ── */

  .app-content {
    display: grid;
    grid-template-columns: subgrid;
    grid-template-rows: auto 1fr;
    gap: var(--space-lg);
    padding: var(--space-lg);
    contain: layout style;
  }

  .page-header {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-md);
  }

  .page-header h1 {
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1.2;
  }

  /* ── Dashboard Grid (cards com subgrid) ── */

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: var(--space-md);
    container-type: inline-size;
    container-name: dashboard;
  }

  /* Card com subgrid nas linhas */
  .stat-card {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: var(--space-sm);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border);
    contain: layout style;
  }

  @supports (grid-template-rows: subgrid) {
    .stat-card {
      grid-template-rows: subgrid;
      grid-row: span 3;
      gap: 0;
    }
  }

  .stat-card-label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    font-weight: 600;
  }

  .stat-card-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1;
  }

  .stat-card-trend {
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .stat-card-trend[data-direction="up"] { color: var(--color-success); }
  .stat-card-trend[data-direction="down"] { color: var(--color-error); }

  /* Container query adapta o grid de cards */
  @container dashboard (min-width: 500px) {
    .dashboard-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @container dashboard (min-width: 800px) {
    .dashboard-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
```

---

## 4. Tabela Responsiva com Subgrid

```css
@layer components {
  .table-container {
    overflow-x: auto;
    container-type: inline-size;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    contain: layout style;
  }

  .data-table {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 80px;
    gap: 0;
    width: 100%;
    min-width: 500px;
  }

  .data-table-header,
  .data-table-row {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-md);
    align-items: center;
  }

  .data-table-header {
    background: color-mix(in oklch, var(--color-primary) 6%, transparent);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .data-table-row {
    border-block-end: 1px solid var(--color-border);
    font-size: var(--text-sm);
    transition: background 0.15s;
  }

  .data-table-row:last-child { border-block-end: none; }
  .data-table-row:hover { background: color-mix(in oklch, var(--color-primary) 4%, transparent); }

  .data-table-row:has(input[type="checkbox"]:checked) {
    background: color-mix(in oklch, var(--color-primary) 10%, transparent);
  }

  .data-table-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .data-table-cell-actions {
    display: flex;
    gap: var(--space-xs);
    justify-content: flex-end;
  }

  /* Responsivo: empilha em telas estreitas */
  @container (max-width: 400px) {
    .data-table-row {
      grid-template-columns: 1fr;
      gap: var(--space-xs);
      padding: var(--space-md);
    }

    .data-table-header { display: none; }

    .data-table-cell::before {
      content: attr(data-label);
      display: block;
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}
```

---

## 5. Formulário com Subgrid e Validação Nativa

```css
@layer components {
  .form-section {
    display: grid;
    gap: var(--space-lg);
    container-type: inline-size;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  @container (min-width: 500px) {
    .form-grid {
      grid-template-columns: [labels] 140px [fields] 1fr;
    }

    .form-row {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: subgrid;
      gap: var(--space-md);
      align-items: start;
    }
  }

  .form-label {
    font-size: var(--text-sm);
    font-weight: 500;
    padding-block-start: var(--space-sm);
  }

  .form-field {
    display: grid;
    gap: var(--space-xs);
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-sm);
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 15%, transparent);
  }

  .form-input:user-invalid,
  .form-select:user-invalid {
    border-color: var(--color-error);
  }

  .form-input:user-invalid:focus {
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-error) 15%, transparent);
  }

  .form-error {
    font-size: var(--text-xs);
    color: var(--color-error);
    display: none;
  }

  .form-group:has(:user-invalid) .form-error {
    display: block;
  }

  @supports selector(:has(:user-invalid)) {
    .form-error:empty { display: none; }
  }

  .form-hint {
    font-size: var(--text-xs);
    color: var(--color-muted);
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    padding-block-start: var(--space-md);
    border-block-start: 1px solid var(--color-border);
  }
}
```

---

## 6. Botões e Variantes

```css
@layer components {
  .btn {
    --btn-bg: var(--color-primary);
    --btn-color: oklch(100% 0 0);
    --btn-border: transparent;
    --btn-hover: color-mix(in oklch, var(--btn-bg) 85%, black);
    --btn-padding: var(--space-sm) var(--space-lg);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--btn-padding);
    font-size: var(--text-sm);
    font-weight: 500;
    line-height: 1;
    border: 1px solid var(--btn-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    background: var(--btn-bg);
    color: var(--btn-color);
    transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    text-align: center;
    white-space: nowrap;
  }

  .btn:hover {
    filter: brightness(1.08);
  }

  .btn:active {
    scale: 0.97;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .btn-secondary {
    --btn-bg: transparent;
    --btn-color: var(--color-text);
    --btn-border: var(--color-border);
    --btn-hover: color-mix(in oklch, var(--color-text) 6%, transparent);
  }

  .btn-ghost {
    --btn-bg: transparent;
    --btn-color: var(--color-text);
    --btn-border: transparent;
    --btn-hover: color-mix(in oklch, var(--color-text) 6%, transparent);
  }

  .btn-sm {
    --btn-padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
  }

  .btn-lg {
    --btn-padding: var(--space-md) var(--space-xl);
    font-size: var(--text-base);
  }

  .btn-icon {
    --btn-padding: var(--space-sm);
    aspect-ratio: 1;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: none;
  }

  .btn:disabled:active { scale: 1; }

  /* Grupo de botões */
  .btn-group {
    display: flex;
    gap: 0;
  }

  .btn-group .btn {
    border-radius: 0;
  }

  .btn-group .btn:first-child {
    border-start-start-radius: var(--radius-md);
    border-end-start-radius: var(--radius-md);
  }

  .btn-group .btn:last-child {
    border-start-end-radius: var(--radius-md);
    border-end-end-radius: var(--radius-md);
  }

  .btn-group .btn + .btn {
    margin-inline-start: -1px;
  }
}
```

---

## 7. Modal com @starting-style e Transições Discretas

```css
@layer components {
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    background: oklch(0% 0 0 / 0.4);
    backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity 0.25s, display 0.25s allow-discrete;
  }

  .modal-overlay.open {
    opacity: 1;
  }

  @starting-style {
    .modal-overlay.open {
      opacity: 0;
    }
  }

  .modal {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: min(90vw, 520px);
    max-height: 85dvh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 0;
    transform: translateY(20px) scale(0.97);
    transition: transform 0.25s, opacity 0.25s;
    overflow: hidden;
  }

  .modal-overlay.open .modal {
    transform: translateY(0) scale(1);
  }

  @starting-style {
    .modal-overlay.open .modal {
      transform: translateY(20px) scale(0.97);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    border-block-end: 1px solid var(--color-border);
  }

  .modal-header h2 {
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    background: transparent;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: background 0.2s;
  }

  .modal-close:hover { background: color-mix(in oklch, var(--color-text) 8%, transparent); }

  .modal-body {
    padding: var(--space-lg);
    overflow-y: auto;
  }

  .modal-footer {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    padding: var(--space-md) var(--space-lg);
    border-block-start: 1px solid var(--color-border);
  }
}
```

---

## 8. Toast com Múltiplas Posições

```css
@layer components {
  .toast-container {
    position: fixed;
    z-index: 300;
    display: grid;
    gap: var(--space-sm);
    pointer-events: none;
  }

  .toast-container[data-position="top-right"] {
    inset-block-start: var(--space-lg);
    inset-inline-end: var(--space-lg);
  }

  .toast-container[data-position="bottom-right"] {
    inset-block-end: var(--space-lg);
    inset-inline-end: var(--space-lg);
  }

  .toast {
    --toast-bg: var(--color-surface);
    --toast-color: var(--color-text);
    --toast-border: var(--color-border);

    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: var(--toast-bg);
    color: var(--toast-color);
    border: 1px solid var(--toast-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    font-size: var(--text-sm);
    pointer-events: auto;
    max-width: min(90vw, 400px);

    translate: 0 0;
    transition: translate 0.3s, opacity 0.3s, display 0.3s allow-discrete;
  }

  .toast[data-variant="success"] {
    --toast-bg: color-mix(in oklch, var(--color-success) 10%, var(--color-surface));
    --toast-border: var(--color-success);
  }

  .toast[data-variant="error"] {
    --toast-bg: color-mix(in oklch, var(--color-error) 10%, var(--color-surface));
    --toast-border: var(--color-error);
  }

  .toast.entering {
    display: flex;
    opacity: 1;
    translate: 0 0;
  }

  .toast.exiting {
    opacity: 0;
    translate: 100%;
  }

  @starting-style {
    .toast.entering {
      opacity: 0;
      translate: 100%;
    }
  }
}
```

---

## 9. Tabs com Container Query

```css
@layer components {
  .tabs-container {
    container-type: inline-size;
  }

  .tabs-list {
    display: flex;
    gap: 0;
    border-block-end: 2px solid var(--color-border);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tab-trigger {
    padding: var(--space-sm) var(--space-md);
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-muted);
    position: relative;
    white-space: nowrap;
    transition: color 0.2s;
  }

  .tab-trigger:hover { color: var(--color-text); }

  .tab-trigger[aria-selected="true"] {
    color: var(--color-primary);
  }

  .tab-trigger[aria-selected="true"]::after {
    content: "";
    position: absolute;
    inset-block-end: -2px;
    inset-inline: var(--space-sm);
    height: 2px;
    background: var(--color-primary);
    border-radius: 1px 1px 0 0;
  }

  .tab-panel {
    padding-block: var(--space-lg);
  }

  /* Mobile: dropdown em vez de tabs horizontais */
  @container (max-width: 400px) {
    .tabs-list { display: none; }

    .tab-select {
      display: block;
      width: 100%;
    }
  }

  @container (min-width: 401px) {
    .tab-select { display: none; }
  }
}
```

---

## 10. Accordion com Animaçao de Altura

```css
@layer components {
  .accordion {
    display: grid;
    gap: 1px;
  }

  .accordion-panel {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .accordion-header { margin: 0; }

  .accordion-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: var(--space-md);
    border: none;
    background: var(--color-surface);
    cursor: pointer;
    font: inherit;
    font-weight: 500;
    font-size: var(--text-sm);
    text-align: start;
  }

  .accordion-trigger:hover {
    background: color-mix(in oklch, var(--color-primary) 4%, transparent);
  }

  .accordion-icon {
    width: 20px;
    height: 20px;
    rotate: 0deg;
    transition: rotate 0.25s;
  }

  .accordion-trigger[aria-expanded="true"] .accordion-icon {
    rotate: 180deg;
  }

  .accordion-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s;
  }

  .accordion-panel:has([aria-expanded="true"]) .accordion-content {
    grid-template-rows: 1fr;
  }

  .accordion-content-inner {
    overflow: hidden;
    padding-inline: var(--space-md);
    padding-block-end: var(--space-md);
  }
}
```

---

## 11. Skeleton Loading

```css
@layer components {
  .skeleton {
    --skeleton-base: color-mix(in oklch, var(--color-text) 6%, transparent);
    --skeleton-shine: color-mix(in oklch, var(--color-text) 2%, transparent);

    background: linear-gradient(
      90deg,
      var(--skeleton-base) 25%,
      var(--skeleton-shine) 50%,
      var(--skeleton-base) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: var(--radius-sm);
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton { animation: none; }
  }

  .skeleton-text {
    height: 1em;
    width: 100%;
  }

  .skeleton-text + .skeleton-text { margin-block-start: var(--space-sm); }
  .skeleton-text:last-child { width: 60%; }

  .skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
  }

  .skeleton-card {
    padding: var(--space-md);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    display: grid;
    gap: var(--space-md);
  }
}
```

---

## 12. Spinner

```css
@layer components {
  .spinner {
    --spinner-size: 24px;
    --spinner-color: var(--color-primary);

    width: var(--spinner-size);
    height: var(--spinner-size);
    border: 2px solid color-mix(in oklch, var(--spinner-color) 20%, transparent);
    border-block-start-color: var(--spinner-color);
    border-radius: var(--radius-full);
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { rotate: 360deg; }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner { animation: none; opacity: 0.5; }
  }

  .spinner-sm { --spinner-size: 16px; border-width: 1.5px; }
  .spinner-lg { --spinner-size: 40px; border-width: 3px; }
}
```

---

## 13. Pagination

```css
@layer components {
  .pagination {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-btn {
    min-width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    padding: var(--space-xs);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
    font-size: var(--text-sm);
    transition: background 0.15s, border-color 0.15s;
  }

  .page-btn:hover { background: color-mix(in oklch, var(--color-text) 6%, transparent); }

  .page-btn[aria-current="page"] {
    background: var(--color-primary);
    color: oklch(100% 0 0);
    font-weight: 600;
  }

  .page-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
}
```

---

## 14. KPI Card com Números e Contadores CSS

```css
@layer components {
  .kpi-list {
    counter-reset: kpi;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: var(--space-md);
    container-type: inline-size;
  }

  .kpi-item {
    counter-increment: kpi;
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-md);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    position: relative;
    contain: layout style;
  }

  .kpi-item::before {
    content: counter(kpi, decimal-leading-zero);
    position: absolute;
    inset-block-start: var(--space-sm);
    inset-inline-end: var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }

  .kpi-label {
    font-size: var(--text-xs);
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .kpi-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .kpi-change {
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }
}
```

---

## 15. Breakcrumb

```css
@layer components {
  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
    font-size: var(--text-sm);
    color: var(--color-muted);
  }

  .breadcrumb a {
    color: var(--color-primary);
    text-decoration: none;
  }

  .breadcrumb a:hover { text-decoration: underline; }

  .breadcrumb li {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .breadcrumb li + li::before {
    content: "/";
    color: var(--color-muted);
  }

  .breadcrumb [aria-current="page"] {
    color: var(--color-text);
    font-weight: 600;
  }
}
```

---

## 16. Badge

```css
@layer components {
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 2px var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    line-height: 1.4;
    border-radius: var(--radius-full);
    white-space: nowrap;
    background: color-mix(in oklch, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
  }

  .badge[data-variant="success"] {
    background: color-mix(in oklch, var(--color-success) 12%, transparent);
    color: var(--color-success);
  }

  .badge[data-variant="error"] {
    background: color-mix(in oklch, var(--color-error) 12%, transparent);
    color: var(--color-error);
  }

  .badge[data-variant="neutral"] {
    background: color-mix(in oklch, var(--color-muted) 12%, transparent);
    color: var(--color-muted);
  }

  .badge-count {
    min-width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    padding: 0 var(--space-xs);
    font-size: var(--text-xs);
    font-weight: 700;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: oklch(100% 0 0);
  }
}
```

---

## 17. Empty State

```css
@layer components {
  .empty-state {
    display: grid;
    place-items: center;
    gap: var(--space-md);
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-muted);
  }

  .empty-state-icon {
    width: 64px;
    height: 64px;
    color: var(--color-muted);
    opacity: 0.4;
  }

  .empty-state h3 {
    font-size: var(--text-lg);
    color: var(--color-text);
  }

  .empty-state p {
    font-size: var(--text-sm);
    max-width: 40ch;
  }
}
```

---

## 18. Search Input

```css
@layer components {
  .search-wrapper {
    display: grid;
    gap: var(--space-xs);
    position: relative;
  }

  .search-input {
    padding-block: var(--space-sm);
    padding-inline: var(--space-md) calc(var(--space-md) + 24px);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-sm);
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 15%, transparent);
  }

  .search-icon {
    position: absolute;
    inset-inline-end: var(--space-md);
    inset-block-start: 50%;
    translate: 0 -50%;
    width: 16px;
    height: 16px;
    color: var(--color-muted);
    pointer-events: none;
  }
}
```

---

## 19. Tooltip

```css
@layer components {
  [data-tooltip] {
    position: relative;
  }

  [data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    z-index: 300;
    inset-block-end: calc(100% + 6px);
    inset-inline-start: 50%;
    translate: -50% 0;
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
    border-radius: var(--radius-sm);
    background: oklch(20% 0.03 260);
    color: oklch(95% 0 0);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }

  [data-tooltip]:hover::after,
  [data-tooltip]:focus-visible::after {
    opacity: 1;
  }
}
```

---

## 20. Print Styles (Consolidado)

```css
@layer print {
  @media print {
    @page {
      size: A4;
      margin: 15mm;
    }

    @page :first { margin-top: 25mm; }

    * {
      background: transparent !important;
      color: black !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    body {
      font-size: 11pt;
      line-height: 1.5;
    }

    .app-sidebar,
    .app-topbar-nav,
    .btn,
    .modal,
    .toast-container,
    .spinner,
    .skeleton,
    .search-wrapper,
    [data-tooltip]::after,
    .tab-trigger:not([aria-selected="true"]) {
      display: none !important;
    }

    .app-shell {
      display: block;
      min-height: auto;
    }

    .app-content {
      display: block;
      padding: 0;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10pt;
      break-inside: avoid;
    }

    .stat-card {
      break-inside: avoid;
      border: 1pt solid #ccc;
      page-break-inside: avoid;
    }

    .data-table-row {
      break-inside: avoid;
    }

    a[href]::after {
      content: " (" attr(href) ")";
      font-size: 0.8em;
      color: #666;
    }

    nav a[href]::after,
    .sidebar-nav a[href]::after {
      content: none;
    }

    h1, h2, h3, h4 {
      page-break-after: avoid;
    }

    p, li {
      orphans: 3;
      widows: 3;
    }

    table {
      border-collapse: collapse;
    }

    th, td {
      border: 1pt solid #ccc;
      padding: 4pt 8pt;
    }
  }
}
```

---

## 21. Acessibilidade Global

```css
@layer utilities {
  /* Focus visível apenas para teclado */
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Skip link */
  .skip-link {
    position: absolute;
    inset-block-start: -100%;
    inset-inline-start: var(--space-md);
    z-index: 9999;
    padding: var(--space-sm) var(--space-md);
    background: var(--color-primary);
    color: oklch(100% 0 0);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }

  .skip-link:focus {
    inset-block-start: 0;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Reduced transparency */
  @media (prefers-reduced-transparency: reduce) {
    * {
      opacity: 1 !important;
      backdrop-filter: none !important;
    }
  }

  /* Reduced data */
  @media (prefers-reduced-data: reduce) {
    img:not([data-critical]),
    .hero-image {
      background: none;
      content-visibility: hidden;
    }
  }

  /* Forced colors (Windows High Contrast) */
  @media (forced-colors: active) {
    .btn { border: 2px solid ButtonText; }
    .stat-card { border: 2px solid ButtonText; }
    .modal { border: 2px solid ButtonText; }
  }

  /* Selection styling */
  ::selection {
    background: color-mix(in oklch, var(--color-primary) 30%, transparent);
    color: var(--color-text);
  }

  /* Screen reader only */
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
}
```

---

## 22. Container de Layout (Contexto para Container Queries)

```css
/* Necessário para que o layout use container queries */
.page-layout {
  container-type: inline-size;
  container-name: layout;
}
```

No HTML:
```html
<body>
  <div class="page-layout">
    <div class="app-shell">
      <!-- ... -->
    </div>
  </div>
</body>
```

---

## 23. Checklist: Implementação Moderna

### Layout
- [ ] `grid-template-areas` para layout de página (auto-documentável)
- [ ] `subgrid` para alinhamento entre componentes
- [ ] `repeat(auto-fill, minmax(...))` para grids responsivos intrínsecos
- [ ] Container queries (`container-type: inline-size`) em vez de media queries
- [ ] `contain: layout style` em cada componente para isolamento de performance
- [ ] `content-visibility: auto` + `contain-intrinsic-size` em seções longas

### Tipografia e Espaçamento
- [ ] `clamp()` para tamanhos fluidos (fonte, spacing)
- [ ] `text-wrap: balance` em títulos, `pretty` em parágrafos
- [ ] `font-display: swap` + `size-adjust` em @font-face
- [ ] Propriedades lógicas (`margin-inline`, `padding-block`, `border-inline-end`)
- [ ] `font-variant-numeric: tabular-nums` em números

### Cores e Tema
- [ ] `oklch()` como formato de cor principal
- [ ] `color-mix()` para variantes tonais
- [ ] `color-scheme: light dark` no `:root`
- [ ] `accent-color` definido globalmente
- [ ] `@property` para variáveis de tema (type-safe, animáveis)
- [ ] Tema escuro via `prefers-color-scheme`
- [ ] Alto contraste via `prefers-contrast: more`

### Interação e Animação
- [ ] `transition` apenas em `transform`, `opacity`, `filter`, `background`
- [ ] `scale`/`translate`/`rotate` independentes (não `transform` único)
- [ ] `@starting-style` + `allow-discrete` para entrada de elementos
- [ ] `prefers-reduced-motion` respeitado globalmente
- [ ] `:focus-visible` em vez de `:focus`
- [ ] `:user-invalid` para validação nativa de formulário

### Performance
- [ ] `@layer` declarado antes de qualquer estilo
- [ ] `:where()` em resets para especificidade zero
- [ ] `will-change` apenas em elementos com animação iminente
- [ ] `overscroll-behavior: contain` em painéis com scroll
- [ ] Imagens com `aspect-ratio` + `object-fit`
- [ ] `min-height: 100dvh` (viewport dinâmica)

### Acessibilidade
- [ ] Skip link implementado
- [ ] `forced-colors` media query para Windows High Contrast
- [ ] `prefers-reduced-transparency` respeitado
- [ ] `prefers-reduced-data` respeitado
- [ ] `::selection` estilizado
- [ ] `aria-current="page"` em navegação
- [ ] `aria-selected` em tabs
- [ ] `aria-expanded` em accordion
- [ ] Role e ARIA labels em elementos interativos

### Print
- [ ] `@page` com tamanho e margens
- [ ] `@media print` oculta UI (sidebar, botões, modais)
- [ ] `break-inside: avoid` em cards e tabelas
- [ ] URLs visíveis em links (`attr(href)`)
- [ ] `orphans`/`widows` para texto

### Interoperabilidade
- [ ] `@supports` para subgrid (fallback sem)
- [ ] `@supports selector(:has(...))` para seletores modernos
- [ ] `env(safe-area-inset-*)` para dispositivos com notch
- [ ] Reset `border-box` global
- [ ] Fallback de fonte termina com genérico (`sans-serif`, `monospace`)

---

## 24. Arquivo HTML de Exemplo (Estrutura)

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="color-scheme" content="light dark" />
  <title>Dashboard Moderno</title>

  <link rel="stylesheet" href="reset.css" />
  <link rel="stylesheet" href="main.css" />
  <link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin />
</head>
<body>
  <a href="#main-content" class="skip-link">Ir para conteúdo</a>

  <div class="page-layout">
    <div class="app-shell">
      <header class="app-topbar">
        <div class="app-topbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </div>
        <nav class="app-topbar-nav" aria-label="Navegação principal">
          <a href="/dashboard" aria-current="page">Início</a>
          <a href="/analytics">Analytics</a>
          <a href="/settings">Configurações</a>
        </nav>
      </header>

      <aside class="app-sidebar" aria-label="Navegação lateral">
        <nav class="sidebar-nav">
          <a href="/dashboard" aria-current="page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Início
          </a>
          <a href="/reports">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            Relatórios
          </a>
          <a href="/team">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Equipe
          </a>
        </nav>
      </aside>

      <main id="main-content" class="app-content">
        <div class="page-header">
          <h1>Visão Geral</h1>
          <div class="btn-group">
            <button class="btn btn-secondary">Exportar</button>
            <button class="btn">Adicionar</button>
          </div>
        </div>

        <div class="kpi-list" role="list" aria-label="Indicadores-chave">
          <div class="kpi-item" role="listitem">
            <span class="kpi-label">Receita</span>
            <span class="kpi-value">R$ 48.250</span>
            <span class="kpi-change" data-direction="up">↑ 12,5%</span>
          </div>
          <div class="kpi-item" role="listitem">
            <span class="kpi-label">Usuários</span>
            <span class="kpi-value">1.847</span>
            <span class="kpi-change" data-direction="up">↑ 8,3%</span>
          </div>
          <div class="kpi-item" role="listitem">
            <span class="kpi-label">Conversão</span>
            <span class="kpi-value">3,24%</span>
            <span class="kpi-change" data-direction="down">↓ 0,7%</span>
          </div>
          <div class="kpi-item" role="listitem">
            <span class="kpi-label">Tickets</span>
            <span class="kpi-value">12</span>
            <span class="kpi-change" data-direction="up">↑ 2</span>
          </div>
        </div>

        <section aria-labelledby="recent-orders">
          <h2 id="recent-orders" class="sr-only">Pedidos Recentes</h2>
          <div class="table-container">
            <div class="data-table" role="table" aria-label="Pedidos recentes">
              <div class="data-table-header" role="row">
                <span role="columnheader">Cliente</span>
                <span role="columnheader">Valor</span>
                <span role="columnheader">Status</span>
                <span role="columnheader" aria-label="Ações"></span>
              </div>
              <div class="data-table-row" role="row">
                <span class="data-table-cell" role="cell" data-label="Cliente">Ana Silva</span>
                <span class="data-table-cell" role="cell" data-label="Valor">R$ 1.200</span>
                <span class="data-table-cell" role="cell" data-label="Status"><span class="badge" data-variant="success">Concluído</span></span>
                <span class="data-table-cell data-table-cell-actions" role="cell" data-label="">
                  <button class="btn btn-ghost btn-icon btn-sm" aria-label="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </span>
              </div>
              <div class="data-table-row" role="row">
                <span class="data-table-cell" role="cell" data-label="Cliente">Carlos Santos</span>
                <span class="data-table-cell" role="cell" data-label="Valor">R$ 890</span>
                <span class="data-table-cell" role="cell" data-label="Status"><span class="badge" data-variant="neutral">Pendente</span></span>
                <span class="data-table-cell data-table-cell-actions" role="cell" data-label="">
                  <button class="btn btn-ghost btn-icon btn-sm" aria-label="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <aside class="app-aside" aria-label="Painel lateral">
        <!-- conteúdo opcional -->
      </aside>

      <footer class="app-footer">
        <!-- footer -->
      </footer>
    </div>
  </div>
</body>
</html>
```

---

## 25. Métricas de Sucesso

| Aspecto | Resultado Esperado |
|---|---|
| **Layout shift (CLS)** | < 0.01 (aspect-ratio, size-adjust, dimensões explícitas) |
| **First Contentful Paint** | < 1.5s (CSS crítico inline, font-display: swap) |
| **Largest Contentful Paint** | < 2.5s (imagens com aspect-ratio, preload de fontes) |
| **Interaction to Next Paint** | < 100ms (contain, content-visibility, composite-only animations) |
| **Acessibilidade** | WCAG 2.2 AA (skip link, focus-visible, prefers-reduced-motion, forced-colors) |
| **Responsividade** | 320px a 2560px sem media queries (apenas container queries) |
| **Tema** | Light + Dark + Alto Contraste (automático via prefers-*) |
| **Print** | A4 formatado, sem UI, URLs visíveis |
| **Interoperabilidade** | Chrome, Firefox, Safari, Edge (fallback progressivo para subgrid) |
