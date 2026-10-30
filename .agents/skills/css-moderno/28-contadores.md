# Contadores e Listas

## CSS Counters

Contadores permitem **numerar elementos automaticamente** via CSS, sem JavaScript. Funcionam com `counter-reset`, `counter-increment` e `counter()`.

### counter-reset — Inicializar ou Resetar Contador

```css
/* Inicializar contador no container */
.article {
  counter-reset: section;     /* nome do contador, padrão = 0 */
  counter-reset: section 1;   /* começa em 1 */
  counter-reset: figure chapter;  /* múltiplos contadores */
  counter-reset: figure 0 chapter 1; /* com valores iniciais */
}
```

### counter-increment — Incrementar Contador

```css
/* Incrementar a cada elemento */
.section-title {
  counter-increment: section;         /* +1 (padrão) */
  counter-increment: section 2;       /* +2 a cada título */
  counter-increment: figure -1;       /* decrementar */
}
```

### counter() — Exibir Valor do Contador

```css
.section-title::before {
  content: counter(section);           /* "1", "2", "3"... */
  content: counter(section, upper-roman); /* "I", "II", "III"... */
  content: "Section " counter(section) ": "; /* texto + contador */
}
```

### counters() — Contadores Aninhados

```css
/* Contadores hierárquicos (1, 1.1, 1.2, 2, 2.1...) */
.toc {
  counter-reset: chapter;
}

.toc-item {
  counter-increment: chapter;
}

.toc-item::before {
  content: counter(chapter) ". ";      /* 1. 2. 3. */
}

.toc-sublist {
  counter-reset: subchapter;
}

.toc-sublist .toc-item::before {
  content: counter(chapter) "." counter(subchapter) ". ";
  /* 1.1. 1.2. 2.1. 2.2. */
}
```

### counters() com String Separadora

```css
/* Aninhamento automático com counters() */
.toc-item {
  counter-increment: item;
}

.toc-item::before {
  content: counters(item, ".") " ";    /* "1", "1.1", "1.1.1"... */
  font-weight: bold;
}
```

### Exemplo Completo: Seções Numeradas

```css
body {
  counter-reset: section figure;
}

h2 {
  counter-increment: section;
  counter-reset: subsection;
}

h2::before {
  content: counter(section) ". ";
  color: var(--color-primary);
}

h3 {
  counter-increment: subsection;
  margin-left: 24px;
}

h3::before {
  content: counter(section) "." counter(subsection) ". ";
  color: var(--color-muted);
}

figure {
  counter-increment: figure;
}

figure figcaption::before {
  content: "Figure " counter(figure) ": ";
  font-weight: 600;
}
```

### Estilos de Contador

```css
/* Estilos disponíveis para counter() e counters() */
counter(section, decimal);          /* 1, 2, 3... (padrão) */
counter(section, decimal-leading-zero); /* 01, 02, 03... */
counter(section, lower-roman);      /* i, ii, iii... */
counter(section, upper-roman);      /* I, II, III... */
counter(section, lower-alpha);      /* a, b, c... */
counter(section, upper-alpha);      /* A, B, C... */
counter(section, lower-greek);      /* α, β, γ... */
counter(section, disc);             /* • */
counter(section, circle);           /* ◦ */
counter(section, square);           /* ▪ */
counter(section, cjk-decimal);      /* 一, 二, 三... (chinês) */
```

## @counter-style — Contadores Customizados

Define estilos de contador personalizados:

```css
@counter-style emoji-steps {
  system: fixed;
  symbols: "1️⃣" "2️⃣" "3️⃣" "4️⃣" "5️⃣";
  suffix: " ";
}

@counter-style thumbs {
  system: cyclic;
  symbols: "👍" "👎";
  suffix: " ";
}

@counter-style wins {
  system: numeric;
  symbols: "0" "1" "2" "3" "4" "5" "6" "7" "8" "9";
}

/* Uso */
li { list-style: emoji-steps; }
```

### Sistemas de @counter-style

| Sistema | Comportamento | Exemplo |
|---|---|---|
| `cyclic` | Repete símbolos em ciclo | A B C D A B... |
| `fixed` | Usa símbolo por posição, depois decimal | ⭐ ⭐⭐ ⭐⭐⭐ 4 5... |
| `symbolic` | Repete símbolo n vezes na posição n | A B C AA BB CC... |
| `alphabetic` | Como numeração alfabética | a b c aa ab ac... |
| `numeric` | Como numeração decimal | 0 1 2 3 4 5 6 7 8 9 |
| `additive` | Romano/sistema aditivo | I II III IV V... |
| `extends` | Herda de outro estilo | extends decimal |

```css
@counter-style extended-decimal {
  system: extends decimal;
  prefix: "[";
  suffix: "] ";
}

@counter-style custom-roman {
  system: additive;
  additive-symbols: V 5, IV 4, I 1;
  range: 1 10;
}
```

## List-Style — Estilização de Listas

### list-style-type

```css
ul {
  list-style-type: disc;        /* • (padrão) */
  list-style-type: circle;      /* ◦ */
  list-style-type: square;      /* ▪ */
  list-style-type: none;        /* sem marcador */
}

ol {
  list-style-type: decimal;           /* 1, 2, 3... (padrão) */
  list-style-type: decimal-leading-zero; /* 01, 02, 03... */
  list-style-type: lower-roman;       /* i, ii, iii... */
  list-style-type: upper-roman;       /* I, II, III... */
  list-style-type: lower-alpha;       /* a, b, c... */
  list-style-type: upper-alpha;       /* A, B, C... */
  list-style-type: lower-greek;       /* α, β, γ... */
}
```

### list-style-position

```css
ul {
  list-style-position: outside;   /* marcador fora do padding (padrão) */
  list-style-position: inside;    /* marcador dentro do padding */
}
```

### list-style-image

```css
ul {
  list-style-image: url("bullet.svg");    /* imagem como marcador */
  list-style-image: none;                /* padrão */
}

/* Fallback: imagem + tipo */
ul {
  list-style-type: disc;              /* fallback */
  list-style-image: url("bullet.svg"); /* substitui se carregar */
}
```

### Atalho list-style

```css
ul {
  list-style: disc outside;
  list-style: disc inside url("bullet.svg");
  list-style: none;                       /* reset completo */
}
```

### ::marker — Estilizar o Marcador

```css
li::marker {
  color: var(--color-primary);
  font-weight: bold;
  font-size: 1.2em;
  content: "▶ ";               /* substitui o marcador */
}

/* Por tipo de item */
li[data-type="warning"]::marker {
  content: "⚠ ";
  color: orange;
}

li[data-type="done"]::marker {
  content: "✓ ";
  color: green;
}
```

### ::marker com Contadores

```css
.custom-list {
  counter-reset: item;
}

.custom-list li {
  counter-increment: item;
  list-style: none;
  padding-left: 24px;
}

.custom-list li::marker {
  content: counter(item, lower-roman) ") ";
  color: var(--color-primary);
}
```

## Padrões com Contadores

### Tabela de Conteúdo Automática

```css
.toc {
  counter-reset: chapter;
}

.toc-item {
  counter-increment: chapter;
  display: flex;
  gap: 8px;
}

.toc-item::before {
  content: counter(chapter, upper-roman) ". ";
  min-width: 24px;
}

.toc-item[data-depth="2"] {
  padding-left: 24px;
}

.toc-item[data-depth="2"]::before {
  content: counters(chapter, ".") " ";
}
```

### Lista de Passos com Enumeração

```css
.steps {
  counter-reset: step;
  list-style: none;
  padding: 0;
}

.step {
  counter-increment: step;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step::before {
  content: counter(step);
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  flex-shrink: 0;
}
```

### Notas de Rodapé Automáticas

```css
body {
  counter-reset: footnote;
}

.footnote-ref {
  counter-increment: footnote;
}

.footnote-ref::after {
  content: "[" counter(footnote) "]";
  font-size: 0.75em;
  vertical-align: super;
  color: var(--color-primary);
}

.footnotes {
  counter-reset: footnote;
}

.footnotes li {
  counter-increment: footnote;
}

.footnotes li::marker {
  content: "[" counter(footnote) "] ";
  color: var(--color-primary);
}
```

## Tabela de Sistemas de Contador

| Sistema | Exemplo | Série |
|---|---|---|
| `decimal` | 1, 2, 3... | 1, 2, 3, 4 |
| `decimal-leading-zero` | 01, 02, 03... | 01, 02, 03, 04 |
| `lower-roman` | i, ii, iii... | i, ii, iii, iv |
| `upper-roman` | I, II, III... | I, II, III, IV |
| `lower-alpha` | a, b, c... | a, b, c, d |
| `upper-alpha` | A, B, C... | A, B, C, D |
| `lower-greek` | α, β, γ... | α, β, γ, δ |
| `cjk-decimal` | 一, 二, 三... | 一, 二, 三, 四 |
| `disc` | • | • • • • |
| `circle` | ◦ | ◦ ◦ ◦ ◦ |
| `square` | ▪ | ▪ ▪ ▪ ▪ |

## Checklist

- [ ] `counter-reset` no container antes de usar contadores
- [ ] `counter-increment` no elemento que dispara a numeração
- [ ] `content: counter(nome)` no `::before` ou `::marker`
- [ ] `counters(nome, ".")` para hierarquia aninhada
- [ ] `@counter-style` para estilos customizados
- [ ] `::marker` para estilizar marcador de lista (não `::before`)
- [ ] `list-style: none` + `::marker` para controle total
- [ ] Contadores não vazam entre árvores (Shadow DOM isola)
