# Definir Termos com HTML

HTML oferece elementos específicos para marcar definições de termos, tanto inline quanto como glossários estruturados.

## 1. Definição Informal com `<dfn>`

Para a **primeira ocorrência** de um termo sendo definido:

```html
<p><dfn>Firefox</dfn> é o navegador web criado pela Mozilla Foundation.</p>
```

- `<dfn>` envolve o **termo sendo definido**, não a definição
- A definição é o parágrafo (ou ancestral) que contém o `<dfn>`

### Com Abreviação (`<dfn>` + `<abbr>`)

```html
<p>
  <dfn><abbr>HTML</abbr> (HyperText Markup Language)</dfn>
  é uma linguagem de descrição usada para estruturar documentos na web.
</p>
```

### Melhorando Acessibilidade com `aria-describedby`

```html
<p>
  <span id="ff">
    <dfn aria-describedby="ff">Firefox</dfn>
    é o navegador web criado pela Mozilla Foundation.
  </span>
  Faça o download em <a href="https://www.mozilla.org">mozilla.org</a>
</p>
```

## 2. Abreviações com `<abbr>`

```html
<p>
  <abbr title="World Wide Web Consortium">W3C</abbr>
  define os padrões da web.
</p>
```

> [!WARNING]
> O atributo `title` em `<abbr>` não substitui uma definição inline. O conteúdo de `title` só aparece em hover (mouse), sendo inacessível para touch e screen readers.

## 3. Lista de Descrição (Glossário Formal)

Usar `<dl>` (description list) + `<dt>` (term) + `<dd>` (description):

### Exemplo Básico

```html
<dl>
  <dt>jambalaya</dt>
  <dd>Prato à base de arroz com frango, salsicha, frutos do mar e especiarias</dd>

  <dt>sukiyaki</dt>
  <dd>Especialidade japonesa com carne fatiada, vegetais e macarrão</dd>

  <dt>chianti</dt>
  <dd>Vinho tinto italiano seco originário da Toscana</dd>
</dl>
```

### Múltiplos Termos / Múltiplas Descrições

```html
<dl>
  <dt>terrier</dt>
  <dt>beagle</dt>
  <dd>Raças de cães de pequeno a médio porte</dd>

  <dt>labrador</dt>
  <dd>Raça de cão de grande porte, amigável e energética</dd>
  <dd>Também conhecido como Labrador Retriever</dd>
</dl>
```

### FAQ (Perguntas Frequentes)

```html
<dl>
  <dt>O que é HTML?</dt>
  <dd>HTML é a linguagem de marcação para páginas web.</dd>

  <dt>O que é CSS?</dt>
  <dd>CSS é a linguagem de estilo para páginas web.</dd>
</dl>
```

> [!NOTE]
> `<dl>` **não** é adequado para marcar diálogos. Use `<p>` com `<b>` para fallante e `<q>` para fala.

## CSS para Estilização

```css
dt {
  font-weight: bold;
  margin-top: 0.5em;
}

dd {
  margin-left: 1.5em;
}
```

## Resumo de Elementos

| Elemento | Uso |
|----------|-----|
| `<dfn>` | Primeira ocorrência de termo sendo definido (inline) |
| `<abbr>` | Abreviação com `title` para expansão |
| `<dl>` | Container da lista de descrição |
| `<dt>` | Termo na lista de descrição |
| `<dd>` | Descrição do termo |
