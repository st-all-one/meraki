# Acessibilidade em SVG e Canvas

## SVG Acessível

### Estrutura Básica

```html
<svg role="img" aria-label="Gráfico de vendas 2024" viewBox="0 0 800 400"
     xmlns="http://www.w3.org/2000/svg">
  <title>Vendas anuais por trimestre</title>
  <desc>Barras mostrando vendas: Q1 R$ 50k, Q2 R$ 75k, Q3 R$ 60k, Q4 R$ 90k</desc>
  <!-- Conteúdo visual -->
</svg>
```

| Elemento | Propósito | Obrigatório? |
|----------|-----------|-------------|
| `<title>` | Nome curto do SVG (como `alt`) | Sim, para SVGs informativos |
| `<desc>` | Descrição longa (como `aria-describedby`) | Recomendado para gráficos |
| `role="img"` | Garante role de imagem | Sim, em SVG inline |
| `aria-label` | Label adicional | Alternativa a `<title>` |

### SVG Decorativo

```html
<svg aria-hidden="true" focusable="false" role="none">
  <!-- conteúdo puramente decorativo -->
</svg>
```

- `aria-hidden="true"` + `focusable="false"` + `role="none"` para decorativos
- Ícones decorativos devem ser completamente invisíveis ao AT

### Gráficos e Diagramas

```html
<svg role="img" aria-labelledby="grafico-titulo grafico-desc"
     viewBox="0 0 600 400">
  <title id="grafico-titulo">Vendas 2024 por região</title>
  <desc id="grafico-desc">
    Gráfico de barras: Sudeste R$ 2.1M, Sul R$ 1.5M,
    Nordeste R$ 1.2M, Centro-Oeste R$ 0.8M, Norte R$ 0.5M
  </desc>
  <g role="list" aria-label="Barras do gráfico">
    <rect role="listitem" x="20" y="100" width="80" height="300"
          aria-label="Sudeste: R$ 2.1 milhões"></rect>
    <rect role="listitem" x="140" y="150" width="80" height="250"
          aria-label="Sul: R$ 1.5 milhões"></rect>
    <rect role="listitem" x="260" y="180" width="80" height="220"
          aria-label="Nordeste: R$ 1.2 milhões"></rect>
  </g>
</svg>
```

### Padrão de Ícone com Texto Alternativo

```html
<!-- Ícone com texto -->
<button aria-label="Favoritar">
  <svg aria-hidden="true" focusable="false" width="24" height="24">
    <use href="#star-icon"></use>
  </svg>
</button>

<!-- Ícone sozinho como link -->
<a href="/perfil" aria-label="Meu perfil">
  <svg role="img" focusable="false" width="24" height="24">
    <title>Perfil</title>
    <use href="#profile-icon"></use>
  </svg>
</a>
```

### SVG Animado

```html
<svg role="img" aria-label="Carregando..." viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="none" stroke="blue" stroke-width="4">
    <animate attributeName="stroke-dashoffset" from="0" to="250"
             dur="1.5s" repeatCount="indefinite" />
  </circle>
</svg>
```

**Atenção com animação**:
- Use `prefers-reduced-motion: reduce` para pausar animações SVG
- SVG `<animate>` e `<animateTransform>` não são afetados por CSS `animation: none`
- Para parar animações SVG: use `document.querySelectorAll('svg animate, svg animateTransform').forEach(el => el.endElement())`

---

## Canvas Acessível

### O Problema

O elemento `<canvas>` renderiza como uma imagem bitmap. Leitores de tela veem apenas o conteúdo de fallback, que muitos desenvolvedores ignoram.

```html
<canvas id="grafico" width="800" height="400">
  <!-- Fallback: renderizado apenas se canvas não for suportado -->
  <p>Gráfico de vendas: Q1 R$ 50k, Q2 R$ 75k, Q3 R$ 60k, Q4 R$ 90k</p>
</canvas>
```

**Problemas**:
1. Canvas não expõe elementos internos ao accessibility tree
2. Fallback só é lido se canvas não renderiza
3. Canvas interativo (ex: desenho à mão livre) perde toda a semântica

### Estratégias de Acessibilidade para Canvas

#### Estratégia 1: Fallback Textual Visível

```html
<canvas id="meuGrafico" width="600" height="400" role="img"
        aria-label="Gráfico de pizza mostrando participação no mercado">
</canvas>
<div id="dados-grafico" role="region" aria-label="Dados do gráfico">
  <h3>Dados em texto</h3>
  <table>
    <caption>Participação no mercado 2024</caption>
    <thead>
      <tr><th>Empresa</th><th>Participação</th></tr>
    </thead>
    <tbody>
      <tr><td>Empresa A</td><td>35%</td></tr>
      <tr><td>Empresa B</td><td>25%</td></tr>
      <tr><td>Empresa C</td><td>20%</td></tr>
    </tbody>
  </table>
</div>
```

#### Estratégia 2: Off-screen Canvas + Elementos DOM Sobrepostos

Renderize o canvas visualmente, mas forneça uma versão DOM sobreposta invisível para AT:

```html
<div style="position: relative;">
  <canvas id="canvas" width="400" height="300" role="img"
          aria-label="Gráfico interativo de vendas"></canvas>
  <div aria-hidden="true">
    <!-- Canvas renderiza aqui -->
  </div>
  <!-- Versão acessível sobreposta visualmente oculta -->
  <div class="sr-only" role="list" aria-label="Valores do gráfico">
    <div role="listitem">Janeiro: 100</div>
    <div role="listitem">Fevereiro: 150</div>
    <div role="listitem">Março: 200</div>
  </div>
</div>
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

#### Estratégia 3: Canvas Interativo com ARIA

Para canvas interativos (jogos, whiteboards, editores), forneça uma camada de controle ARIA completa:

```html
<div role="application" aria-label="Editor de desenho">
  <canvas id="whiteboard" width="800" height="600"
          role="img" aria-label="Área de desenho">
  </canvas>
  <div role="toolbar" aria-label="Ferramentas">
    <button aria-pressed="true" aria-label="Lápis">✏️</button>
    <button aria-pressed="false" aria-label="Borracha">🧹</button>
  </div>
  <div role="slider" aria-label="Espessura do traço"
       aria-valuemin="1" aria-valuemax="20" aria-valuenow="3"
       tabindex="0">
  </div>
</div>
```

### Canvas + Leitor de Tela: Live Updates

```javascript
const canvas = document.getElementById('canvas');
const statusRegion = document.getElementById('canvas-status');

function atualizarCanvas() {
  // Renderiza no canvas...
  statusRegion.textContent = 'Gráfico atualizado: Q1 R$ 50k, Q2 R$ 75k';
}
```

```html
<div aria-live="polite" id="canvas-status"></div>
```

---

## Comparação: SVG vs Canvas

| Aspecto | SVG | Canvas |
|---------|-----|--------|
| Acessibilidade nativa | ✅ Roles, ARIA, texto | ❌ Bitmap mudo |
| Elementos individuais | ✅ Cada elemento no a11y tree | ❌ Tudo é um pixel |
| Interatividade | ✅ Eventos por elemento | ⚠️ Coordenadas manuais |
| Complexidade | Melhor para até ~1000 elementos | Melhor para muitos elementos |
| Animação | ✅ CSS / SMIL | ✅ requestAnimationFrame |
| Fallback textual | `<title>` + `<desc>` | Conteúdo entre tags |
| Suporte AT | Bom | Precisa de workarounds |

### Quando usar cada um

| Cenário | Escolha |
|---------|---------|
| Ícones, logos, ilustrações | SVG |
| Gráficos com dados | SVG (com title/desc) |
| Data visualization complexa | SVG + tabela de dados |
| Jogos com muitos elementos | Canvas + overlay ARIA |
| Editor de imagens/fotos | Canvas + toolbar ARIA |
| Animações simples | SVG |
| Animações complexas (>1000 elementos) | Canvas |

---

## Checklist
- [ ] SVG informativo: `<title>` + `role="img"` + `aria-label`
- [ ] SVG decorativo: `aria-hidden="true"` + `focusable="false"` + `role="none"`
- [ ] Gráficos SVG: `aria-labelledby` com `title` e `desc`
- [ ] Barras/elementos em gráfico têm `role="list"` + `role="listitem"` com `aria-label`
- [ ] Animações SVG respeitam `prefers-reduced-motion`
- [ ] Canvas informativo: `role="img"` + `aria-label` + tabela de dados alternativa
- [ ] Canvas interativo: camada de controle ARIA fora do canvas
- [ ] Canvas com live updates: `aria-live` para anunciar mudanças
- [ ] Fallback de canvas contém dados textuais completos
- [ ] Se SVG ou Canvas for a único meio de informação, forneça alternativa textual
