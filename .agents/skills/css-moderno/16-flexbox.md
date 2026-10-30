# Flexbox

## Conceito

Flexbox é um modelo de layout unidimensional que distribui espaço entre itens em um **eixo** (linha ou coluna). Diferente de Grid (bidimensional), Flexbox resolve alinhamento em uma direção por vez.

## Container vs. Itens

```css
.container {
  display: flex;          /* ativa flexbox no container */
  display: inline-flex;   /* container flexível inline */
}
```

Propriedades do **container** afetam o grupo; propriedades dos **itens** afetam cada filho individualmente.

## Eixos: Main e Cross

```
flex-direction: row          → main axis = horizontal → cross axis = vertical
flex-direction: column       → main axis = vertical   → cross axis = horizontal
flex-direction: row-reverse  → main axis invertido
flex-direction: column-reverse → main axis invertido
```

## Propriedades do Container

### flex-direction — Direção do Eixo Principal

```css
.container {
  flex-direction: row;           /* padrão: horizontal, da esquerda para direita */
  flex-direction: row-reverse;   /* horizontal, invertido */
  flex-direction: column;        /* vertical, de cima para baixo */
  flex-direction: column-reverse; /* vertical, invertido */
}
```

### flex-wrap — Quebra de Linha

```css
.container {
  flex-wrap: nowrap;      /* padrão: todos na mesma linha (pode encolher) */
  flex-wrap: wrap;        /* itens quebram para nova linha */
  flex-wrap: wrap-reverse; /* quebra na direção inversa */
}

/* Atalho */
.container {
  flex-flow: row wrap; /* flex-direction + flex-wrap */
}
```

### justify-content — Alinhamento no Eixo Principal

```css
.container {
  justify-content: flex-start;    /* padrão: agrupa no início */
  justify-content: flex-end;      /* agrupa no final */
  justify-content: center;        /* centraliza */
  justify-content: space-between; /* primeiro no início, último no fim, resto distribuído */
  justify-content: space-around;  /* espaço igual ao redor de cada item */
  justify-content: space-evenly;  /* espaço exatamente igual entre todos */
}
```

### align-items — Alinhamento no Eixo Transversal

```css
.container {
  align-items: stretch;      /* padrão: estica para preencher */
  align-items: flex-start;   /* topo/alinhado ao início */
  align-items: flex-end;     /* base/alinhado ao fim */
  align-items: center;       /* centro */
  align-items: baseline;     /* alinha pela linha de base do texto */
}
```

### align-content — Alinhamento de Múltiplas Linhas

(Só funciona com `flex-wrap: wrap` e múltiplas linhas)

```css
.container {
  align-content: stretch;       /* padrão */
  align-content: flex-start;
  align-content: flex-end;
  align-content: center;
  align-content: space-between;
  align-content: space-around;
}
```

### gap — Espaçamento Entre Itens

```css
.container {
  gap: 16px;          /* espaçamento igual em ambas direções */
  gap: 16px 8px;      /* row-gap column-gap */
  row-gap: 16px;
  column-gap: 8px;
}
```

## Propriedades dos Itens

### flex-grow — Crescimento Proporcional

```css
.item {
  flex-grow: 0;  /* padrão: não cresce */
  flex-grow: 1;  /* ocupa espaço disponível igualmente */
  flex-grow: 2;  /* cresce 2x mais que itens com flex-grow: 1 */
}
```

O espaço **restante** após posicionar todos os itens é distribuído proporcionalmente ao `flex-grow`.

### flex-shrink — Encolhimento Proporcional

```css
.item {
  flex-shrink: 1; /* padrão: encolhe se necessário */
  flex-shrink: 0; /* não encolhe — mantém tamanho */
}
```

### flex-basis — Tamanho Base

```css
.item {
  flex-basis: auto;     /* padrão: usa width/content */
  flex-basis: 200px;    /* tamanho base fixo */
  flex-basis: 0;        /* ignora content — distribuição igual */
  flex-basis: 30%;      /* proporcional ao container */
  flex-basis: fit-content;
}
```

### Atalho flex

```css
.item {
  flex: 1;              /* flex-grow: 1, flex-shrink: 1, flex-basis: 0% */
  flex: 1 1 200px;      /* grow shrink basis */
  flex: 0 0 auto;       /* tamanho natural, não cresce nem encolhe */
  flex: none;           /* 0 0 auto — tamanho fixo */
  flex: auto;           /* 1 1 auto — cresce mas respeita tamanho base */
}
```

**Melhor prática**: sempre usar `flex` (atalho) em vez de propriedades individuais.

### align-self — Override de align-items

```css
.item {
  align-self: auto;        /* herda align-items do container */
  align-self: flex-start;  /* alinha este item ao topo */
  align-self: flex-end;    /* alinha à base */
  align-self: center;      /* centraliza */
  align-self: stretch;     /* estica */
  align-self: baseline;
}
```

### order — Reordenação Visual

```css
.item {
  order: 0;   /* padrão: ordem de aparição no HTML */
  order: -1;  /* antes de todos */
  order: 1;   /* depois de todos */
}
```

⚠️ `order` afeta apenas ordem visual, não a ordem de tabulação (acessibilidade).

## Padrões com Flexbox

### Centralização Total

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### Navbar com Espaçamento

```css
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
}

.nav-links {
  display: flex;
  gap: 16px;
}
```

### Sidebar com Conteúdo Flexível

```css
.sidebar-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  flex: 0 0 250px;       /* largura fixa */
}

.content {
  flex: 1;               /* ocupa o resto */
}
```

### Card com Footer Sempre no Final

```css
.card-flex {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-body {
  flex: 1;               /* empurra footer para baixo */
}

.card-footer {
  flex-shrink: 0;
}
```

### Holy Grail Layout (Flex)

```css
.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.holy-grail-middle {
  display: flex;
  flex: 1;
}

.holy-grail-middle nav,
.holy-grail-middle aside {
  flex: 0 0 200px;
}

.holy-grail-middle article {
  flex: 1;
}
```

## Flexbox vs. Grid

| Aspecto | Flexbox | Grid |
|---|---|---|
| Dimensão | Unidimensional (linha OU coluna) | Bidimensional (linhas E colunas) |
| Caso de uso | Navbars, toolbars, centering, sequência linear | Layout de página, galerias, formulários complexos |
| Controle de linhas/colunas | Indireto (wrap) | Direto (grid-template-*) |
| Distribuição de espaço | Espaço restante (flex-grow) | Trilhas definidas (fr, minmax) |
| Gap entre itens | `row-gap` + `column-gap` via `gap` | `gap` |
| Ordem visual | `order` (limitado) | grid-area / line placement |

**Regra prática**: Flexbox para componentes internos (navbar, toolbar, card); Grid para layout de página.

## Flexbox e Acessibilidade

```css
/* ✅ Correto: ordem visual = ordem DOM */
.nav { display: flex; gap: 8px; }

/* ❌ Evitar: order e row-reverse invertem tabulação */
.nav li:nth-child(2) { order: -1; }
```

## Margins em Flexbox

```css
/* Auto margin: empurra item para o extremo */
.nav {
  display: flex;
}

.nav .spacer {
  margin-inline-start: auto; /* empurra para a direita */
  /* ou */
  margin-left: auto;
}
```

## Propriedades Lógicas em Flexbox

```css
.container {
  display: flex;
  flex-direction: row;       /* respeita writing-mode */
  /* Em RTL, row inverte automaticamente */
  justify-content: start;    /* start/end em vez de flex-start/flex-end */
  align-items: start;
}
```

## Checklist

- [ ] `display: flex` no container, não nos itens
- [ ] `gap` em vez de `margin` nos itens
- [ ] `flex` atalho em vez de grow/shrink/basis separados
- [ ] `align-self` para exceções pontuais
- [ ] `order` usado com cautela (acessibilidade)
- [ ] Propriedades lógicas (`start`/`end`) para i18n
- [ ] `flex-wrap: wrap` quando layout precisa quebrar
- [ ] `min-width: 0` em itens flexíveis com overflow oculto (resolve bugs de `min-width: auto`)
