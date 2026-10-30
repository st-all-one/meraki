# Padrões de Componentes

## Card com Subgrid

```css
@layer components {
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    container-type: inline-size;
  }

  .card {
    --card-bg: var(--color-surface, white);
    --card-radius: 8px;
    --card-padding: 16px;

    display: grid;
    grid-template-rows: auto 1fr auto; /* fallback */
    gap: 8px;
    background: var(--card-bg);
    border-radius: var(--card-radius);
    padding: var(--card-padding);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
    contain: layout style;
  }

  @supports (grid-template-rows: subgrid) {
    .card {
      grid-template-rows: subgrid;
      grid-row: span 3;
      gap: 0;
    }
  }

  .card-image {
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--card-radius) var(--card-radius) 0 0;
    margin: calc(-1 * var(--card-padding));
    margin-bottom: 0;
    width: calc(100% + 2 * var(--card-padding));
  }

  .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .card-footer {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-block-start: 8px;
    border-block-start: 1px solid rgb(0 0 0 / 0.08);
  }
}
```

## Media Object (Cookbook)

```css
@layer components {
  .media {
    display: grid;
    gap: 16px;
    grid-template-columns: fit-content(200px) 1fr;
    align-items: start;
  }

  .media-flip {
    direction: rtl;
    text-align: start;
  }

  .media-figure {
    border-radius: 8px;
    overflow: hidden;
  }

  .media-figure img {
    display: block;
    max-width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }

  .media-body {
    display: grid;
    gap: 4px;
  }

  .media-title {
    font-weight: 600;
  }

  /* Responsivo intrínseco */
  @container (max-width: 400px) {
    .media {
      grid-template-columns: 1fr;
    }

    .media-figure {
      max-width: 100px;
    }
  }
}
```

## Breadcrumb Navigation

```css
@layer components {
  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    list-style: none;
  }

  .breadcrumb li {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .breadcrumb li + li::before {
    content: "/";
    color: var(--color-muted, #666);
    display: inline;
  }

  .breadcrumb a {
    color: var(--color-primary, blue);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .breadcrumb [aria-current="page"] {
    color: var(--color-text, black);
    font-weight: 600;
  }
}
```

## Modal / Dialog

```css
@layer components {
  dialog {
    border: none;
    border-radius: 12px;
    padding: 0;
    max-width: min(90vw, 500px);
    width: 100%;
    box-shadow: 0 4px 24px rgb(0 0 0 / 0.15);
  }

  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    padding: 24px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
  }

  .modal-close:hover {
    background: rgb(0 0 0 / 0.08);
  }
}
```

## Tabs

```css
@layer components {
  .tabs {
    display: flex;
    gap: 0;
    border-block-end: 2px solid var(--color-border, #ddd);
  }

  .tab {
    padding: 8px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--color-muted, #666);
    font-weight: 500;
    position: relative;
  }

  .tab[aria-selected="true"] {
    color: var(--color-primary, blue);
  }

  .tab[aria-selected="true"]::after {
    content: "";
    position: absolute;
    inset-block-end: -2px;
    inset-inline: 8px;
    height: 2px;
    background: currentColor;
    border-radius: 1px 1px 0 0;
  }

  .tab-panel {
    padding-block: 16px;
  }

  .tab-panel:not([hidden]) {
    display: block;
  }

  .tab[hidden] {
    display: none;
  }
}
```

## Accordion

```css
@layer components {
  .accordion {
    display: grid;
    gap: 1px;
  }

  .accordion-panel {
    border: 1px solid var(--color-border, #ddd);
    border-radius: 8px;
    overflow: hidden;
  }

  .accordion-header {
    margin: 0;
  }

  .accordion-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: var(--color-surface, white);
    cursor: pointer;
    font: inherit;
    font-weight: 500;
    text-align: start;
  }

  .accordion-trigger:hover {
    background: rgb(0 0 0 / 0.03);
  }

  .accordion-icon {
    width: 20px;
    height: 20px;
    transition: transform 0.2s;
  }

  .accordion-trigger[aria-expanded="true"] .accordion-icon {
    transform: rotate(180deg);
  }

  .accordion-content {
    padding: 0 16px 12px;
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s;
  }

  .accordion-panel:has([aria-expanded="true"]) .accordion-content {
    grid-template-rows: 1fr;
  }

  .accordion-content-inner {
    overflow: hidden;
  }
}
```

## Form Controls

```css
@layer components {
  .form-group {
    display: grid;
    gap: 4px;
    margin-bottom: 16px;
  }

  .form-label {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .form-input {
    padding: 8px 12px;
    border: 1px solid var(--color-border, #ccc);
    border-radius: 6px;
    font: inherit;
    width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: var(--color-surface, white);
    color: var(--color-text, black);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary, blue);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, blue) 20%, transparent);
  }

  .form-input:user-invalid {
    border-color: var(--color-error, #dc3545);
  }

  .form-error {
    color: var(--color-error, #dc3545);
    font-size: 0.8rem;
  }
}
```

## Princípios dos Componentes

1. **Variáveis CSS para customização** — todo componente expõe `--*-*` para tema externo
2. **`contain: layout style`** em cada componente — isola performance
3. **Sem dependência de dimensões externas** — usar `minmax`, `clamp`, `fit-content`
4. **Acessibilidade por padrão** — `aria-*`, `role`, foco visível
5. **Subgrid para alinhamento** — quando o componente é filho de um grid
6. **Container queries** — componente se adapta ao contexto, não à viewport
7. **@layer** — todos os componentes em `@layer components`
