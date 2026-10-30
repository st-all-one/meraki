# Acessibilidade por Teclado

## Princípio

> Toda funcionalidade disponível por mouse/touch **deve** ser operável por teclado.

## Fundamentos do tabindex

| Valor | Comportamento |
|---|---|
| `tabindex="-1"` | Foco via JS (`element.focus()`) mas NÃO via Tab |
| `tabindex="0"` | Foco via Tab e JS, na ordem do DOM |
| `tabindex="5"` (positivo) | **EVITAR**. Ordem customizada manual que confunde usuários |

### Regras do tabindex

1. **`tabindex="0"`** para tornar elemento não-interativo focado (ex: container de widget)
2. **`tabindex="-1"`** para itens em widget composto (navegação por setas)
3. **Nunca use valores positivos** — quebram a ordem natural
4. Controles desabilitados: remova da tab order com `tabindex="-1"` (mas itens em widget agrupado mantêm navegação por setas)

## Padrão de Navegação em Widgets Compostos

### Roving tabindex (padrão recomendado)
```
Widget entra no tab order via filho selecionado com tabindex="0".
Demais filhos têm tabindex="-1".
Setas movem foco: filho anterior → tabindex="-1", novo filho → tabindex="0", focus().
Tab sai do widget; ao retornar, foco retorna ao último item selecionado.
```

Exemplo prático:
```html
<ul role="tablist">
  <li role="tab" tabindex="0" aria-selected="true">Aba 1</li>
  <li role="tab" tabindex="-1" aria-selected="false">Aba 2</li>
  <li role="tab" tabindex="-1" aria-selected="false">Aba 3</li>
</ul>
```

```js
// Handler de setas: atualiza tabindex, foco, e aria-selected
tablist.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    const current = document.activeElement;
    const next = current.nextElementSibling;
    if (next) {
      current.tabIndex = -1;
      current.ariaSelected = 'false';
      next.tabIndex = 0;
      next.ariaSelected = 'true';
      next.focus();
    }
  }
  // ArrowLeft similar
});
```

### aria-activedescendant (alternativa)

Container tem foco, filho virtual é apontado por `aria-activedescendant`:
```html
<ul role="listbox" tabindex="0" aria-activedescendant="opt1">
  <li role="option" id="opt1">Item 1</li>
  <li role="option" id="opt2">Item 2</li>
</ul>
```
- Só o container está no tab order
- JS atualiza `aria-activedescendant` e estilo visual
- Mais simples que roving para listas grandes/virtualizadas

## Convenções de Teclado por Tipo de Widget

| Widget | Teclas |
|---|---|
| **Botão** | Enter/Space |
| **Link** | Enter |
| **Checkbox/Radio** | Space (alterna estado) |
| **Select (dropdown)** | Enter expande, setas navegam, Enter/Escape fecha |
| **Slider** | Setas (incremento), Home/End (min/máx) |
| **Tab/Tablist** | Setas mudam aba, Ctrl+PageUp/Down também |
| **Menu/Menubar** | Enter/Seta pra baixo abre, Setas navegam, Escape fecha |
| **Tree** | Setas navegam, Enter ativa, Direita expande, Esquerda colapsa |
| **Grid/Datagrid** | Setas (2D), Ctrl+setas move sem selecionar, Space seleciona |
| **Dialog** | Escape fecha, foco preso dentro do modal (focus trap) |
| **Toolbar** | Setas navegam entre itens, Tab sai do toolbar |
| **Listbox** | Setas navegam, Space seleciona/desseleciona (se multiselect) |

## Boas Práticas de Foco

### Foco Visível

```css
/* NUNCA faça: */
*:focus { outline: none; }

/* Prefira: usar o outline nativo ou customizar mantendo foco visível */
*:focus-visible {
  outline: 3px solid #4A90D9;
  outline-offset: 2px;
}
```

- Use `:focus-visible` para mostrar foco apenas quando relevante (teclado, não mouse)
- Mantenha `outline` padrão do navegador ao menos para usuários de teclado
- Se criar componentes customizados, sempre defina estilo de foco

### Gerenciamento de Foco em Diálogos

```js
function openDialog(dialogEl) {
  dialogEl.showModal(); // ou: hidden = false
  // Guarda referência ao elemento que abriu o dialog
  previousFocus = document.activeElement;
  // Foca primeiro elemento focado dentro do dialog
  const firstFocusable = dialogEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  firstFocusable?.focus();
}

function closeDialog(dialogEl) {
  dialogEl.close(); // ou: hidden = true
  // Restaura foco
  previousFocus?.focus();
}
```

### Focus Trap
Modal deve prender foco:
1. Tab no último elemento → volta ao primeiro
2. Shift+Tab no primeiro → vai ao último
3. Escape fecha o modal

### Skip Links
```html
<a href="#main-content" class="skip-link">Pular para conteúdo principal</a>
```
- Primeiro elemento focado ao pressionar Tab na página
- Deve estar visível ao receber foco (ou aparecer apenas no foco)
- Linka para o `id` do `<main>` ou conteúdo principal

## O Que EVITAR

- `tabindex` positivo (`tabindex="5"`)
- Remover `:focus` (`outline: none`) sem substituto
- `onclick` sem `onkeydown` correspondente
- Evento `focus` via dispatch (use `element.focus()`)
- Assumir que foco muda apenas via mouse/teclado (AT também define foco)
- Usar `tabindex="0"` em elementos que não são interativos

## Checklist de Teclado

- [ ] Todas as funcionalidades são acessíveis por teclado
- [ ] Ordem de Tab segue a ordem visual/DOM
- [ ] Nenhum `tabindex` positivo
- [ ] Foco visível em todos os elementos interativos
- [ ] Widgets compostos implementam navegação por setas
- [ ] Diálogos/menus implementam focus trap
- [ ] Skip link presente e funcional
- [ ] Enter/Space ativam todos os controles
- [ ] Foco retorna ao elemento de origem ao fechar modais
- [ ] Elementos desabilitados removidos do tab order
