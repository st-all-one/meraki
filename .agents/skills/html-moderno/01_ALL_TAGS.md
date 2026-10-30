# Catálogo Completo de Todas as Tags HTML Modernas

Baseado no HTML Living Standard (WHATWG). Tags agrupadas por função. Inclui todas as tags válidas em 2025.

---

## 1. Main Root

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<html>` | Elemento raiz do documento | `<head>` + `<body>` | Não | Atributo `lang` obrigatório para acessibilidade |

## 2. Document Metadata

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<base>` | URL base para URLs relativas | Vazio | SIM | Apenas um por documento |
| `<head>` | Container para metadados | Elementos de metadata | Não | Deve conter `<title>` |
| `<link>` | Relaciona recurso externo | Vazio | SIM | Atributos: `rel`, `href`, `as`, `crossorigin`, `integrity` |
| `<meta>` | Metadados (charset, viewport, etc.) | Vazio | SIM | charset="UTF-8" obrigatório |
| `<style>` | Regras CSS | Texto (CSS) | Não | Pode conter `media`, `blocking` |
| `<title>` | Título do documento | Texto puro | Não | Obrigatório, visível na aba |

## 3. Sectioning Root

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<body>` | Corpo do documento | Flow content | Não | Apenas um por documento |

## 4. Content Sectioning

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<address>` | Informações de contato | Flow content | Não | Sempre dentro de sectioning content |
| `<article>` | Composição autocontida | Flow content | Não | Distribuível/reutilizável independentemente |
| `<aside>` | Conteúdo indiretamente relacionado | Flow content | Não | Sidebars, callouts, pullquotes |
| `<footer>` | Rodapé da seção/raiz | Flow content | Não | Sem heading/sectioning descendentes |
| `<header>` | Conteúdo introdutório | Flow content | Não | Sem footer/header descendentes |
| `<h1>`-`<h6>` | Cabeçalhos de seção (6 níveis) | Phrasing content | Não | Não pular níveis; um `<h1>` por página |
| `<hgroup>` | Cabeçalho com conteúdo secundário | Um `<h1>`-`<h6>` + `<p>` opcional | Não | Subtitle, tagline |
| `<main>` | Conteúdo dominante (único) | Flow content | Não | Apenas um por página, não aninhável |
| `<nav>` | Bloco de navegação | Flow content | Não | Links de navegação principais |
| `<search>` | Funcionalidade de busca/filtro | Flow content | Não | ARIA role="search" implícito |
| `<section>` | Seção genérica temática | Flow content | Não | Sempre ter um heading (salvo exceções) |

## 5. Text Content

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<blockquote>` | Citação longa em bloco | Flow content | Não | Atributo `cite` para URL da fonte |
| `<dd>` | Valor/descrição em lista de descrição | Flow content | Não | Filho de `<dl>` |
| `<div>` | Container genérico (sem semântica) | Flow content | Não | Último recurso semântico |
| `<dl>` | Lista de descrição/definição | `<dt>` + `<dd>` | Não | Termos e descrições |
| `<dt>` | Termo em lista de descrição | Phrasing content | Não | Filho de `<dl>` |
| `<figcaption>` | Legenda para `<figure>` | Flow content | Não | Primeiro ou último filho de `<figure>` |
| `<figure>` | Conteúdo autocontido com legenda | Flow content + `<figcaption>` | Não | Diagramas, fotos, code snippets |
| `<hr>` | Quebra temática (linha horizontal) | Vazio | SIM | Mudança de cena/tópico |
| `<li>` | Item de lista | Flow content | Não | Filho de `<ul>`, `<ol>`, `<menu>` |
| `<menu>` | Lista não ordenada semântica (== `<ul>`) | `<li>` | Não | Alternativa semântica a `<ul>` |
| `<ol>` | Lista ordenada | `<li>` | Não | Atributos: `reversed`, `start`, `type` |
| `<p>` | Parágrafo | Phrasing content | Não | Apenas phrasing content; sem divs, headings |
| `<pre>` | Texto pré-formatado | Phrasing content | Não | Whitespace preservado, monospace |
| `<ul>` | Lista não ordenada | `<li>` | Não | Bullet points |

## 6. Inline Text Semantics

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<a>` | Hyperlink | Transparent | Não | `href` cria link; `target`, `rel`, `download` |
| `<abbr>` | Abreviação/acrônimo | Phrasing content | Não | Atributo `title` para expansão |
| `<b>` | Atenção do leitor (bold) | Phrasing content | Não | Sem importância semântica; usar CSS para bold |
| `<bdi>` | Isolamento bidirecional | Phrasing content | Não | Texto com direcionalidade desconhecida |
| `<bdo>` | Sobrescrever direção do texto | Phrasing content | Não | Atributo `dir` obrigatório |
| `<br>` | Quebra de linha | Vazio | SIM | Para poemas, endereços |
| `<cite>` | Título de trabalho criativo | Phrasing content | Não | Obra, não autor/pessoa |
| `<code>` | Fragmento de código | Phrasing content | Não | Monospace |
| `<data>` | Tradução machine-readable | Phrasing content | Não | Atributo `value` |
| `<dfn>` | Termo sendo definido | Phrasing content | Não | Termo de definição |
| `<em>` | Ênfase (stress emphasis) | Phrasing content | Não | Entonação de ênfase |
| `<i>` | Voz alternativa/termo técnico | Phrasing content | Não | Não itálico decorativo |
| `<kbd>` | Entrada de teclado do usuário | Phrasing content | Não | Input do usuário |
| `<mark>` | Texto marcado/destacado | Phrasing content | Não | Relevância contextual |
| `<q>` | Citação curta inline | Phrasing content | Não | Browser adiciona aspas |
| `<rp>` | Parênteses de fallback ruby | Texto | Não | Usado dentro de `<ruby>` |
| `<rt>` | Texto de anotação ruby | Phrasing content | Não | Pronúncia, definição |
| `<ruby>` | Anotação ruby | Phrasing content | Não | Caracteres CJV com pronúncia |
| `<s>` | Texto não mais preciso/strikethrough | Phrasing content | Não | Conteúdo obsoleto/incorreto |
| `<samp>` | Saída de computador | Phrasing content | Não | Exemplo de output |
| `<small>` | Comentários laterais, letras miúdas | Phrasing content | Não | Termos legais, notas |
| `<span>` | Container inline genérico | Phrasing content | Não | Último recurso; sem semântica |
| `<strong>` | Importância/urgência forte | Phrasing content | Não | Séria, urgente; não negrito decorativo |
| `<sub>` | Subscrito | Phrasing content | Não | Fórmulas químicas, notas |
| `<sup>` | Sobrescrito | Phrasing content | Não | Notas de rodapé, expoentes |
| `<time>` | Data/hora machine-readable | Phrasing content | Não | Atributo `datetime` |
| `<u>` | Anotação não textual (underline) | Phrasing content | Não | Palavras mal escritas, nomes próprios |
| `<var>` | Variável matemática/programação | Phrasing content | Não | Monospace itálico |
| `<wbr>` | Oportunidade de quebra de palavra | Vazio | SIM | Sem hífen; quebra quando necessário |

## 7. Image & Multimedia

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<area>` | Área clicável em image map | Vazio | SIM | Filho de `<map>` |
| `<audio>` | Áudio | `<source>` + `<track>` + transparent | Não | Atributos: `controls`, `autoplay`, `loop`, `muted`, `preload` |
| `<img>` | Imagem embutida | Vazio | SIM | `alt` obrigatório; `srcset`, `sizes`, `loading`, `fetchpriority` |
| `<map>` | Image map | `<area>` ou flow content | Não | Associado via `name` + `<img usemap>` |
| `<track>` | Trilhas de texto (legendas) | Vazio | SIM | Filho de `<audio>`/`<video>`; `srclang`, `kind`, `label` |
| `<video>` | Vídeo | `<source>` + `<track>` + transparent | Não | `controls`, `poster`, `width`, `height`, `playsinline` |

## 8. Embedded Content

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<embed>` | Conteúdo de plugin externo | Vazio | SIM | `src`, `type`, `width`, `height` |
| `<fencedframe>` | Navegação aninhada com privacidade | Vazio | Não | experimental; privacy sandbox |
| `<iframe>` | Contexto de navegação aninhado | Transparent (fallback) | Não | `sandbox`, `loading`, `allow`, `srcdoc` |
| `<object>` | Recurso externo (plugin) | `<param>` + transparent | Não | `data`, `type`, `width`, `height` |
| `<picture>` | Container de imagem responsiva | `<source>` + `<img>` | Não | Art direction |
| `<source>` | Múltiplos recursos de mídia | Vazio | SIM | `srcset`, `media`, `type`, `sizes` |

## 9. SVG & MathML

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<svg>` | Container SVG | Elementos SVG | Não | Inline SVG diretamente no HTML |
| `<math>` | Fórmula MathML | Elementos MathML | Não | Notação matemática |

## 10. Scripting

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<canvas>` | Bitmap renderizável por script | Transparent (fallback) | Não | `width`, `height` |
| `<noscript>` | Fallback quando JS desabilitado | Transparent | Não | Metadata se em `<head>`, flow se em `<body>` |
| `<script>` | Código executável ou dados | Script (text/module) | Não | `async`, `defer`, `type="module"`, `integrity`, `crossorigin` |

## 11. Demarcating Edits

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<del>` | Texto deletado | Transparent | Não | `cite`, `datetime` |
| `<ins>` | Texto inserido | Transparent | Não | `cite`, `datetime` |

## 12. Table Content

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<caption>` | Legenda da tabela | Flow content (sem `<table>`) | Não | Primeiro filho de `<table>` |
| `<col>` | Coluna dentro de `<colgroup>` | Vazio | SIM | `span` |
| `<colgroup>` | Grupo de colunas | `<col>` | Não | `span` |
| `<table>` | Dados tabulares | `<caption>`, `<colgroup>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>` | Não | Não usar para layout |
| `<tbody>` | Corpo da tabela (linhas) | `<tr>` | Não | Agrupamento opcional |
| `<td>` | Célula de dados | Flow content | Não | `colspan`, `rowspan`, `headers` |
| `<tfoot>` | Rodapé da tabela | `<tr>` | Não | Agrupamento opcional |
| `<th>` | Célula de cabeçalho | Flow content (sem heading/sectioning) | Não | `scope`, `colspan`, `rowspan`, `headers` |
| `<thead>` | Cabeçalho da tabela | `<tr>` | Não | Agrupamento opcional |
| `<tr>` | Linha da tabela | `<td>` + `<th>` | Não | Agrupado por `<thead>`, `<tbody>`, `<tfoot>` |

## 13. Forms

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<button>` | Botão interativo | Phrasing content | Não | `type="submit"`, `"reset"`, `"button"` |
| `<datalist>` | Opções predefinidas para input | `<option>` | Não | Autocomplete para `<input list>` |
| `<fieldset>` | Grupo de controles de formulário | `<legend>` + flow | Não | `disabled`, `form`, `name` |
| `<form>` | Formulário interativo | Flow content (sem `<form>` aninhado) | Não | `action`, `method`, `novalidate`, `rel` |
| `<input>` | Controle de entrada (22 tipos) | Vazio | SIM | Ver tipos abaixo |
| `<label>` | Rótulo para controle de formulário | Phrasing content | Não | `for` associa ao `id` do controle |
| `<legend>` | Título do `<fieldset>` | Phrasing content | Não | Primeiro filho de `<fieldset>` |
| `<meter>` | Medida escalar dentro de intervalo | Phrasing content | Não | `value`, `min`, `max`, `low`, `high`, `optimum` |
| `<optgroup>` | Grupo de `<option>`s | `<option>` | Não | `label` obrigatório |
| `<option>` | Opção em select/datalist | Texto puro | Não | `value`, `selected`, `disabled` |
| `<output>` | Resultado de cálculo | Phrasing content | Não | `for`, `form`, `name` |
| `<progress>` | Progresso de tarefa | Phrasing content | Não | `value`, `max` (omita para indeterminado) |
| `<select>` | Menu dropdown | `<option>` + `<optgroup>` | Não | `multiple`, `size`, `required` |
| `<selectedcontent>` | Opção selecionada atual | Flow content | Não | experimental |
| `<textarea>` | Entrada de texto multi-linha | Texto (raw) | Não | `rows`, `cols`, `wrap`, `maxlength` |

### 13.1 Input Types (22 tipos)

`button`, `checkbox`, `color`, `date`, `datetime-local`, `email`, `file`, `hidden`, `image`, `month`, `number`, `password`, `radio`, `range`, `reset`, `search`, `submit`, `tel`, `text` (default), `time`, `url`, `week`

## 14. Interactive Elements

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<details>` | Widget de revelação | `<summary>` + flow content | Não | `open`, `name` (accordion) |
| `<dialog>` | Caixa de diálogo modal/não-modal | Flow content | Não | `showModal()`, `show()`, `close()`; `closedby` |
| `<geolocation>` | Controle de geolocalização | Flow content | Não | experimental |
| `<summary>` | Resumo para `<details>` | Phrasing content | Não | Primeiro filho de `<details>` |

## 15. Web Components

| Tag | Descrição | Modelo de Conteúdo | Void | Notas |
|-----|-----------|-------------------|------|-------|
| `<slot>` | Placeholder Shadow DOM | Transparent | Não | `name` para named slots |
| `<template>` | Fragmento HTML inerte (não renderizado) | Qualquer conteúdo | Não | Usado com Shadow DOM ou JS |

## 16. Elementos sem categoria (contexto específico)

`<caption>`, `<col>`, `<colgroup>`, `<dd>`, `<dt>`, `<figcaption>`, `<head>`, `<html>`, `<legend>`, `<li>`, `<optgroup>`, `<option>`, `<param>` (deprecated), `<rb>` (deprecated), `<rp>`, `<rt>`, `<rtc>` (deprecated), `<source>`, `<tbody>`, `<tfoot>`, `<th>`, `<thead>`, `<tr>`, `<track>`

## Legenda

- **Void (SIM)** = tag sem fechamento (`<br />`)
- **Transparent** = herda o modelo de conteúdo do pai
- **Flow content** = conteúdo de bloco (parágrafos, divs, headings, etc.)
- **Phrasing content** = conteúdo inline (texto, spans, etc.)
- **Experimental** = pode não ter suporte total em todos navegadores
