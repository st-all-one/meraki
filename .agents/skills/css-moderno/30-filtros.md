# Filtros CSS

## filter — Filtros no Elemento

Aplica efeitos gráficos diretamente ao elemento (imagem, texto, fundo):

```css
.elemento {
  filter: none;                           /* sem filtro (padrão) */
  filter: blur(4px);                      /* desfoque */
  filter: brightness(1.2);                /* brilho */
  filter: contrast(0.8);                  /* contraste */
  filter: drop-shadow(2px 4px 6px black); /* sombra */
  filter: grayscale(100%);                /* escala de cinza */
  filter: hue-rotate(90deg);              /* rotação de matiz */
  filter: invert(100%);                   /* inverter cores */
  filter: opacity(0.5);                   /* opacidade */
  filter: saturate(0.5);                  /* saturação */
  filter: sepia(80%);                     /* sépia */
  filter: url("filters.svg#blur");        /* SVG filter */
}
```

### Múltiplos Filtros

```css
.elemento {
  filter: brightness(1.2) contrast(1.1) saturate(1.1);
  filter: grayscale(50%) sepia(30%) hue-rotate(30deg);
}
```

### Valores de Cada Função

```css
/* blur(radius) */
filter: blur(0);              /* sem desfoque */
filter: blur(2px);            /* desfoque sutil */
filter: blur(8px);            /* desfoque forte */

/* brightness(amount) */
filter: brightness(1);        /* original */
filter: brightness(2);        /* 2x mais brilhante */
filter: brightness(0.5);      /* metade do brilho */

/* contrast(amount) */
filter: contrast(1);          /* original */
filter: contrast(2);          /* dobro do contraste */
filter: contrast(0.5);        /* metade do contraste */

/* drop-shadow(offset-x offset-y blur color) */
filter: drop-shadow(2px 4px 6px rgb(0 0 0 / 0.3));
/* Diferente de box-shadow: segue o formato do elemento (transparência) */

/* grayscale(amount) */
filter: grayscale(0);         /* original */
filter: grayscale(100%);      /* completamente cinza */
filter: grayscale(50%);       /* meio cinza */

/* hue-rotate(angle) */
filter: hue-rotate(0deg);     /* original */
filter: hue-rotate(180deg);   /* cores complementares */
filter: hue-rotate(90deg);

/* invert(amount) */
filter: invert(0);            /* original */
filter: invert(100%);         /* negativo */

/* opacity(amount) */
filter: opacity(1);           /* 100% opaco */
filter: opacity(0.5);         /* 50% transparente */

/* saturate(amount) */
filter: saturate(1);          /* original */
filter: saturate(2);          /* cores vibrantes */
filter: saturate(0);          /* sem cor (como grayscale) */

/* sepia(amount) */
filter: sepia(0);             /* original */
filter: sepia(100%);          /* efeito vintage */
```

## backdrop-filter — Filtro no Fundo

Aplica filtro ao **fundo atrás do elemento** (não ao elemento em si):

```css
/* Vidro fosco (frosted glass) */
.modal {
  backdrop-filter: blur(8px);
  background: rgb(255 255 255 / 0.1);
}

/* Efeito escurecido no fundo */
.sidebar {
  backdrop-filter: brightness(0.5);
}

/* Combinação */
.navbar-blur {
  backdrop-filter: blur(12px) saturate(1.2);
  background: rgb(255 255 255 / 0.7);
}
```

### Comparação: filter vs. backdrop-filter

| Aspecto | `filter` | `backdrop-filter` |
|---|---|---|
| Afeta | O próprio elemento | O fundo atrás do elemento |
| Exemplo | Imagem com blur | Modal com vidro fosco |
| Performance | Composite/Paint | Paint (mais caro) |
| Suporte | ✅ Amplo | ✅ Chrome 76+, Safari 9+, Firefox 103+ |

## drop-shadow vs. box-shadow

```css
/* box-shadow: aplica na caixa retangular */
.box-shadow {
  box-shadow: 2px 4px 8px rgb(0 0 0 / 0.3);
  border-radius: 8px;
}

/* drop-shadow: aplica no formato do conteúdo (respeita alpha) */
.drop-shadow {
  filter: drop-shadow(2px 4px 8px rgb(0 0 0 / 0.3));
}

/* Exemplo: sombra em PNG transparente */
.logo-transparent {
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.3));
  /* A sombra segue o contorno do PNG, não a caixa retangular */
}

/* Exemplo: sombra em triângulo CSS */
.triangle {
  width: 0;
  height: 0;
  border: 50px solid transparent;
  border-bottom-color: blue;
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.3));
  /* Sombra no triângulo, não na caixa */
}
```

## mix-blend-mode — Modo de Mescla

Controla como o elemento se **mescla com o fundo**:

```css
.elemento {
  mix-blend-mode: normal;        /* padrão */
  mix-blend-mode: multiply;      /* multiplica — escurece */
  mix-blend-mode: screen;        /* tela — clareia */
  mix-blend-mode: overlay;       /* sobreposição */
  mix-blend-mode: darken;        /* escurece */
  mix-blend-mode: lighten;       /* clareia */
  mix-blend-mode: color-dodge;   /* clareia mais */
  mix-blend-mode: color-burn;    /* escurece mais */
  mix-blend-mode: soft-light;    /* luz suave */
  mix-blend-mode: hard-light;    /* luz forte */
  mix-blend-mode: difference;    /* diferença */
  mix-blend-mode: exclusion;     /* exclusão */
  mix-blend-mode: hue;           /* matiz */
  mix-blend-mode: saturation;    /* saturação */
  mix-blend-mode: color;         /* cor */
  mix-blend-mode: luminosity;    /* luminosidade */
}
```

### Casos de Uso

```css
/* Texto que se adapta ao fundo (herói com imagem) */
.hero-text {
  color: white;
  mix-blend-mode: difference;
}

/* Duotone com overlay */
.overlay {
  background: linear-gradient(135deg, #667eea, #764ba2);
  mix-blend-mode: overlay;
  opacity: 0.7;
}

/* Efeito de texto recortado */
.hero-title {
  background: url("hero.jpg") center / cover;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  mix-blend-mode: hard-light;
}
```

## background-blend-mode — Mescla de Backgrounds

Mescla **múltiplos backgrounds** entre si:

```css
/* Gradiente + imagem mesclados */
.hero {
  background:
    linear-gradient(135deg, #667eea 0%, #764ba2 100%),
    url("hero.jpg") center / cover;
  background-blend-mode: overlay;
}

/* Efeitos com blend mode */
.blend-multiply {
  background:
    url("texture.png"),
    url("photo.jpg") center / cover;
  background-blend-mode: multiply;
}

.blend-screen {
  background:
    url("overlay.png"),
    linear-gradient(black, white);
  background-blend-mode: screen;
}
```

### Tabela de Blend Modes

| Modo | Efeito | Uso |
|---|---|---|
| `multiply` | Escurece, remove branco | Texturas, sombras |
| `screen` | Clareia, remove preto | Brilhos, luzes |
| `overlay` | Aumenta contraste | Duotone, hero images |
| `difference` | Inverte baseado no fundo | Efeitos criativos |
| `color` | Transfere cor sem luminosidade | Colorização |

## Filtros SVG (url())

Filtros CSS podem referenciar filtros SVG complexos:

```css
.elemento {
  filter: url("#duotone");
}
```

```svg
<svg style="display: none;">
  <filter id="duotone">
    <feColorMatrix type="matrix" values="
      0.5 0   0   0   0
      0   0.3 0   0   0
      0   0   0.8 0   0
      0   0   0   1   0
    "/>
  </filter>
</svg>
```

## Performance de Filtros

```css
/* ✅ Baixo custo — GPU acelerado */
filter: blur(4px);
filter: opacity(0.5);
filter: drop-shadow(2px 4px 6px black);

/* ⚠️ Custo médio */
filter: brightness(1.2);
filter: contrast(1.1);
filter: saturate(0.5);
filter: hue-rotate(90deg);

/* ⚠️ Pode disparar paint em alguns engines */
filter: url(#svg-filter);
backdrop-filter: blur(8px);    /* sempre paint */
```

| Função | Pipeline | Custo |
|---|---|---|
| `blur()` | Composite | Baixo |
| `drop-shadow()` | Composite | Baixo |
| `opacity()` | Composite | Baixo |
| `brightness()` | Paint | Médio |
| `contrast()` | Paint | Médio |
| `saturate()` | Paint | Médio |
| `grayscale()` | Paint | Médio |
| `hue-rotate()` | Paint | Médio |
| `invert()` | Paint | Médio |
| `sepia()` | Paint | Médio |
| `backdrop-filter` | Paint | Alto |
| `url()` SVG | Paint | Alto |

## Acessibilidade e Filtros

```css
/* Reduzir movimento para animações com filtro */
@media (prefers-reduced-motion: reduce) {
  .animated-filter {
    transition: none;
  }
}

/* Contraste: evitar filtros que reduzem legibilidade */
@media (prefers-contrast: more) {
  .text-over-image {
    backdrop-filter: none;            /* remove blur no texto */
    background: rgb(0 0 0 / 0.7);    /* fundo sólido */
  }
}
```

## Padrões com Filtros

### Modo Noturno para Imagens

```css
@media (prefers-color-scheme: dark) {
  img {
    filter: brightness(0.8) contrast(1.1);
  }
}
```

### Hover Efeito em Imagens

```css
.card img {
  transition: filter 0.3s ease;
}

.card:hover img {
  filter: brightness(1.1) saturate(1.1);
}

.card-grayscale img {
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}

.card-grayscale:hover img {
  filter: grayscale(0%);
}
```

### Vidro Fosco (Glassmorphism)

```css
.glass {
  background: rgb(255 255 255 / 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgb(255 255 255 / 0.3);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 0.1);
}
```

### Duotone CSS

```css
.duotone {
  position: relative;
}

.duotone::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  mix-blend-mode: overlay;
  opacity: 0.8;
  pointer-events: none;
}
```

## Tabela de Funções de Filtro

| Função | Parâmetros | Exemplo |
|---|---|---|
| `blur()` | `<length>` | `blur(4px)` |
| `brightness()` | `<number>` ou `<percentage>` | `brightness(1.2)` |
| `contrast()` | `<number>` ou `<percentage>` | `contrast(0.8)` |
| `drop-shadow()` | `offset-x offset-y blur color` | `drop-shadow(2px 4px 6px black)` |
| `grayscale()` | `<number>` ou `<percentage>` | `grayscale(100%)` |
| `hue-rotate()` | `<angle>` | `hue-rotate(90deg)` |
| `invert()` | `<number>` ou `<percentage>` | `invert(100%)` |
| `opacity()` | `<number>` ou `<percentage>` | `opacity(0.5)` |
| `saturate()` | `<number>` ou `<percentage>` | `saturate(2)` |
| `sepia()` | `<number>` ou `<percentage>` | `sepia(80%)` |
| `url()` | `<url>` | `url(#svg-filter)` |

## Checklist

- [ ] `backdrop-filter` com fallback para `background` sólido (acessibilidade)
- [ ] `drop-shadow` em vez de `box-shadow` para elementos com cantos não-retangulares
- [ ] `mix-blend-mode` testado em diferentes backgrounds
- [ ] `prefers-contrast: more` respeitado (desligar filtros de redução de contraste)
- [ ] Filtros não usados em textos longos (legibilidade)
- [ ] `transition` em filtros com performance razoável (preferir `opacity` e `transform`)
- [ ] SVG filter `url()` apenas para efeitos complexos sem alternativa CSS
- [ ] `pointer-events: none` em overlays com blend mode
