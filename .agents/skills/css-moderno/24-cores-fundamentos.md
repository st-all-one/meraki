# Cores em CSS: Fundamentos

## Formatos de Cor

### Hexadecimal (#RGB / #RRGGBB)

```css
.elemento {
  color: #ff0000;          /* vermelho */
  color: #f00;             /* shorthand — vermelho */
  color: #ff0;             /* amarelo */
  color: #000;             /* preto */
  color: #fff;             /* branco */
  color: #3498db;          /* azul */
  color: #ff000080;        /* vermelho com 50% alpha (notação 8 dígitos) */
  color: #f008;            /* vermelho com 50% alpha (shorthand 4 dígitos) */
}
```

Hex é o formato mais compacto, mas menos legível para variações de cor.

### rgb() e rgba()

```css
/* rgb(R G B) — notação moderna sem vírgulas */
.elemento {
  color: rgb(255 0 0);              /* vermelho */
  color: rgb(0 0 0);                /* preto */
  color: rgb(255 255 255);          /* branco */

  /* Com alpha */
  color: rgb(255 0 0 / 0.5);        /* vermelho 50% opaco */
  color: rgb(255 0 0 / 50%);        /* mesma coisa */
}

/* rgba() — idêntico, mantido para compatibilidade */
color: rgba(255, 0, 0, 0.5);        /* legado com vírgulas */
```

**Notação moderna** (sem vírgulas) é preferível. O `/` separa valores de alpha.

### hsl() e hsla()

```css
/* hsl(H S L) — Hue, Saturation, Lightness */
.elemento {
  color: hsl(0 100% 50%);           /* vermelho (hue 0) */
  color: hsl(120 100% 50%);         /* verde (hue 120) */
  color: hsl(240 100% 50%);         /* azul (hue 240) */

  /* Preto, branco, cinza */
  color: hsl(0 0% 0%);              /* preto */
  color: hsl(0 0% 100%);            /* branco */
  color: hsl(0 0% 50%);             /* cinza médio */

  /* Com alpha */
  color: hsl(220 50% 40% / 0.8);    /* azul com 80% opaco */
}
```

### Paleta com HSL

```css
:root {
  --hue-primary: 220;                /* matiz base */

  --color-primary: hsl(var(--hue-primary) 60% 50%);
  --color-primary-light: hsl(var(--hue-primary) 60% 80%);
  --color-primary-dark: hsl(var(--hue-primary) 60% 30%);
  --color-primary-muted: hsl(var(--hue-primary) 20% 60%);

  --color-accent: hsl(calc(var(--hue-primary) + 180) 60% 50%); /* complementar */
}
```

### named colors (Nomes de Cor)

```css
.elemento {
  color: red;             /* 147 nomes padronizados */
  color: blue;
  color: transparent;     /* invisível */
  color: currentColor;    /* herda a cor do texto do elemento */
  color: rebeccapurple;   /* purple especial */
}
```

**⚠️ Evitar** para valores que precisam de alteração programática. Preferir HSL/OKLCH.

## Entendendo HSL

```
HUE (Matiz):      0° = Vermelho    120° = Verde     240° = Azul
SATURATION (Saturação): 0% = cinza, 100% = cor pura
LIGHTNESS (Luminosidade): 0% = preto, 50% = cor pura, 100% = branco
```

## Entendendo OKLCH

(Ver também `09-funcoes-modernas.md`.)

```css
.elemento {
  /* oklch(L C H) — Luminosidade, Croma, Hue */
  color: oklch(50% 0.2 250);    /* azul médio */
  color: oklch(90% 0.02 250 / 0.8); /* azul claro com alpha */
}
```

Vantagens sobre HSL:
- Luminosidade perceptualmente uniforme
- Gama mais ampla (P3)
- Interpolação natural em gradientes

## currentColor

```css
.btn {
  color: var(--color-primary);
  border: 2px solid currentColor;   /* borda na mesma cor do texto */
  background: color-mix(in srgb, currentColor 10%, transparent); /* fundo sutil */
}

/* Útil para ícones e bordas que acompanham a cor do texto */
.icon {
  color: inherit;           /* herda a cor do elemento pai */
}

.card {
  color: #333;
}

.card .icon {
  color: currentColor;      /* #333 — mesma cor do card */
}
```

## transparent

```css
.elemento {
  background: transparent;    /* fundo invisível */
  border-color: transparent;  /* borda invisível */
  color: transparent;         /* texto invisível (útil com background-clip: text) */
}
```

## Alpha / Opacidade

```css
/* opacity: elemento inteiro transparente */
.elemento {
  opacity: 1;         /* 100% opaco (padrão) */
  opacity: 0.5;       /* 50% transparente */
  opacity: 0;         /* invisível mas ocupa espaço */
}

/* Alpha em cores: apenas a cor, não o elemento */
.elemento {
  color: rgb(0 0 0 / 0.5);            /* texto semi-transparente */
  background: rgb(255 0 0 / 0.2);     /* fundo vermelho sutil */
  border-color: hsl(0 0% 0% / 0.1);   /* borda quase invisível */
}
```

## accent-color

```css
/* Cor de elementos de formulário nativos */
:root {
  accent-color: var(--color-primary);
}

input[type="checkbox"],
input[type="radio"],
input[type="range"],
progress {
  accent-color: var(--color-primary);
}
```

## color-scheme

```css
/* Informa o navegador que o tema escuro é suportado */
:root {
  color-scheme: light dark;
}
```

## force-colors / prefers-contrast

```css
@media (prefers-contrast: more) {
  :root {
    --color-text: black;
    --color-bg: white;
    --border-width: 2px;
  }

  .btn {
    border: var(--border-width) solid currentColor;
  }
}

@media (forced-colors: active) {
  /* Modo de alto contraste do Windows */
  .btn {
    border: 2px solid ButtonText;
  }
}
```

## Gradientes

(Ver também `21-backgrounds-borders.md`.)

```css
.elemento {
  background: linear-gradient(in oklch,
    oklch(50% 0.2 250),
    oklch(50% 0.2 10)
  );
  /* Interpolação em oklch evita "cinza sujo" */
}
```

## Tabela de Formatos de Cor

| Formato | Sintaxe | Gama | Alpha | Performance |
|---|---|---|---|---|
| Hex | `#ff0` | sRGB | Sim (8 dígitos) | Parsing rápido |
| RGB | `rgb(255 0 0)` | sRGB | Sim (`/ alpha`) | Parsing rápido |
| HSL | `hsl(0 100% 50%)` | sRGB | Sim (`/ alpha`) | Parsing rápido |
| OKLCH | `oklch(50% 0.2 250)` | P3+ | Sim | Parsing moderno |
| Nome | `red` | sRGB | Não | Limitado |

## Quando usar cada formato

| Situação | Formato Recomendado |
|---|---|
| Paleta de cores do tema | `oklch()` |
| Variações de uma cor base | `oklch(from ...)` ou `color-mix()` |
| Cores fixas (tema claro) | `hsl()` ou `rgb()` |
| Shorthand rápido | Hex `#f00` |
| Cor com alpha variável | `rgb(R G B / A)` |
| Transparência | `transparent` |
| Herdar cor do pai | `currentColor` |
| Cores de formulário nativas | `accent-color` |

## Checklist

- [ ] `oklch()` preferido para sistema de design (gama ampla, percepção uniforme)
- [ ] `hsl()` ou `rgb()` para cores fixas sem necessidade de gama P3
- [ ] Alpha via `/ alpha` (notação moderna) em vez de `rgba()`/`hsla()`
- [ ] `currentColor` para bordas e ícones que acompanham cor do texto
- [ ] `accent-color` definido globalmente
- [ ] `color-scheme: light dark` no `:root`
- [ ] `prefers-contrast` e `forced-colors` considerados
- [ ] Nomes de cor reservados para casos simples (`transparent`, `currentColor`)
