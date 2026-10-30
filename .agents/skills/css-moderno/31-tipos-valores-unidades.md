# Tipos de Valor, Unidades e Keywords

## Tipos de Dados CSS

Toda propriedade CSS aceita valores de tipos específicos. Estes são os tipos fundamentais.

### <length> — Comprimento

```css
.elemento {
  /* Absolutas */
  width: 100px;          /* pixels */
  margin: 1in;           /* polegadas (1in = 96px) */
  padding: 2cm;          /* centímetros */
  font-size: 10mm;       /* milímetros */
  border-width: 10pt;    /* points (1pt = 1/72in) */
  font-size: 1pc;        /* picas (1pc = 12pt) */

  /* Relativas à fonte */
  font-size: 1em;         /* tamanho da fonte do pai */
  font-size: 2rem;        /* tamanho da fonte raiz (html) */
  width: 10ch;            /* largura de 10 caracteres "0" */
  width: 10ex;            /* altura de 10 letras "x" */
  width: 10ic;            /* largura de 10 caracteres CJK */
  line-height: 1.5lh;     /* altura de linha do elemento */
  line-height: 1.5rlh;    /* altura de linha da raiz */

  /* Relativas à viewport */
  width: 50vw;            /* 50% da largura da viewport */
  height: 50vh;           /* 50% da altura da viewport */
  font-size: 5vmin;       /* 5% do menor lado da viewport */
  font-size: 5vmax;       /* 5% do maior lado da viewport */
  width: 100dvw;          /* viewport dinâmica (muda com UI mobile) */
  height: 100svh;         /* viewport pequena (sem URL bar) */
  height: 100lvh;         /* viewport grande (altura máxima) */

  /* Relativas ao container */
  width: 50cqw;           /* 50% da largura do container */
  height: 50cqh;          /* 50% da altura do container */
  font-size: 5cqi;        /* 5% do inline-size do container */
  font-size: 5cqb;        /* 5% do block-size do container */
  width: 50cqmin;         /* 50% do menor lado do container */
  width: 50cqmax;         /* 50% do maior lado do container */
}
```

### <percentage> — Porcentagem

```css
.elemento {
  width: 50%;              /* % do containing block */
  height: 50%;             /* % da altura do containing block */
  font-size: 150%;         /* % do font-size do pai */
  margin-left: 10%;        /* % da largura do containing block */
  padding: 5%;             /* % da largura do containing block */
  top: 10%;                /* % da altura do containing block */
  transform: translate(50%, 50%); /* % do próprio tamanho */
}
```

### <number> e <integer>

```css
.elemento {
  opacity: 0.5;            /* <number>: 0 a 1 */
  flex-grow: 1;            /* <number>: sem unidade */
  line-height: 1.6;        /* <number>: relativo ao font-size */
  z-index: 10;             /* <integer>: sem unidade */
  order: -1;               /* <integer>: negativo permitido */
  columns: 3;              /* <integer>: sem unidade */
  animation-iteration-count: infinite; /* keyword */
}
```

### <angle> — Ângulo

```css
.elemento {
  transform: rotate(45deg);      /* graus (deg): 360° = círculo completo */
  transform: rotate(0.5turn);    /* turns: 1turn = 360° */
  transform: rotate(1.57rad);    /* radianos: π rad = 180° */
  transform: rotate(100grad);    /* gradianos: 400grad = 360° */
  background: conic-gradient(from 0deg, red, blue);

  /* Uso típico */
  background: linear-gradient(135deg, red, blue);
}
```

### <time> — Tempo

```css
.elemento {
  transition-duration: 0.3s;       /* segundos */
  animation-duration: 200ms;       /* milissegundos */
  transition-delay: 0.1s;          /* 100ms */
  animation-delay: -1s;            /* negativo: começa no meio */
}
```

### <resolution> — Resolução

```css
.elemento {
  /* Media queries para densidade de pixels */
  @media (min-resolution: 2dppx) { ... }   /* dots per pixel */
  @media (min-resolution: 192dpi) { ... }  /* dots per inch */
  @media (min-resolution: 1x) { ... }      /* x: 1x = 96dpi */
  @media (min-resolution: 2x) { ... }      /* retina */
}
```

### <color> — Cor

```css
.elemento {
  color: red;                           /* named color */
  color: #ff0000;                       /* hex */
  color: #f00;                          /* hex shorthand */
  color: rgb(255 0 0);                  /* rgb */
  color: rgb(255 0 0 / 0.5);           /* rgb com alpha */
  color: hsl(0 100% 50%);              /* hsl */
  color: hsl(0 100% 50% / 0.5);        /* hsl com alpha */
  color: oklch(50% 0.2 250);           /* oklch */
  color: transparent;                   /* transparente */
  color: currentColor;                  /* herda cor do texto */
}
```

(Detalhado em `24-cores-fundamentos.md`.)

### <image> — Imagem

```css
.elemento {
  background-image: url("bg.jpg");             /* url */
  background-image: linear-gradient(red, blue); /* gradiente */
  background-image: image-set("photo.avif" 1x); /* image-set */
  background-image: image("icon.svg", #fff);   /* image com fallback */
  list-style: url("bullet.svg");               /* em listas */
}
```

### <url> — URL

```css
@import url("style.css");
background: url("https://example.com/bg.jpg");
@font-face { src: url("font.woff2"); }
cursor: url("custom.cur"), auto;
```

### <string> — String

```css
.elemento::before {
  content: "Hello, World!";
  font-family: "Inter Variable", system-ui;
}
```

### <custom-ident> — Identificador Customizado

```css
.elemento {
  animation-name: slide-in;        /* nome de @keyframes */
  grid-area: header;               /* nome de área */
  counter-reset: my-counter;       /* nome de contador */
}
```

## Keywords Especiais

### inherit, initial, unset, revert, revert-layer

(Detalhado em `19-cascata-heranca.md`.)

```css
.elemento {
  color: inherit;         /* força herança do pai */
  color: initial;         /* valor inicial da especificação */
  color: unset;           /* herda se herdável, initial se não */
  color: revert;          /* volta ao user-agent */
  color: revert-layer;    /* volta ao valor da camada anterior */
}
```

### auto

```css
.elemento {
  width: auto;             /* calculado pelo conteúdo (padrão) */
  height: auto;            /* calculado pelo conteúdo */
  margin: auto;            /* centralização em flexbox */
  overflow: auto;          /* scroll se necessário */
  cursor: auto;            /* cursor padrão */
}
```

### none

```css
.elemento {
  display: none;           /* remove do fluxo e acessibilidade */
  border: none;            /* sem borda */
  outline: none;           /* sem outline */
  box-shadow: none;        /* sem sombra */
  filter: none;            /* sem filtro */
  pointer-events: none;    /* ignora eventos de clique */
  text-decoration: none;   /* sem decoração */
}
```

### Tabela de Unidades de Comprimento

| Unidade | Tipo | Relativo a | Exemplo |
|---|---|---|---|
| `px` | Absoluta | Pixel físico | `16px` |
| `cm` | Absoluta | Centímetro | `2cm` |
| `mm` | Absoluta | Milímetro | `10mm` |
| `in` | Absoluta | Polegada (96px) | `1in` |
| `pt` | Absoluta | Point (1/72in) | `12pt` |
| `pc` | Absoluta | Pica (12pt) | `1pc` |
| `em` | Relativa | Fonte do pai | `2em` |
| `rem` | Relativa | Fonte raiz | `1.5rem` |
| `ch` | Relativa | Largura "0" | `40ch` |
| `ex` | Relativa | Altura "x" | `2ex` |
| `lh` | Relativa | line-height | `1.5lh` |
| `vw` | Viewport | Largura viewport | `50vw` |
| `vh` | Viewport | Altura viewport | `100vh` |
| `vmin` | Viewport | Menor lado | `5vmin` |
| `vmax` | Viewport | Maior lado | `5vmax` |
| `svh` | Viewport | Viewport pequena | `100svh` |
| `lvh` | Viewport | Viewport grande | `100lvh` |
| `dvw` | Viewport | Viewport dinâmica | `100dvw` |
| `cqw` | Container | Largura container | `50cqw` |
| `cqh` | Container | Altura container | `50cqh` |
| `cqi` | Container | Inline-size container | `10cqi` |
| `cqb` | Container | Block-size container | `10cqb` |
| `cqmin` | Container | Menor lado container | `50cqmin` |
| `cqmax` | Container | Maior lado container | `50cqmax` |

### Propriedade vs. Tipo Aceito

| Propriedade | Tipo Aceito | Exemplo |
|---|---|---|
| `width` | `<length>`, `<percentage>`, `auto` | `300px`, `50%`, `auto` |
| `color` | `<color>` | `red`, `#f00`, `oklch(...)` |
| `font-size` | `<length>`, `<percentage>` | `16px`, `1rem`, `150%` |
| `padding` | `<length>`, `<percentage>` | `16px`, `5%` |
| `margin` | `<length>`, `<percentage>`, `auto` | `8px`, `auto` |
| `transform` | `<transform-function>`+ | `translateX(20px)` |
| `animation` | `<time>` + `<time>` + ... | `0.3s ease` |
| `background` | `<image>` + ... | `url(bg.jpg) center` |
| `opacity` | `<number>` | `0.5` |
| `z-index` | `<integer>` | `10` |
| `line-height` | `<number>`, `<length>`, `<percentage>` | `1.6`, `24px`, `150%` |

## Tabela de Valores Globais

| Keyword | Herdável | Não Herdável | Compatibilidade |
|---|---|---|---|
| `inherit` | Herda do pai | Herda do pai | ✅ Todos |
| `initial` | Valor inicial | Valor inicial | ✅ Todos |
| `unset` | Herda do pai | Valor inicial | ✅ Todos |
| `revert` | User-agent | User-agent | ✅ Chrome 84+, Firefox 67+, Safari 9.1+ |
| `revert-layer` | Camada anterior | Camada anterior | ⚠️ Chrome 99+, Firefox 97+, Safari 15.4+ |

## Tabela de Propriedades Lógicas

| Física | Lógica | Writing-mode |
|---|---|---|
| `margin-left` | `margin-inline-start` | LTR = left, RTL = right |
| `margin-top` | `margin-block-start` | Sempre topo |
| `padding-right` | `padding-inline-end` | LTR = right, RTL = left |
| `border-left` | `border-inline-start` | LTR = left, RTL = right |
| `width` | `inline-size` | Largura em LTR |
| `height` | `block-size` | Altura |
| `top` | `inset-block-start` | Sempre topo |
| `left` | `inset-inline-start` | LTR = left, RTL = right |
| `text-align: left` | `text-align: start` | LTR = left, RTL = right |

## Checklist

- [ ] `rem` preferido sobre `em` para font-size (consistência)
- [ ] `ch` para largura de texto legível (`max-width: 70ch`)
- [ ] `vw`/`vh` com `clamp()` para responsivo sem media queries
- [ ] `cq*` unidades usadas dentro de container queries
- [ ] `svh`/`lvh`/`dvh` para viewport mobile (evitar `100vh`)
- [ ] Propriedades lógicas no lugar de físicas para i18n
- [ ] Números sem unidade onde apropriado (`line-height`, `opacity`, `flex-grow`)
- [ ] `0` sem unidade (não precisa de `0px`)
