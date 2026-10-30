# Referência: Elemento HTML → Role ARIA Implícita

Tabela de referência **completa** dos papéis implícitos que o HTML confere aos
elementos, segundo a especificação HTML-ARIA. Use como fonte da verdade ao
auditar páginas e ao interpretar o facet `aria.role`/`ax.role` da ferramenta
`sniffCSS`.

> A role implícita é a que o navegador usa **quando nenhum `role` explícito**
> é declarado. Um `role` explícito sobrescreve a implícita.

---

## Landmarks

| Elemento | Role implícita | Condição |
|---|---|---|
| `<header>` | `banner` | **somente** fora de `article`/`aside`/`main`/`nav`/`section` |
| `<footer>` | `contentinfo` | **somente** fora de `article`/`aside`/`main`/`nav`/`section` |
| `<nav>` | `navigation` | sempre |
| `<main>` | `main` | sempre (1 por documento) |
| `<aside>` | `complementary` | sempre |
| `<form>` | `form` | **somente** se tiver nome acessível |
| `<section>` | `region` | **somente** se tiver nome acessível (label/labelledby/title) |
| `<search>` | `search` | sempre |

## Estrutura e texto

| Elemento | Role implícita | Elemento | Role implícita |
|---|---|---|---|
| `<h1>`-`<h6>` | `heading` (nível 1–6) | `<p>` | `paragraph` |
| `<article>` | `article` | `<blockquote>` | `blockquote` |
| `<figure>` | `figure` | `<figcaption>` | *(nomeia o figure — sem role)* |
| `<ul>`/`<ol>`/`<menu>` | `list` | `<li>` | `listitem` |
| `<dl>` | `list` | `<dt>` | `term` |
| `<dd>` | `definition` | `<dfn>` | `term` |
| `<mark>` | `mark` | `<strong>` | `strong` |
| `<em>` | `emphasis` | `<sub>` | `subscript` |
| `<sup>` | `superscript` | `<code>` | `code` |
| `<time>` | `time` | `<hr>` | `separator` |
| `<pre>`/`<small>`/`<abbr>`/`<bdi>`/`<bdo>`/`<address>` | *(sem role)* | `<math>` | `math` |
| `<del>` | `deletion` | `<ins>` | `insertion` |
| `<q>`/`<cite>`/`<s>`/`<u>` | *(sem role)* | `<i>`/`<b>` | *(sem role)* |

## Tabelas

| Elemento | Role implícita |
|---|---|
| `<table>` | `table` |
| `<caption>` | *(nomeia a tabela — sem role)* |
| `<colgroup>` / `<thead>` / `<tbody>` / `<tfoot>` | `rowgroup` |
| `<col>` | `column` |
| `<tr>` | `row` |
| `<th scope="col">` | `columnheader` |
| `<th scope="row">` | `rowheader` |
| `<td>` | `cell` |

## Widgets e formulários

| Elemento | Role implícita | Condição |
|---|---|---|
| `<button>` | `button` | sempre |
| `<summary>` | `button` | filho de `<details>` |
| `<a>` / `<area>` | `link` | **somente** com `href` |
| `<details>` | `group` | sempre |
| `<fieldset>` | `group` | sempre |
| `<legend>` | *(nomeia o fieldset — sem role)* | — |
| `<optgroup>` | `group` | — |
| `<option>` | `option` | filho de `<select>`/`<datalist>` |
| `<select>` | `combobox` | single |
| `<select multiple>` / `size>1` | `listbox` | múltipla escolha |
| `<datalist>` | `listbox` | — |
| `<progress>` | `progressbar` | — |
| `<meter>` | `meter` | — |
| `<output>` | `status` | — |
| `<dialog>` | `dialog` | sempre |
| `<img alt="texto">` / sem `alt` | `img` | conteúdo não decorativo |
| `<img alt="">` | `presentation` | decorativo |
| `<canvas>` | `img` | **somente** se tiver conteúdo de fallback |
| `<iframe>` | `document` | **somente** se tiver `title` |
| `<embed>` | `embedded` | — |
| `<audio>` / `<video>` | `group` | **somente** com atributo `controls` |

## Matriz de `<input type=...>`

| `type` | Role implícita | `type` | Role implícita |
|---|---|---|---|
| `button` / `submit` / `reset` / `image` | `button` | `text` / `email` / `url` / `tel` | `textbox` |
| `checkbox` | `checkbox` | `search` | `searchbox` |
| `radio` | `radio` | `number` | `spinbutton` |
| `range` | `slider` | `password` / `file` / `color` | *(sem role)* |
| `hidden` | *(sem role)* | `date` / `time` / `week` / `month` / `datetime-local` | *(sem role)* |

---

## Regras de nuance (validadas na ferramenta)

A `sniffCSS` implementa essas regras deterministicamente no facet
`aria.role` (`extractor.rs`, `implicitRole`), e a árvore de acessibilidade real
do Chrome (`ax.role`, via CDP `Accessibility`) é a fonte autoritativa quando as
duas divergem:

1. **`header`/`footer`** → `banner`/`contentinfo` apenas fora de
   `article, aside, main, nav, section`.
2. **`section`** → `region` apenas com nome acessível (`aria-label`,
   `aria-labelledby` ou `title`).
3. **`img`** → `presentation` quando `alt=""`; `img` caso contrário.
4. **`select`** → `listbox` quando `multiple` ou `size>1`; `combobox` senão.
5. **`th`** → `rowheader` quando `scope="row"`; `columnheader` caso contrário.
6. **`iframe`** → `document` apenas com `title`.
7. **`canvas`** → `img` apenas com conteúdo de fallback (texto interno).
8. **`audio`/`video`** → `group` apenas com `controls`.

```bash
# Ver um elemento específico (aria.role determinístico + ax.role do Chrome)
# ax já vem ON por padrão; --compact também. --full desliga os otimizadores.
sniffCSS -u URL -s "select#multi" \
  | jq '{aria_role: .aria.role, ax_role: .ax.role}'
```

## Checklist

- [ ] Nenhum `role` explícito desnecessário quando a tag já confere a role
- [ ] `header`/`footer` de seção não poluem landmarks (`banner`/`contentinfo`)
- [ ] Imagens decorativas com `alt=""` (role `presentation`)
- [ ] `th` com `scope` correto (col vs row)
- [ ] `select` múltiplo usa a role `listbox` (não `combobox`)
- [ ] `iframe` sem `title` não vira `document` órfão
- [ ] `aria.role` (determinístico) e `ax.role` (Chrome) conferem no diff
