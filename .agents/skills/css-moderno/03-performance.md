# Performance CSS

## Princípios de Performance

O custo dominante em CSS não é o parsing do arquivo, mas **layout (reflow)** e **paint**. Cada propriedade CSS dispara um pipeline diferente:

```
JavaScript → Style → Layout → Paint → Composite
```

| Propriedade | Pipeline | Custo |
|---|---|---|
| `transform` | Composite | Baixo |
| `opacity` | Composite | Baixo |
| `width/height` | Layout → Paint → Composite | Alto |
| `top/left` | Layout → Paint → Composite | Alto |
| `color` | Paint → Composite | Médio |
| `background` | Paint → Composite | Médio |

**Regra de ouro**: Animar apenas `transform` e `opacity`.

## Content-visibility

```css
/* ✅ Isola seções fora da viewport */
.secao-longa {
  content-visibility: auto;
  contain-intrinsic-size: 1px 500px; /* tamanho aproximado antes do paint */
}
```

`content-visibility: auto` pula renderização de elementos fora da viewport. O `contain-intrinsic-size` evita que o scroll height seja zero durante o carregamento.

## Contain

```css
/* Níveis de contenção */
.widget {
  contain: layout;   /* isola layout interno — reflows não escapam */
  contain: style;    /* isola estilos — counters/named-flow não vazam */
  contain: paint;    /* isola paint — clipping na borda do elemento */
  contain: strict;   /* layout style paint size */
  contain: content;  /* layout style paint (sem size — automático) */
}
```

## Will-change (Usar com Moderação)

```css
/* ✅ Correto: em elementos que o usuário vai interagir */
.dropdown-trigger {
  will-change: transform;
}

/* ❌ Errado: em muitos elementos ou permanentemente */
.tudo { will-change: transform; } /* consome memória GPU */
```

`will-change` promove o elemento ao próprio layer. Usar apenas em elementos que o usuário **explicitamente** vai interagir (hover/focus em menus, tooltips, modais).

## Animação Performance

```css
/* ✅ Correto */
.card-animado {
  transition: transform 200ms ease, opacity 200ms ease;
}

.card-animado:hover {
  transform: translateY(-4px);
  opacity: 0.9;
}

/* ❌ Evitar */
.card-animado:hover {
  margin-top: -4px; /* dispara layout */
  box-shadow: 0 4px 8px rgba(0,0,0,0.2); /* dispara paint */
}
```

## Redução de Estilos Não-Usados

```css
/* ✅ Usar @layer para carregamento seletivo */
@layer reset, base, components, utilities;

@import url("reset.css") layer(reset);
@import url("grid.css") layer(base);
```

`@import` com `layer()` permite que o navegador priorize o carregamento de camadas visíveis primeiro.

## Layout Thrashing (Evitar)

Múltiplas leituras/escritas síncronas de propriedades de layout causam **layout thrashing**:

```js
// ❌ Ruim: leitura → escrita → leitura → escrita
el.style.width = `${box.offsetWidth}px`; // escrita força reflow
console.log(box.offsetHeight); // leitura força outro reflow

// ✅ Bom: batch leituras, depois escritas
const w = box.offsetWidth;
const h = box.offsetHeight;
el.style.width = `${w}px`;
el.style.height = `${h}px`;
```

## Propriedades que Disparam Layout

```css
/* Disparam layout (evitar em animação) */
width, height, padding, margin, border
top, left, right, bottom
display, float, position
font-size, font-weight, line-height
text-align, vertical-align
overflow, overflow-x, overflow-y
```

## Propriedades que Disparam Apenas Paint

```css
/* Disparam apenas paint (custo médio) */
color, background, background-color, background-image
border-color, border-style, border-radius
box-shadow, text-shadow, outline
visibility, text-decoration
```

## Propriedades que Disparam Apenas Composite

```css
/* Disparam apenas composite (barato) */
transform, opacity, filter, will-change
/* Nota: filter pode disparar paint em alguns engines */
```

## Estratégias de Carregamento

1. **CSS crítico inline** no `<head>` para above-the-fold
2. **`media="print"` onload** para CSS não-crítico:
   ```html
   <link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
   ```
3. **`@layer` com `@import`** para carregamento priorizado
4. **Evitar `@import` no CSS principal** — bloqueia renderização em série

## Font Loading Performance

```css
/* ✅ font-display: swap + size-adjust reduzem CLS */
@font-face {
  font-family: "Body";
  src: url("/fonts/SourceSerif.woff2") format("woff2");
  font-display: swap;
  size-adjust: 98%;       /* alinha métricas com o fallback */
  ascent-override: 90%;   /* reduz layout shift na troca */
  descent-override: 22%;
  line-gap-override: 0%;
}

/* ✅ Preload no HTML para fontes críticas */
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>

/* ❌ Evitar font-display: block (FOIT longo) */
@font-face {
  font-family: "SlowFont";
  src: url("/fonts/Slow.woff2");
  font-display: block; /* 3s de texto invisível */
}
```

## Content-visibility (Casos Avançados)

```css
/* Seção longa — pula renderização até ficar visível */
.secao-longa {
  content-visibility: auto;
  contain-intrinsic-size: 1px 500px; /* altura aproximada antes do paint */
}

/* Grid de cards — cada card é umcontain */
.card {
  content-visibility: auto;
  contain-intrinsic-size: 1px 200px; /* altura estimada */
}

/* Virtual scroller-like: itens fora da tela não renderizam */
.scroll-list > * {
  content-visibility: auto;
  contain-intrinsic-size: 1px 48px; /* altura de cada item */
}
```

## contain: strict em Componentes Isolados

```css
/* Widgets independentes — nada vaza para fora */
.widget {
  contain: strict;           /* layout + style + paint + size */
  /* O navegador sabe que pode otimizar esta subárvore independentemente */
}

/* Componente que não depende do tamanho do pai */
.modal {
  position: fixed;
  contain: layout style;     /* sem size — tamanho determinado pelo conteúdo */
}

/* Grid item — layout não vaza */
.card {
  contain: layout style;
}
```

## Metrics de Performance CSS

| Métrica | Impacto |
|---|---|
| **First Contentful Paint (FCP)** | CSS crítico inline + font-display: optional/swap |
| **Largest Contentful Paint (LCP)** | font-display: swap + size-adjust | aspect-ratio em imagens |
| **Cumulative Layout Shift (CLS)** | `aspect-ratio`, `size-adjust` em @font-face, dimensões explícitas |
| **Time to Interactive (TTI)** | CSS não-bloqueante com `media="print"` |
| **First Input Delay (FID)** | Evitar long tasks de parsing CSS |
| **Interaction to Next Paint (INP)** | `content-visibility: auto` em seções abaixo da dobra |
