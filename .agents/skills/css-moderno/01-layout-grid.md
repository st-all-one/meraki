# CSS Grid Moderno

## Conceitos Fundamentais

### Grid Explícito vs. Implícito

```css
.grid-explicito {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 200px auto;
  /* Apenas 2 linhas explícitas; linhas extras vão para o grid implícito */
  grid-auto-rows: minmax(100px, auto); /* controle do implícito */
}
```

### A Unidade `fr`

`fr` distribui **espaço disponível** após itens com tamanho fixo. Diferente de `%`:

```css
.grid-fr {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  /* 200px fixa, restante dividido igualmente entre as duas fr */
}
```

### Funções-Chave

| Função | Propósito |
|---|---|
| `repeat(3, 1fr)` | Repetir padrão de trilhas |
| `minmax(200px, 1fr)` | Mínimo de 200px, depois expande |
| `fit-content(300px)` | Como `max-content` mas limitado a 300px |
| `clamp(200px, 50%, 600px)` | Valor fluido entre limites |
| `min(100%, 400px)` | O menor entre dois valores |
| `max(300px, 50%)` | O maior entre dois valores |

### Grid Template Areas (Padrão Preferido)

```css
.layout {
  display: grid;
  grid-template-columns: 250px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header  header"
    "sidebar main    aside"
    "footer  footer  footer";
  min-height: 100vh;
  gap: 16px;
}

header { grid-area: header; }
main   { grid-area: main; }
aside  { grid-area: aside; }
footer { grid-area: footer; }
```

**Vantagens**: auto-documentável, fácil reordenar em media queries, sem números mágicos.

### Posicionamento por Linhas (Quando Áreas Não São Suficientes)

```css
.grid-linhas {
  display: grid;
  grid-template-columns: [full-start] 1fr [content-start] minmax(auto, 800px) [content-end] 1fr [full-end];
}

.full-width {
  grid-column: full-start / full-end;
}

.content {
  grid-column: content-start / content-end;
}
```

Nomes de linha permitem **layouts assimétricos e híbridos** sem aninhamento extra.

## Auto-Placement Inteligente

```css
.galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.galeria > .destaque {
  grid-column: span 2;
  grid-row: span 2;
}
```

Usar `auto-fill` + `minmax` cria **grids responsivos sem media queries**. O navegador decide quantas colunas cabem.

## Box Alignment

```css
.container {
  display: grid;
  justify-items: center;     /* eixo inline (horizontal padrão) */
  align-items: start;        /* eixo block (vertical padrão) */
  justify-content: center;   /* alinhamento do grid container */
  align-content: start;
}

.item {
  justify-self: end;         /* override por item */
  align-self: stretch;
}
```

Sempre preferir `start`/`end`/`center`/`stretch` em vez de `left`/`right` para respeitar writing modes.

## Gap vs. Margin

```css
/* ✅ Correto */
.grid {
  display: grid;
  gap: 24px;
}

/* ❌ Evitar */
.grid-item {
  margin: 12px; /* quebra o alinhamento das bordas */
}
```

`gap` não colapsa e mantém alinhamento perfeito nas bordas do container.

## Performance em Grid

- Preferir `grid-template-areas` para layouts de página (mais declarativo, menos recalculo)
- `subgrid` reduz aninhamento desnecessário (ver `02-subgrid.md`)
- `auto-fill` com `minmax` evita media queries, reduzindo CSS processado
- Usar `contain: layout style` em grids grandes para isolar subárvores
