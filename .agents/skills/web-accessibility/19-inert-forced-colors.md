# inert, prefers-contrast, forced-colors e High Contrast Mode

## O Atributo `inert`

O atributo `inert` torna um elemento e toda sua subárvore não-interativa: não focável, não clicável, invisível ao leitor de tela.

```html
<div inert>
  <p>Este conteúdo não é interativo.</p>
  <button>Não pode ser clicado</button>
  <a href="/">Não pode ser navegado</a>
</div>
```

### Casos de Uso

#### Modal/Dialog com Focus Trap

```javascript
function abrirModal(id) {
  const modal = document.getElementById(id);
  const mainContent = document.getElementById('main');

  // Desabilita interação com o resto da página
  mainContent.inert = true;
  document.body.appendChild(modal);
  modal.showModal();

  // Foco vai para o modal
  modal.querySelector('button, input, a').focus();
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  const mainContent = document.getElementById('main');

  mainContent.inert = false;
  modal.close();
}
```

#### Off-canvas / Drawer Aberto

```html
<aside id="sidebar" class="sidebar-open">
  <!-- Menu lateral -->
</aside>
<main inert>
  <!-- Conteúdo principal fica inerte enquanto drawer está aberto -->
</main>
```

#### Abas (Tabs) com Conteúdo Oculto

```html
<div role="tabpanel" id="painel1" inert>
  Conteúdo da aba 1 (não visível/ativa)
</div>
<div role="tabpanel" id="painel2">
  Conteúdo da aba 2 (ativa)
</div>
```

### `inert` vs Outras Técnicas

| Técnica | Efeito no AT | Efeito no Foco |
|---------|-------------|----------------|
| `display: none` | Remove do a11y tree | Remove do foco |
| `visibility: hidden` | Remove do a11y tree | Remove do foco |
| `aria-hidden="true"` | Oculta do AT | Mantém focável! |
| `tabindex="-1"` | Mantém no AT | Remove do Tab |
| `inert` | Remove do AT | Remove do foco |
| `hidden` attribute | Remove do a11y tree | Remove do foco |

**`inert` resolve o problema de `aria-hidden`**: elementos com `aria-hidden="true"` ainda podem receber foco via Tab, criando um "buraco negro" de foco. `inert` previne isso.

### Polyfill para navegadores antigos

```javascript
// inert não é suportado em navegadores antigos
if (!HTMLElement.prototype.hasOwnProperty('inert')) {
  // Use o polyfill: https://github.com/WICG/inert
  import('https://cdn.jsdelivr.net/npm/wicg-inert@3.1.1/dist/inert.min.js');
}
```

---

## prefers-contrast

A media query `prefers-contrast` detecta a preferência do usuário por mais ou menos contraste.

```css
/* Contraste normal/declarado */
body {
  color: #333;
  background: #fff;
}

/* Mais contraste */
@media (prefers-contrast: more) {
  body {
    color: #000;
    background: #fff;
  }
  a {
    text-decoration: underline;
    color: #00f;
  }
  input, button {
    border: 2px solid #000;
  }
}

/* Menos contraste */
@media (prefers-contrast: less) {
  body {
    color: #555;
    background: #f5f5f5;
  }
  hr {
    border-color: #ccc;
  }
}
```

### Valores

| Valor | Significado |
|-------|-------------|
| `no-preference` | Sem preferência declarada (padrão) |
| `more` | Usuário quer mais contraste (ex: Windows High Contrast ativado) |
| `less` | Usuário quer menos contraste (ex: temas de baixo contraste) |

### Combinação com `prefers-color-scheme`

```css
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  body {
    color: #fff;
    background: #000;
  }
}
```

---

## forced-colors

A media query `forced-colors` detecta se o sistema está em modo de cores forçadas (Windows High Contrast Mode).

```css
@media (forced-colors: active) {
  /* Remove backgrounds customizados */
  button, .card, .panel {
    background: Canvas;
    border: 1px solid ButtonText;
  }

  /* Garante que links sejam distinguíveis */
  a {
    color: LinkText;
  }

  /* Remove imagens de fundo decorativas que podem causar ruído */
  .hero-section {
    background: none;
  }

  /* Garante que focus seja visível */
  *:focus {
    outline: 3px solid Highlight;
  }
}
```

### Palavras-chave do Sistema

No modo forced-colors, use cores do sistema para garantir legibilidade:

| Cor do Sistema | Uso |
|----------------|-----|
| `Canvas` | Fundo da página |
| `CanvasText` | Texto na página |
| `LinkText` | Links |
| `VisitedText` | Links visitados |
| `ActiveText` | Links ativos |
| `ButtonFace` | Fundo de botão |
| `ButtonText` | Texto de botão |
| `Highlight` | Item selecionado/foco |
| `HighlightText` | Texto do item selecionado |
| `GrayText` | Texto desabilitado |
| `Field` | Fundo de input |
| `FieldText` | Texto de input |

```css
button {
  background: ButtonFace;
  color: ButtonText;
  border: 1px solid ButtonText;
}

input {
  background: Field;
  color: FieldText;
  border: 1px solid ButtonText;
}

*:focus-visible {
  outline: 3px solid Highlight;
  outline-offset: 2px;
}
```

### forced-colors + prefers-color-scheme

```css
/* Modo escuro com high contrast */
@media (forced-colors: active) and (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}
```

---

## Windows High Contrast Mode (WHCM)

WHCM é a implementação do Windows para `forced-colors`. O usuário ativa via:
- **Win + Ctrl + C** (atalho rápido)
- Configurações > Facilidade de Acesso > Alto Contraste

### O que WHCM faz

| Mudança | Impacto Acessibilidade |
|---------|----------------------|
| Substitui cores por paleta limitada | ✅ Garante contraste mínimo |
| Remove backgrounds, gradientes, sombras | ⚠️ Pode remover indicadores visuais |
| Aplica cores do sistema a todos elementos | ✅ Consistente |
| Sobrescreve estilos CSS (força cores) | ⚠️ Pode quebrar layout |

### Problemas Comuns com WHCM

```css
/* ❌ Backgrounds decorativos somem */
.card {
  background: linear-gradient(...) no-repeat;
}
.card-text {
  color: transparent;  /* ❌ Texto some se for só background-clip */
}

/* ✅ Solução: garantir que cores sólidas estejam presentes */
.card {
  background: Canvas;
}
.card [aria-hidden="true"] {
  /* ícones decorativos */
}
```

### Testando WHCM

1. Ative WHCM: Win + Ctrl + C
2. Teste todos os temas de alto contraste disponíveis
3. Verifique:
   - Todo texto é legível
   - Links são distinguíveis
   - Foco é visível
   - Ícones e gráficos têm contraste
   - Botões e inputs têm bordas visíveis

---

## `-ms-high-contrast` (Legado)

Media query proprietária do Internet Explorer/Edge Legacy. Use `forced-colors` para navegadores modernos.

```css
/* Fallback para navegadores antigos */
@media (-ms-high-contrast: active) {
  /* estilos WHCM para IE/Edge Legacy */
}
@media (-ms-high-contrast: black-on-white) {
  /* tema específico */
}
@media (-ms-high-contrast: white-on-black) {
  /* tema específico */
}
```

---

## Estratégia Combinada

```css
/* Tema base com variáveis CSS */
:root {
  --text-primary: #1a1a1a;
  --bg-primary: #ffffff;
  --border-color: #ccc;
  --focus-ring: 2px solid blue;
}

/* Modo escuro */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #e0e0e0;
    --bg-primary: #1a1a1a;
    --border-color: #444;
    --focus-ring: 2px solid #66b3ff;
  }
}

/* Mais contraste */
@media (prefers-contrast: more) {
  :root {
    --text-primary: #000;
    --bg-primary: #fff;
    --border-color: #000;
  }
}

/* Cores forçadas (WHCM) */
@media (forced-colors: active) {
  :root {
    --text-primary: CanvasText;
    --bg-primary: Canvas;
    --border-color: ButtonText;
  }
  .card, button, input {
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
  }
}
```

---

## Checklist
- [ ] `inert` usado em modais/dialogs para focus trapping (não apenas `aria-hidden`)
- [ ] `inert` usado em off-canvas/drawers para desabilitar conteúdo de fundo
- [ ] `prefers-contrast: more` implementado com estilos de alto contraste
- [ ] `prefers-contrast: less` implementado para usuários que preferem menos contraste
- [ ] `forced-colors: active` testado com Windows High Contrast Mode
- [ ] Cores do sistema usadas em modo `forced-colors`
- [ ] WHCM testado com todos os temas disponíveis
- [ ] Nenhum texto usa `color: transparent` ou `background-clip` como única forma
- [ ] Foco visível garantido em `forced-colors` via `Highlight`
- [ ] Polyfill de `inert` carregado para navegadores sem suporte
