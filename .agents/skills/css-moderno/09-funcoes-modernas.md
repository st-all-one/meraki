# Funções CSS Modernas

## Funções Matemáticas

### min(), max(), clamp()

```css
/* min(): o menor valor */
.elemento {
  width: min(100%, 400px); /* no máximo 400px */
  font-size: min(3vw, 2rem); /* escala com viewport, mas nunca > 2rem */
}

/* max(): o maior valor */
.elemento {
  width: max(300px, 50%); /* pelo menos 300px */
  padding: max(16px, 2vw); /* nunca menos que 16px */
}

/* clamp(): valor fluido entre mínimo e máximo */
.elemento {
  font-size: clamp(1rem, 0.75rem + 1.5vw, 1.5rem);
  /* Mín: 1rem, Ideal: 0.75rem + 1.5vw, Máx: 1.5rem */
  width: clamp(280px, 60%, 800px);
}
```

### Comparação com Media Queries

```css
/* ❌ Antes: media query para cada breakpoint */
h1 { font-size: 1.75rem; }
@media (min-width: 600px) { h1 { font-size: 2.25rem; } }
@media (min-width: 1200px) { h1 { font-size: 3rem; } }

/* ✅ Depois: clamp() único, sem media queries */
h1 { font-size: clamp(1.75rem, 1rem + 2.5vw, 3rem); }
```

### calc() Avançado

```css
.elemento {
  /* Mistura de unidades */
  width: calc(100% - 32px);
  height: calc(100vh - var(--header-h, 60px));

  /* Aninhado (navegadores modernos) */
  inset: calc(calc(100% - 400px) / 2);

  /* Com variáveis */
  --gap: 16px;
  --columns: 3;
  width: calc((100% - var(--gap) * (var(--columns) - 1)) / var(--columns));
}

/* Calculando em grid sem calc excessivo */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  /* 1fr já distribui espaço disponível — calc só quando necessário */
}
```

### round(), mod(), rem()

**Nota**: Suporte parcial (Chrome 120+, Firefox 120+).

```css
/* round(): arredonda para o múltiplo mais próximo */
.elemento {
  width: round(nearest, 100vw / 3, 4px); /* múltiplo de 4px */
  padding: round(up, 1.3rem, 0.25rem); /* arredonda para cima */
  margin: round(down, 1.3rem, 0.25rem); /* arredonda para baixo */
  /* to-zero: arredonda em direção a zero */
}

/* mod(): resto da divisão (sinal do divisor) */
.elemento {
  width: calc(100% - mod(100%, 8px)); /* alinha a grid de 8px */
}

/* rem(): resto da divisão (sinal do dividendo) */
.gap-fix {
  margin-right: calc(-1 * rem(100%, 16px));
}
```

## Funções de Cor Modernas

### oklch() e oklab (Recomendado)

```css
/* ✅ Preferir oklch — percepção humana uniforme, gama P3 */
.elemento {
  color: oklch(45% 0.15 250);        /* L: luminosidade, C: croma, H: hue */
  background: oklch(90% 0.02 250 / 0.8); /* com alpha */

  /* Vantagens sobre HSL: */
  /* 1. Luminosidade perceptualmente uniforme */
  /* 2. Gama mais ampla que sRGB (P3 +) */
  /* 3. Interpolação mais natural em gradientes */
}

/* Gradiente com oklch (interpolação correta) */
.gradient {
  background: linear-gradient(
    to right in oklch,
    oklch(50% 0.2 250),
    oklch(50% 0.2 10)
  );
  /* Interpola no espaço oklch → sem cinza sujo */
}
```

### color-mix()

```css
/* Mistura duas cores em proporção */
.elemento {
  background: color-mix(in oklch, var(--color-primary) 30%, var(--color-bg));
  border: 2px solid color-mix(in srgb, red 50%, blue);
}

/* Tonalidades a partir de uma cor base */
:root {
  --brand: oklch(50% 0.2 250);
  --brand-light: color-mix(in oklch, var(--brand) 20%, white);
  --brand-dark: color-mix(in oklch, var(--brand) 80%, black);
  --brand-soft: color-mix(in oklch, var(--brand) 10%, transparent);
}

/* Modos de interpolação */
.interp {
  background: color-mix(in hsl, red, blue);     /* espaço HSL */
  background: color-mix(in oklch, red, blue);   /* espaço oklch (melhor) */
  background: color-mix(in srgb, red, blue);    /* espaço sRGB */
  background: color-mix(in srgb-linear, red, blue);
}
```

### color-contrast() — Acessibilidade Automática

```css
/** Nota: suporte limitado (Safari 16+) */
.texto {
  /* Escolhe a cor de maior contraste entre as opções */
  color: color-contrast(var(--bg) vs white, black, #ccc);
  /* Retorna white, black, ou #ccc — qual tiver > contraste com --bg */
}
```

### relative color syntax

```css
/* Manipular canais de uma cor existente */
:root {
  --primary: oklch(50% 0.2 250);
  --primary-light: oklch(from var(--primary) 70% c h);
  /* ↑ mesma saturação (c) e hue (h), luminosidade 70% */
  --primary-gray: oklch(from var(--primary) l 0.01 h);
  /* ↑ mesma luminosidade e hue, croma quase zero (acinzentado) */
  --primary-complement: oklch(from var(--primary) l c calc(h + 180));
  /* ↑ cor complementar: hue + 180deg */
}
```

## Funções de Gradiente

```css
/* Conic gradient */
.conic {
  background: conic-gradient(from 0deg, red, yellow, green, blue, red);
}

/* Gradiente com ângulo e paradas */
.linear {
  background: linear-gradient(
    135deg in oklch,
    oklch(50% 0.2 250) 0%,
    oklch(50% 0.2 10) 100%
  );
}

/* Radial */
.radial {
  background: radial-gradient(circle at 30% 40%, oklch(80% 0.1 120), transparent);
}

/* Repetindo gradientes */
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

## filter() e backdrop-filter()

```css
/* filter: aplica no elemento */
.elemento {
  filter: brightness(1.2) contrast(0.9) saturate(1.1);
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.2));
}

/* backdrop-filter: aplica no fundo atrás do elemento */
.modal-backdrop {
  backdrop-filter: blur(8px) brightness(0.8);
}

/* Múltiplos filtros */
.foto {
  filter: sepia(0.3) hue-rotate(30deg) saturate(1.2);
}
```

## Tabela de Suporte (2026)

| Função | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| `calc()` | ✅ | ✅ | ✅ | ✅ |
| `min()` / `max()` | ✅ 79+ | ✅ 75+ | ✅ 11.1+ | ✅ 79+ |
| `clamp()` | ✅ 79+ | ✅ 75+ | ✅ 13.1+ | ✅ 79+ |
| `round()` | ✅ 120+ | ✅ 120+ | ❌ | ✅ 120+ |
| `oklch()` / `oklab` | ✅ 111+ | ✅ 113+ | ✅ 15.4+ | ✅ 111+ |
| `color-mix()` | ✅ 111+ | ✅ 113+ | ✅ 16.2+ | ✅ 111+ |
| `color-contrast()` | ❌ | ❌ | ✅ 16+ | ❌ |
| Relative color syntax | ✅ 119+ | ✅ 120+ | ✅ 16.2+ | ✅ 119+ |
| `filter()` | ✅ 53+ | ✅ 35+ | ✅ 6+ | ✅ 12+ |
| `backdrop-filter()` | ✅ 76+ | ✅ 103+ | ✅ 9+ | ✅ 17+ |
