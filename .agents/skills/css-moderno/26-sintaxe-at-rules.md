# Sintaxe CSS e At-Rules

## Estrutura de uma Regra CSS

```css
seletor {
  propriedade: valor;
}

/* Exemplo */
.card {
  background: white;
  border-radius: 8px;
}
```

### Componentes

- **Seletor**: define quais elementos serão estilizados
- **Declaração**: par `propriedade: valor` dentro de chaves `{}`
- **Propriedade**: característica a ser alterada (ex: `color`, `display`)
- **Valor**: o novo valor da propriedade (ex: `red`, `flex`)

### Comentários

```css
/* Comentário de uma linha */
/*
  Comentário
  de múltiplas
  linhas
*/
```

### Whitespace

CSS ignora espaços extras, quebras de linha e tabs. Isso permite formatação livre:

```css
/* Todos equivalentes */
.card {color:red;}
.card {
  color: red;
}
.card
{
  color
  :
  red
  ;
}
```

## At-Rules (@rules)

Regras especiais que começam com `@` e controlam comportamento do CSS.

### @charset — Codificação do Arquivo

```css
/* Deve ser a PRIMEIRA linha do arquivo, antes de qualquer outra regra */
@charset "UTF-8";

/* Define a codificação do arquivo CSS */
/* Útil para caracteres especiais em content, nomes de font-family, etc. */
```

Regras:
- Deve ser exatamente a primeira linha do arquivo
- Não pode ter whitespace antes
- Sintaxe: `@charset "UTF-8";` (case-insensitive)
- Arquivos CSS modernos geralmente usam UTF-8 por padrão
- Raramente necessário hoje — a maioria dos servidores envia charset via HTTP header

### @import — Importar Arquivos CSS

```css
/* Importar outro arquivo CSS */
@import url("reset.css");
@import url("components.css") layer(components);
@import url("print.css") print;
@import url("dark.css") screen and (prefers-color-scheme: dark);

/* Com media query condicional */
@import url("mobile.css") (max-width: 600px);

/* Com layer (moderno) */
@import url("theme.css") layer(theme);

/* URLs podem ser string ou url() */
@import "reset.css";
@import url("reset.css");
```

#### Regras e Limitações

- `@import` deve vir **antes** de qualquer regra de estilo (exceto `@charset`)
- `@import` **bloqueia** o download em série — cada import espera o anterior
- Preferir `<link>` no HTML para carregamento paralelo

```html
<!-- ✅ Paralelo: navegador baixa ambos simultaneamente -->
<link rel="stylesheet" href="reset.css">
<link rel="stylesheet" href="styles.css">

<!-- ❌ Série: styles.css espera reset.css terminar -->
/* styles.css */
@import url("reset.css");
```

#### @import vs. <link>

| Aspecto | `<link>` HTML | `@import` CSS |
|---|---|---|
| Download | Paralelo | Serial (bloqueante) |
| Ordem | Ordem no HTML | Ordem de declaração |
| Media queries | Atributo `media` | Após a URL |
| Layers | Via `@import` com `layer()` | Direto |
| Shadow DOM | Suportado | Não suportado |
| Performance | ✅ Melhor | ❌ Pior |

**Regra**: usar `<link>` para CSS principal; `@import` apenas para organização de layers em CSS modular.

### @namespace — Escopo XML

```css
/* Define namespace para seletores */
@namespace url(http://www.w3.org/1999/xhtml);
@namespace svg url(http://www.w3.org/2000/svg);

/* Seletores com namespace */
|a { color: blue; }              /* elementos sem namespace */
svg|a { fill: red; }             /* elementos no namespace SVG */
*|a { color: green; }            /* todos os namespaces */
```

Raramente usado — necessário apenas para documentos XML/SVG com múltiplos namespaces.

### @supports — Feature Detection

```css
/* Aplica se o recurso é suportado */
@supports (display: grid) {
  .container { display: grid; }
}

/* Negação */
@supports not (display: grid) {
  .container { display: flex; }
}

/* Combinação */
@supports (display: grid) and (gap: 16px) {
  .grid { gap: 16px; }
}

@supports (display: grid) or (display: flex) {
  .container { display: flex; }
}

/* Seletor support (moderno) */
@supports selector(:has(a)) {
  .card:has(img) { border-radius: 0; }
}

/* Font tech */
@supports font-tech(variations) {
  @font-face {
    font-family: "Variable";
    src: url("var.woff2") format("woff2") tech(variations);
  }
}
```

### @media — Media Queries

```css
/* Tipos de mídia */
@media screen { ... }         /* telas */
@media print { ... }          /* impressão */
@media all { ... }            /* todos (padrão) */

/* Media features */
@media (min-width: 768px) { ... }
@media (prefers-color-scheme: dark) { ... }
@media (prefers-reduced-motion: reduce) { ... }

/* Combinação */
@media screen and (min-width: 768px) and (hover: hover) { ... }

/* Sintaxe moderna (nível 4) */
@media (width >= 768px) { ... }
@media (768px <= width <= 1200px) { ... }
```

(Detalhado em `06-responsivo.md` e `13-acessibilidade.md`.)

### @font-face — Fontes Customizadas

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.woff2") format("woff2") tech(variations);
  font-display: swap;
  font-weight: 100 900;
}
```

(Detalhado em `11-tipografia-moderna.md`.)

### @keyframes — Animações

```css
@keyframes slide-in {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

(Detalhado em `22-animacoes-keyframes.md`.)

### @layer — Cascata em Camadas

```css
@layer reset, base, components, utilities;

@layer reset {
  * { margin: 0; padding: 0; }
}
```

(Detalhado em `05-variaveis-camadas.md`.)

### @property — Propriedades Registradas

```css
@property --color-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: black;
}
```

(Detalhado em `08-propriedades-registradas.md`.)

### @starting-style — Animações de Entrada

```css
@starting-style {
  .modal[open] {
    opacity: 0;
    transform: scale(0.9);
  }
}
```

(Detalhado em `14-animacoes-discretas.md`.)

### @scope — Escopo de Estilos (Experimental)

```css
/* Estilos escopados a uma subárvore */
@scope (.card) {
  :scope { border: 1px solid #ccc; }
  p { margin: 0; }
}
```

### @container — Container Queries

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card { display: grid; }
}
```

(Detalhado em `06-responsivo.md`.)

### @page — Estilos de Impressão

```css
@page {
  size: A4;
  margin: 20mm;
}

@page :first {
  margin-top: 40mm;
}
```

(Detalhado em `27-print.md`.)

## Ordem das Regras em um Arquivo CSS

```
1. @charset (se necessário, primeira linha)
2. @import (antes de qualquer estilo)
3. @namespace (antes de seletores com namespace)
4. @layer (declaração de ordem)
5. @custom-media / @custom-selector (PostCSS, não nativo)
6. @font-face
7. @keyframes
8. @property
9. @starting-style
10. @layer (definição de conteúdo)
11. @media / @supports / @container (aninhados)
12. Regras de estilo (.classe, #id, elemento)
13. @page
```

## Tabela de At-Rules

| At-Rule | Propósito | Uso Principal |
|---|---|---|
| `@charset` | Codificação do arquivo | UTF-8 declaration |
| `@import` | Importar CSS externo | Modularização |
| `@namespace` | Namespace XML/SVG | Documentos XML |
| `@media` | Media queries | Responsivo, acessibilidade |
| `@supports` | Feature detection | Fallbacks progressivos |
| `@font-face` | Fontes customizadas | Tipografia |
| `@keyframes` | Animações | @keyframes definition |
| `@layer` | Cascata em camadas | Especificidade gerenciada |
| `@property` | Propriedades registradas | Type-safe custom properties |
| `@starting-style` | Estado inicial de animação | Animações de entrada |
| `@container` | Container queries | Responsivo por container |
| `@page` | Estilos de impressão | Print layout |
| `@scope` | Escopo de estilos | CSS isolation |

## Valores e Unidades

(Detalhado em `31-tipos-valores-unidades.md`.)

## Checklist

- [ ] `@charset "UTF-8"` presente quando o arquivo contém caracteres não-ASCII em strings
- [ ] Preferir `<link>` a `@import` para performance
- [ ] `@import` com `layer()` para organização de camadas
- [ ] `@supports` para aprimoramento progressivo sem JS
- [ ] At-rules de definição (`@font-face`, `@keyframes`, `@property`) antes do uso
- [ ] `@layer` declarado antes de qualquer estilo
