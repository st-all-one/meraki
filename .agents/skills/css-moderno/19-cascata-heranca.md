# Cascata, Herança e Keywords Globais

## A Cascata (Cascade)

A cascata determina **qual valor de propriedade é aplicado** quando múltiplas regras conflitam. Três fatores em ordem de prioridade:

1. **Importância** (`!important` quebra a cascata)
2. **Origem do estilo** (User-agent < User < Author < Author !important < User !important)
3. **Especificidade** (maior vence)
4. **Ordem de declaração** (última vence em especificidade igual)

### Exemplo de Resolução

```css
/* Especificidade 0-0-1 */
p { color: blue; }

/* Especificidade 0-1-0 */
.text { color: red; }

/* Especificidade 0-1-1 */
p.text { color: green; }

/* Resultado: <p class="text"> → green (maior especificidade) */
```

### Ordem de Declaração

```css
.btn { color: blue; }
.btn { color: red; }
/* <button class="btn"> → red (último vence com mesma especificidade) */
```

### !important — Último Recurso

```css
/* ✅ Aceitável em: utilitários, reset de terceiros, preferências do usuário */
.emergency { color: red !important; }

/* ❌ Evitar: uso sistêmico — quebra o princípio da cascata */
.btn { color: blue !important; }
.btn-primary { color: red; } /* não sobrescreve SEM !important */
```

`!important` **inverte a prioridade das origens** — author !important > user !important > user-agent.

Estratégia: usar `@layer` em vez de `!important` para controle de precedência.

### @layer — Hierarquia de Camadas

```css
/* Declaração de ordem */
@layer reset, base, components, utilities;

/* Camadas com precedência da DIREITA para ESQUERDA (utilities vence) */
```

(Detalhado em `05-variaveis-camadas.md`.)

## Herança

Algumas propriedades CSS são **herdadas** dos pais para os filhos automaticamente; outras não.

### Propriedades Herdadas (padrão)

```css
/* Texto */
color, font-family, font-size, font-weight, font-style
line-height, letter-spacing, word-spacing, text-align
text-indent, text-shadow, text-transform, white-space
word-break, overflow-wrap, hyphens

/* Visibilidade */
visibility, cursor

/* Listas */
list-style, list-style-type

/* Outras */
direction, tab-size, writing-mode
```

### Propriedades NÃO Herdadas

```css
/* Box model */
width, height, margin, padding, border, box-sizing

/* Layout */
display, position, float, flex-*, grid-*

/* Background */
background, background-color, background-image

/* Outras */
overflow, transform, animation, transition
```

### Controle de Herança com Valores Globais

```css
.parent {
  color: blue;
  font-size: 16px;
  border: 2px solid black;    /* não herdado */
}

.child {
  /* herda color e font-size automaticamente */
  /* NÃO herda border */
}
```

## Keywords Globais

Toda propriedade CSS aceita estas quatro keywords:

### inherit — Força Herança

```css
/* Força o elemento a herdar do pai, mesmo que a propriedade não seja herdada */
.child {
  border: inherit;     /* filho herda a borda do pai */
  margin: inherit;     /* filho herda a margem do pai */
}

/* Caso de uso: links em um card herdarem a cor */
.card a {
  color: inherit;      /* link usa a cor do card, não o azul padrão */
  text-decoration: inherit;
}
```

### initial — Valor Inicial (Padrão do Navegador)

```css
/* Reseta para o valor definido na especificação CSS */
.elemento {
  color: initial;      /* black (valor inicial de color) */
  display: initial;    /* inline (valor inicial de display) */
  font-size: initial;  /* medium (~16px) */
}
```

### unset — Herda se Herdável, Inicial se Não

```css
/* Comportamento misto */
.elemento {
  color: unset;        /* herdado → herda do pai */
  border: unset;       /* não herdado → initial (none) */
  margin: unset;       /* não herdado → initial (0) */
}

/* Útil para reset completo */
.reset {
  all: unset;          /* reseta TODAS as propriedades */
}
```

### revert — Valor Padrão do Navegador

```css
/* Diferente de initial: reverte para o estilo do user-agent */
.revert-example {
  color: revert;       /* volta ao estilo padrão do navegador */
  display: revert;     /* volta a block para div, inline para span */
}

/* Caso de uso: desfaz estilos do author sem perder user-agent */
.link-revert {
  color: revert;       /* mostra link na cor padrão do navegador (blue) */
}
```

### Tabela Comparativa

| Keyword | Herdável | Não Herdável | Volta ao User-Agent |
|---|---|---|---|
| `inherit` | Herda | Herda | Não |
| `initial` | Valor inicial | Valor inicial | Não |
| `unset` | Herda | Valor inicial | Não |
| `revert` | Valor do user-agent | Valor do user-agent | Sim |

### all — Reseta Todas as Propriedades

```css
.reset-all {
  all: initial;        /* reseta TUDO para valores iniciais */
  all: unset;          /* reseta TUDO (herança mista) */
  all: revert;         /* volta aos estilos do user-agent */
  all: inherit;        /* herda TUDO do pai */
}

/* Útil para componentes isolados */
.widget-reset {
  all: revert;         /* remove estilos do tema, volta ao navegador */
  /* depois aplica estilos específicos */
}
```

## Processamento de Valores CSS

O navegador processa cada valor em 4 estágios:

1. **Valor inicial** — definido na especificação (ex: `display: inline`)
2. **Valor especificado** — o que o autor escreveu no CSS
3. **Valor computado** — resolvido sem layout (ex: `%` → `px`, `em` → `px`)
4. **Valor usado** — resolvido com layout (ex: `width: auto` → `800px`)
5. **Valor real** — o que o navegador realmente renderiza (pode arredondar)

```css
.box {
  width: 50%;            /* especificado */
  /* computado: 400px (se containing block = 800px) */
  /* usado: 400px */
  font-size: 1.2em;      /* especificado */
  /* computado: 19.2px (se pai tem 16px) */
}
```

## Shorthand Properties

Propriedades abreviadas que definem múltiplos valores de uma vez:

```css
/* background */
background: #fff url(bg.jpg) no-repeat center / cover;

/* Equivale a: */
background-color: #fff;
background-image: url(bg.jpg);
background-repeat: no-repeat;
background-position: center;
background-size: cover;

/* font */
font: 600 1rem/1.5 "Inter", system-ui, sans-serif;
/* font-weight font-size/line-height font-family */

/* animation */
animation: slide-in 0.3s ease forwards;
/* animation-name duration timing-function fill-mode */

/* margin / padding */
margin: 8px 16px;        /* top/bottom left/right */

/* border */
border: 2px solid #ccc;

/* flex */
flex: 1 1 200px;

/* grid */
grid: auto-flow dense / repeat(3, 1fr);
```

### ⚠️ Cuidados com Shorthands

Shorthands **sempre resetam** as sub-propriedades não declaradas para `initial`:

```css
.elemento {
  background-color: red;
  background-image: url(bg.jpg);

  /* PROBLEMA: este reset limpa background-color e background-image */
  background: none;  /* zera tudo — não só a imagem */
}

/* ✅ Correto: resetar apenas o que precisa */
.elemento {
  background-image: none;  /* só limpa a imagem */
}
```

## Exemplos de Resolução Completa

```css
/* HTML: <p class="text" style="color: purple">Texto</p> */

/* User-agent: */
p { color: black; display: block; margin: 16px 0; }

/* Author: */
.text { color: blue; }
p { color: red; }
p { color: green; }

/* Inline: */
style="color: purple"

/* Resultado: purple (inline > author > user-agent) */

/* Se não houvesse inline: green (último author com mesma especificidade) */
```

## Estratégia Moderna de Cascata

```
1. @layer reset      → :where() + revert (especificidade zero)
2. @layer base       → type selectors (a, p, h1)
3. @layer components → classes (.btn, .card)
4. @layer utilities  → :where(.gap-md) (especificidade zero)
5. Estilos fora      → exceções específicas
6. Inline style      → valores dinâmicos (JS)
7. !important        → só em último caso (preferências do usuário)
```

## Checklist

- [ ] `@layer` declarado antes de qualquer estilo
- [ ] `!important` ausente (exceto em resets de terceiros)
- [ ] `inherit` usado para forçar herança quando necessário
- [ ] `all: unset` ou `all: revert` para reset isolado
- [ ] Shorthands usadas com cuidado (não resetam sub-propriedades indesejadas)
- [ ] `revert` preferido a `initial` para reset que respeita user-agent
- [ ] Nenhum estilo autor ultrapassa especificidade 0-1-0 ou 1-0-0 (IDs evitados)
