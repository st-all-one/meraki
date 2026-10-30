# Acessibilidade em HTML (A11Y)

## 1. Princípio Fundamental

**HTML Semântico é o primeiro pilar da acessibilidade.** Screen readers e tecnologias assistivas dependem da semântica dos elementos para transmitir significado. Use o elemento mais apropriado para o conteúdo, não para a aparência.

## 2. ARIA (Accessible Rich Internet Applications)

### Primeira Regra do ARIA
**Se você pode usar um elemento HTML nativo com a semântica necessária, não adicione ARIA.**

```html
<!-- CERTO: HTML nativo -->
<nav>...</nav>
<button>Enviar</button>

<!-- ERRADO: ARIA desnecessário -->
<div role="navigation">...</div>
<div role="button" tabindex="0">Enviar</div>
```

### Quando usar ARIA
- Quando não existe elemento HTML nativo para a semântica desejada
- Quando o elemento nativo não tem o estado necessário (ex: `aria-expanded`)
- Quando widgets complexos são construídos com JS/CSS

### Principais atributos ARIA

| Atributo | Uso |
|----------|-----|
| `role` | Define o papel semântico (ex: `role="tab"`, `role="alert"`) |
| `aria-label` | Rótulo acessível quando não há label visível |
| `aria-labelledby` | Referencia um elemento que serve como label |
| `aria-describedby` | Referencia um elemento com descrição adicional |
| `aria-hidden` | Remove elemento da árvore de acessibilidade |
| `aria-expanded` | Indica se um controle está expandido |
| `aria-controls` | Referencia o elemento controlado |
| `aria-current` | Indica o item atual (page, step, location, date, time, true) |
| `aria-live` | Região que atualiza dinamicamente (polite, assertive, off) |
| `aria-atomic` | Se a região live deve ser anunciada por inteiro |
| `aria-relevant` | Que tipo de mudança é relevante (additions, removals, text) |
| `aria-modal` | Indica modal (quando não usa `<dialog>`) |
| `aria-details` | Referencia elemento com detalhes adicionais |
| `aria-required` | Indica campo obrigatório (alternativo a `required`) |
| `aria-invalid` | Indica valor inválido |

## 3. Landmarks (Regiões de Navegação)

| Elemento HTML | ARIA implícito | Notas |
|---------------|----------------|-------|
| `<header>` | `banner` | Quando top-level (filho direto de `<body>`) |
| `<nav>` | `navigation` | Bloco de navegação |
| `<main>` | `main` | Único por página |
| `<aside>` | `complementary` | Conteúdo tangencial |
| `<section>` | `region` | Apenas se tem nome acessível |
| `<article>` | `article` | Conteúdo autocontido |
| `<footer>` | `contentinfo` | Quando top-level |
| `<search>` | `search` | Busca/filtro |
| `<form>` | `form` | Apenas se tem nome acessível |

### Múltiplos landmarks do mesmo tipo
```html
<nav aria-label="Principal">...</nav>
<nav aria-label="Rodapé">...</nav>
```

## 4. Hierarquia de Títulos (Headings)

```html
<h1>Título Principal (1 por página)</h1>
  <h2>Seção</h2>
    <h3>Subseção</h3>
  <h2>Outra Seção</h2>
    <h3>Subseção</h3>
      <h4>Detalhe</h4>
```

**Regras**:
- Um `<h1>` por página
- Não pular níveis
- Usar para estrutura, não para tamanho de fonte
- Headings devem ser descritivos

## 5. Imagens

```html
<!-- Imagem com significado -->
<img src="diagrama.png" alt="Diagrama mostrando fluxo de dados entre cliente e servidor" />

<!-- Imagem decorativa -->
<img src="borda.png" alt="" /> <!-- alt vazio, não aria-hidden -->

<!-- Figure com figcaption -->
<figure>
  <img src="foto.jpg" alt="Pôr do sol na praia" />
  <figcaption>Praia de Copacabana ao entardecer</figcaption>
</figure>
```

**Toda `<img>` precisa de `alt`** — mesmo que vazio para decorativas.

## 6. Formulários

### Label Association
```html
<!-- EXPLÍCITA (recomendada) -->
<label for="nome">Nome completo:</label>
<input type="text" id="nome" name="nome" />

<!-- IMPLÍCITA -->
<label>Nome completo: <input type="text" name="nome" /></label>

<!-- ARIA (fallback, quando label não é possível) -->
<input type="search" aria-label="Buscar no site" />
```

### Agrupamento com Fieldset
```html
<fieldset>
  <legend>Informações de entrega</legend>
  <label for="endereco">Endereço:</label>
  <input type="text" id="endereco" name="endereco" />
</fieldset>
```

### Error Announcements
```html
<label for="email">Email:</label>
<input type="email" id="email" name="email" required
       aria-describedby="email-error" />
<span id="email-error" role="alert" aria-live="polite">
  Por favor insira um email válido.
</span>
```

### Required & Invalid
```html
<input type="text" required aria-required="true" />
<input type="email" aria-invalid="true" />
```

## 7. Focus Management

### Tabindex
| Valor | Comportamento |
|-------|--------------|
| `0` | Focável, na ordem natural do DOM |
| `-1` | Focável apenas via JS (`element.focus()`) |
| `>0` | **EVITAR** — quebra a ordem esperada |

### Skip Links
```html
<a href="#main-content" class="skip-link">Pular para o conteúdo principal</a>
<main id="main-content">...</main>
```

### Autofocus
```html
<!-- Apenas UM por página -->
<input type="text" autofocus />
```

### Dialog Focus
- `showModal()` move foco para o primeiro elemento focável dentro do dialog
- Conteúdo fora do dialog fica inert automaticamente
- Ao fechar, foco retorna ao elemento que abriu o dialog

## 8. Inert Attribute

```html
<div inert>
  <p>Este conteúdo não é interativo nem acessível.</p>
  <button>Não clicável</button>
</div>
```

**Efeitos**: Remove de tab order, cliques, seleção de texto, find-in-page, accessibility tree. Usado automaticamente por modais.

## 9. Live Regions

```html
<!-- Anúncio de mudanças dinâmicas -->
<div aria-live="polite" aria-atomic="true">
  <!-- Screen reader anuncia mudanças aqui -->
</div>
```

**Valores**: `polite` (anuncia quando usuário estiver ocioso), `assertive` (interrompe), `off` (padrão)

## 10. Aria-Current

```html
<nav aria-label="Paginação">
  <a href="?page=1" aria-current="page">1</a>
  <a href="?page=2">2</a>
  <a href="?page=3">3</a>
</nav>
```

**Valores**: `page`, `step`, `location`, `date`, `time`, `true`, `false`

## 11. Links

```html
<!-- CONTEXTO: texto do link deve ser descritivo -->
<a href="relatorio-2025.pdf">Relatório Anual 2025 (PDF, 2MB)</a>

<!-- EVITAR: "clique aqui", "leia mais" -->
<a href="...">Clique aqui</a> <!-- ERRADO -->

<!-- Destino em nova aba -->
<a href="https://exemplo.com" target="_blank" rel="noopener noreferrer">
  Exemplo (abre em nova janela)
</a>
```

## 12. Tabelas Acessíveis

```html
<table>
  <caption>Vendas por mês em 2025</caption>
  <thead>
    <tr>
      <th scope="col">Mês</th>
      <th scope="col">Vendas</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Janeiro</th>
      <td>R$ 50.000</td>
    </tr>
  </tbody>
</table>
```

## 13. Checklist de Acessibilidade

- [ ] `<html lang="...">` definido
- [ ] Um `<h1>` por página, headings sem pular níveis
- [ ] `<main>` único por página
- [ ] Landmarks corretos (nav, main, aside, header, footer, search)
- [ ] Todo `<img>` tem `alt` (vazio para decorativas)
- [ ] Formulários com `<label for="">` associados
- [ ] Mensagens de erro com `aria-describedby` e `aria-live`
- [ ] Skip link presente
- [ ] Links descritivos (sem "clique aqui")
- [ ] Tabelas com `<caption>` e `<th scope="">`
- [ ] Contraste de cores (WCAG AA: 4.5:1 texto normal, 3:1 texto grande)
- [ ] Múltiplos landmarks do mesmo tipo têm `aria-label` único
- [ ] `target="_blank"` com `rel="noopener noreferrer"` + indicação textual
- [ ] `aria-expanded` em controles que expandem/recolhem
- [ ] `aria-current` em navegação para item ativo
- [ ] Navegação por teclado funcional (Tab, Enter, Esc, setas)
- [ ] Nenhum `tabindex > 0`
