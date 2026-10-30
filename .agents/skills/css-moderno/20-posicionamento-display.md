# Posicionamento e Display

## A Propriedade display

`display` define o **tipo de caixa** que um elemento gera. É a base de todo layout CSS.

### Valores Externos (comportamento no fluxo)

```css
.block {
  display: block;           /* ocupa toda a largura, quebra linha */
}

.inline {
  display: inline;          /* na mesma linha, ignora width/height */
}

.inline-block {
  display: inline-block;    /* inline externo, block interno */
}

.none {
  display: none;            /* removido do fluxo e acessibilidade */
}
```

### Valores de Layout

```css
.flex {
  display: flex;            /* flexbox container (block-level) */
}

.inline-flex {
  display: inline-flex;     /* flexbox container (inline-level) */
}

.grid {
  display: grid;            /* grid container (block-level) */
}

.inline-grid {
  display: inline-grid;     /* grid container (inline-level) */
}
```

### Valores Especiais

```css
.flow-root {
  display: flow-root;       /* block + novo BFC (contém floats) */
}

.contents {
  display: contents;        /* caixa invisível, filhos sobem na árvore */
  /* ⚠️ remove o elemento da acessibilidade */
}

.table {
  display: table;           /* comportamento de tabela CSS */
}

.list-item {
  display: list-item;       /* como <li> */
}
```

### Tabela Resumo

| display | Ocupa Linha Própria | Aceita width/height | Aceita margin/padding |
|---|---|---|---|
| `block` | Sim | Sim | Sim |
| `inline` | Não | Não | Horizontal apenas |
| `inline-block` | Não | Sim | Sim |
| `none` | — | — | — |
| `flex` | Sim | Sim | Sim |
| `grid` | Sim | Sim | Sim |
| `flow-root` | Sim | Sim | Sim |
| `contents` | — | — | — |

## Posicionamento (position)

### position: static (Padrão)

```css
.elemento {
  position: static;   /* fluxo normal — top/left/right/bottom/z-index NÃO funcionam */
}
```

### position: relative

Mantém o elemento no fluxo normal, mas permite deslocamento visual:

```css
.elemento {
  position: relative;
  top: 10px;         /* desce 10px do seu local original */
  left: 20px;        /* move 20px para a direita */
  z-index: 1;        /* cria stacking context */
}

/* Caso de uso: âncora para position: absolute de filhos */
.container {
  position: relative;  /* containing block para filhos absolute */
}
```

### position: absolute

Remove do fluxo normal. Posiciona relativo ao **ancestral posicionado** mais próximo:

```css
.container {
  position: relative;  /* containing block */
}

.absolute-child {
  position: absolute;
  top: 0;
  right: 0;
  /* canto superior direito do .container */
  width: 200px;
  z-index: 10;
}

/* Centralização absoluta */
.center-absolute {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Preencher o containing block */
.fill-absolute {
  position: absolute;
  inset: 0;            /* top: 0; right: 0; bottom: 0; left: 0 */
}
```

### position: fixed

Remove do fluxo. Posiciona relativo à **viewport** (ou ao containing block se `transform` no ancestral):

```css
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 100;
  background: var(--color-surface);
}

.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
  z-index: 200;
}
```

### position: sticky

Híbrido: fluxo normal até o scroll atingir um limite, então fixa:

```css
.sticky-header {
  position: sticky;
  top: 0;               /* fixa no topo quando scroll passa */
  z-index: 10;
  background: var(--color-surface);
}

.sidebar-sticky {
  position: sticky;
  top: 24px;            /* fixa 24px do topo */
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

/* Múltiplos sticky empilhados */
.section-title {
  position: sticky;
  top: 0;
}

.section-title + .section-title {
  top: 48px;            /* segundo sticky começa onde o primeiro termina */
}
```

### Tabela Comparativa

| position | Fluxo | Referência | top/left/right/bottom | z-index |
|---|---|---|---|---|
| `static` | Normal | — | Ignora | Ignora |
| `relative` | Normal | Posição original | Funciona | Cria stacking context com z-index |
| `absolute` | Removido | Ancestral posicionado | Funciona | Funciona |
| `fixed` | Removido | Viewport (ou transform) | Funciona | Funciona |
| `sticky` | Normal até limite | Fluxo + viewport | Funciona | Funciona |

## Float

Originalmente para texto ao redor de imagens. Hoje substituído por Flexbox/Grid para layout.

```css
/* Uso legítimo: texto ao redor de imagem */
.article img {
  float: left;
  margin-right: 16px;
  margin-bottom: 8px;
}

/* Limpar float */
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}

/* Alternativa moderna */
.clearfix {
  display: flow-root;  /* cria BFC, contém floats */
}
```

```css
/* ❌ EVITAR: float para layout */
.sidebar { float: left; width: 250px; }
.main { float: left; width: calc(100% - 250px); }

/* ✅ USAR: Grid ou Flexbox */
.layout { display: grid; grid-template-columns: 250px 1fr; }
```

## Display: Contents — Cuidados

```css
/* Parece inofensivo: "remove" a caixa mas mantém filhos */
.hidden-box {
  display: contents;
  /* O elemento some da árvore de renderização */
  /* Filhos sobem para o lugar do pai */
}
```

**Problemas de acessibilidade**:
- Elemento some da árvore de acessibilidade (leitores de tela)
- Perde suporte a foco, role e estado
- Perde background, border, padding

```css
/* ❌ Perigoso */
button.hidden-box {
  display: contents;  /* botão some do leitor de tela */
}

/* ✅ Alternativa: subgrid */
.grid-item {
  display: grid;
  grid-template-columns: subgrid;
  /* mantém o elemento na árvore */
}
```

## inset — Atalho para top/right/bottom/left

```css
/* Preencher completamente */
.full {
  position: absolute;
  inset: 0;                 /* top: 0; right: 0; bottom: 0; left: 0 */
}

/* Vertical e horizontal */
.centered {
  position: absolute;
  inset: 20px 10%;          /* top/bottom: 20px, left/right: 10% */
}

/* Propriedades lógicas */
.logical {
  position: absolute;
  inset-block: 0;           /* top: 0; bottom: 0 */
  inset-inline: 16px;       /* left: 16px; right: 16px */
}
```

## Block Formatting Context (BFC)

Um BFC isola o layout interno. Elementos dentro de um BFC não interagem com floats de fora.

```css
/* Formas de criar BFC */
.bfc {
  display: flow-root;      /* moderna, sem side-effects */
  overflow: hidden;        /* cria BFC, mas corta conteúdo */
  display: inline-block;   /* cria BFC */
  position: absolute;      /* cria BFC */
  float: left;             /* cria BFC */
  contain: layout;         /* cria BFC */
}
```

**Uso**: conter floats, evitar colapso de margem, isolar layout.

## Padrões de Posicionamento

### Tooltip

```css
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: #333;
  color: white;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
}

.tooltip-wrapper:hover .tooltip {
  opacity: 1;
}
```

### Badge

```css
.badge-wrapper {
  position: relative;
  display: inline-block;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: red;
  border-radius: 50%;
  color: white;
  font-size: 10px;
  display: grid;
  place-items: center;
}
```

### Sticky Section Headers

```css
.list-section {
  position: relative;
}

.section-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-surface);
  padding: 8px 16px;
  border-bottom: 1px solid #ddd;
}
```

## Checklist

- [ ] `position: relative` no container antes de usar `position: absolute` nos filhos
- [ ] `inset: 0` em vez de `top: 0; right: 0; bottom: 0; left: 0`
- [ ] `display: flow-root` para BFC em vez de `overflow: hidden`
- [ ] `display: contents` evitado em elementos interativos
- [ ] Float apenas para wrap de texto, não para layout
- [ ] `position: sticky` com `top` definido (não funciona sem offset)
- [ ] Propriedades lógicas para `inset-block` / `inset-inline`
- [ ] `z-index` gerenciado por camadas, não números aleatórios
- [ ] Elementos fixos com `contain: layout style` para performance
