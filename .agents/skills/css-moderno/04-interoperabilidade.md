# Interoperabilidade Cross-Browser

## Princípio Fundamental

CSS é **resiliente por construção**: navegadores ignoram declarações que não entendem. Isso permite **aprimoramento progressivo** sem custo.

```css
/* Todos os navegadores entendem */
.elemento {
  display: block;
}

/* Navegadores modernos aplicam; legados ignoram */
@supports (display: grid) {
  .elemento {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

## Feature Detection com @supports

```css
/* Layout principal com grid, fallback com flexbox */
.container {
  display: flex;
  flex-wrap: wrap;
}

@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 24px;
  }

  .container > * {
    margin: 0; /* remove fallback margin quando grid está ativo */
  }
}
```

## Subgrid Fallback (Caso Crítico)

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.card {
  display: grid;
  gap: 8px;
  /* Fallback: linhas definidas explicitamente */
  grid-template-rows: auto 1fr auto;
}

/* Quando subgrid é suportado */
@supports (grid-template-rows: subgrid) {
  .card {
    grid-template-rows: subgrid;
    grid-row: span 3;
    gap: 0; /* delega gap para o pai */
  }
}
```

## Vendor Prefixes (Quando Usar)

```css
/* ✅ Apenas para propriedades que realmente precisam */
.elemento {
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
```

**Nunca prefixar** propriedades padrão bem suportadas (Grid, Flexbox, Custom Properties). Usar Autoprefixer em build tooling em vez de escrever prefixes manualmente.

## Tabela de Suporte (2026)

| Recurso | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| CSS Grid | ✅ | ✅ | ✅ | ✅ |
| Subgrid | ✅ 117+ | ✅ 71+ | ✅ 16+ | ✅ 117+ |
| `@layer` | ✅ 99+ | ✅ 97+ | ✅ 15.4+ | ✅ 99+ |
| `:has()` | ✅ 105+ | ✅ 103+ | ✅ 15.4+ | ✅ 105+ |
| `container` queries | ✅ 105+ | ✅ 110+ | ✅ 16.2+ | ✅ 105+ |
| `content-visibility` | ✅ 85+ | ✅ 107+ | ✅ 15.4+ | ✅ 85+ |
| `color-mix()` | ✅ 109+ | ✅ 110+ | ✅ 16.2+ | ✅ 109+ |
| `subgrid` | ✅ 117+ | ✅ 71+ | ✅ 16+ | ✅ 117+ |

## Padrão de Fallback Robusto (3 Níveis)

```css
.card {
  /* Nível 1: Legado (block normal) */
  display: block;
  margin-bottom: 16px;

  /* Nível 2: Flexbox */
  display: flex;
  flex-direction: column;
}

@supports (display: grid) {
  /* Nível 3: Grid */
  .card {
    display: grid;
    grid-template-rows: auto 1fr auto;
    margin-bottom: 0;
  }
}
```

## Propriedades Lógicas para Internacionalização

```css
/* ✅ Funciona em LTR e RTL */
.elemento {
  margin-inline-start: 16px;
  padding-block: 8px 16px;
  border-inline-end: 2px solid currentColor;
}

/* ❌ Quebra em RTL */
.elemento {
  margin-left: 16px;
  padding-top: 8px;
  padding-bottom: 16px;
  border-right: 2px solid currentColor;
}
```

## Color Interoperability

```css
/* ✅ Mais interoperável: números, não nomes */
.elemento {
  color: rgb(33 37 41);       /* sintaxe moderna sem vírgulas */
  color: hsl(220 10% 20%);   /* HSL sem vírgulas */
  color: oklch(45% 0.1 250); /* OKLCH — gama mais ampla */
}

/* ❌ Menos interoperável: nomes de cor */
.elemento {
  color: darkgray; /* interpretação pode variar */
}
```

## Reset Moderno (Interoperável)

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Remove estilos padrão que variam entre browsers */
:where(ul, ol) {
  list-style: none;
}

:where(img, video) {
  display: block;
  max-width: 100%;
  height: auto;
}

:where(button, input, select, textarea) {
  font: inherit;
  color: inherit;
}
```

## Testing Matrix

Sempre testar:

1. **Navegadores**: Chrome, Firefox, Safari (mobile + desktop)
2. **Modos**: LTR e RTL, prefers-reduced-motion, prefers-color-scheme
3. **Zoom**: 100%, 200%, 300%
4. **Viewports**: 320px (mobile narrow), 768px (tablet), 1440px (desktop)
5. **Input**: mouse, teclado, touch, leitor de tela
