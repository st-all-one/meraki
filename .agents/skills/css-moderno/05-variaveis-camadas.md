# Custom Properties e @layer

## Custom Properties (Variáveis CSS)

### Declaração e Escopo

```css
:root {
  /* Globais — tema do sistema */
  --color-primary: oklch(50% 0.2 250);
  --color-surface: oklch(98% 0.01 250);
  --font-body: system-ui, sans-serif;
  --space-md: clamp(0.75rem, 2vw, 1.25rem);
  --radius-md: 8px;
}

.card {
  /* Locais — escopo do componente */
  --card-padding: var(--space-md);
  --card-radius: var(--radius-md);
  padding: var(--card-padding);
  border-radius: var(--card-radius);
}
```

### Fallback Chain

```css
.elemento {
  /* Fallback direto */
  color: var(--color-unknown, blue);

  /* Fallback aninhado (3 níveis máx. por performance) */
  background: var(--bg-primary, var(--bg-default, white));
}
```

### Valores Inválidos

Quando `var()` produz um valor inválido para a propriedade, o navegador usa o **valor inicial** da propriedade, não o valor herdado:

```css
:root { --bad-val: 16px; }
p { color: var(--bad-val); }
/* color espera um valor de cor; 16px é inválido → usa black (inicial) */
```

### Performance com Custom Properties

```css
/* ⚠️ Cada var() adiciona custo de resolução na cascata */
.muitas-variaveis {
  color: var(--a, var(--b, var(--c, black)));
  /* Performance aceitável para poucos usos */
}
```

**Regra**: Máximo de 3 níveis de fallback aninhado. Acima disso, usar JavaScript para pré-resolução.

### Type-Safe Custom Properties via @property

```css
@property --color-accent {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(50% 0.2 250);
}

@property --spacing-fluid {
  syntax: "<length-percentage>";
  inherits: false;
  initial-value: 16px;
}

/* Uso com type checking em tempo de compilação */
.elemento {
  --color-accent: oklch(60% 0.25 180); /* ✅ válido */
  --color-accent: 42px;                 /* ❌ inválido — ignora */
}
```

### @property Avançado: Tipos Compostos e Animações

```css
/* Union types */
@property --gap-fluid {
  syntax: "<length> | <percentage>";
  inherits: false;
  initial-value: 16px;
}

/* Animação de custom property via @property */
@property --hue {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes hue-cycle {
  to { --hue: 360deg; }
}

.elemento {
  background: oklch(50% 0.2 var(--hue));
  animation: hue-cycle 3s linear infinite;
}

/* Transform list type (experimental) */
@property --twist {
  syntax: "<transform-list>";
  inherits: false;
  initial-value: rotate(0deg);
}
```

### env() — Variáveis de Ambiente do User-Agent

```css
/* Safe areas (notch iPhone, punch-hole Android) */
body {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Viewport dimension helpers */
.elemento {
  height: env(vh, 100vh); /* fallback se env não existir */
}

/* Keyboard inset (mobile — suporte experimental) */
.fab {
  bottom: calc(16px + env(keyboard-inset-height, 0px));
}

/* Case-sensitive: safe-area-inset-top ≠ Safe-Area-Inset-Top */
```

### attr() — Atributos HTML como Valores CSS

```css
/* Uso tradicional: content */
[data-tooltip]::after {
  content: attr(data-tooltip);
}

/* Uso moderno: em qualquer propriedade (suporte crescente) */
.elemento {
  --columns: attr(data-columns number, 3);
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
}

.dynamic-size {
  width: attr(data-width px, 100px);
  height: attr(data-height px, 100px);
}

/* Tipos suportados: string, color, url, integer, number, length, angle, time, frequency, % */
.card {
  background: attr(data-bg-color color, var(--color-surface));
}
```

### Performance de @property vs var()

| Aspecto | `--var` simples | `@property --var` |
|---|---|---|
| Resolução | Cascata percorre pais | Tipo conhecido, resolução mais rápida |
| Animável | Não (string genérica) | Sim (interpolação por tipo) |
| Valor inválido | Usa valor herdado/inicial | Usa initial-value |
| Fallback | Cadeia de var() explícita | initial-value embutido |
| Override externo | Qualquer string | Apenas valores do tipo |
| Uso em @keyframes | Não funciona | Funciona |

## @layer — Controle de Cascata

### Problema que @layer Resolve

Antes de `@layer`, especificidade era o único mecanismo de precedência. Isso levava a:

```css
/* ❌ Guerra de especificidade */
.btn { color: blue; }
button.btn { color: red; } /* mais específico */
.btn[type="button"] { color: green; } /* ainda mais específico */
```

### Solução com @layer

```css
@layer reset, base, components, utilities;

@layer reset {
  * { box-sizing: border-box; margin: 0; }
}

@layer base {
  a { color: blue; }
  a:hover { text-decoration: underline; }
}

@layer components {
  .btn { color: var(--color-primary); padding: 0.5em 1em; }
}

@layer utilities {
  .mt-0 { margin-top: 0; }
  .text-center { text-align: center; }
}
```

**Ordem de precedência**: utilities > components > base > reset

### Estilos Fora de @layer

```css
/* Estilos fora de @layer têm MAIOR prioridade que qualquer @layer */
.foo { color: red; }

@layer base {
  .foo { color: blue; } /* perde para o de fora */
}
```

### @layer com @import

```css
/* Carregamento com prioridade embutida */
@import url("reset.css") layer(reset);
@import url("components.css") layer(components);
@import url("utilities.css") layer(utilities);
```

### Aninhamento de @layer

```css
@layer framework {
  @layer base, theme;

  @layer base {
    .btn { border: 1px solid; }
  }

  @layer theme {
    .btn { border-color: blue; }
  }
}

/* Referência aninhada */
@layer framework.theme {
  .btn { border-color: red; } /* sobrescreve framework.theme */
}
```

## Tema com Light/Dark

```css
:root {
  --color-bg: white;
  --color-text: black;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1a1a2e;
    --color-text: #e0e0e0;
  }
}

[data-theme="light"] {
  --color-bg: white;
  --color-text: black;
}

[data-theme="dark"] {
  --color-bg: #1a1a2e;
  --color-text: #e0e0e0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  transition: background 0.3s, color 0.3s; /* transição suave entre temas */
}
```

## Padrão: Componente com Tema

```css
.card {
  /* Valores padrão */
  --card-bg: var(--color-surface);
  --card-color: var(--color-text);
  --card-border: var(--color-border, #ccc);

  background: var(--card-bg);
  color: var(--card-color);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 16px;
}

/* Tema escuro no componente — sem afetar o resto */
.card.dark-theme {
  --card-bg: #2d2d3d;
  --card-color: #f0f0f0;
  --card-border: #444;
}
```

## Estratégia de Gerenciamento de Variáveis (Moderna)

```
1. @property → define contrato (tipo, herança, default)
2. :root → define valores do tema global
3. Componente → define valores locais via --custom
4. Fallback automático via initial-value do @property
5. env() para variáveis de ambiente (sistema)
6. attr() para dados dinâmicos (HTML → CSS sem JS)
```

```css
/* Sistema completo */
@property --color-bg { syntax: "<color>"; inherits: true; initial-value: white; }
@property --color-text { syntax: "<color>"; inherits: true; initial-value: black; }
@property --space-unit { syntax: "<length>"; inherits: false; initial-value: 4px; }

:root {
  --color-bg: white;
  --color-text: black;
  --space-unit: 4px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #121212;
    --color-text: #e0e0e0;
  }
}

.componente {
  background: var(--color-bg);
  color: var(--color-text);
  padding: calc(var(--space-unit) * 4);
}

/* Tema inline via atributo data- */
[data-theme="dark"] {
  --color-bg: #121212;
  --color-text: #e0e0e0;
}

/* Safe areas + custom properties = mobile first */
.app {
  padding-top: env(safe-area-inset-top, var(--space-safe-top, 0px));
}
```

## Checklist

- [ ] Variáveis animáveis registradas com `@property`
- [ ] `@property` com `syntax`, `inherits`, `initial-value` sempre definidos
- [ ] `inherits: false` para props de escopo local (performance)
- [ ] `inherits: true` para props de tema (herança natural)
- [ ] `env()` usado para safe areas mobile
- [ ] `attr()` para dados que já estão no HTML
- [ ] Variáveis semânticas em `:root` (propósito > valor)
- [ ] `@layer` declarado antes de qualquer estilo
- [ ] Ordem: `@layer reset, base, components, utilities`
- [ ] Fallback de var() nunca ultrapassa 3 níveis
- [ ] Temas usam apenas variáveis; sem hard-coded colors
