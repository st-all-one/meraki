# Stacking Context e Scroll

## Stacking Context (Contexto de Empilhamento)

### O que Cria um Stacking Context

```css
/* Posicionamento */
.relative { position: relative; z-index: 1; }
.absolute { position: absolute; z-index: 1; }
.fixed    { position: fixed; }               /* sempre cria */
.sticky   { position: sticky; }              /* sempre cria */

/* Propriedades visuais */
.opaco    { opacity: 0.99; }                 /* < 1 cria */
.transform { transform: scale(1); }          /* diferente de none */
.filter   { filter: blur(0px); }            /* diferente de none */
.perspective { perspective: 1px; }          /* diferente de none */
.clip-path { clip-path: inset(0); }         /* diferente de none */
.mask      { mask: url(#mask); }            /* diferente de none */
.isolate  { isolation: isolate; }           /* força criação */
.mix-blend { mix-blend-mode: multiply; }    /* diferente de normal */
.contain-layout { contain: layout; }        /* cria contexto */
.will-change  { will-change: transform; }   /* se contém propriedade que cria */

/* Elemento raiz */
html { /* sempre é a raiz do stacking context */ }
```

### Ordem de Empilhamento

Dentro de um stacking context, a ordem (do fundo para o topo) é:

1. Background e border do elemento
2. Stacking contexts de elementos filhos com `z-index < 0`
3. Elementos block-level (fluxo normal, não-posicionados)
4. Elementos float
5. Elementos inline
6. Elementos posicionados com `z-index: auto` ou `z-index: 0`
7. Stacking contexts de elementos filhos com `z-index > 0`

```css
/* Regra prática para z-index */
.overlay {
  position: fixed;
  z-index: 100;   /* sempre acima do conteúdo */
}

.modal {
  position: fixed;
  z-index: 200;   /* acima do overlay */
}

.tooltip {
  position: absolute;
  z-index: 300;   /* acima de tudo */
}
```

### Problema Clássico: z-index não funciona

```css
/* ❌ z-index não funciona porque .container cria stacking context próprio */
.container {
  position: relative;       /* ← stacking context */
  z-index: 1;
}

.child-with-z {
  position: absolute;
  z-index: 9999;           /* só funciona DENTRO de .container */
}

/* ✅ Solução: remover stacking context do pai ou aumentar z-index do pai */
.container {
  position: relative;
  z-index: 2;              /* maior que o concorrente */
}

/* ✅ Ou: usar isolation: isolate apenas quando necessário */
.container {
  isolation: isolate;      /* cria stacking context sem position */
}
```

## Scroll-Snap

```css
/* Container de snap */
.scroll-container {
  scroll-snap-type: y mandatory;   /* eixo: x | y | both, strictness: mandatory | proximity */
  overflow-y: scroll;
  height: 100vh;
}

/* Filhos com snap */
.scroll-item {
  scroll-snap-align: start;        /* start | end | center */
  scroll-snap-stop: always;        /* always | normal (evita pular itens) */
  height: 100vh;
}

/* Exemplo: carrossel horizontal */
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 16px;
  scroll-padding: 16px;            /* padding interno no snap */
}

.carousel-item {
  scroll-snap-align: start;
  flex: 0 0 300px;
}
```

## Overscroll-behavior

```css
/* Evitar "scroll chaining" — scroll que vaza para o pai */
.sidebar {
  overscroll-behavior: contain;    /* isola scroll dentro do elemento */
  overflow-y: auto;
}

.modal {
  overscroll-behavior: none;       /* sem scroll além do conteúdo */
  overflow-y: auto;
}

/* Evitar efeito bounce/pull-to-refresh em páginas */
body {
  overscroll-behavior-y: none;     /* Chrome, Firefox */
}

/* Controle total */
.elemento {
  overscroll-behavior: contain;    /* não propaga para o pai */
  overscroll-behavior: none;       /* não propaga e não mostra efeito */
  overscroll-behavior: auto;       /* padrão */
}
```

## Scrollbar Styling

```css
/* Estilização moderna com scrollbar-color/width */
.custom-scroll {
  scrollbar-width: thin;                       /* auto | thin | none */
  scrollbar-color: var(--color-primary) transparent;  /* thumb track */
  overflow-y: auto;
}

/* Webkit (fallback) */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 3px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
```

## Scroll Behavior

```css
/* Scroll suave global */
html {
  scroll-behavior: smooth;
}

/* Por elemento */
.container {
  scroll-behavior: smooth;
}

/* Âncora com scroll suave */
html {
  scroll-padding-top: 80px; /* compensa header fixo */
}

section[id] {
  scroll-margin-top: 80px;
}
```

## Position: Sticky em Profundidade

```css
/* Sticky básico */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-surface);
}

/* Sticky com scroll container aninhado */
.sidebar-sticky {
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

/* Múltiplos sticky (um após o outro) */
.section-header {
  position: sticky;
  top: 0;
}

.section-header + .section-header {
  top: 48px; /* deslocamento para o próximo */
}
```

## Tabela de Decisão

| Problema | Solução |
|---|---|
| z-index ignorado | Verificar stacking context do pai |
| Scroll vaza para o pai | `overscroll-behavior: contain` |
| Carrossel com snap | `scroll-snap-type: x mandatory` |
| Header fixo cobre âncora | `scroll-padding-top` |
| Pull-to-refresh indesejado | `overscroll-behavior-y: none` |
| Tooltip atrás de modal | Verificar stacking context da modal |
| Scrollbar feia | `scrollbar-width: thin` + `scrollbar-color` |
| Rolagem suave | `scroll-behavior: smooth` (global) |
