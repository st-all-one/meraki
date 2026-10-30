# Subgrid: Composição de Componentes

## Conceito

`subgrid` permite que um grid item **herde as trilhas (linhas e colunas) do grid pai**, em vez de definir suas próprias. Isso resolve o problema clássico de alinhamento entre componentes aninhados sem hacks de `display: contents` ou dimensões fixas.

```css
/* Pai define as trilhas */
.page-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* Filho herda as trilhas do pai */
.card-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  /* Agora card-grid tem exatamente as mesmas 4 colunas do pai */
}
```

## Casos de Uso Críticos

### 1. Cards com Header/Body/Footer Alinhados

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3; /* ocupa 3 linhas do grid implícito do pai */
  gap: 0; /* delega o gap para o pai */
}

.card h2 {
  /* linha 1 do subgrid */
}

.card p {
  /* linha 2 do subgrid */
}

.card footer {
  /* linha 3 do subgrid — alinhado com todos os outros footers */
}
```

**Problema resolvido**: Footers de cards em alturas diferentes ficam desalinhados. Com `subgrid`, todos os footers ocupam a mesma linha de trilha.

### 2. Formulários com Labels Alinhados

```css
.form-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 16px;
}

.form-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

.form-row label {
  grid-column: 1;
}

.form-row input {
  grid-column: 2;
}
```

**Problema resolvido**: Labels de linhas diferentes ficam desalinhados quando inputs têm tamanhos variados.

### 3. Layout de Página com Seções Aninhadas

```css
.page {
  display: grid;
  grid-template-columns: [sidebar] 250px [content] minmax(auto, 800px) [aside] 200px;
  gap: 24px;
}

.section {
  grid-column: content;
  display: grid;
  grid-template-columns: subgrid;
  /* Herda a coluna 'content' — sem precisar saber a largura */
}

.section-header {
  grid-column: 1 / -1; /* ocupa toda a largura da section */
}

.section-body {
  display: grid;
  grid-template-columns: subgrid;
}
```

## Subgrid em Linhas vs. Colunas

Subgrid pode ser aplicado a **apenas um eixo**:

```css
/* Apenas colunas */
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
}

.item {
  display: grid;
  grid-template-columns: subgrid;  /* herda colunas */
  grid-template-rows: auto 1fr auto; /* define próprias linhas */
}
```

## Subgrid vs. display: contents

| Aspecto | `subgrid` | `display: contents` |
|---|---|---|
| Elemento DOM | Permanece na árvore de acessibilidade | Removido da árvore de acessibilidade |
| Controle de gap | Herda gaps do pai | Perde gaps, precisa redefinir |
| Background/Border | Pode ter estilos próprios | Perde estilos do elemento |
| Performance | Mais previsível | Pode causar repaint em cascata |
| Fallback | Funciona como grid normal | Funciona como block normal |

**Regra**: Preferir `subgrid` sempre que o elemento precisar manter sua identidade visual (background, border, padding).

## Interoperabilidade

Subgrid é **CSS Grid Level 2** e tem suporte amplo:

- Chrome 117+ (2023)
- Firefox 71+ (2019)
- Safari 16+ (2022)
- Edge 117+

```css
/* Fallback progressivo */
.card {
  display: grid;
  grid-template-rows: auto 1fr auto; /* fallback sem subgrid */
}

@supports (grid-template-rows: subgrid) {
  .card {
    grid-template-rows: subgrid;
  }
}
```

## Performance com Subgrid

1. **Menos aninhamento** — subgrid elimina containers intermediários, reduzindo a profundidade da árvore de renderização
2. **Menos recalculo** — o layout engine recalcula apenas as trilhas do grid pai; filhos herdam sem novo cálculo
3. **Sem `display: contents`** — evita o custo de remoção/reinserção na árvore de acessibilidade
4. **Layout isolado** — `contain: layout` combinado com subgrid permite que o navegador otimize subárvores independentes

## Padrões Proibidos / Antipadrões

```css
/* ❌ EVITAR: fixed heights para alinhar filhos */
.card {
  height: 400px; /* quebra em qualquer conteúdo dinâmico */
}

/* ❌ EVITAR: margin-bottom forcing */
.card-footer {
  margin-top: auto; /* frágil, não escala */
}

/* ✅ USAR: subgrid */
.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
```

## Checklist para Uso de Subgrid

- [ ] O grid pai define trilhas estáveis (não muda com frequência via JS)
- [ ] Os filhos precisam de alinhamento cross-componente
- [ ] O elemento intermediário precisa de estilo próprio (background, border)
- [ ] Suporte a navegadores alvo inclui Chrome 117+ / Firefox 71+ / Safari 16+
- [ ] Fallback sem subgrid é funcional (apenas perde alinhamento, não quebra layout)
