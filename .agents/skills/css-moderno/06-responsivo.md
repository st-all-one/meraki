# Design Responsivo Intrínseco

## Paradigma: Responsivo sem Media Queries

Media queries ainda são úteis, mas o CSS moderno permite **layouts que se adaptam automaticamente ao container** sem breakpoints fixos.

## Grid Intrínseco (auto-fill + minmax)

```css
.galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
```

**Comportamento**:
- Container com 600px: 2 colunas de 280px + gap
- Container com 900px: 3 colunas
- Container com 400px: 1 coluna com 280px mínimo

Sem media query alguma.

## Typography Fluid (clamp)

```css
:root {
  --text-base: clamp(1rem, 0.5rem + 1vw, 1.25rem);
  --text-h1: clamp(1.75rem, 1rem + 3vw, 3rem);
  --text-h2: clamp(1.35rem, 0.8rem + 2vw, 2.25rem);
  --space-section: clamp(2rem, 5vw, 4rem);
}

body {
  font-size: var(--text-base);
}

h1 { font-size: var(--text-h1); }
h2 { font-size: var(--text-h2); }

section + section {
  margin-top: var(--space-section);
}
```

## Container Queries

```css
/* Define o contexto de containment */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Estilos baseados no tamanho do container, não da viewport */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
```

Container queries permitem que **um mesmo componente se adapte a diferentes contextos** sem saber onde está na página.

### Container Query Units

```css
.widget {
  container-type: inline-size;
}

.widget-title {
  /* Unidades relativas ao container */
  font-size: clamp(1rem, 3cqw, 2rem);  /* 3% da largura do container */
  padding: 2cqi;                         /* 2% do inline-size do container */
  margin-block: 1cqb;                    /* 1% do block-size do container */
}

.widget-aside {
  width: 30cqw;                          /* 30% da largura do container */
  min-width: 200px;
}

/* Todas as unidades: cqw, cqh, cqi, cqb, cqmin, cqmax */
```

| Unidade | Referência |
|---|---|
| `cqw` | 1% da largura do container |
| `cqh` | 1% da altura do container |
| `cqi` | 1% do inline-size do container |
| `cqb` | 1% do block-size do container |
| `cqmin` | O menor entre cqi e cqb |
| `cqmax` | O maior entre cqi e cqb |

## Layout Híbrido (Grid + Container Queries)

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.widget {
  container-type: inline-size;

  .widget-header { font-size: clamp(1rem, 3cqw, 1.5rem); }
  .widget-body { display: flex; flex-direction: column; }
}

@container (min-width: 500px) {
  .widget-body {
    flex-direction: row;
    gap: 16px;
  }
}
```

## Aspect-ratio (CLS Prevenção)

```css
/* ✅ Evita layout shift durante carregamento */
img, video {
  aspect-ratio: attr(width) / attr(height);
  max-width: 100%;
  height: auto;
}

.video-embed {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}

.card-image {
  aspect-ratio: 3 / 2;
  object-fit: cover;
}
```

## Media Queries: Uso Residual

Reservar media queries para **mudanças de layout fundamentais** que não podem ser expressas intrinsecamente:

```css
/* Navegação: side nav vs. top nav */
@layer components {
  @media (min-width: 768px) {
    .layout {
      grid-template-columns: 250px 1fr;
      grid-template-areas: "sidebar main";
    }
  }
}
```

## Padrão: Sidebar que Vira Topbar

```css
.layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas: "main";
}

@container layout (min-width: 600px) {
  .layout {
    grid-template-columns: 200px 1fr;
    grid-template-areas: "sidebar main";
  }
}

@container layout (max-width: 599px) {
  .sidebar {
    display: flex;
    gap: 8px;
    overflow-x: auto;
  }
}
```

## Safe Areas (Notch, Keyboard)

```css
/* ✅ env() para dispositivos com notch/câmera */
.app-shell {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Componentes fixos respeitam safe area */
.fab {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  right: calc(24px + env(safe-area-inset-right, 0px));
}

/* Keyboard inset (teclado virtual mobile) */
.input-area {
  position: fixed;
  bottom: calc(0px + env(keyboard-inset-height, 0px));
}

/* fallback para navegadores sem env() */
@supports (padding-top: env(safe-area-inset-top)) {
  .app-shell {
    --safe-top: env(safe-area-inset-top);
  }
}
```

## Container Query + env() + clamp() = Responsivo Total

```css
/* Componente que se adapta ao container, viewport, e ambiente */
.card-component {
  container-type: inline-size;

  --card-padding: clamp(12px, 2cqi, 24px);
  --card-font: clamp(0.875rem, 1.5cqi, 1.125rem);
  --card-gap: clamp(8px, 1.5cqi, 16px);

  padding: var(--card-padding);
  font-size: var(--card-font);
  display: grid;
  gap: var(--card-gap);
}

/* Mobile safe area respeitada mesmo dentro de componente */
.card-component {
  padding-left: calc(var(--card-padding) + env(safe-area-inset-left, 0px));
}
```

## Spacing Responsivo

## Tabela de Decisão

| Problema | Solução | Media Query? |
|---|---|---|
| Grade de cards | `repeat(auto-fill, minmax(280px, 1fr))` | Não |
| Tamanho de fonte | `clamp(1rem, 1vw + 0.5rem, 1.5rem)` | Não |
| Stack horizontal/vertical | Container query | Não |
| Sidebar → topbar | Container query | Não |
| Espaçamento entre seções | `clamp()` | Não |
| Notch / safe area | `env(safe-area-inset-*)` | Não |
| Keyboard mobile | `env(keyboard-inset-height)` | Não |
| Tipos de container | `cqi`, `cqw`, `cqh` | Não |
| Navegação complexa | Media query (exceção) | Sim |
| Print | `@media print` | Sim |
| Modo escuro | `prefers-color-scheme` | Sim |
| Reduced motion | `prefers-reduced-motion` | Sim |
| Reduced data | `prefers-reduced-data` | Sim |

## Hierarquia de Decisão Responsiva

```
1. Container queries + unidades cqi/cqw → componente se adapta
2. Grid intrínseco (auto-fill + minmax) → layout fluido
3. clamp() + unidades viewport → tipografia fluida
4. env() → ambiente do dispositivo
5. @media → exceções de layout global
```
