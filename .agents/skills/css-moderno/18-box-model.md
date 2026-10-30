# Box Model

## Conceito

Cada elemento em CSS é uma **caixa retangular** composta por quatro áreas concêntricas:

```
┌─────────────────────────────────────┐
│            Margin                    │
│  ┌───────────────────────────────┐  │
│  │          Border               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │        Padding          │  │  │
│  │  │  ┌───────────────────┐  │  │  │
│  │  │  │    Content        │  │  │  │
│  │  │  │   (width/height)  │  │  │  │
│  │  │  └───────────────────┘  │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Content-box (Padrão)

```css
/* Padrão do CSS: width = apenas o conteúdo */
.elemento {
  box-sizing: content-box;  /* padrão */
  width: 200px;
  padding: 16px;
  border: 2px solid black;
  /* Largura total = 200 + 16*2 + 2*2 = 236px */
}
```

## Border-box (Recomendado)

```css
/* width inclui padding e border */
.elemento {
  box-sizing: border-box;
  width: 200px;
  padding: 16px;
  border: 2px solid black;
  /* Largura total = 200px (conteúdo = 200 - 32 - 4 = 164px) */
}

/* Reset global */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

## Propriedades do Box Model

### width / height

```css
.elemento {
  width: 300px;            /* largura fixa */
  width: 50%;              /* % do containing block */
  width: auto;             /* padrão — determinado pelo conteúdo */
  width: min(100%, 400px); /* fluido com máximo */
  width: clamp(200px, 50%, 600px);
  max-width: 800px;
  min-width: 200px;
  height: auto;            /* determinado pelo conteúdo */
  max-height: 500px;
  min-height: 100px;
}
```

### padding — Espaçamento Interno

```css
.elemento {
  padding: 16px;               /* todos os lados */
  padding: 8px 16px;           /* vertical horizontal */
  padding: 4px 8px 12px;       /* topo horizontal base */
  padding: 4px 8px 12px 16px;  /* topo direita base esquerda */

  /* Propriedades individuais */
  padding-top: 4px;
  padding-right: 8px;
  padding-bottom: 12px;
  padding-left: 16px;

  /* Propriedades lógicas (recomendado) */
  padding-block: 8px 12px;     /* padding-top padding-bottom */
  padding-inline: 16px;        /* padding-left padding-right */
  padding-block-start: 8px;
  padding-block-end: 12px;
  padding-inline-start: 16px;
  padding-inline-end: 16px;
}
```

### border — Borda

```css
.elemento {
  /* Atalho */
  border: 2px solid black;

  /* Largura Estilo Cor */
  border: 2px dashed red;
  border: 4px dotted blue;

  /* Lados individuais */
  border-top: 2px solid #ccc;
  border-right: 2px solid #ccc;
  border-bottom: 2px solid #ccc;
  border-left: 2px solid #ccc;

  /* Propriedades separadas */
  border-width: 2px;
  border-style: solid;
  border-color: black;
  border-radius: 8px;   /* cantos arredondados */

  /* Propriedades lógicas */
  border-block: 1px solid #ccc;
  border-inline: 2px solid #ddd;
  border-block-start: 1px solid black;
  border-inline-end: 2px solid blue;
}
```

### margin — Espaçamento Externo

```css
.elemento {
  margin: 16px;               /* todos os lados */
  margin: 8px 16px;           /* vertical horizontal */
  margin: 4px 8px 12px 16px;  /* topo direita base esquerda */

  margin-top: 4px;
  margin-right: 8px;
  margin-bottom: 12px;
  margin-left: 16px;

  /* Valores especiais */
  margin-inline: auto;         /* centraliza horizontalmente em block */
  margin-left: auto;           /* empurra para a direita */

  /* Propriedades lógicas */
  margin-block: 8px;
  margin-inline: 16px;
  margin-block-start: 8px;
}
```

### `margin-inline: auto` — Centralização

```css
.block-center {
  width: fit-content;
  margin-inline: auto;  /* centraliza o bloco horizontalmente */
}
```

Funciona para qualquer elemento com `width` definida e `display: block`.

## Colapso de Margem (Margin Collapsing)

Margens verticais (`margin-top` e `margin-bottom`) de **elementos block adjacentes** colapsam em uma única margem igual ao **maior dos dois valores**.

```css
/* Duas divs empilhadas */
.box-a { margin-bottom: 24px; }
.box-b { margin-top: 16px; }
/* Distância real entre elas = max(24px, 16px) = 24px, não 40px */
```

### Quando ocorre colapso:

1. **Irmãos adjacentes** — margem bottom do primeiro + margem top do segundo
2. **Pai e primeiro/último filho** — quando sem borda/padding/inline-block entre eles
3. **Elemento vazio** — margem top e bottom do mesmo elemento colapsam

### Como prevenir colapso:

```css
/* Adicionar borda ou padding quebra o colapso */
.parent {
  padding: 1px;            /* quebra colapso com filho */
  border: 1px solid transparent; /* alternativa */
  display: flow-root;      /* cria BFC, quebra colapso */
  overflow: auto;          /* também cria BFC */
}
```

```css
/* Preferir gap em vez de margin para itens de layout */
.container {
  display: grid;
  gap: 16px;               /* gap não colapsa */
}

/* Ou flexbox */
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

### Regras do colapso

| Situação | Resultado |
|---|---|
| Duas margens positivas | Maior valor |
| Uma positiva, uma negativa | Soma (positivo + negativo) |
| Duas negativas | Menor (mais negativa) |
| Margem do filho + pai sem separador | Colapsa (o pai "absorve") |

## Display e o Box Model

```css
/* Block — respeita width, height, margin, padding */
.block {
  display: block;
  width: 300px;
  height: 100px;
  margin: 16px auto;
}

/* Inline — IGNORA width, height; margin/padding só horizontal */
.inline {
  display: inline;
  /* width: ❌, height: ❌ */
  margin: 0 8px;      /* apenas horizontal funciona */
  padding: 0 4px;     /* padding vertical funciona mas não empurra */
}

/* Inline-block — como inline mas respeita box model */
.inline-block {
  display: inline-block;
  width: 200px;       /* ✅ funciona */
  height: 100px;      /* ✅ funciona */
  margin: 8px;        /* ✅ funciona em todos os lados */
}
```

## O Containing Block

Define o contexto de referência para porcentagens:

```css
.parent {
  width: 400px;
  height: 300px;
}

.child {
  width: 50%;    /* 200px — 50% do containing block (parent) */
  height: 50%;   /* 150px */
  margin-left: 10%; /* 40px */
}
```

Para elementos `position: fixed`, o containing block é a viewport.
Para `position: absolute`, é o ancestral posicionado mais próximo.

## box-sizing Comparativo

```css
/* content-box (padrão) */
.a {
  box-sizing: content-box;
  width: 200px;
  padding: 16px;
  border: 2px solid black;
  /* visual total: 236px */
}

/* border-box */
.b {
  box-sizing: border-box;
  width: 200px;
  padding: 16px;
  border: 2px solid black;
  /* visual total: 200px (conteúdo encolhe) */
}
```

**Sempre usar** `border-box` globalmente — simplifica cálculos de layout.

## Propriedades Lógicas vs. Físicas

```css
/* Físicas (quebram em RTL) */
.physical {
  margin-left: 16px;
  padding-top: 8px;
  border-right: 2px solid;
}

/* Lógicas (funcionam em LTR e RTL) */
.logical {
  margin-inline-start: 16px;
  padding-block-start: 8px;
  border-inline-end: 2px solid;
}
```

## Dimensões do Box Model

```
Largura total (content-box) = width + padding-left + padding-right + border-left + border-right
Altura total (content-box)  = height + padding-top + padding-bottom + border-top + border-bottom

Largura total (border-box) = width (inclui padding + border)
Altura total (border-box)  = height (inclui padding + border)
```

## Checklist

- [ ] `box-sizing: border-box` global (`*, *::before, *::after`)
- [ ] `gap` em vez de `margin` em containers flex/grid
- [ ] Propriedades lógicas (`margin-inline`, `padding-block`) em vez de físicas
- [ ] `margin-inline: auto` para centralizar blocos
- [ ] `display: flow-root` para conter floats e quebrar colapso
- [ ] Evitar `height` fixa em containers de texto (usar `min-height`)
- [ ] `aspect-ratio` para dimensões proporcionais em vez de height fixa
- [ ] Preferir `width: min(100%, 800px)` a `max-width` para fluidez
