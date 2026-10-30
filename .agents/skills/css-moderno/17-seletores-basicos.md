# Seletores CSS: Fundamentos

## Classificação

| Tipo | Exemplo | Especificidade (a-b-c) |
|---|---|---|
| Universal | `*` | 0-0-0 |
| Tipo (type) | `div`, `p`, `h1` | 0-0-1 |
| Classe | `.btn`, `.container` | 0-1-0 |
| ID | `#header`, `#main` | 1-0-0 |
| Atributo | `[type="text"]` | 0-1-0 |
| Pseudo-classe | `:hover`, `:first-child` | 0-1-0 |
| Pseudo-elemento | `::before`, `::after` | 0-0-1 |

## Seletores Básicos

### Universal

```css
* { box-sizing: border-box; }           /* todos os elementos */
*::before, *::after { box-sizing: border-box; }
```

### Type Selector

```css
div { margin: 0; }                       /* todas as divs */
p { line-height: 1.6; }                 /* todos os parágrafos */
h1, h2, h3 { font-weight: 600; }       /* múltiplos tipos */
```

### Class Selector

```css
.btn { padding: 8px 16px; }            /* qualquer elemento com class="btn" */
.card.featured { border-color: gold; } /* .card E .featured simultaneamente */
```

### ID Selector

```css
#header { height: 60px; }             /* único elemento com id="header" */
#main-content { flex: 1; }
```

⚠️ IDs têm **alta especificidade** — evite para estilos de componente. Prefira classes.

## Combinadores

```css
/* Descendente (espaço) — qualquer filho, em qualquer profundidade */
article p { color: gray; }

/* Filho direto (>) — apenas filhos imediatos */
.menu > li { list-style: none; }

/* Irmão adjacente (+) — o primeiro irmão imediatamente após */
h2 + p { margin-top: 0; }

/* Irmãos subsequentes (~) — todos os irmãos após */
h2 ~ p { color: #666; }

/* Combinador de coluna (||) — experimental */
col.selected || td { background: yellow; }
```

### Exemplos Combinados

```css
/* Link dentro de card */
.card a { color: var(--color-primary); }

/* Primeiro item de uma lista dentro do menu */
nav > ul > li:first-child { border-top: none; }

/* Título seguido de parágrafo */
.section-title + .section-body { margin-top: 8px; }

/* Todos os parágrafos após o título em uma seção */
section h2 ~ p { padding-inline-start: 16px; }
```

## Seletores de Atributo

```css
/* Presença do atributo */
[disabled] { opacity: 0.5; }
[hidden] { display: none; }

/* Igualdade exata */
[type="text"] { border: 1px solid #ccc; }
[data-variant="primary"] { background: blue; }

/* Começa com */
[href^="https"] { color: green; }             /* links seguros */
[class^="col-"] { padding: 8px; }             /* classe com prefixo */

/* Termina com */
[src$=".svg"] { display: inline; }             /* SVGs */
[href$=".pdf"]::after { content: " (PDF)"; }   /* links de PDF */

/* Contém */
[class*="btn"] { cursor: pointer; }            /* classe contém "btn" */
[href*="example.com"] { color: red; }          /* link para domínio específico */

/* Contém palavra (separada por espaço) */
[rel~="external"] { target: _blank; }          /* valor em lista separada por espaço */

/* Começa com valor em lista separada por hífen */
[lang|="en"] { font-family: serif; }           /* en, en-US, en-GB */
```

### Combinando Atributo + Classe

```css
/* Input de texto com erro */
input[type="text"].error { border-color: red; }

/* Link externo em card */
.card a[href^="http"]::after { content: " ↗"; }
```

## Pseudo-classes (Estado)

```css
/* Interação */
a:link { color: blue; }              /* link não visitado */
a:visited { color: purple; }         /* link visitado */
a:hover { text-decoration: underline; } /* mouse sobre */
a:active { color: red; }             /* sendo clicado */
input:focus { outline: 2px solid blue; } /* foco */
:focus-visible { outline: 2px solid; }   /* foco via teclado */
:target { background: yellow; }      /* alvo de URL âncora */

/* Formulário */
input:disabled { opacity: 0.5; }     /* desabilitado */
input:enabled { cursor: text; }      /* habilitado */
input:read-only { background: #f5f5f5; }
input:read-write { background: white; }
input:required { border-left: 3px solid red; }
input:optional { border-left: 3px solid gray; }
input:checked + label { font-weight: bold; } /* checkbox/radio marcado */
input:valid { border-color: green; }
input:invalid { border-color: red; }
input:in-range { border-color: green; }
input:out-of-range { border-color: orange; }
input:placeholder-shown { color: #999; }
:user-invalid { border-color: #dc3545; } /* após interação do usuário */

/* Estruturais */
:root { --color-primary: blue; }     /* elemento raiz (html) */
:empty { display: none; }            /* sem filhos */
:blank { display: none; }            /* vazio (incluindo whitespace) */

/* Negação */
input:not([type="hidden"]) { display: block; }
.btn:not(:last-child) { margin-right: 8px; }
```

## Pseudo-classes Estruturais (Filhos)

```css
/* Primeiro/último */
li:first-child { border-top: none; }
li:last-child { border-bottom: none; }
p:only-child { margin: 0; }                /* único filho */
p:only-of-type { font-size: 1.2em; }      /* único do tipo */

/* Posicional */
tr:nth-child(odd) { background: #f9f9f9; }         /* ímpares */
tr:nth-child(even) { background: white; }           /* pares */
li:nth-child(3) { color: red; }                     /* terceiro */
li:nth-child(3n+1) { color: blue; }                 /* 1, 4, 7, 10... */
li:nth-last-child(2) { margin-bottom: 0; }          /* penúltimo */

/* Por tipo */
p:first-of-type { margin-top: 0; }
p:last-of-type { margin-bottom: 0; }
li:nth-of-type(2n) { background: #eee; }
li:nth-last-of-type(1) { border-bottom: none; }
```

```css
/* Tabela zebrada simplificada */
tbody tr:nth-child(even) { background: var(--color-surface-alt, #f5f5f5); }

/* Grid com 3 colunas — remove margem da 3n */
.grid-item:nth-child(3n) { margin-right: 0; }

/* Primeiro e último filho sem borda */
.menu-item:first-child { border-radius: 8px 0 0 8px; }
.menu-item:last-child { border-radius: 0 8px 8px 0; }
```

## Pseudo-elementos

```css
/* ::before e ::after — conteúdo gerado */
.btn-icon::before {
  content: "★";
  margin-right: 4px;
}

.tooltip[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  /* estiliza tooltip */
}

/* ::first-letter — primeira letra */
p::first-letter {
  font-size: 2em;
  font-weight: bold;
  float: left;
  margin-right: 4px;
}

/* ::first-line — primeira linha */
p::first-line {
  font-weight: 600;
  color: var(--color-primary);
}

/* ::selection — destaque de seleção do usuário */
::selection {
  background: var(--color-primary);
  color: white;
}

/* ::backdrop — fundo de dialog/modal */
dialog::backdrop {
  background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(4px);
}

/* ::placeholder — texto de placeholder */
input::placeholder {
  color: #999;
  opacity: 1;
}

/* ::marker — bullet de lista */
li::marker {
  color: var(--color-primary);
  font-weight: bold;
}

/* ::file-selector-button — botão de file input */
input[type="file"]::file-selector-button {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f0f0f0;
  cursor: pointer;
}
```

### ::before e ::after — Propriedades Essenciais

```css
/* Sempre precisam de content */
.elemento::before {
  content: "";            /* vazio mas necessário */
  content: "texto";       /* texto literal */
  content: attr(data-x);  /* valor de atributo */
  content: counter(n);    /* valor de contador */
  content: url(icon.svg); /* imagem */
  content: open-quote;    /* aspas abertas */
  content: close-quote;   /* aspas fechadas */

  display: block;         /* se quiser dimensões */
  width: 16px;
  height: 16px;
}
```

## Combinando Seletores (BEM)

```css
/* BEM — Block Element Modifier */
.card { }                    /* bloco */
.card__title { }             /* elemento */
.card__title--featured { }   /* modificador */

/* Uso típico */
.card { border: 1px solid #ddd; }
.card__title { font-size: 1.125rem; }
.card__title--featured { color: gold; }
.card__body { padding: 16px; }
.card__footer { border-top: 1px solid #eee; }
```

## Boas Práticas

```css
/* ✅ Preferir classes a IDs para estilos */
.btn-primary { background: blue; }           /* 0-1-0 */

/* ❌ Evitar IDs para estilos */
#btn-primary { background: blue; }           /* 1-0-0 — difícil override */

/* ✅ Usar :where() para resets com especificidade zero */
:where(ul, ol) { list-style: none; }

/* ❌ Evitar seletores muito profundos */
article section div p a { color: blue; }     /* frágil, alta especificidade */

/* ✅ Preferir classe direta */
.link { color: blue; }
```

## Tabela de Especificidade

| Padrão | Especificidade | Exemplo |
|---|---|---|
| `*` | 0-0-0 | qualquer elemento |
| `p`, `h1`, `div` | 0-0-1 | type selectors |
| `::before`, `::after` | 0-0-1 | pseudo-elementos |
| `.btn`, `[type]` | 0-1-0 | classes e atributos |
| `:hover`, `:first-child` | 0-1-0 | pseudo-classes |
| `#header` | 1-0-0 | ID |
| `style="..."` | 1-0-0-0 | inline |

## Checklist

- [ ] `:hover` e `:focus` sempre juntos para acessibilidade
- [ ] `:focus-visible` em vez de `:focus` para outline
- [ ] `::before`/`::after` sempre com `content`
- [ ] IDs apenas para âncoras/JavaScript, não para estilos
- [ ] Preferir combinador `>` quando só filhos diretos importam
- [ ] `:not()` com lista para exclusões múltiplas
- [ ] `:where()` para resets com especificidade zero
- [ ] Seletores com no máximo 3 níveis de profundidade
