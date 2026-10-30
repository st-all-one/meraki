# Roles Estruturais: Mapeamento HTML → ARIA

## Tabela Completa de Mapeamento

| HTML Nativo | Role ARIA | Comportamento |
|-------------|-----------|---------------|
| `<article>` | `article` | Documento independente |
| `<aside>` | `complementary` | Conteúdo complementar |
| `<blockquote>` | `blockquote` | Citação em bloco |
| `<caption>` | `caption` | Título de tabela |
| `<code>` | `code` | Fragmento de código |
| `<dd>` | `definition` | Definição |
| `<del>` | `deletion` | Texto removido |
| `<dfn>` | `term` | Termo sendo definido |
| `<dl>` | `associationlist` | Lista de associações |
| `<dt>` | `associationlistitemkey` | Termo na lista |
| `<em>` | `emphasis` | Ênfase |
| `<figcaption>` | `caption` | Legenda de figura |
| `<figure>` | `figure` | Figura com legenda |
| `<footer>` (contexto body) | `contentinfo` | Informações do documento |
| `<h1>`-`<h6>` | `heading` + `aria-level` | Cabeçalho de seção |
| `<header>` (contexto body) | `banner` | Cabeçalho do site |
| `<hr>` | `separator` | Separação temática |
| `<i>` | `none` (semântica vazia) | Itálico visual |
| `<img>` | `image` / `img` | Imagem |
| `<ins>` | `insertion` | Texto inserido |
| `<li>` | `listitem` | Item de lista |
| `<mark>` | `mark` | Destaque textual |
| `<meter>` | `meter` | Medidor escalar |
| `<ol>` | `list` | Lista ordenada |
| `<p>` | `paragraph` | Parágrafo |
| `<pre>` | `none` / `generic` | Texto pré-formatado |
| `<progress>` | `progressbar` | Barra de progresso |
| `<s>` | `deletion` (impreciso) | Texto tachado |
| `<section>` | `region` (se nomeada) | Seção genérica |
| `<small>` | `none` / `generic` | Letras pequenas |
| `<strong>` | `strong` | Ênfase forte |
| `<sub>` | `subscript` | Subscrito |
| `<sup>` | `superscript` | Sobrescrito |
| `<table>` | `table` | Tabela de dados |
| `<tbody>` | `rowgroup` | Grupo de linhas |
| `<td>` | `cell` | Célula de tabela |
| `<tfoot>` | `rowgroup` | Rodapé de tabela |
| `<th>` | `columnheader` / `rowheader` | Célula de cabeçalho |
| `<thead>` | `rowgroup` | Cabeçalho de tabela |
| `<time>` | `time` | Data/hora |
| `<tr>` | `row` | Linha de tabela |
| `<ul>` | `list` | Lista não ordenada |

---

## Roles Específicas de Texto

### Paragraph

```html
<p>Texto do parágrafo.</p>
<div role="paragraph">Texto do parágrafo em div.</div>
```

- `role="paragraph"` só deve ser usada se `<p>` não puder ser usado
- Não use `role="paragraph"` em elementos de bloco genéricos para fingir semântica

### Emphasis vs Strong

```html
<p>Isto é <em role="emphasis">importante</em> e isto é <strong role="strong">crítico</strong>.</p>
```

| Role | Significado | Elemento |
|------|-------------|----------|
| `emphasis` | Ênfase suave, mudança de entonação | `<em>` |
| `strong` | Ênfase forte, urgência, seriedade | `<strong>` |

### Code

```html
<p>Use a função <code role="code">calcularTotal()</code> para obter o resultado.</p>
```

- Leitores de tela podem mudar o tom de voz para indicar código
- `role="code"` garante essa semântica mesmo em spans

### Subscript / Superscript

```html
<p>H<sub role="subscript">2</sub>O — água.</p>
<p>E = mc<sup role="superscript">2</sup></p>
```

- O HTML nativo já fornece a semântica correta
- Use ARIA apenas se não puder usar `<sub>` / `<sup>` (ex: SVG text)

### Blockquote

```html
<blockquote role="blockquote">
  <p>Acessibilidade não é um recurso, é um direito.</p>
</blockquote>
```

### Time

```html
<time role="time" datetime="2025-07-21">21 de julho de 2025</time>
```

- O atributo `datetime` fornece a representação legível por máquina
- Leitores de tela podem anunciar a data no formato do usuário

---

## Associationlist (dl / dt / dd)

```html
<dl role="associationlist">
  <div role="associationlistitemkey">HTML</div>
  <div role="associationlistitemvalue">Linguagem de marcação</div>
  <div role="associationlistitemkey">CSS</div>
  <div role="associationlistitemvalue">Folhas de estilo</div>
</dl>
```

| Elemento | Role | Uso |
|----------|------|-----|
| `<dl>` | `associationlist` | Lista de pares chave-valor |
| `<dt>` | `associationlistitemkey` | Termo/Chave |
| `<dd>` | `associationlistitemvalue` | Definição/Valor |

Sempre prefira elementos HTML nativos. Use ARIA apenas em casos extremos onde a marcação não pode ser alterada.

---

## Marcar vs Strong vs Emphasis

| Role | Elemento | Propósito |
|------|----------|-----------|
| `mark` | `<mark>` | Destacar texto para referência (como marca-texto) |
| `strong` | `<strong>` | Importância, seriedade, urgência |
| `emphasis` | `<em>` | Ênfase na entonação, mudança de significado |

```html
<p>
  O prazo final é <mark role="mark">amanhã</mark>.
  Isso é <strong role="strong">extremamente importante</strong>.
  Por favor, <em role="emphasis">leia com atenção</em>.
</p>
```

---

## Anti-padrões

1. **Usar ARIA quando HTML nativo existe**: `<span role="heading" aria-level="1">` em vez de `<h1>`
2. **`role="paragraph"` em múltiplos blocos**: Parágrafos reais devem usar `<p>`
3. **`role="code"` sem formatação visual**: Não há indicação visual de que é código
4. **Aninhamento incorreto**: `listitem` fora de `list`, `row` fora de `table`
5. **Ignorar `aria-level` em headings customizados**: Sempre especifique o nível

## Checklist
- [ ] HTML nativo preferido sobre ARIA para todos os elementos estruturais
- [ ] Headings customizados usam `role="heading"` + `aria-level` obrigatório
- [ ] Listas usam `role="list"` + `role="listitem"` emparelhados
- [ ] Tabelas não-semânticas usam `table`/`row`/`cell` com índices quando necessário
- [ ] `role="presentation"`/`role="none"` não usado em elementos interativos
- [ ] `code`, `strong`, `emphasis` usados apenas via HTML nativo, não ARIA
