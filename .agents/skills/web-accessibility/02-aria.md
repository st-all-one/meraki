# ARIA — Accessible Rich Internet Applications

## As 5 Regras do ARIA

```
1. Se existe elemento HTML nativo com semântica e comportamento desejados, use-o. 
   → Não use ARIA.
2. Não mude semânticas nativas a menos que seja absolutamente necessário.
   → Ex: <h1 role="button"> NÃO.
3. Todo elemento interativo ARIA deve ser operável por teclado.
   → Ex: <div role="button"> precisa de tabindex="0", onkeydown (Enter/Space).
4. Elementos com role="presentation" ou role="none" NÃO devem conter elementos com nome acessível.
5. Elementos interativos devem ter nomes acessíveis (aria-label, aria-labelledby, ou label nativo).
```

## Categorias de Funções (Roles)

### 1. Widget Roles
| Role | Equivalente HTML | Requerimentos |
|---|---|---|
| `button` | `<button>` | Enter/Space para ativar |
| `checkbox` | `<input type="checkbox">` | `aria-checked` obrigatório |
| `link` | `<a href>` | Enter para navegar |
| `radio` | `<input type="radio">` | `aria-checked`, agrupamento via `radiogroup` |
| `switch` | — | `aria-checked`, toggle visual |
| `slider` | `<input type="range">` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| `progressbar` | `<progress>` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| `tab` | — | `aria-selected`, `aria-controls` para o `tabpanel` |
| `tabpanel` | — | `aria-labelledby` apontando para o `tab` |
| `textbox` | `<input type="text">`, `<textarea>` | `aria-multiline` se multilinha |
| `searchbox` | `<input type="search">` | Mesmo que textbox |
| `combobox` | `<select>` + autocomplete | `aria-expanded`, `aria-controls`, `aria-activedescendant` |
| `listbox` | `<select size=">1">` | Contém `option` children |
| `option` | `<option>` | `aria-selected`, `aria-posinset`, `aria-setsize` |
| `menu`/`menubar` | — | Navegação por setas, `aria-expanded` |
| `menuitem` | — | Enter ativa |
| `tooltip` | — | Associado via `aria-describedby` |
| `treeitem` | — | `aria-expanded`, `aria-selected`, `aria-level` |

### 2. Document Structure Roles
| Role | Equivalente HTML | Nota |
|---|---|---|
| `article` | `<article>` | Autocontido |
| `cell` | `<td>` | Filho de `row` |
| `columnheader` | `<th scope="col">` | — |
| `rowheader` | `<th scope="row">` | — |
| `figure` | `<figure>` | — |
| `heading` | `<h1>`-`<h6>` | Requer `aria-level` |
| `img` | `<img>` | Usar só quando agrupa SVG ou múltiplos elementos visuais |
| `list` | `<ul>`/`<ol>` | — |
| `listitem` | `<li>` | Filho de `list` |
| `meter` | `<meter>` | Intervalo conhecido |
| `table` | `<table>` | Estrutura estática, não interativa |
| `row` | `<tr>` | — |
| `rowgroup` | `<thead>`/`<tbody>`/`<tfoot>` | — |
| `separator` | `<hr>` | Se focado, vira widget |
| `toolbar` | — | Roving tabindex, setas |
| `term` | `<dfn>` | Definição |
| `none`/`presentation` | — | Remove semântica ARIA implícita |

### 3. Landmark Roles
| Role | Equivalente HTML | Nota |
|---|---|---|
| `banner` | `<header>` (global) | — |
| `navigation` | `<nav>` | — |
| `main` | `<main>` | Apenas 1 por documento |
| `complementary` | `<aside>` | Separável do main |
| `contentinfo` | `<footer>` (global) | — |
| `region` | `<section>` | Precisa de nome acessível |
| `form` | `<form>` | Precisa de nome acessível |
| `search` | `<search>` | — |

### 4. Live Region Roles
| Role | Comportamento | aria-live implícito |
|---|---|---|
| `alert` | Anuncia imediatamente, interrompe | `assertive` |
| `status` | Anuncia quando usuário ocioso | `polite` |
| `log` | Atualizações em chat/log | `polite` |
| `marquee` | Rolagem contínua | `off` |
| `timer` | Relógio/cronômetro | `off` |
| `progressbar` | Barra de progresso | — |

### 5. Window Roles
| Role | Equivalente HTML | Requisitos |
|---|---|---|
| `dialog` | `<dialog>` | `aria-labelledby` ou `aria-label`, gerenciamento de foco |
| `alertdialog` | — | Como dialog + alerta crítico, pelo menos 1 foco |

## Principais Atributos ARIA

### Widget Attributes
| Atributo | Tipo | Função |
|---|---|---|
| `aria-checked` | `false`/`true`/`mixed` | Checkbox, radio, switch |
| `aria-current` | `page`/`step`/`location`/`date`/`time`/`true` | Elemento atual em um conjunto |
| `aria-disabled` | `boolean` | Visível mas não operável |
| `aria-expanded` | `boolean` | Controla visibilidade de conteúdo |
| `aria-haspopup` | `menu`/`listbox`/`tree`/`grid`/`dialog` | Indica popup acionável |
| `aria-hidden` | `boolean` | Remove da árvore de acessibilidade |
| `aria-invalid` | `false`/`true`/`grammar`/`spelling` | Erro de validação |
| `aria-label` | string | Nome acessível (sem equivalente visível) |
| `aria-labelledby` | lista de IDs (**maior precedência**) | Referencia label visível |
| `aria-describedby` | lista de IDs | Descrição adicional |
| `aria-modal` | `boolean` | Dialog é modal |
| `aria-pressed` | `false`/`true`/`mixed` | Botão toggle |
| `aria-required` | `boolean` | Campo obrigatório |
| `aria-selected` | `boolean` | Tab, option, gridcell |
| `aria-sort` | `ascending`/`descending`/`none`/`other` | Ordenação de tabela/grid |
| `aria-valuenow` | número | Valor atual de range |
| `aria-valuetext` | string | Texto alternativo para valuenow |
| `aria-valuemin`/`aria-valuemax` | número | Limites de range |

### Live Region Attributes
| Atributo | Valores | Efeito |
|---|---|---|
| `aria-live` | `off`/`polite`/`assertive` | Prioridade de anúncio |
| `aria-atomic` | `boolean` | Anunciar região inteira ou só mudanças |
| `aria-relevant` | `additions`/`removals`/`text`/`all` | Tipos de mudança a anunciar |
| `aria-busy` | `boolean` | Região ainda carregando |

### Relationship Attributes
| Atributo | Função |
|---|---|
| `aria-activedescendant` | Foco virtual em composite widget |
| `aria-controls` | Elemento controlado por este (ex: tab → tabpanel) |
| `aria-owns` | Relação pai-filho não capturada no DOM |
| `aria-flowto` | Ordem de leitura alternativa |
| `aria-errormessage` | Referencia elemento de erro |
| `aria-details` | Referencia conteúdo de detalhes adicionais |

## Padrão: Nome Acessível (Accessible Name)

Hierarquia de cálculo (maior precedência primeiro):
1. `aria-labelledby` (referencia IDs de elementos label)
2. `aria-label`
3. Atributo nativo (ex: `alt` em img, `title` em frame)
4. Conteúdo do elemento (ex: texto dentro de `<button>`)
5. `placeholder` (apenas para textbox)
6. `title` (global attribute)

## Armadilhas Comuns

| Erro | Correção |
|---|---|
| `<div role="button">` sem `tabindex="0"` | Adicionar `tabindex="0"` e handlers de teclado |
| `role="alert"` no HTML estático | Role alert é para conteúdo DINÂMICO; pré-existente não é anunciado |
| `aria-label` duplicando label visível | Remover `aria-label` ou usar `aria-labelledby` |
| `role="presentation"` em elemento interativo | Remove semântica, mas interação continua; evitar |
| `aria-hidden="true"` em elemento focado | Foco em elemento `aria-hidden` é inconsistente |
| Usar `aria-placeholder` em vez de `<label>` | Placeholder não substitui label |
| `aria-live="assertive"` para tudo | Interrompe usuário constantemente; use `polite` por padrão |
| Múltiplos `role="main"` | Apenas 1 `main` por documento |
| `role="application"` sem necessidade | Remove modos de navegação do leitor de tela; usar só para apps complexos |

## Técnicas Avançadas

### Foco Gerenciado em Composite Widgets

Dois padrões:

**Roving tabindex**: Cada filho tem `tabindex` controlado:
```js
// Atualiza tabindex do item atual e anterior ao navegar com setas
anterior.tabIndex = -1;
atual.tabIndex = 0;
atual.focus();
```

**aria-activedescendant**: Container tem foco, `aria-activedescendant` aponta para ID do filho virtualmente focado:
```html
<ul role="listbox" tabindex="0" aria-activedescendant="opt1">
  <li role="option" id="opt1">Opção 1</li>
  <li role="option" id="opt2">Opção 2</li>
</ul>
```

### Labels Multipart (aria-labelledby)
```html
<input aria-labelledby="label-text input-unit" id="input" type="text" value="10">
<span id="label-text">Desligar após</span>
<span id="input-unit"> minutos</span>
```
Útil para construções como "Desligar após [10] minutos".

## Referência Rápida: ARIA vs HTML Nativo

| Funcionalidade | HTML Nativo (preferir) | ARIA (apenas se não der) |
|---|---|---|
| Botão | `<button>` | `<div role="button" tabindex="0">` |
| Abas | — | `role="tablist"`, `tab`, `tabpanel` |
| Accordion | `<details>` + `<summary>` | `role="button"` + `aria-expanded` |
| Barra de progresso | `<progress>` | `role="progressbar"` |
| Diálogo | `<dialog>` | `role="dialog"`/`alertdialog` |
| Menu | — | `role="menubar"`, `menu`, `menuitem` |
| Slider | `<input type="range">` | `role="slider"` |
| Dica flutuante | — | `role="tooltip"` via `aria-describedby` |
| Grid editável | — | `role="grid"`, `gridcell` |
| Tree | — | `role="tree"`, `treeitem` |
| Autocomplete | `<datalist>` | `role="combobox"` + `listbox` |
| Alternador | `<input type="checkbox" role="switch">` | `role="switch"` + `aria-checked` |
