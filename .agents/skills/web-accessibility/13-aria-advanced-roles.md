# Roles ARIA Avançadas

## Application Role

A role `application` designa uma região como um aplicativo web, não um documento. Ela remove todas as semânticas implícitas dos elementos filhos, fazendo com que leitores de tela entrem em modo de interação direta (modo foco/navegação por cursor).

```html
<div role="application" aria-label="Editor de texto">
  ...
</div>
```

### Quando usar
- Google Docs, CKEditor, TinyMCE, Gmail
- Widgets complexos onde teclas de atalho do leitor de tela entram em conflito com atalhos do app
- O usuário precisa de interação contínua sem interferência do AT

### Quando NÃO usar
- Navegação normal de site ou documento
- Conteúdo predominantemente de leitura
- Como solução preguiçosa para evitar testar com teclado

### Implicações
- Leitores de tela desativam comandos de navegação (headings, landmarks, links)
- Toda a comunicação deve ser implementada via ARIA explícita
- O foco gerenciavel deve ser implementado manualmente
- Requer extenso teste com múltiplos ATs

---

## Feed Role

Fornece um padrão de rolagem infinita acessível, permitindo que leitores de tela naveguem por artigos carregados dinamicamente.

```html
<section role="feed" aria-busy="false" aria-label="Feed de notícias">
  <article role="article" aria-posinset="1" aria-setsize="-1">
    <h2>Notícia 1</h2>
    <p>Conteúdo...</p>
  </article>
  <article role="article" aria-posinset="2" aria-setsize="-1">
    <h2>Notícia 2</h2>
    <p>Conteúdo...</p>
  </article>
</section>
```

| Estado | Uso |
|--------|-----|
| `aria-posinset` | Posição do item dentro do feed (1-indexed) |
| `aria-setsize` | Número total de itens; use `-1` se indeterminado |
| `aria-busy="true"` | Enquanto carrega mais itens |

### Navegação por teclado
| Tecla | Ação |
|-------|------|
| Page Down | Próximo artigo |
| Page Up | Artigo anterior |
| Ctrl + End | Último artigo |
| Ctrl + Home | Primeiro artigo |

### JavaScript Essencial
```javascript
const feed = document.getElementById('feed');
feed.addEventListener('scroll', () => {
  if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 200) {
    carregarMaisItens();
  }
});
```

---

## Definition Role + Term Role

```html
<span role="term">Mansplaining</span>
<span role="definition">Explicar algo de forma condescendente...</span>
```

| Elemento | Role ARIA | Uso |
|----------|-----------|-----|
| `<dfn>` | `term` | Termo sendo definido |
| `<dd>` | `definition` | Definição correspondente |

Prefira HTML nativo: `<dl>` + `<dt>` + `<dd>`.

---

## Note Role

Conteúdo suplementar ou de suporte, sem função de landmark. Diferente de `region`, não deve ser usado para conteúdo navegável.

```html
<p role="note" class="highlight-box">
  Nota: Este artigo foi atualizado em janeiro de 2025.
</p>
```

- Não substitui `<aside>` ou `region` para conteúdo complementar
- Adequado para notas editoriais, avisos, dicas laterais

---

## Math Role

Representa uma expressão matemática. Deve conter uma descrição textual acessível via `aria-label` ou texto interno.

```html
<img role="math" alt="Fórmula de Bhaskara: x = (-b ± √(b² - 4ac)) / 2a"
     src="formula-bhaskara.png">
```

```html
<div role="math" aria-label="E = mc²">
  <span aria-hidden="true">E = mc²</span>
</div>
```

Prefira MathML quando possível:
```html
<math role="math" aria-label="Equação de segundo grau">
  <mi>x</mi> <mo>=</mo>
  <mfrac>
    <mrow>
      <mo>-</mo> <mi>b</mi>
      <mo>±</mo>
      <msqrt><msup><mi>b</mi><mn>2</mn></msup> <mo>-</mo> <mn>4</mn><mi>a</mi><mi>c</mi></msqrt>
    </mrow>
    <mrow><mn>2</mn><mi>a</mi></mrow>
  </mfrac>
</math>
```

---

## Comment Role (ARIA 1.3 — Proposto)

Associa um comentário anexado a um trecho de texto via `aria-details`.

```html
<p>
  O texto principal
  <span role="mark" aria-details="thread-1">contém um trecho</span>
  que continua aqui.
</p>
<div role="comment" id="thread-1">
  <p>Este é um comentário sobre o trecho destacado.</p>
</div>
```

| Atributo | Uso |
|----------|-----|
| `aria-details` | Referencia o ID do comentário |
| `role="mark"` | Destaca o texto referenciado |

Comentários aninhados:
```html
<div role="comment" id="thread-1">
  <p>Comentário original</p>
  <div role="comment" id="thread-1-1">
    <p>Resposta ao comentário</p>
  </div>
</div>
```

---

## Suggestion Role (ARIA 1.3 — Proposto)

Agrupa uma alteração sugerida, combinando inserção e remoção.

```html
<p>
  O texto
  <span role="suggestion">
    <span role="deletion">antigo</span>
    <span role="insertion">novo</span>
  </span>
  continua aqui.
</p>
```

- `role="suggestion"` envolve `deletion` + `insertion`
- Anotado via `aria-details` para metadados da sugestão

### Deletion + Insertion (ARIA 1.3 — Proposto)

```html
<span role="deletion">texto removido</span>
<span role="insertion">texto adicionado</span>
```

| HTML Nativo | Role ARIA |
|-------------|-----------|
| `<del>` | `deletion` |
| `<ins>` | `insertion` |

---

## Generic Role

Role abstrata para uso exclusivo de agentes de usuário (UA). **Não deve ser usada por autores**.

- Representa um elemento sem semântica implícita
- Equivalente ARIA de `<div>` ou `<span>` sem role
- Navegadores a usam internamente para elementos não-semânticos

---

## None Role vs Presentation Role

Ambas removem a semântica implícita do elemento, mas com diferenças sutis:

| Aspecto | `presentation` | `none` |
|---------|---------------|--------|
| Efeito | Remove semântica do elemento atual | Remove semântica do elemento atual |
| Propagação | Não remove semântica de descendentes nomeados | Mesmo |
| Diferença prática | Nenhuma — `none` é um alias de `presentation` | Idêntico |
| Quando usar | Para suprimir semântica de elementos decorativos | Prefira `none` por clareza |

```html
<h2 role="presentation">Título visual sem semântica de heading</h2>
<ul role="none">
  <li>Item sem semântica de lista</li>
</ul>
```

**Atenção**: Descendentes com funções explícitas (ex: `<a href>`, `<button>`, `role="link"`) mantêm suas semânticas, mesmo quando ancestrais têm `role="presentation"`.

---

## Checklist
- [ ] `role="application"` usado apenas para apps complexos, nunca para navegação normal
- [ ] Feed implementa `aria-posinset`/`aria-setsize` e navegação Page Up/Down
- [ ] Definições preferem `<dl>`/`<dt>`/`<dd>` nativos
- [ ] `role="note"` usado para conteúdo suplementar, não como landmark
- [ ] Expressões matemáticas usam MathML ou `role="math"` com `aria-label`
- [ ] `role="presentation"`/`role="none"` usados apenas para supressão semântica
- [ ] `role="generic"` nunca usado por autores
