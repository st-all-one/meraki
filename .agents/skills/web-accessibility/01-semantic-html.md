# HTML Semântico Moderno — A Fundação da Acessibilidade

## Princípio Central

> **A melhor tecnologia de acessibilidade é usar o elemento HTML correto para a finalidade correta.**
> Elementos nativos têm suporte embutido a teclado, papéis ARIA implícitos, estados e propriedades.

## Regra Áurea

> *"If you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so."* — Primeira Regra do ARIA

## Mapeamento HTML ↔ Funções ARIA Implícitas

### Landmarks

| Elemento HTML | Função ARIA implícita | Uso |
|---|---|---|
| `<header>` | `banner` (quando não aninhado em main/aside/nav/section/article) | Cabeçalho global do site |
| `<nav>` | `navigation` | Navegação principal |
| `<main>` | `main` | Conteúdo principal (apenas 1 por página) |
| `<aside>` | `complementary` | Conteúdo complementar (sidebar) |
| `<footer>` | `contentinfo` (quando não aninhado) | Rodapé global |
| `<form>` | `form` | Formulário (só exposto como landmark se tiver nome acessível) |
| `<section>` | `region` (só se tiver nome acessível) | Seção genérica |
| `<article>` | `article` | Conteúdo autocontido |
| `<search>` | `search` | Função de busca |

### Conteúdo Estrutural

| Elemento | Função ARIA implícita |
|---|---|
| `<h1>`-`<h6>` | `heading` com `aria-level` apropriado |
| `<ul>`/`<ol>` | `list` |
| `<li>` | `listitem` |
| `<table>` | `table` |
| `<tr>` | `row` |
| `<td>` | `cell` |
| `<th>` | `columnheader`/`rowheader` |
| `<figure>` | `figure` |
| `<figcaption>` | — (nomeia o figure) |
| `<blockquote>` | — (citação) |
| `<pre>` | — (texto pré-formatado) |
| `<code>` | — (código) |
| `<abbr>` | — (abreviação) |

### Widgets e Formulários

| Elemento HTML | Função ARIA implícita | Estados suportados nativamente |
|---|---|---|
| `<button>` | `button` | `aria-disabled`, `aria-pressed` (toggle) |
| `<a>` (com href) | `link` | `aria-disabled` |
| `<input type="text">` | `textbox` | `aria-readonly`, `aria-required`, `aria-invalid` |
| `<input type="checkbox">` | `checkbox` | `aria-checked` (via checked), `aria-required` |
| `<input type="radio">` | `radio` | `aria-checked` (via checked) |
| `<input type="range">` | `slider` | `aria-valuemin`, `aria-valuemax`, `aria-valuenow` |
| `<select>` | `listbox` ou `combobox` | `aria-expanded`, `aria-multiselectable` |
| `<textarea>` | `textbox` | `aria-multiline`, `aria-readonly` |
| `<progress>` | `progressbar` | `aria-valuenow`, `aria-valuemax` |
| `<dialog>` | `dialog` | `aria-modal` |
| `<details>` | `group` | `aria-expanded` |
| `<summary>` | `button` (nomeia o details) | — |

> **Referência completa** de elemento → role implícita (incluindo `<fieldset>`,
> `<output>`, `<progress>`, `<meter>`, `<select multiple>`, matriz de
> `<input type=...>` e as regras de nuance de `header`/`footer`/`section`):
> [`25-tag-role-reference.md`](25-tag-role-reference.md).

## Padrões Modernos: O Que SEMPRE Usar

### 1. Skip Links
```html
<a href="#main-content" class="skip-link">Pular para conteúdo principal</a>
```
Permite usuários de teclado pularem blocos repetitivos de navegação.

### 2. Headings com Hierarquia Lógica
```html
<h1>Título da Página</h1>
  <h2>Seção Principal</h2>
    <h3>Subseção</h3>
  <h2>Outra Seção</h2>
```
Nunca pule níveis (`<h1>` → `<h3>`). Use heading para títulos, não para estilização.

### 3. Botões vs Links

| Contexto | Elemento Correto |
|---|---|
| Navegar para outra URL | `<a href="...">` |
| Executar ação na página | `<button>` |
| Enviar formulário | `<button type="submit">` |

Nunca use `<div>` ou `<span>` com `role="button"` se `<button>` funciona.

### 4. Formulários com `<label>`
```html
<label for="email">E-mail</label>
<input type="email" id="email" name="email" required>
```
Todo controle de formulário **deve** ter um `<label>` associado via `for`/`id` ou aninhamento.

### 5. Tabelas com `<caption>`, `<thead>`, `<tbody>`, `<th scope="">`
```html
<table>
  <caption>Resultados da pesquisa</caption>
  <thead>
    <tr>
      <th scope="col">Nome</th>
      <th scope="col">Idade</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">João</th>
      <td>30</td>
    </tr>
  </tbody>
</table>
```

### 6. Landmarks com HTML5
Estrutura completa:
```html
<header>
  <nav aria-label="Principal">...</nav>
</header>
<main>
  <article>
    <section aria-labelledby="section-title">
      <h2 id="section-title">...</h2>
    </section>
  </article>
  <aside>...</aside>
</main>
<footer>...</footer>
```

## O Que EVITAR

| Anti-padrão | Por que |
|---|---|
| `<div onclick="...">` em vez de `<button>` | Sem foco por teclado, sem semântica, sem evento Enter/Space |
| `tabindex` positivo (`tabindex="5"`) | Quebra ordem natural de tabulação |
| `role="button"` em `<div>` sem JS de teclado | Apenas adiciona semântica; comportamento deve ser implementado manualmente |
| `aria-label` em elemento que já tem label visível | Prefira o label nativo; `aria-label` sobressai o nome acessível |
| Remover outline (`outline: none`) sem substituto | Usuários de teclado perdem indicador de foco |
| Usar `<br>` para espaçamento | Use CSS `margin`/`padding` |
| Tabela para layout | Use CSS Grid/Flexbox |
| `<i>` para ícone sem `aria-hidden="true"` | Leitor de tela pode ler "i" ou itálico |

## Checklist Semântico Moderno

- [ ] Toda página tem um `<main>` único
- [ ] Headings seguem hierarquia sem pular níveis
- [ ] Botões usam `<button>`, links usam `<a href>`
- [ ] Form controls têm `<label>` explícito
- [ ] Tabelas de dados têm `<caption>` e `<th scope="">`
- [ ] Landmarks HTML5 usados em vez de `<div role="...">`
- [ ] Skip link presente no topo da página
- [ ] Nenhum `tabindex` positivo
- [ ] Nenhum `outline: none` sem `:focus-visible` alternativo
- [ ] `lang` definido no `<html>`
- [ ] Título (`<title>`) descritivo por página
- [ ] Mensagens de erro associadas via `aria-describedby` ou `aria-errormessage`
