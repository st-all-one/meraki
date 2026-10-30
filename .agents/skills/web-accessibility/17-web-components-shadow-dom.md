# Web Components, Shadow DOM e Acessibilidade

## O Problema

O Shadow DOM cria uma barreira de encapsulamento. Elementos dentro de uma shadow tree não são diretamente acessíveis pelo DOM principal — e isso inclui como leitores de tela interagem com eles.

```
Light DOM (acessível ao AT)
  └── <meu-componente>
        └── #shadow-root (encapsulado)
              ├── <button> OK </button>     ← parcialmente acessível
              ├── <input>                   ← acessível via label externo
              └── <div aria-label="...">    ← aria-label funciona
```

---

## O Que Funciona Através do Shadow Boundary

| Mecanismo | Funciona? | Notas |
|-----------|-----------|-------|
| `aria-label` no host element | ✅ Sim | O AT anuncia o label do host |
| Eventos de foco | ✅ Sim | `focus`, `blur`, `focusin`, `focusout` |
| Navegação por Tab | ✅ Sim | Elementos focáveis dentro do shadow são alcançáveis |
| `aria-describedby` cruzando boundary | ❌ Não | IDs em shadow não são referenciáveis de fora |
| `aria-labelledby` cruzando boundary | ❌ Não | Mesmo problema |
| `aria-activedescendant` cruzando | ❌ Não | Não funciona |
| `aria-owns` cruzando | ❌ Não | Não funciona |
| `role` no host | ✅ Sim | O host expõe a role |
| `part` attribute (CSS) | ✅ Sim | Para estilização externa |
| `exportparts` | ✅ Sim | Exporta partes para estilização |

---

## Padrões para Web Components Acessíveis

### 1. Delegar ARIA ao Host Element

```javascript
class MeuBotao extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadowRoot.innerHTML = `
      <style>/* estilos encapsulados */</style>
      <button part="button">
        <slot></slot>
      </button>
    `;
  }

  static get observedAttributes() {
    return ['aria-label', 'disabled', 'aria-pressed'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'disabled') {
      this.shadowRoot.querySelector('button').disabled = newValue !== null;
    }
    if (name === 'aria-label') {
      this.shadowRoot.querySelector('button')
        .setAttribute('aria-label', newValue);
    }
  }

  // Encaminhar aria-pressed para o botão interno
  get pressed() {
    return this.getAttribute('aria-pressed') === 'true';
  }
  set pressed(val) {
    this.setAttribute('aria-pressed', val);
  }
}

customElements.define('meu-botao', MeuBotao);
```

```html
<meu-botao aria-label="Fechar" aria-pressed="false">
  ✕
</meu-botao>
```

### 2. `delegatesFocus: true`

```javascript
this.attachShadow({ mode: 'open', delegatesFocus: true });
```

- Quando o shadow host recebe foco, o primeiro elemento focável dentro do shadow DOM ganha foco
- Evita que o AT anuncie o host e depois precise navegar até o conteúdo interno
- Essencial para interactive widgets

### 3. `:focus-within` para estados de foco no host

```css
:host(:focus-within) {
  outline: 2px solid blue;
}
```

### 4. Partes Exportáveis

```javascript
this.shadowRoot.innerHTML = `
  <button part="trigger" aria-haspopup="true">
    <slot></slot>
  </button>
  <div part="panel">
    <slot name="panel"></slot>
  </div>
`;
```

```css
/* Quem usa o componente pode estilizar partes internas */
meu-componente::part(trigger) {
  background: blue;
}
meu-componente::part(panel) {
  border: 1px solid gray;
}
```

---

## Gerenciamento de Foco em Shadow DOM

### Roving Tabindex com Shadow DOM

```javascript
class MenuComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <div role="menubar" aria-label="Menu principal">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot.querySelector('div')
      .addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    const items = this.querySelectorAll('[role="menuitem"]');
    const current = Array.from(items).indexOf(
      this.shadowRoot.activeElement?.assignedSlot?.host || e.target
    );
    // Lógica de roving tabindex...
  }
}
```

---

## Acessibilidade de Slots

```html
<meu-card>
  <h2 slot="titulo">Título do Card</h2>
  <p slot="conteudo">Descrição do card.</p>
</meu-card>
```

```javascript
class MeuCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <article part="card">
        <h2><slot name="titulo"></slot></h2>
        <div><slot name="conteudo"></slot></div>
      </article>
    `;
  }
}
```

**Importante**: Slots preservam a semântica do conteúdo projetado. Um `<h2>` projetado em um slot continua sendo um heading.

---

## Limitações e Workarounds

### Problema: aria-labelledby não atravessa shadow boundary

```html
<!-- NÃO FUNCIONA -->
<label id="nome-label">Nome:</label>
<meu-input aria-labelledby="nome-label"></meu-input>
```

**Workaround**: Passe o label como atributo ou slot nomeado.

```html
<meu-input label="Nome:"></meu-input>
```

```javascript
class MeuInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <label id="label"><slot name="label">${this.getAttribute('label') || ''}</slot></label>
      <input id="input" aria-labelledby="label">
    `;
  }
}
```

### Problema: `aria-activedescendant` não funciona com elementos no shadow DOM

**Workaround**: Use roving tabindex em vez de `aria-activedescendant` dentro de shadow roots.

### Problema: `aria-owns` não funciona através da boundary

**Workaround**: Coloque todos os filhos no light DOM e referencie-os de dentro do shadow via projeção.

---

## Testando Web Components com AT

| AT | Comportamento com Shadow DOM |
|----|------------------------------|
| NVDA + Chrome | Bom suporte, anunciado conteúdo projetado |
| JAWS + Chrome | Moderado, alguns problemas com elementos encapsulados |
| VoiceOver + Safari | Bom suporte para slots, problemas com shadow antigos |
| TalkBack + Chrome | Suporte parcial |

### Checklist de Teste
1. Tab para o web component — o foco vai para o lugar certo?
2. AT anuncia o nome correto?
3. AT anuncia a role correta?
4. Navegação por setas funciona para widgets compostos?
5. Slots preservam semântica dos elementos projetados?
6. `delegatesFocus` funciona no cenário de uso?

---

## Resumo

| Faça | Não Faça |
|------|----------|
| Use `delegatesFocus: true` para interactive widgets | Tente referenciar IDs cruzando shadow boundary |
| Encaminhe atributos ARIA do host para o shadow | Use `aria-activedescendant` através da boundary |
| Use slots para conteúdo semântico do light DOM | Dependa de `aria-owns` cruzando shadow |
| Exporte `part` para estilização externa | Esqueça de testar com leitores de tela reais |
| Use `:focus-within` no host para indicar foco | Assuma que o shadow encapsula tudo |

---

## References
- WAI-ARIA 1.2: Shadow DOM considerations
- Web Fundamentals: Accessible Web Components
- Google Chrome Developers: Web Components Acessíveis
- MDN: Using custom elements
