# Seletores Avançados e Gerenciamento de Especificidade

## :has() — Seletor Parental

`:has()` permite selecionar um elemento **com base em seus descendentes ou irmãos**. Pela primeira vez no CSS, um pai pode ser estilizado baseado nos filhos.

```css
/* Estilizar um card que contém imagem */
.card:has(img) {
  grid-template-rows: auto 1fr;
}

/* Estilizar um form com erro */
.form-group:has(:user-invalid) {
  --border-color: var(--color-error);
}
.form-group:has(:user-invalid) .form-error {
  display: block;
}

/* Estilizar label baseado no estado do input */
label:has(+ input:disabled) {
  opacity: 0.5;
}

/* Selecionar link que contém apenas ícone */
a:has(> svg:only-child) {
  padding: 8px;
}

/* Layout responsivo baseado em conteúdo */
.sidebar:has(.user-menu) {
  --sidebar-width: 280px;
}
.sidebar:has(.minimal-nav) {
  --sidebar-width: 200px;
}

/* Tabela com seleção múltipla */
tr:has(input[type="checkbox"]:checked) {
  background: color-mix(in oklch, var(--color-primary) 10%, transparent);
}
```

### :has() com Combinadores

```css
/* Irmão adjacente com condição */
h2:has(+ p.intro) {
  margin-bottom: 0;
}

/* Qualquer descendente */
article:has(figure) {
  --layout: with-figure;
}

/* Descendente direto */
.menu:has(> .submenu) {
  position: relative;
}

/* Aninhamento complexo */
.card:has(figure img[data-type="hero"]) {
  grid-column: 1 / -1;
}
```

## :where() e :is()

Ambos aceitam listas de seletores, mas diferem em **especificidade**:

```css
/* :is() — a especificidade é a MAIOR da lista */
:is(header, main, footer) p { /* especificidade = 0-0-2 (como se fosse header p) */ }
:is(#sidebar, .card) a { /* especificidade = 0-1-1 (do #sidebar) */ }

/* :where() — especificidade SEMPRE ZERO */
:where(header, main, footer) p { /* especificidade = 0-0-1 (só o p) */ }
:where(#sidebar) a { /* especificidade = 0-0-1 (não importa o #sidebar) */ }
```

### Padrão: Reset com Zero Especificidade

```css
/* ✅ Reset sem especificidade — qualquer classe sobrescreve */
:where(h1, h2, h3, h4, h5, h6) {
  margin: 0;
  font-size: revert;
  font-weight: 600;
}

:where(ul, ol) {
  list-style: none;
  padding: 0;
}

:where(a) {
  text-decoration: none;
  color: inherit;
}

/* ✅ Componentes com especificidade controlada */
@layer components {
  .btn {
    padding: 8px 16px;
    border-radius: 6px;
  }

  /* :where reduz especificidade para facilitar override */
  .btn:where(:hover, :focus-visible) {
    filter: brightness(1.1);
  }
}
```

## :not() — Negação

```css
/* Excluir um tipo */
input:not([type="hidden"]) {
  border: 1px solid var(--color-border);
}

/* Múltiplas exclusões (suporte moderno) */
.elemento:not(:first-child, :last-child) {
  border-radius: 0;
}

/* Com :where para manter especificidade baixa */
.menu-item:not(:where(:hover, :focus-visible)) {
  opacity: 0.8;
}
```

## Seletores de Estado CSS

```css
/* Formulário — estados nativos (sem JS) */
input:user-invalid {
  border-color: var(--color-error);
  /* :user-invalid só ativa após interação do usuário */
}

input:blank {
  /* input vazio — ainda não implementado em todos os browsers */
}

input:placeholder-shown {
  border-color: var(--color-muted);
}

/* Alvo de âncora */
section:target {
  animation: highlight 2s ease;
}

/* Elemento vazio (sem filhos, sem texto) */
li:empty {
  display: none;
}
```

## Especificidade por Camada (@layer)

```css
@layer reset, base, components, utilities;

@layer reset {
  /* Tudo em reset tem a MENOR prioridade */
  a { color: blue; } /* < 0-0-1 */
}

@layer base {
  a { color: rebeccapurple; } /* ganha de reset */
}

@layer components {
  .btn { color: white; } /* < 0-1-0 */
}

@layer utilities {
  .text-red { color: red; } /* < 0-1-0 — ganha de components pela ordem */
}

/* Fora de @layer: MAIOR prioridade que qualquer camada */
.emergency { color: red !important; } /* !important só quando inevitável */
```

## Regra de Ouro da Especificidade

1. **Reset**: `:where()` — especificidade zero
2. **Base**: `@layer base` — type selectors (`a`, `p`, `h1`)
3. **Componentes**: `@layer components` — classes (`.btn`, `.card`)
4. **Utilitários**: `@layer utilities` — classes com `:where()` para zero
5. **Exceções**: estilo inline ou `!important` apenas em **último caso**

```css
/* Padrão completo de especificidade gerenciada */
@layer base {
  :where(a) { color: var(--color-primary); }
  :where(h1) { font-size: var(--text-h1); }
}

@layer components {
  .card { ... }               /* 0-1-0 */
  .card-title { ... }         /* 0-1-0 */
  .card:where(:hover) { ... } /* 0-1-0 (where não add especificidade) */
}

@layer utilities {
  :where(.gap-sm) { gap: 8px; }   /* 0-0-0 */
  :where(.gap-md) { gap: 16px; }  /* 0-0-0 */
}
```

## Tabela de Especificidade

| Seletor | Especificidade (a-b-c) | Exemplo |
|---|---|---|
| Universal | 0-0-0 | `*` |
| Type | 0-0-1 | `div`, `p` |
| Pseudo-element | 0-0-1 | `::before`, `::after` |
| Class | 0-1-0 | `.btn` |
| Attribute | 0-1-0 | `[type="text"]` |
| Pseudo-class | 0-1-0 | `:hover`, `:nth-child()` |
| `:where()` | depende dos args (zero) | `:where(.btn)` = 0-0-0 |
| `:is()`, `:not()`, `:has()` | depende dos args | `:has(#id)` = 0-1-0 |
| ID | 1-0-0 | `#header` |
| Inline style | 1-0-0-0 | `style="..."` |
| `!important` | quebra tudo | evitar |
