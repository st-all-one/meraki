# Comentários HTML (`<!-- ... -->`)

## Sintaxe

```html
<!-- comentário de uma linha -->

<!--
comentário
de múltiplas
linhas
-->

<!-- Código desabilitado (não renderizado) -->
<!--
<p>Este parágrafo não aparece.</p>
-->
```

## Regras

- Começa com `<!--` e termina com `-->`
- O texto entre eles **não pode**:
  - começar com `>` ou `->`
  - conter `-->` ou `--!>`
  - terminar com `<!-`
- Comentários **não podem ser aninhados** (o primeiro `-->` fecha)
- Comentários **não são elementos HTML** (apesar de começarem com `<` e terminarem com `>`)

## Onde Usar

- Antes e depois do DOCTYPE
- Antes e depois do `<html>`
- Como conteúdo da maioria dos elementos

## Onde NÃO Usar

Dentro destes elementos, que interpretam conteúdo como raw text:

| Elemento | Motivo |
|----------|--------|
| `<script>` | Usar comentários JS (`//` ou `/* */`) |
| `<style>` | Usar comentários CSS (`/* */`) |
| `<title>` | Texto puro, comentários apareceriam |
| `<textarea>` | Texto puro, comentários apareceriam |

> [!NOTE]
> Historicamente, `<script>` content era envolvido em `<!-- -->` para browsers antigos que não suportavam JS. Isso é legado e **não deve ser feito hoje**.

## API DOM

```js
// Criar comentário via JS
const comment = document.createComment("texto do comentário");
document.body.appendChild(comment);

// NodeType de comentário: 8
console.log(comment.nodeType); // 8
```

## Boas Práticas

- Use comentários para explicar **por que** algo foi feito, não **o que** foi feito
- Não exponha informações sensíveis em comentários (visíveis no source)
- Evite comentários que poluam o HTML de produção; use build tools para removê-los
