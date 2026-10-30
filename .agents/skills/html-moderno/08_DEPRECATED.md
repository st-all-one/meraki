# Elementos e Atributos HTML Obsoletos / Deprecados

## 1. Elementos Deprecados (NÃO USAR)

| Elemento | Substituto Moderno | Motivo |
|----------|-------------------|--------|
| ~~`<acronym>`~~ | `<abbr>` | Redundante com `<abbr>`; ambos são abreviações |
| ~~`<applet>`~~ | `<object>` ou `<embed>` | Java applets descontinuados |
| ~~`<basefont>`~~ | CSS `font-*` properties | Presentacional |
| ~~`<big>`~~ | CSS `font-size` | Presentacional |
| ~~`<center>`~~ | CSS `text-align: center` ou flexbox/grid | Presentacional |
| ~~`<command>`~~ | `aria-*` + JavaScript | Nunca amplamente suportado |
| ~~`<content>`~~ | `<slot>` | Web Components v0 obsoleto |
| ~~`<dir>`~~ | `<ul>` | Redundante com `<ul>` |
| ~~`<font>`~~ | CSS `font-*` properties | Presentacional |
| ~~`<frame>`~~ | `<iframe>` ou CSS layouts | Framesets obsoletos |
| ~~`<frameset>`~~ | CSS flexbox/grid | Framesets obsoletos |
| ~~`<image>`~~ | `<img>` | Nunca foi padronizado |
| ~~`<isindex>`~~ | `<input type="text">` + `<form>` | Mecanismo obsoleto |
| ~~`<keygen>`~~ | `<select>` + JavaScript | Problemas de segurança |
| ~~`<listing>`~~ | `<pre>` ou `<code>` | Redundante com `<pre>` |
| ~~`<marquee>`~~ | CSS animations | Nunca padronizado, inacessível |
| ~~`<menuitem>`~~ | JavaScript context menus | Removido do spec |
| ~~`<nextid>`~~ | N/A | Nunca padronizado |
| ~~`<nobr>`~~ | CSS `white-space: nowrap` | Presentacional |
| ~~`<noembed>`~~ | Fallback em `<object>` | Todos browsers modernos suportam plugins |
| ~~`<noframes>`~~ | N/A (sem frames) | Framesets obsoletos |
| ~~`<param>`~~ | Atributos diretos ou `data-*` | `<object>` pode usar atributos diretamente |
| ~~`<plaintext>`~~ | `<pre>` + server-side highlight | Quebra o parser HTML (não tem fechamento) |
| ~~`<rb>`~~ | Ruby nativo sem `<rb>` | Redundante em ruby moderno |
| ~~`<rtc>`~~ | Ruby nativo sem `<rtc>` | Redundante em ruby moderno |
| ~~`<shadow>`~~ | `<slot>` | Web Components v0 obsoleto |
| ~~`<spacer>`~~ | CSS margin/padding/width | Presentacional, nunca padronizado |
| ~~`<strike>`~~ | `<s>`, `<del>` ou `<ins>` | Substituído por elementos mais semânticos |
| ~~`<tt>`~~ | `<code>`, `<kbd>`, `<samp>`, `<var>` ou CSS `font-family` | Presentacional (teletype) |
| ~~`<xmp>`~~ | `<pre>` ou `<code>` | Redundante com `<pre>` |

## 2. Atributos Deprecados (NÃO USAR)

| Atributo | Elementos | Substituto |
|----------|-----------|------------|
| `align` | Múltiplos | CSS `text-align`, `float`, `vertical-align`, flexbox/grid |
| `alink` | `<body>` | CSS `:active` |
| `background` | `<body>`, `<table>`, `<td>`, `<th>` | CSS `background-image` |
| `bgcolor` | Múltiplos | CSS `background-color` |
| `border` | `<img>`, `<object>`, `<table>` | CSS `border` |
| `clear` | `<br>` | CSS `clear` |
| `color` | `<font>`, `<hr>` | CSS `color`, `background-color` |
| `compact` | `<dl>`, `<ol>`, `<ul>` | CSS `margin` |
| `height` | `<div>`, `<td>`, `<th>` | CSS `height` |
| `hspace` | `<img>`, `<object>` | CSS `margin` |
| `language` | `<script>` | `type` attribute |
| `link` | `<body>` | CSS `:link` |
| `noshade` | `<hr>` | CSS `border-style` |
| `nowrap` | `<td>`, `<th>` | CSS `white-space: nowrap` |
| `rev` | `<a>`, `<link>` | `rel` attribute |
| `rules` | `<table>` | CSS `border` |
| `scheme` | `<meta>` | Outros atributos de `<meta>` |
| `size` | `<hr>`, `<font>` | CSS `height`, `font-size` |
| `summary` | `<table>` | `<caption>` ou `aria-describedby` |
| `text` | `<body>` | CSS `color` |
| `type` | `<li>`, `<ol>`, `<ul>` | CSS `list-style-type` |
| `valign` | Múltiplos | CSS `vertical-align` |
| `vlink` | `<body>` | CSS `:visited` |
| `vspace` | `<img>`, `<object>` | CSS `margin` |
| `width` | `<div>`, `<td>`, `<th>`, `<hr>`, `<pre>` | CSS `width` |
| `accept` | `<form>` | `accept` no `<input type="file">` |
| `autocorrect` | Vários | Usar tipos de input apropriados |
| `methods` | `<a>`, `<link>` | HTTP methods |
| `urn` | `<a>`, `<link>` | URN resolution |
| `version` | `<html>` | DOCTYPE |

## 3. Input Types Deprecados

| Tipo | Substituto |
|------|-----------|
| `datetime` (obsoleto) | `<input type="datetime-local">` ou date picker JS |

## 4. `rel` Values Deprecados

| Valor | Substituto |
|-------|-----------|
| `prerender` (deprecado) | Speculation Rules API |
| `shortcut` (non-conforming) | Omitir (usar só `rel="icon"`) |

## 5. Tabela de Substituição Rápida

### Presentação → CSS
```
<font color="red">     →  CSS: color: red;
<big>...</big>         →  CSS: font-size: larger;
<center>...</center>   →  CSS: text-align: center;
<strike>...</strike>   →  <s>...</s>  ou  <del>...</del>
<tt>...</tt>           →  <code>...</code>  ou  CSS: font-family: monospace;
<u>...</u>             →  CSS: text-decoration: underline;
<br clear="all">       →  CSS: clear: both;
<hr size="2">          →  CSS: height: 2px;
<hr noshade>           →  CSS: border-style: solid;
```

### Estrutura → HTML Semântico
```
<div class="header">   →  <header>
<div class="nav">      →  <nav>
<div class="main">     →  <main>
<div class="footer">   →  <footer>
<div class="article">  →  <article>
<div class="section">  →  <section>
<div class="search">   →  <search>
```

### Frames → CSS
```
<frameset>             →  CSS Grid ou Flexbox
<frame>                →  <iframe> (se necessário)
```

## 6. Notas Importantes

- **Não confundir "obsoleto" com "removido"**: browsers ainda renderizam elementos obsoletos para compatibilidade, mas eles são inválidos no validator e podem causar problemas de acessibilidade e SEO.
- **Elementos obsoletos podem desaparecer em versões futuras** dos browsers.
- **Atributos presentacionais**: Foram removidos do HTML spec. Use CSS.
- **`<param>`**: Ainda pode ser necessário em casos legados com `<object>`, mas prefira atributos diretos.
- **`<b>` e `<i>`**: NÃO são obsoletos — foram redefinidos com significado semântico (não visual). `<b>` = atenção, `<i>` = voz alternativa.
- **`<s>`**: NÃO é obsoleto — representa conteúdo que não é mais preciso/relevante (diferente de `<del>` que é remoção editorial).
