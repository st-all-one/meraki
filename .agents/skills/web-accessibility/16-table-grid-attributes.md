# Tabelas e Grids: Atributos Avançados

## Atributos de Tabela a Nível de Grid

### Visão Geral

| Atributo | Aplica-se a | Propósito |
|----------|-------------|-----------|
| `aria-colcount` | `table`, `grid`, `treegrid` | Número total de colunas |
| `aria-rowcount` | `table`, `grid`, `treegrid` | Número total de linhas |
| `aria-colindex` | `cell`, `row`, `columnheader`, `rowheader`, `gridcell` | Índice da coluna (1-indexed) |
| `aria-colindextext` | `cell`, `columnheader`, `rowheader`, `gridcell` | Label textual do índice da coluna |
| `aria-rowindex` | `cell`, `row`, `rowheader`, `columnheader`, `gridcell` | Índice da linha (1-indexed) |
| `aria-rowindextext` | `cell`, `rowheader`, `columnheader`, `gridcell` | Label textual do índice da linha |
| `aria-colspan` | `cell`, `columnheader`, `rowheader`, `gridcell` | Número de colunas mescladas |
| `aria-rowspan` | `cell`, `columnheader`, `rowheader`, `gridcell` | Número de linhas mescladas |

---

## Tabelas com Colunas/Linhas Ocultas

Quando colunas ou linhas não estão presentes no DOM (ex: lazy loading, colunas ocultas por responsividade), use `aria-colindex` e `aria-rowindex` para informar o AT sobre a posição real.

```html
<div role="table" aria-label="Vendas por mês" aria-colcount="12" aria-rowcount="4">
  <div role="rowgroup">
    <div role="row" aria-rowindex="1">
      <div role="columnheader" aria-colindex="1">Jan</div>
      <div role="columnheader" aria-colindex="3">Mar</div>
      <div role="columnheader" aria-colindex="6">Jun</div>
      <div role="columnheader" aria-colindex="12">Dez</div>
    </div>
    <div role="row" aria-rowindex="2">
      <div role="cell" aria-colindex="1">R$ 1.200</div>
      <div role="cell" aria-colindex="3">R$ 1.500</div>
      <div role="cell" aria-colindex="6">R$ 2.100</div>
      <div role="cell" aria-colindex="12">R$ 2.800</div>
    </div>
  </div>
</div>
```

**Por que usar**: leitores de tela anunciam "linha X de Y, coluna Z de W" — sem os índices, uma tabela com colunas puladas informaria posições erradas.

---

## Mesclagem (colspan / rowspan)

### HTML Nativo
```html
<table>
  <thead>
    <tr>
      <th scope="col">Produto</th>
      <th scope="col" colspan="2">Vendas</th>
      <th scope="col">Total</th>
    </tr>
    <tr>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Widget A</td>
      <td>100</td>
      <td>150</td>
      <td>250</td>
    </tr>
    <tr>
      <td>200</td>
      <td>250</td>
      <td>450</td>
    </tr>
  </tbody>
</table>
```

### Equivalente ARIA para Tabelas Não-Semânticas
```html
<div role="table" aria-label="Vendas">
  <div role="rowgroup">
    <div role="row">
      <div role="columnheader">Produto</div>
      <div role="columnheader" aria-colspan="2">Vendas</div>
      <div role="columnheader">Total</div>
    </div>
    <div role="row">
      <div role="rowheader" aria-rowspan="2">Widget A</div>
      <div role="cell">100</div>
      <div role="cell">150</div>
      <div role="cell">250</div>
    </div>
    <div role="row">
      <div role="cell">200</div>
      <div role="cell">250</div>
      <div role="cell">450</div>
    </div>
  </div>
</div>
```

---

## aria-colindextext / aria-rowindextext

Fornece um label textual para o índice, útil quando os índices numéricos não são informativos.

```html
<div role="table" aria-label="Calendário">
  <div role="row">
    <div role="columnheader" aria-colindex="1"
         aria-colindextext="Segunda">Seg</div>
    <div role="columnheader" aria-colindex="2"
         aria-colindextext="Terça">Ter</div>
    <div role="columnheader" aria-colindex="7"
         aria-colindextext="Domingo">Dom</div>
  </div>
  <div role="row">
    <div role="cell" aria-colindex="1">1</div>
    <div role="cell" aria-colindex="2">2</div>
    <div role="cell" aria-colindex="7">7</div>
  </div>
</div>
```

- Leitores de tela anunciam "coluna Segunda" em vez de "coluna 1"
- Essencial quando a numeração não reflete o significado visual

---

## Grids Esparsos (Sparse Grids)

Quando linhas ou colunas são omitidas do DOM, mas existem logicamente.

```html
<div role="grid" aria-label="Planilha" aria-colcount="100" aria-rowcount="1000">
  <div role="row" aria-rowindex="1">
    <div role="columnheader" aria-colindex="1">A</div>
    <div role="columnheader" aria-colindex="2">B</div>
    <div role="columnheader" aria-colindex="100">CV</div>
  </div>
  <div role="row" aria-rowindex="500">
    <div role="cell" aria-colindex="1">Item 500A</div>
    <div role="cell" aria-colindex="50">Item 500B</div>
  </div>
  <div role="row" aria-rowindex="1000">
    <div role="cell" aria-colindex="1">Item 1000A</div>
  </div>
</div>
```

**Atenção**: Em grids esparsos, o leitor de tela precisa de `aria-rowindex` em CADA `role="row"`.

---

## Tabela vs Grid vs Treegrid

| Role | Uso | Navegação |
|------|-----|-----------|
| `table` | Dados estáticos, apenas leitura | Tab, setas opcionais |
| `grid` | Dados interativos, editáveis | Setas, Home, End, Page Up/Down |
| `treegrid` | Grid hierárquico com expansão | Setas + Enter para expandir/recolher |

```html
<!-- grid: células interativas -->
<div role="grid" aria-label="Células editáveis">
  <div role="row">
    <div role="columnheader">Nome</div>
    <div role="columnheader">Idade</div>
  </div>
  <div role="row">
    <div role="gridcell" tabindex="0">João</div>
    <div role="gridcell" tabindex="-1">30</div>
  </div>
</div>
```

**Diferenças de implementação grid vs table**:
- `grid`: células são focáveis individualmente, navegação com setas
- `table`: célula não é focável, navegação via Tab linha a linha
- `grid`: suporta `aria-activedescendant` para gerenciamento de foco

---

## Integração com HTML Nativo

### Quando usar HTML `<table>` vs `role="table"`

| Situação | Recomendação |
|----------|--------------|
| Dados tabulares em HTML | `<table>` nativo |
| Layout responsivo com `display: grid` no CSS | `<table>` perde semântica com `display: grid` → usar `role="table"` |
| Widget customizado tipo planilha | `role="grid"` |
| Dados carregados via canvas/SVG | `role="table"` + atributos |
| Feed de dados em tempo real | `role="grid"` com live regions |

```css
/* Quando CSS display:grid quebra a semântica de <table> */
table[role="table"] {
  display: grid;
}
```

**Problema conhecido**: Aplicar `display: grid` ou `display: block` a `<table>` remove sua semântica implícita. A solução é adicionar `role="table"` explicitamente.

---

## Resumo Visual

```
aria-colcount="12" ← total de colunas
┌──────────────────────────────────────────────┐
│  aria-colindex="1"   aria-colindex="3"        │ ← índice de cada coluna
│  aria-colindextext="Janeiro"                  │ ← label textual
├──────────────────────────────────────────────┤
│  aria-rowindex="1"  ────── rowspan ──────►   │
│  aria-rowindex="2"                            │ ← índice de cada linha
│              aria-colspan="2"                 │ ← mesclagem
└──────────────────────────────────────────────┘
aria-rowcount="1000" ← total de linhas
```

---

## Checklist
- [ ] `aria-colcount`/`aria-rowcount` definidos quando linhas/colunas estão fora do DOM
- [ ] `aria-colindex`/`aria-rowindex` em cada célula em grids esparsos
- [ ] `aria-colspan`/`aria-rowspan` em células mescladas
- [ ] `aria-colindextext`/`aria-rowindextext` quando índices numéricos não são claros
- [ ] `grid` usado apenas quando há interatividade por célula
- [ ] Tabelas nativas (`<table>`) preferidas sobre `role="table"`
- [ ] CSS `display` não quebra semântica de tabela sem `role` explícito
