# Estrutura Semântica do HTML Moderno

## 1. Documento Base

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Título</title>
  <meta name="description" content="Descrição para SEO" />
  <link rel="canonical" href="https://exemplo.com/" />
</head>
<body>
</body>
</html>
```

## 2. Content Categories (Modelo de Conteúdo)

**7 categorias principais** que determinam onde cada elemento pode ser aninhado:

```
                     ALL content
                         |
                   Metadata content
                         |
                   Flow content
                   /    |    \
        Sectioning   Heading   Phrasing
        content      content   content
             \         |         /
              Interactive content
                   Embedded content
```

### Metadata content
Elementos que modificam comportamento/aparência ou provêm metadados:
`<base>`, `<link>`, `<meta>`, `<noscript>`, `<script>`, `<style>`, `<template>`, `<title>`

### Flow content
Maioria dos elementos que vão dentro do `<body>`: textos, blocos, mídia, formulários.

### Sectioning content
Criam seções no outline do documento. **Cada um define o escopo de `<header>` e `<footer>`:**
- `<article>`, `<aside>`, `<nav>`, `<section>`

### Heading content
Definem título da seção:
- `<h1>`-`<h6>`, `<hgroup>`

### Phrasing content
Texto e marcação inline dentro de parágrafos:
- Elementos inline (span, a, strong, em, code, etc.), texto puro

### Embedded content
Importam recursos externos:
- `<audio>`, `<canvas>`, `<embed>`, `<iframe>`, `<img>`, `<math>`, `<object>`, `<picture>`, `<svg>`, `<video>`

### Interactive content
Elementos para interação do usuário:
- `<button>`, `<details>`, `<embed>`, `<iframe>`, `<label>`, `<select>`, `<textarea>`
- `<a>` (se com `href`), `<audio>`/`<video>` (se com `controls`), `<input>` (se não hidden), `<img>` (se com `usemap`), `<object>` (se com `usemap`)

## 3. Document Outline Algorithm

**ADVERTÊNCIA:** O algoritmo de outline do HTML5 NÃO é implementado por browsers ou tecnologias assistivas. **Sempre use heading hierarchy real (h1 > h2 > h3 > ...).**

### Sectioning roots (resetam numeração de headings internamente)
`<body>`, `<blockquote>`, `<details>`, `<dialog>`, `<fieldset>`, `<figure>`, `<td>`

### Regra prática
```html
<body>
  <h1>Título da Página</h1>
  <nav>...</nav>

  <section>
    <h2>Seção 1</h2>
    <h3>Sub-seção 1.1</h3>
    <h3>Sub-seção 1.2</h3>
  </section>

  <article>
    <h2>Título do Artigo</h2>
    <section>
      <h3>Sub-seção do Artigo</h3>
    </section>
  </article>
</body>
```

## 4. Landmarks (Marcos de Navegação)

Elementos que criam regiões no accessibility tree:

| Elemento | ARIA Role Implícito | Uso |
|----------|-------------------|-----|
| `<header>` | `banner` | Apenas quando top-level (filho direto de `<body>`) |
| `<nav>` | `navigation` | Bloco de links de navegação |
| `<main>` | `main` | Conteúdo principal (1 por página) |
| `<aside>` | `complementary` | Conteúdo tangencial |
| `<section>` | `region` | Apenas se tem nome acessível (`aria-label` / `aria-labelledby`) |
| `<article>` | `article` | Composição autocontida |
| `<footer>` | `contentinfo` | Apenas quando top-level |
| `<search>` | `search` | Interface de busca |
| `<form>` | `form` | Apenas se tem nome acessível |

### Múltiplos landmarks do mesmo tipo
```html
<nav aria-label="Main">...</nav>
<nav aria-label="Footer">...</nav>
```

## 5. Quando usar cada elemento

### div vs section vs article vs aside

```
Conteúdo tem agrupamento temático?
├── SIM → Tem heading?
│   ├── SIM → É autocontido/distribuível?
│   │   ├── SIM → <article>
│   │   └── NÃO → <section>
│   └── NÃO → <div> (section sempre deve ter heading)
└── NÃO → É tangencial ao conteúdo principal?
    ├── SIM → <aside>
    └── NÃO → <div>
```

### header vs section vs div
- **`<header>`**: Conteúdo introdutório (não confundir com `<head>`)
- **`<section>`**: Agrupamento temático (SEMPRE ter heading)
- **`<div>`**: Container sem semântica (último recurso)

## 6. Regras de Aninhamento (Nesting)

| Container | Aceita | Rejeita |
|-----------|--------|---------|
| `<p>` | Apenas phrasing content | div, headings, outros p, flow content |
| `<h1>`-`<h6>` | Apenas phrasing content | Flow content |
| `<span>` | Apenas phrasing content | Flow content |
| `<div>` | Flow content | — |
| `<ul>`/`<ol>`/`<menu>` | `<li>`, `<script>`, `<template>` | Texto direto, outros |
| `<dl>` | `<dt>` + `<dd>` | Flow direto |
| `<table>` | `<caption>`, `<colgroup>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>` | Texto direto |
| `<tr>` | `<td>`, `<th>` | Flow content |
| `<form>` | Flow content (sem `<form>` aninhado) | `<form>` aninhado |
| `<label>` | Phrasing content (sem `<label>` aninhado) | `<label>` aninhado |
| `<button>` | Phrasing content (sem interactive) | `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>` |
| `<a>` | Transparent | Interactive descendants |
| `<details>` | `<summary>` + flow | Múltiplos `<summary>` |
| `<figcaption>` | Flow content | Primeiro/último filho de `<figure>` |
| `<li>` | Flow content | Filho de `<ul>`/`<ol>`/`<menu>` |
| `<template>` | Qualquer (inerte) | — |

## 7. Hierarquia de Títulos (Headings)

### Regras
1. **UM `<h1>` por página** (título principal)
2. Não pular níveis (`<h1>` → `<h3>` é erro)
3. Usar níveis para profundidade, não para estilo
4. `<hgroup>` para título + subtítulo

### Exemplo correto
```html
<h1>Título do Site</h1>
  <h2>Seção Principal</h2>
    <h3>Subseção</h3>
      <h4>Detalhe</h4>
  <h2>Outra Seção</h2>
```

### Exemplo incorreto
```html
<h1>Título</h1>
  <h3>Subseção</h3> <!-- ERRO: pulou h2 -->
  <h2>Subseção</h2>
    <h4>Detalhe</h4> <!-- ERRO: pulou h3 -->
```

## 8. Estrutura de Página Recomendada

```html
<body>
  <header>
    <nav aria-label="Main">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
    <search>
      <form action="/search">
        <input type="search" name="q" aria-label="Search" />
        <button type="submit">Search</button>
      </form>
    </search>
  </header>

  <main>
    <article>
      <h1>Título do Artigo</h1>
      <p>...</p>
      <section>
        <h2>Subseção</h2>
        <p>...</p>
      </section>
    </article>

    <aside>
      <h2>Relacionados</h2>
      <ul>...</ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2025</p>
  </footer>
</body>
```
