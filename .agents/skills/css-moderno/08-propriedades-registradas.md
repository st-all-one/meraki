# Propriedades Registradas com @property

## Conceito

`@property` permite registrar **propriedades customizadas com tipo**, tornando-as type-safe, animáveis e semanticamente explícitas. Sem `@property`, o navegador trata `--*` como strings genéricas — ele não sabe se o valor é uma cor, comprimento ou número.

```css
/* ❌ Sem @property: o navegador não entende o tipo */
:root {
  --color-primary: oklch(50% 0.2 250);
  --scale-ratio: 1.5;
  --duration-fast: 200ms;
}

/* ✅ Com @property: tipos explícitos, animáveis */
@property --color-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(50% 0.2 250);
}

@property --scale-ratio {
  syntax: "<number>";
  inherits: false;
  initial-value: 1.5;
}

@property --duration-fast {
  syntax: "<time>";
  inherits: false;
  initial-value: 200ms;
}
```

## Syntax (Tipos Suportados)

| Tipo | Exemplo | Uso |
|---|---|---|
| `<length>` | `16px`, `1rem`, `10cqw` | Dimensões |
| `<number>` | `1.5`, `0.8` | Multiplicadores, escalas |
| `<percentage>` | `50%`, `100%` | Proporções |
| `<length-percentage>` | `16px`, `50%`, `clamp(200px, 50%, 400px)` | Flexível |
| `<color>` | `oklch(50% 0.2 250)`, `#ff0` | Cores |
| `<image>` | `url(img.jpg)`, `linear-gradient(...)` | Imagens |
| `<url>` | `url(font.woff2)` | URLs |
| `<integer>` | `1`, `42` | Inteiros |
| `<angle>` | `45deg`, `0.5turn` | Ângulos |
| `<time>` | `200ms`, `0.3s` | Durações |
| `<resolution>` | `72dpi`, `2dppx` | Resoluções |
| `<custom-ident>` | `auto`, `cover` | Identificadores |
| `<transform-function>` | `rotate(45deg)`, `scale(1.5)` | Transformações |
| `<transform-list>` | `scale(1.5) rotate(45deg)` | Lista de transformações |
| `*` | qualquer valor | Tipo genérico (padrão) |

### Múltiplos Tipos (Union)

```css
@property --gap-fluid {
  syntax: "<length> | <percentage>";
  inherits: false;
  initial-value: 16px;
}

@property --size-clamp {
  syntax: "<length-percentage> | <number>";
  inherits: false;
  initial-value: 200px;
}
```

## Animações com @property

Sem `@property`, transições em custom properties não funcionam (o navegador não sabe interpolar strings). Com `@property`, a animação passa a ser possível:

```css
@property --hue {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.elemento {
  --hue: 0deg;
  background: oklch(50% 0.2 var(--hue));
  transition: --hue 0.5s ease;
}

.elemento:hover {
  --hue: 180deg; /* transiciona suavemente */
}
```

## Herança vs. Não-Herança

```css
/* Herdado: filhos herdam o valor */
@property --theme-color {
  syntax: "<color>";
  inherits: true;
  initial-value: black;
}

/* Não-herdado: cada elemento usa initial-value se não definido */
@property --local-offset {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}
```

## Comparação: @property vs. var() Simples

| Aspecto | `--var` simples | `@property --var` |
|---|---|---|
| Type safety | Nenhum (string genérica) | Tipado (rejeita valores inválidos) |
| Animável | Não | Sim |
| Valor inválido | Usa valor herdado/inicial | Usa `initial-value` |
| Performance | Resolução na cascata | Resolução otimizada pelo tipo |
| Fallback | `var(--x, fallback)` | `initial-value` embutido |
| Customização externa | Qualquer string | Apenas valores do tipo |

## Padrão: Sistema de Tema Type-Safe

```css
@property --color-bg {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(98% 0.01 260);
}

@property --color-text {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(20% 0.03 260);
}

@property --color-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(50% 0.2 250);
}

@property --space-unit {
  syntax: "<length>";
  inherits: false;
  initial-value: 4px;
}

@property --radius-sm {
  syntax: "<length>";
  inherits: false;
  initial-value: 4px;
}

:root {
  --color-bg: oklch(98% 0.01 260);
  --color-text: oklch(20% 0.03 260);
  --color-primary: oklch(50% 0.2 250);
  --space-unit: 4px;
}

[data-theme="dark"] {
  --color-bg: oklch(15% 0.02 260);
  --color-text: oklch(90% 0.01 260);
  --color-primary: oklch(60% 0.2 250);
}
```

## env() — Variáveis de Ambiente

`env()` funciona como `var()`, mas para variáveis **fornecidas pelo user-agent**:

```css
/* Safe areas (notch iPhone) */
body {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Viewport dimensions (experimental) */
.elemento {
  height: env(vh, 100vh);
}

/* Keyboard inset (mobile) */
.fab {
  bottom: calc(16px + env(keyboard-inset-height, 0px));
}
```

## attr() — Atributos HTML como Valores CSS

`attr()` lê atributos HTML diretamente:

```css
/* Básico: content */
[data-tooltip]::after {
  content: attr(data-tooltip);
}

/* Com tipo (suporte experimental em alguns navegadores) */
.elemento {
  --columns: attr(data-columns number, 3);
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
}

.pixel-size {
  width: attr(data-width px, 100px);
  height: attr(data-height px, 100px);
}
```

## Performance de @property

1. **Resolução mais rápida** que `var()` simples, pois o tipo é conhecido
2. **Animações GPU-compatíveis** quando o tipo mapeia para propriedades composite (`<color>`, `<number>`, `<length>`)
3. **Sem re-parsing** em atribuição via JS: `el.style.setProperty('--hue', '180deg')` não precisa revalidar
4. **Initial-value embutido** elimina a cadeia de fallback na cascata

## Checklist

- [ ] Propriedades animáveis usam `@property` com `<color>`, `<number>`, `<length>`
- [ ] `inherits: false` para propriedades de escopo local (performance)
- [ ] `inherits: true` para propriedades de tema (herança natural)
- [ ] `initial-value` sempre definido (nunca depende de fallback externo)
- [ ] `env()` para safe areas mobile
- [ ] `attr()` para dados dinâmicos do HTML (evitar JS para valores simples)
