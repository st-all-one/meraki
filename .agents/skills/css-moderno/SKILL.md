---
name: css-moderno
description: >
  Modern CSS (2026): Grid, Subgrid, Flexbox, Cascade Layers, @property,
  Container Queries, intrinsic design, discrete animations, view transitions,
  typography, performance, accessibility, foundations. Load when building
  layouts, managing the cascade, defining design tokens, or optimizing style
  rendering.
category: languages
version: "2026"
tags: [css, grid, subgrid, flexbox, container-queries, at-property, cascade-layers, animations, a11y]
license: MIT
---

# Modern CSS (2026)

## Use When
- Layouts with Grid/Subgrid/Flexbox or intrinsic responsive design
- Cascade/specificity control (`@layer`, `:where()`, `:is()`)
- Typed custom properties (`@property`), design tokens, theming
- Container queries, `clamp()`, `minmax()`
- Discrete animations, `@starting-style`, view transitions
- Rendering performance (`content-visibility`, `contain`), accessibility, print

## Core Rules
- Layout first: Grid for 2D, Flexbox for 1D. Use `gap`, never margin hacks.
- Never disable zoom; use `rem`/`ch` for type and spacing.
- `@layer` to control precedence; `:where()` for zero-specificity resets.
- Register animatable custom properties with `@property` (`syntax`, `inherits`, `initial-value`).
- Container queries (`container-type: inline-size`) over viewport media queries for components.
- Respect `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, `forced-colors`.
- Animate only compositor-friendly props (`transform`, `opacity`); avoid layout thrash.
- Use logical properties (`margin-inline`, `padding-block`) for i18n.
- Progressive enhancement with `@supports`; never rely on one engine.

## Core Patterns
```css
/* Cascade layers */
@layer reset, base, components, utilities;

/* Typed custom property */
@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }

/* Container query */
.card-host { container-type: inline-size; }
@container (min-width: 30rem) { .card { grid-template-columns: 1fr 1fr; } }

/* Intrinsic type */
h1 { font-size: clamp(1.75rem, 1rem + 3vw, 3rem); text-wrap: balance; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }

/* Modern color */
.ok { color: oklch(0.7 0.15 150); background: color-mix(in oklch, var(--brand) 20%, white); }

/* Grid areas + subgrid */
.page { display: grid; grid-template-areas: "head" "main" "foot"; grid-template-rows: auto 1fr auto; }
.item { display: grid; grid-template-columns: subgrid; }
```

## File Map
| File | Content |
|---|---|
| `00-introducao.md` | Philosophy, file map, conventions |
| `01-layout-grid.md` | Grid: areas, named lines, auto-placement, gap |
| `02-subgrid.md` | Subgrid composition |
| `03-performance.md` | content-visibility, contain, will-change |
| `04-interoperabilidade.md` | @supports, fallbacks, progressive enhancement |
| `05-variaveis-camadas.md` | Custom properties, @layer, var() fallbacks |
| `06-responsivo.md` | Intrinsic responsive, clamp, minmax, container queries |
| `07-padroes-componentes.md` | Component patterns, naming |
| `08-propriedades-registradas.md` | @property, env(), attr() |
| `09-funcoes-modernas.md` | oklch, color-mix, min/max/clamp, calc |
| `10-seletores-avancados.md` | :has, :where, :is, specificity |
| `11-tipografia-moderna.md` | @font-face, variable fonts, text-wrap |
| `12-stacking-scroll.md` | Stacking context, scroll-snap, sticky |
| `13-acessibilidade.md` | prefers-*, color-scheme, :focus-visible, contrast |
| `14-animacoes-discretas.md` | @starting-style, allow-discrete, view transitions |
| `15-web-component-optimization.md` | Shadow DOM + grid/subgrid/@property |
| `16-flexbox.md` | Flex container/items/alignment |
| `17-seletores-basicos.md` | Selectors and combinators |
| `18-box-model.md` | box-sizing, padding, margin collapse |
| `19-cascata-heranca.md` | Cascade, inheritance, keywords |
| `20-posicionamento-display.md` | position, display, float, BFC |
| `21-backgrounds-borders.md` | Backgrounds, borders, shadows, gradients |
| `22-animacoes-keyframes.md` | @keyframes, animation props |
| `23-transicoes.md` | Transitions and triggers |
| `24-cores-fundamentos.md` | Color formats |
| `25-transforms.md` | 2D/3D transforms, perspective |
| `26-sintaxe-at-rules.md` | At-rules and order |
| `27-print.md` | @page, print styles |
| `28-contadores.md` | Counters and @counter-style |
| `29-imagens.md` | object-fit, aspect-ratio, image-set, SVG |
| `30-filtros.md` | filter, backdrop-filter, blend modes |
| `31-tipos-valores-unidades.md` | Data types, units, logical props |
| `32-recommended-modern-implementation.md` | Consolidated reference implementation |

## Read Order
Modern: `01`→`02`→`06`. Cascade: `05`→`10`→`19`. Tokens: `08`→`09`→`24`. Animations: `14`→`22`→`23`. End with `32`.

## Prereqs
Basic CSS (selectors, box model, cascade); a 2024+ browser for Subgrid/Container Queries/@property.
