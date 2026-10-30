# Padrões de Design ARIA (WAI-ARIA APG)

## Referência Oficial

Todos os padrões abaixo são adaptações do **[WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)**. Consulte o APG para exemplos completos, demonstrações interativas e código-fonte funcional.

---

## Accordion (Disclosure)

```html
<div role="region" aria-label="Perguntas frequentes">
  <h3>
    <button id="accordion-1-header"
            aria-expanded="false"
            aria-controls="accordion-1-panel">
      O que é acessibilidade web?
    </button>
  </h3>
  <div id="accordion-1-panel"
       role="region"
       aria-labelledby="accordion-1-header"
       hidden>
    <p>Acessibilidade web significa que pessoas com deficiência...</p>
  </div>

  <h3>
    <button id="accordion-2-header"
            aria-expanded="false"
            aria-controls="accordion-2-panel">
      Por que usar HTML semântico?
    </button>
  </h3>
  <div id="accordion-2-panel"
       role="region"
       aria-labelledby="accordion-2-header"
       hidden>
    <p>HTML semântico fornece significado estrutural...</p>
  </div>
</div>
```

### Navegação por teclado
- **Enter/Space**: Alterna o painel do header focado
- **Tab**: Move entre headers

### JavaScript Essencial
```javascript
function alternarPainel(button) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  const panel = document.getElementById(button.getAttribute('aria-controls'));

  button.setAttribute('aria-expanded', !expanded);
  panel.hidden = expanded;
}
```

Note: não use setas para navegação entre headers em accordion simples. Isso é reservado para **vertical tabs**.

---

## Carousel (Slide Rotator)

```html
<section aria-roledescription="carousel" aria-label="Destaques">
  <div role="group" aria-roledescription="slide" aria-label="Slide 1 de 5">
    <img src="slide1.jpg" alt="Promoção de verão: 30% off">
  </div>
  <div role="group" aria-roledescription="slide" aria-label="Slide 2 de 5" hidden>
    <img src="slide2.jpg" alt="Novos produtos chegando">
  </div>

  <button aria-label="Slide anterior">◀</button>
  <button aria-label="Próximo slide">▶</button>
  <div role="tablist" aria-label="Controle de slides">
    <button role="tab" aria-selected="true" aria-label="Slide 1" tabindex="0"></button>
    <button role="tab" aria-selected="false" aria-label="Slide 2" tabindex="-1"></button>
  </div>
</section>
```

### Regras
- `aria-roledescription="carousel"` no container principal
- `aria-roledescription="slide"` em cada slide
- `aria-label="Slide X de Y"` em cada slide
- Controles: play/pause, anterior/próximo, dots de navegação
- Autoplay deve respeitar `prefers-reduced-motion: reduce`
- Autoplay deve ter pause visível e não deve iniciar automaticamente sem consentimento

### JavaScript Essencial
```javascript
function irParaSlide(carousel, index) {
  const slides = carousel.querySelectorAll('[role="group"]');
  const tabs = carousel.querySelectorAll('[role="tab"]');

  slides.forEach((s, i) => {
    s.hidden = i !== index;
  });
  tabs.forEach((t, i) => {
    t.setAttribute('aria-selected', i === index);
    t.setAttribute('tabindex', i === index ? '0' : '-1');
  });
}
```

---

## Autocomplete (Combobox Pattern)

```html
<label id="search-label">Buscar produto</label>
<div role="combobox" aria-expanded="false" aria-haspopup="listbox"
     aria-controls="suggestions" aria-labelledby="search-label">
  <input type="text" id="search-input" aria-activedescendant="">
</div>
<ul role="listbox" id="suggestions" hidden>
  <li role="option" id="opt1">Notebook</li>
  <li role="option" id="opt2">Notebook Gamer</li>
  <li role="option" id="opt3">Mouse</li>
</ul>
```

### Comportamento por Tipo

| Tipo | Descrição | Teclas |
|------|-----------|--------|
| `aria-autocomplete="none"` | Lista previsível, sem autocomplete | ↓ opens list |
| `aria-autocomplete="list"` | Sugestões na lista | ↓ navega, Enter seleciona |
| `aria-autocomplete="inline"` | Sugestão inline no input | → aceita sugestão |
| `aria-autocomplete="both"` | Lista + inline | Ambos |

### JavaScript Essencial
```javascript
const input = document.getElementById('search-input');
const listbox = document.getElementById('suggestions');
const combobox = input.closest('[role="combobox"]');

input.addEventListener('input', () => {
  const query = input.value;
  if (query.length < 2) {
    fecharListbox();
    return;
  }
  buscarSugestoes(query).then(sugestoes => {
    preencherListbox(sugestoes);
    abrirListbox();
  });
});

input.addEventListener('keydown', (e) => {
  const options = [...listbox.querySelectorAll('[role="option"]')];
  const current = options.findIndex(
    o => o.id === input.getAttribute('aria-activedescendant')
  );

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (current < options.length - 1) {
        input.setAttribute('aria-activedescendant', options[current + 1].id);
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (current > 0) {
        input.setAttribute('aria-activedescendant', options[current - 1].id);
      }
      break;
    case 'Enter':
      e.preventDefault();
      if (current >= 0) {
        input.value = options[current].textContent;
        fecharListbox();
      }
      break;
    case 'Escape':
      fecharListbox();
      break;
  }
});
```

---

## Menu com Submenus

```html
<nav aria-label="Menu principal">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" href="/" tabindex="0">Home</a>
    </li>
    <li role="none">
      <button role="menuitem" aria-haspopup="true" aria-expanded="false"
              aria-controls="submenu-produtos" tabindex="-1">
        Produtos
      </button>
      <ul id="submenu-produtos" role="menu" aria-label="Produtos" hidden>
        <li role="none">
          <a role="menuitem" href="/produtos/calcados" tabindex="-1">Calçados</a>
        </li>
        <li role="none">
          <a role="menuitem" href="/produtos/roupas" tabindex="-1">Roupas</a>
        </li>
      </ul>
    </li>
  </ul>
</nav>
```

### Navegação por teclado (menubar)
- **→** / **←**: Navega entre itens na barra
- **↓**: Abre submenu (se houver)
- **↑**: Fecha submenu (se aberto)
- **Enter/Space**: Ativa o item
- **Escape**: Fecha submenu
- **Home/End**: Primeiro/último item

---

## Dialog (Modal)

```html
<div role="dialog" aria-modal="true"
     aria-labelledby="dialog-title"
     aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirmar exclusão</h2>
  <p id="dialog-desc">Tem certeza que deseja excluir este item?</p>
  <button id="confirm-delete">Sim, excluir</button>
  <button id="cancel-delete">Cancelar</button>
</div>
```

Para `<dialog>` nativo com `showModal()`:
- Browser gerencia `aria-modal`, focus trap, e inert automaticamente
- Escape fecha o dialog
- Foco retorna ao elemento que abriu

Para `role="dialog"` custom (sem `<dialog>`):
- Gerenciar foco manualmente
- Focus trap manual (Tab cicla, Shift+Tab reverso)
- `aria-modal="true"` indica que conteúdo fora do dialog não é interativo
- Aplicar `inert` ao conteúdo de fundo

---

## Combobox com Listbox (Select-Only)

```html
<div role="combobox" aria-expanded="false" aria-haspopup="listbox"
     aria-controls="country-list" tabindex="0"
     aria-label="País" id="country-combobox">
  <span id="country-value">Selecione um país</span>
</div>
<ul role="listbox" id="country-list" hidden>
  <li role="option" id="br" aria-selected="false">Brasil</li>
  <li role="option" id="ar" aria-selected="false">Argentina</li>
  <li role="option" id="us" aria-selected="false">Estados Unidos</li>
</ul>
```

### Navegação por teclado
| Tecla | Ação |
|-------|------|
| ↓ | Abre lista e move para primeiro item |
| Alt + ↓ | Abre lista sem mover foco |
| ↑ | Fecha lista |
| Enter | Seleciona item focado e fecha |
| Escape | Fecha lista sem alterar seleção |
| Home | Primeiro item |
| End | Último item |

---

## Tree com Multi-Seleção

```html
<ul role="tree" aria-label="Categorias">
  <li role="treeitem" aria-expanded="true">
    Eletrônicos
    <ul role="group">
      <li role="treeitem" aria-selected="false">Notebooks</li>
      <li role="treeitem" aria-selected="false"
          aria-expanded="false">
        Smartphones
        <ul role="group" hidden>
          <li role="treeitem" aria-selected="false">Android</li>
          <li role="treeitem" aria-selected="false">iOS</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>
```

### Navegação por teclado
| Tecla | Ação |
|-------|------|
| ↓ | Próximo node visível |
| ↑ | Node visível anterior |
| → | Expande node se tem group, senão entra |
| ← | Recolhe node se expandido, senão vai ao parent |
| Enter | Alterna seleção (no multi-select) |
| Space | Alterna seleção |
| * | Expande todos os nós irmãos no mesmo nível |
| Ctrl + A | Seleciona todos os nós visíveis |

---

## Breadcrumb

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/produtos">Produtos</a></li>
    <li aria-current="page">Notebooks</li>
  </ol>
</nav>
```

- Use `<nav>` com `aria-label="Breadcrumb"`
- Use `<ol>` para ordem
- Use `aria-current="page"` no item atual
- Separe visualmente com `aria-hidden="true"` (ex: `/` ou `›`)

---

## Pagination

```html
<nav aria-label="Paginação">
  <ul role="list">
    <li><a href="?page=1" aria-label="Página 1">1</a></li>
    <li><a href="?page=2" aria-label="Página 2" aria-current="page">2</a></li>
    <li><a href="?page=3" aria-label="Página 3">3</a></li>
  </ul>
</nav>
```

- Use `<nav>` com `aria-label="Paginação"`
- `aria-current="page"` na página atual
- Botões "Anterior/Próximo" podem ser links ou buttons
- Ocultar visualmente links de página para leitores de tela: `aria-label`

---

## Slider com Múltiplos Thumbs (Range Slider)

```html
<div role="group" aria-label="Intervalo de preço">
  <div role="slider" tabindex="0"
       aria-valuemin="0" aria-valuemax="1000"
       aria-valuenow="100" aria-valuetext="R$ 100"
       aria-label="Preço mínimo"
       id="price-min"></div>
  <div role="slider" tabindex="-1"
       aria-valuemin="0" aria-valuemax="1000"
       aria-valuenow="800" aria-valuetext="R$ 800"
       aria-label="Preço máximo"
       id="price-max"></div>
</div>
```

- Use roving tabindex entre os thumbs
- O thumb mínimo não pode ultrapassar o máximo e vice-versa

---

## Grade de Seleção (Meter + Grid)

```html
<div role="grid" aria-label="Avaliação do produto">
  <div role="row">
    <div role="gridcell" tabindex="0" aria-label="1 estrela">★</div>
    <div role="gridcell" tabindex="-1" aria-label="2 estrelas">★</div>
    <div role="gridcell" tabindex="-1" aria-label="3 estrelas">★</div>
    <div role="gridcell" tabindex="-1" aria-label="4 estrelas">★</div>
    <div role="gridcell" tabindex="-1" aria-label="5 estrelas">★</div>
  </div>
</div>
```

---

## Dicas Gerais para Padrões APG

### Quando Implementar Manualmente vs. Usar Biblioteca

| Cenário | Recomendação |
|---------|--------------|
| Components comuns (tabs, dialog, accordion) | Biblioteca testada (ex: Radix, Reach UI, Headless UI) |
| Padrões simples (tooltip, skip link) | Implementação manual |
| Padrões complexos (treegrid, feed, combobox com autocomplete) | Biblioteca ou APG como referência |
| Widget específico do produto | Implementação manual seguindo APG |

### Bibliotecas Acessíveis Recomendadas
- **Radix UI**: Primitivas headless com ARIA integrada
- **Reach UI**: Componentes acessíveis para React
- **Headless UI (Tailwind)**: Componentes headless acessíveis
- **WAI-ARIA APG Examples**: Exemplos de referência oficiais
- **Deque Code Library**: Componentes acessíveis e testados

### Teste com Leitores de Tela
- Todo padrão implementado deve ser testado com NVDA + Chrome e VoiceOver + Safari
- Verifique anúncios de role, estado, nome e descrição
- Verifique navegação por teclado completa
- Verifique foco gerenciado corretamente

---

## Checklist
- [ ] Padrões implementados seguem as convenções WAI-ARIA APG
- [ ] Accordions usam `aria-expanded` + `aria-controls` + `hidden`
- [ ] Carousels usam `aria-roledescription="carousel/slide"` + `aria-label="Slide X de Y"`
- [ ] Autocomplete usa `aria-autocomplete` + `aria-activedescendant`
- [ ] Menus usam `aria-haspopup` + `aria-expanded` + `aria-controls`
- [ ] Dialogs usam `aria-modal="true"` + `aria-labelledby` + `aria-describedby`
- [ ] Tabs usam `aria-selected` + `aria-controls` + `aria-labelledby` no painel
- [ ] Trees usam `aria-expanded` + `aria-selected` + `aria-level` (se não nativo)
- [ ] Breadcrumbs usam `<nav aria-label="Breadcrumb">` + `aria-current="page"`
- [ ] Pagination usa `<nav>` + `aria-label` + `aria-current`
- [ ] Sliders com múltiplos thumbs usam roving tabindex + validação de limite
- [ ] Testado com NVDA, VoiceOver e TalkBack
- [ ] Todos os eventos de teclado implementados conforme tabela do widget
