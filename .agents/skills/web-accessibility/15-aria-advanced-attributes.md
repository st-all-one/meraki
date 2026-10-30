# Atributos ARIA Avançados

## aria-keyshortcuts

Declara atalhos de teclado para um elemento, permitindo que leitores de tela informem o usuário sobre atalhos disponíveis.

```html
<button aria-keyshortcuts="Ctrl+Shift+S">Salvar</button>
<a href="/busca" aria-keyshortcuts="/">Busca</a>
```

### Sintaxe
| Padrão | Exemplo |
|--------|---------|
| Tecla única | `"Enter"`, `"Escape"`, `"/"` |
| Combinada com modificador | `"Ctrl+C"`, `"Alt+1"` |
| Múltiplos modificadores | `"Ctrl+Shift+S"` |
| Múltiplos atalhos | `"Ctrl+S Shift+F10"` (alternativas separadas por espaço) |

### Modificadores
| Modificador | Nota |
|-------------|------|
| `Ctrl` | Control |
| `Alt` | Alternative / Option |
| `Shift` | Shift |
| `Meta` | Windows / Command |

### Boas práticas
- `aria-keyshortcuts` **apenas documenta** o atalho — você ainda precisa implementar o event listener
- Não use atalhos que conflitem com leitores de tela ou navegador
- Informe o atalho também no texto visível quando possível
- Siga convenções do sistema operacional (`Ctrl` no Windows/Linux, `Cmd` no macOS)

```javascript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 's') {
    e.preventDefault();
    salvarDocumento();
  }
});
```

---

## aria-roledescription

Fornece um nome legível para uma role ARIA, substituindo a anunciação padrão do leitor de tela.

```html
<div role="region" aria-roledescription="slide" aria-label="Slide 1">
  Conteúdo do slide...
</div>
<div role="button" aria-roledescription="Play/Pause">▶</div>
```

### Regras
- Deve ser usada APENAS com roles que tenham significado claro para o usuário
- **Não use** para substituir roles padrão como `button`, `link`, `heading`
- **Não use** para confundir o usuário (ex: `role="button" aria-roledescription="link"`)
- Sempre forneça `aria-label` ou texto nomeando o elemento
- O valor deve ser localizado no idioma do conteúdo

### Quando usar
- Slideshow com `role="region"` → `aria-roledescription="slide"`
- Player de mídia com `role="region"` → `aria-roledescription="player"`
- Custom dashboard widget

### Quando NÃO usar
- Roles padrão bem compreendidas (`button`, `link`, `heading`, `checkbox`)
- Para evitar que o leitor de tela anuncie a role real
- Com `aria-brailleroledescription` conflitante

---

## aria-braillelabel

Define um label específico para exibição em Braille, diferente do label normal.

```html
<button aria-label="Salvar documento" aria-braillelabel="Salvar">
  💾
</button>
```

- Usado quando o label normal contém caracteres que não se traduzem bem para Braille
- Deve ser mais curto e direto que o label normal
- Nunca mais longo que o label de áudio
- Se omitido, o display Braille usa o accessible name padrão

---

## aria-brailleroledescription

Define uma descrição de role específica para Braille.

```html
<div role="region" aria-roledescription="slide"
     aria-brailleroledescription="sld">
  ...
</div>
```

- Deve ser usada em conjunto com `aria-roledescription`
- O valor deve ser curto (idealmente 1-4 caracteres Braille)
- Se omitido, o display Braille usa `aria-roledescription`

---

## aria-flowto

Define uma ordem de leitura alternativa para elementos, permitindo que autores controlem a sequência de navegação.

```html
<div id="artigo1">Primeiro conteúdo...</div>
<div id="artigo3" aria-flowto="artigo2">Terceiro conteúdo...</div>
<div id="artigo2">Segundo conteúdo...</div>
```

```html
<input type="text" id="nome" aria-flowto="endereco telefone">
<input type="text" id="endereco">
<input type="text" id="telefone">
```

### Suporte
| AT | Suporte |
|----|---------|
| VoiceOver (macOS) | Limitado |
| NVDA | Limitado |
| JAWS | Parcial |
| TalkBack | Não suportado |

- **Suporte limitado** — não confie como única forma de navegação
- Use `tabindex` e ordem DOM para navegação linear
- `aria-flowto` é uma dica, não um comando imperativo
- Múltiplos IDs separados por espaço: `aria-flowto="id1 id2 id3"`

---

## aria-details

Fornece uma referência a conteúdo que contém informações detalhadas ou explicações estendidas.

```html
<img src="grafico-vendas.png"
     alt="Gráfico de vendas do ano"
     aria-details="descricao-vendas">
<div id="descricao-vendas">
  <h3>Análise detalhada</h3>
  <p>As vendas cresceram 23% no primeiro trimestre...</p>
  <table>
    <caption>Vendas por mês</caption>
    ...
  </table>
</div>
```

```html
<p>
  <span role="mark" aria-details="comentario-1">Trecho destacado</span>
</p>
<div role="comment" id="comentario-1">
  <p>Comentário sobre o trecho.</p>
</div>
```

### Diferença de `aria-describedby`
| Atributo | Propósito |
|----------|-----------|
| `aria-describedby` | Descrição curta, complementar |
| `aria-details` | Conteúdo estendido e estruturado (tabelas, listas, parágrafos) |

- Não substitui `aria-describedby` para descrições curtas
- Usado com `role="comment"` e `role="mark"` para comentários (ARIA 1.3)

---

## aria-placeholder

Fornece uma dica sobre o formato esperado em um `textbox` customizado.

```html
<div role="textbox" contenteditable="true"
     aria-placeholder="Ex: nome@exemplo.com"
     aria-labelledby="label-email">
</div>
```

### Problemas conhecidos do `placeholder` HTML
| Problema | Impacto |
|----------|---------|
| Baixo contraste (geralmente cinza claro) | Falha WCAG 1.4.3 |
| Desaparece ao digitar | Perde contexto |
| Confundido com valor preenchido | Leitores de tela podem anunciar como valor real |
| Não substitui `<label>` | Falha WCAG 3.3.2 |

### Boas práticas
- `aria-placeholder` APENAS em elementos com `role="textbox"` ou `role="searchbox"`
- Nunca use `aria-placeholder` no lugar de `aria-label` ou `<label>`
- O placeholder deve ser apenas um exemplo, não instrução completa
- Contraste do placeholder visual deve ser ≥ 4.5:1 ou 3:1 para texto grande

---

## aria-dropeffect + aria-grabbed (Depreciados)

Estes atributos faziam parte da especificação ARIA para drag-and-drop, mas foram **depreciados** e não devem ser usados em novos projetos.

| Atributo | Valores | Status |
|----------|---------|--------|
| `aria-dropeffect` | `none`, `copy`, `execute`, `link`, `move`, `popup` | **Depreciado** |
| `aria-grabbed` | `true`, `false`, `undefined` | **Depreciado** |

### Alternativas modernas
- Use a **HTML Drag and Drop API** com foco gerenciado
- Implemente `role="button"` ou `role="listitem"` com eventos de teclado
- Forneça instruções claras e feedback visual

```html
<!-- Abordagem moderna: drag and drop com teclado -->
<ul role="listbox" aria-label="Itens para reordenar">
  <li role="option" tabindex="0" aria-grabbed="false"
      draggable="true" id="item1">
    Item 1
  </li>
  <li role="option" tabindex="-1" aria-grabbed="false"
      draggable="true" id="item2">
    Item 2
  </li>
</ul>
```

```javascript
// Gerenciamento de teclado para reordenação
document.querySelectorAll('[draggable="true"]').forEach(item => {
  item.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moverItem(item, 'baixo');
    }
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moverItem(item, 'cima');
    }
  });
});
```

---

## Tabela de Suporte dos Atributos

| Atributo | Suporte AT | Recomendação |
|----------|------------|--------------|
| `aria-keyshortcuts` | Bom (NVDA, JAWS, VoiceOver) | ✅ Usar |
| `aria-roledescription` | Moderado | ⚠️ Usar com cautela |
| `aria-braillelabel` | Limitado | ⚠️ Apenas quando necessário |
| `aria-brailleroledescription` | Muito limitado | ⚠️ Apenas braille |
| `aria-flowto` | Limitado | ❌ Não confiar |
| `aria-details` | Parcial (NVDA, JAWS) | ✅ Usar para conteúdo extenso |
| `aria-placeholder` | Moderado | ✅ Usar em textbox custom |
| `aria-dropeffect` | **Depreciado** | ❌ Não usar |
| `aria-grabbed` | **Depreciado** | ❌ Não usar |

---

## Checklist
- [ ] `aria-keyshortcuts` implementado com event listener correspondente
- [ ] `aria-roledescription` não usado para substituir roles padrão
- [ ] `aria-braillelabel` mais curto que o label de áudio
- [ ] `aria-flowto` não usado como única forma de navegação
- [ ] `aria-details` usado para conteúdo extenso, não descrições curtas
- [ ] `aria-placeholder` nunca substitui `<label>` ou `aria-label`
- [ ] Drag-and-drop implementado com API moderna, não `aria-dropeffect`/`aria-grabbed`
