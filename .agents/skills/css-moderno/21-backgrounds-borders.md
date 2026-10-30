# Backgrounds e Borders

## Background

### background-color

```css
.elemento {
  background-color: #ff0;                    /* hex */
  background-color: rgb(255 0 0 / 0.5);      /* rgb moderno */
  background-color: oklch(50% 0.2 250);      /* oklch */
  background-color: transparent;              /* padrão */
  background-color: currentColor;             /* mesma cor do texto */
}
```

### background-image

```css
.elemento {
  background-image: url("bg.jpg");
  background-image: linear-gradient(red, blue);
  background-image: radial-gradient(circle, yellow, transparent);
  background-image: conic-gradient(from 0deg, red, blue);
  background-image: repeating-linear-gradient(45deg, #ccc 0, #ccc 8px, transparent 8px, transparent 16px);
  background-image: none;                     /* padrão */
}
```

### Múltiplos Backgrounds

```css
/* Ordem: da FRENTE para TRÁS */
.elemento {
  background:
    url("overlay.png") center / contain no-repeat,
    linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### background-repeat

```css
.elemento {
  background-repeat: repeat;      /* padrão: repete em ambas direções */
  background-repeat: repeat-x;    /* repete horizontal */
  background-repeat: repeat-y;    /* repete vertical */
  background-repeat: no-repeat;   /* não repete */
  background-repeat: round;       /* repete ajustando para caber inteiro */
  background-repeat: space;       /* repete com espaço entre */
}
```

### background-size

```css
.elemento {
  background-size: auto;           /* padrão: tamanho original */
  background-size: cover;          /* cobre a área (pode cortar) */
  background-size: contain;        /* contém a área (pode sobrar) */
  background-size: 50%;            /* porcentagem do bg area */
  background-size: 200px 100px;    /* largura altura */
  background-size: auto 100%;      /* altura 100%, largura automática */
}
```

### background-position

```css
.elemento {
  background-position: center;           /* centralizado */
  background-position: top left;         /* canto superior esquerdo */
  background-position: 50% 50%;          /* centro (padrão) */
  background-position: right 16px bottom 16px; /* offset das bordas */
  background-position: 20px 40px;        /* x y pixels */
}
```

### background-attachment

```css
.elemento {
  background-attachment: scroll;    /* padrão: rola com o elemento */
  background-attachment: fixed;     /* fixo na viewport */
  background-attachment: local;     /* rola com o conteúdo interno */
}

/* Hero section com parallax simples */
.hero {
  background-image: url("hero.jpg");
  background-size: cover;
  background-attachment: fixed;
}
```

### background-origin e background-clip

```css
.elemento {
  /* ONDE o background começa */
  background-origin: padding-box;  /* padrão: do padding */
  background-origin: border-box;   /* da borda */
  background-origin: content-box;  /* do conteúdo */

  /* ONDE o background é cortado */
  background-clip: border-box;     /* padrão: até borda */
  background-clip: padding-box;    /* até padding */
  background-clip: content-box;    /* só conteúdo */
  background-clip: text;           /* recorta no texto (webkit) */
}

/* Background recortado no texto */
.gradient-text {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
```

### Atalho background

```css
.elemento {
  background: #fff url(bg.jpg) no-repeat center / cover fixed padding-box;
  /* color image repeat position/size attachment origin+clip */
}
```

⚠️ O atalho `background` **reseta todas as sub-propriedades** não declaradas para `initial`.

## Border

### border-width

```css
.elemento {
  border-width: 2px;          /* fino */
  border-width: medium;       /* ~3px */
  border-width: thick;        /* ~5px */
  border-width: 2px 4px;      /* top/bottom left/right */
}
```

### border-style

```css
.elemento {
  border-style: solid;        /* linha contínua */
  border-style: dashed;       /* tracejado */
  border-style: dotted;       /* pontilhado */
  border-style: double;       /* linha dupla */
  border-style: groove;       /* sulco 3D */
  border-style: ridge;        /* crista 3D */
  border-style: inset;        /* baixo-relevo */
  border-style: outset;       /* alto-relevo */
  border-style: none;         /* sem borda (padrão) */
  border-style: hidden;       /* igual none, mas em tabelas */
}
```

### border-color

```css
.elemento {
  border-color: black;
  border-color: var(--color-primary);
  border-color: transparent;
  border-color: currentColor;   /* herda cor do texto */
}
```

### border-radius

```css
.elemento {
  border-radius: 8px;                        /* todos os cantos */
  border-radius: 8px 16px;                   /* top-left+bottom-right top-right+bottom-left */
  border-radius: 4px 8px 12px 16px;          /* TL TR BR BL */
  border-radius: 50%;                        /* círculo (com width/height iguais) */
  border-radius: 9999px;                     /* pill shape */
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-end-start-radius: 12px;             /* propriedade lógica */
  border-end-end-radius: 12px;

  /* Forma elíptica: horizontal / vertical */
  border-radius: 50% / 20%;                  /* elipse */
  border-radius: 16px 8px / 8px 16px;
}

/* Círculo perfeito */
.circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}
```

### border-image

```css
.elemento {
  border-image-source: url("border-frame.png");
  border-image-slice: 30;              /* fatias em pixels */
  border-image-slice: 30 fill;         /* preenche o centro */
  border-image-repeat: stretch;        /* estica (padrão) */
  border-image-repeat: repeat;         /* repete */
  border-image-repeat: round;          /* repete ajustando */
  border-image-outset: 10px;           /* expande para fora */
  border-image-width: 10px;            /* largura da borda */
}

/* Atalho */
.elemento {
  border-image: url("frame.png") 30 / 10px round;
}
```

### outline — Contorno (Fora da Borda)

```css
.elemento {
  outline: 2px solid blue;
  outline-offset: 4px;         /* espaço entre borda e outline */
  outline-color: var(--color-primary);
  outline-style: solid;
  outline-width: 2px;
}

/* Focus ring */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ❌ Remover outline sem alternativa quebra acessibilidade */
:focus { outline: none; }

/* ✅ Correto: substituir por focus-visible */
:focus:not(:focus-visible) { outline: none; }
```

### box-shadow — Sombra da Caixa

```css
.elemento {
  /* offset-x offset-y blur spread color */
  box-shadow: 2px 4px 8px rgb(0 0 0 / 0.15);

  /* Sombra interna */
  box-shadow: inset 0 2px 4px rgb(0 0 0 / 0.1);

  /* Múltiplas sombras */
  box-shadow:
    0 1px 3px rgb(0 0 0 / 0.12),
    0 4px 12px rgb(0 0 0 / 0.08);

  /* Sem sombra */
  box-shadow: none;
}
```

## Gradientes como Background

### linear-gradient

```css
.elemento {
  background: linear-gradient(red, blue);
  background: linear-gradient(to right, red, blue);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: linear-gradient(in oklch, oklch(50% 0.2 250), oklch(50% 0.2 10));
}
```

### radial-gradient

```css
.elemento {
  background: radial-gradient(circle, yellow, orange);
  background: radial-gradient(circle at 30% 40%, oklch(80% 0.1 120), transparent);
  background: radial-gradient(ellipse at center, #fff 0%, #eee 100%);
}
```

### conic-gradient

```css
.elemento {
  background: conic-gradient(from 0deg, red, yellow, green, blue, red);
  background: conic-gradient(from 90deg, #ff6b6b, #feca57, #48dbfb);
}
```

## Padrões com Background

### Card com Imagem de Fundo

```css
.hero-card {
  background:
    linear-gradient(rgb(0 0 0 / 0.5), rgb(0 0 0 / 0.5)),
    url("hero.jpg") center / cover no-repeat;
  color: white;
  padding: 64px 32px;
}
```

### Stripes CSS

```css
.stripes {
  background: repeating-linear-gradient(
    45deg,
    var(--stripe-color) 0px,
    var(--stripe-color) 8px,
    transparent 8px,
    transparent 16px
  );
}
```

### Checkerboard

```css
.checkerboard {
  background:
    conic-gradient(#ccc 25%, transparent 25%) 0 0 / 20px 20px,
    conic-gradient(transparent 25%, #ccc 25%) 10px 10px / 20px 20px;
}
```

## Gradientes vs. Imagens — Performance

| Técnica | Request HTTP | Resolução | Uso |
|---|---|---|---|
| `linear-gradient` | 0 | CPU | Fundos simples |
| `url(bg.jpg)` | 1 | Network + decode | Fotos/texturas |
| `repeating-linear-gradient` | 0 | CPU | Padrões geométricos |
| SVG inline | 0 | Render | Ícones/ilustrações |

## Checklist

- [ ] `background-size: cover` para imagens de fundo responsivas
- [ ] Múltiplos backgrounds: overlay primeiro, imagem base depois
- [ ] `background-clip: text` com fallback (cor sólida)
- [ ] `border-radius` para cantos arredondados em vez de imagens
- [ ] `outline` para focus ring (não afeta layout)
- [ ] `box-shadow` múltipla para profundidade natural
- [ ] Gradientes em oklch para interpolação uniforme
- [ ] Propriedades lógicas (`border-end-start-radius`) para i18n
