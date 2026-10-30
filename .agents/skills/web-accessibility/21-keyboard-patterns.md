# Padrões de Teclado Completos por Widget

## Convenções Gerais

| Tecla | Comportamento Universal |
|-------|------------------------|
| Tab | Entra/sai do widget. O item ativo recebe `tabindex="0"`, os demais `tabindex="-1"` |
| Shift + Tab | Sai do widget na direção reversa |
| Enter / Space | Ativa o item focado |
| Escape | Fecha menu/popup/dialog, retorna foco ao elemento que o invocou |

---

## Button

| Tecla | Ação |
|-------|------|
| Enter | Ativa o botão |
| Space | Ativa o botão |

- Navegadores tratam `<button>` nativamente
- Para `role="button"`: implementar keydown para Enter + Space

---

## Link

| Tecla | Ação |
|-------|------|
| Enter | Navega para o link |

- Links nativos (`<a href>`) já tratam Enter
- `role="link"` custom: implementar keydown para Enter
- **Não use Space** para links — viola expectativa do usuário

---

## Checkbox

| Tecla | Ação |
|-------|------|
| Space | Alterna estado marcado/desmarcado |

- Estado anunciado via `aria-checked` (não via `aria-selected`)
- Rótulo deve indicar o que é marcado
- Checkbox nunca deve ter submenu ou popup

---

## Radio / Radiogroup

| Tecla | Ação |
|-------|------|
| Tab | Entra no grupo: foca o item selecionado, ou o primeiro se nenhum selecionado |
| → / ↓ | Próxima opção (deseleciona atual, seleciona próxima) |
| ← / ↑ | Opção anterior (deseleciona atual, seleciona anterior) |

```javascript
radiogroup.addEventListener('keydown', (e) => {
  const radios = [...radiogroup.querySelectorAll('[role="radio"]')];
  const current = radios.findIndex(r => r.getAttribute('aria-checked') === 'true');

  let nextIndex = current;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      nextIndex = (current + 1) % radios.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      nextIndex = (current - 1 + radios.length) % radios.length;
      break;
  }

  radios[current].setAttribute('aria-checked', 'false');
  radios[current].setAttribute('tabindex', '-1');
  radios[nextIndex].setAttribute('aria-checked', 'true');
  radios[nextIndex].setAttribute('tabindex', '0');
  radios[nextIndex].focus();
});
```

---

## Switch

| Tecla | Ação |
|-------|------|
| Space | Alterna o estado on/off |

- Use `aria-checked` (não `aria-pressed`) para switch
- Diferença visual marcante entre estado ativo e inativo

---

## Select (Combobox / Listbox)

### Combobox (single-select editável)

| Tecla | Ação |
|-------|------|
| ↓ | Abre a lista, move para próximo item |
| ↑ | Abre a lista, move para item anterior |
| Alt + ↓ | Abre a lista sem mover foco |
| Alt + ↑ | Fecha a lista |
| Enter | Seleciona item focado, fecha lista |
| Escape | Fecha a lista sem selecionar |
| Home | Move para o primeiro item |
| End | Move para o último item |
| Caractere | Type-ahead: move para item que começa com caractere |

### Listbox (multi-select)

| Tecla | Ação |
|-------|------|
| ↓ | Próximo item (sem selecionar se for navigation) |
| ↑ | Item anterior |
| Space | Alterna seleção do item atual |
| Ctrl + ↓ | Move foco sem selecionar (multi-select) |
| Shift + ↓ | Seleciona range (contíguo) |
| Ctrl + A | Seleciona todos |
| Home | Primeiro item |
| End | Último item |

---

## Tab / Tablist

| Tecla | Ação |
|-------|------|
| Tab | Entra na tablist: foca na aba ativa. Tab novamente: sai da tablist para o tabpanel |
| → | Próxima aba (ativa se for automatic activation) |
| ← | Aba anterior |
| Home | Primeira aba |
| End | Última aba |
| Enter/Space | Se manual activation: ativa a aba focada |

```javascript
tablist.addEventListener('keydown', (e) => {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      ativarAba((current + 1) % tabs.length);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      ativarAba((current - 1 + tabs.length) % tabs.length);
      break;
    case 'Home':
      e.preventDefault();
      ativarAba(0);
      break;
    case 'End':
      e.preventDefault();
      ativarAba(tabs.length - 1);
      break;
  }
});

function ativarAba(index) {
  const tabs = tablist.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
  panels.forEach(p => p.classList.remove('active'));

  tabs[index].setAttribute('aria-selected', 'true');
  tabs[index].focus();
  panels[index].classList.add('active');
}
```

---

## Dialog / Alertdialog

| Tecla | Ação |
|-------|------|
| Tab | Move foco para o próximo elemento dentro do dialog |
| Shift + Tab | Move foco para o elemento anterior dentro do dialog |
| Escape | Fecha o dialog, retorna foco ao elemento que o abriu |

### Regras de Foco
1. Ao abrir: foco vai para o primeiro elemento interativo OU o elemento mais importante
2. Focus trap: Tab cicla apenas dentro do dialog
3. Ao fechar: foco retorna ao elemento que acionou a abertura
4. Se o elemento que abriu não existe mais, foco vai para o próximo lógico

```javascript
function abrirDialog(dialog) {
  const previousFocus = document.activeElement;
  dialog.previousFocus = previousFocus;
  dialog.showModal();  // <dialog> nativo + inert
  dialog.querySelector('button, input, a, [tabindex]').focus();
}

function fecharDialog(dialog) {
  dialog.close();
  if (dialog.previousFocus) {
    dialog.previousFocus.focus();
  }
}

// Focus trap manual para <div role="dialog">
dialog.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    const focusable = dialog.querySelectorAll(
      'button, input, a, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
```

---

## Slider

| Tecla | Ação |
|-------|------|
| → / ↑ | Incrementa valor |
| ← / ↓ | Decrementa valor |
| Page Up | Incremento grande (ex: +10%) |
| Page Down | Decremento grande |
| Home | Valor mínimo |
| End | Valor máximo |

```html
<div role="slider" tabindex="0"
     aria-valuemin="0" aria-valuemax="100"
     aria-valuenow="50" aria-valuetext="50%"
     aria-label="Volume">
</div>
```

```javascript
slider.addEventListener('keydown', (e) => {
  const min = parseInt(slider.getAttribute('aria-valuemin'));
  const max = parseInt(slider.getAttribute('aria-valuemax'));
  let value = parseInt(slider.getAttribute('aria-valuenow'));
  const step = 1;
  const largeStep = 10;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      e.preventDefault();
      value = Math.min(max, value + step);
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      e.preventDefault();
      value = Math.max(min, value - step);
      break;
    case 'PageUp':
      e.preventDefault();
      value = Math.min(max, value + largeStep);
      break;
    case 'PageDown':
      e.preventDefault();
      value = Math.max(min, value - largeStep);
      break;
    case 'Home':
      e.preventDefault();
      value = min;
      break;
    case 'End':
      e.preventDefault();
      value = max;
      break;
  }

  slider.setAttribute('aria-valuenow', value);
  slider.setAttribute('aria-valuetext', `${value}%`);
});
```

---

## Menu / Menubar

### Menubar

| Tecla | Ação |
|-------|------|
| → | Próximo item na barra |
| ← | Item anterior na barra |
| ↓ | Abre submenu do item atual |
| ↑ | Se submenu aberto: item anterior no submenu |
| Enter | Ativa item (se não tem submenu) ou abre submenu |
| Escape | Fecha submenu, retorna à barra |
| Home | Primeiro item na barra |
| End | Último item na barra |

### Submenu (Menu)

| Tecla | Ação |
|-------|------|
| ↓ | Próximo item no menu (wrap) |
| ↑ | Item anterior no menu (wrap) |
| → | Abre submenu aninhado (se houver) |
| ← | Fecha submenu atual |
| Enter/Space | Ativa item |
| Escape | Fecha submenu |
| Tab | Fecha todos os menus |

---

## Tree / Treeview

| Tecla | Ação |
|-------|------|
| ↓ | Próximo node visível |
| ↑ | Node visível anterior |
| → | Expande node recolhido, ou move para primeiro filho |
| ← | Recolhe node expandido, ou move para o parent |
| Enter | Ativa node (se for link/action) |
| Space | Alterna seleção (multi-select) |
| Home | Primeiro node da árvore |
| End | Último node visível |
| * | Expande todos os irmãos no mesmo nível |
| Caractere | Type-ahead: foca node cujo label começa com o caractere |

```javascript
tree.addEventListener('keydown', (e) => {
  const items = [...tree.querySelectorAll('[role="treeitem"]')];
  const current = items.findIndex(
    i => i.getAttribute('tabindex') === '0'
  );

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      focusItem(current + 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      focusItem(current - 1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      expandItem(current);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      collapseItem(current);
      break;
    case 'Home':
      e.preventDefault();
      focusItem(0);
      break;
    case 'End':
      e.preventDefault();
      focusItem(items.length - 1);
      break;
  }
});
```

---

## Grid / DataGrid

| Tecla | Ação |
|-------|------|
| → | Célula à direita |
| ← | Célula à esquerda |
| ↓ | Célula abaixo |
| ↑ | Célula acima |
| Page Down | Move para baixo uma tela |
| Page Up | Move para cima uma tela |
| Home | Primeira célula na linha |
| End | Última célula na linha |
| Ctrl + Home | Primeira célula no grid |
| Ctrl + End | Última célula no grid |
| Tab | Sai do grid (última célula) ou entra (primeira) |
| Enter | Ativa célula / modo de edição |
| Ctrl + Space | Seleciona coluna atual |
| Shift + Space | Seleciona linha atual |
| Ctrl + A | Seleciona todas as células |

---

## Toolbar

| Tecla | Ação |
|-------|------|
| → | Próximo controle na toolbar (wrap) |
| ← | Controle anterior na toolbar (wrap) |
| Tab | Sai da toolbar |
| Home | Primeiro controle |
| End | Último controle |

- Roving tabindex: `tabindex="0"` no focado, `tabindex="-1"` nos demais
- Orientação implícita horizontal (use `aria-orientation="vertical"` para vertical)

---

## Treegrid

| Tecla | Ação |
|-------|------|
| ↓ | Próxima linha |
| ↑ | Linha anterior |
| → | Em linha com rowheader: expande se recolhido, move para primeira célula |
| ← | Move para rowheader, ou recolhe se expandido |
| Enter | Ativa ação na célula |
| Tab | Próximo widget na página |
| Space | Alterna seleção da linha |
| Ctrl + ↓ | Move foco sem mudar seleção |

---

## Feed

| Tecla | Ação |
|-------|------|
| Page Down | Próximo artigo |
| Page Up | Artigo anterior |
| Ctrl + End | Último artigo disponível |
| Ctrl + Home | Primeiro artigo |
| Tab | Entra/sai do feed |

---

## Tooltip

| Ação | Comportamento |
|------|---------------|
| Focus/Hover no elemento | Aparece o tooltip |
| Escape | Fecha o tooltip |
| Tab | Fecha o tooltip |
| Muda foco | Fecha o tooltip |

- Tooltips não devem conter elementos interativos
- Tooltips não devem ser essenciais para operação
- Escape deve sempre fechar o tooltip

---

## Resumo: Estrutura de Navegação por Tipo

| Tipo | Tab para entrar | Navegação interna | Tab para sair |
|------|----------------|-------------------|---------------|
| Button | ✅ | N/A | ✅ |
| Link | ✅ | N/A | ✅ |
| Checkbox | ✅ | N/A | ✅ |
| Radio group | ✅ | Setas | ✅ |
| Switch | ✅ | N/A | ✅ |
| Combobox | ✅ | Setas + Alt + setas | ✅ |
| Listbox | ✅ | Setas | ✅ |
| Tablist | ✅ | Setas | ✅ (para panel) |
| Dialog | ✅ | Tab (trap) | Escape |
| Slider | ✅ | Setas, Page, Home, End | ✅ |
| Menu | ✅ | Setas | Escape |
| Tree | ✅ | Setas, Home, End, * | ✅ |
| Grid | ✅ | Setas, Page, Ctrl+Home/End | ✅ |
| Toolbar | ✅ | Setas | ✅ |
| Treegrid | ✅ | Setas, Enter, Space | ✅ |
| Feed | ✅ | Page Up/Down | ✅ |

---

## Checklist
- [ ] Todos os widgets interativos são operáveis por teclado
- [ ] Roving tabindex implementado para widgets com sub-elementos
- [ ] Tab entra/sai do widget (Tab + Shift+Tab)
- [ ] Setas navegam entre itens internos
- [ ] Home/End funcionam para ir ao primeiro/último item
- [ ] Escape fecha popups/menus/dialogs e retorna foco
- [ ] Enter/Space ativam o item focado
- [ ] Dialogs têm focus trap (Tab cicla dentro)
- [ ] Foco retorna ao elemento de origem ao fechar dialog/menu
- [ ] Type-ahead implementado em listas longas (caractere → item correspondente)
- [ ] Atalhos não conflitam com leitores de tela
- [ ] Focus ring visível em todos os elementos focáveis
