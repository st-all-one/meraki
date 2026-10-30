# Estilos de Impressão (Print CSS)

## @media print — Mídia de Impressão

Estilos específicos para quando a página é **impressa** ou **salva como PDF**:

```css
@media print {
  /* Seus estilos de impressão aqui */
}
```

## @page — Configuração da Página

Controla o **tamanho, margens e orientação** da página impressa:

```css
/* Configuração global */
@page {
  size: A4;
  margin: 20mm;
}

/* Tamanhos comuns */
@page {
  size: A4;               /* 210mm × 297mm */
  size: A5;               /* 148mm × 210mm */
  size: letter;           /* 8.5in × 11in */
  size: legal;            /* 8.5in × 14in */
  size: landscape;        /* paisagem (orientação) */
  size: portrait;         /* retrato (padrão) */
  size: A4 landscape;     /* tamanho + orientação */
  size: 200mm 300mm;      /* largura altura customizadas */
}
```

### Pseudo-classes de Página

```css
/* Primeira página */
@page :first {
  margin-top: 40mm;         /* margem maior na primeira página */
}

/* Página à esquerda (frente/verso) */
@page :left {
  margin-left: 30mm;
  margin-right: 20mm;
}

/* Página à direita (frente/verso) */
@page :right {
  margin-left: 20mm;
  margin-right: 30mm;
}

/* Páginas em branco */
@page :blank {
  @top-center { content: "Esta página foi intencionalmente deixada em branco"; }
}
```

### Margens e Caixas de Página (@page margin boxes)

```css
@page {
  @top-left { content: "Capítulo 1"; font-size: 9pt; }
  @top-center { content: "Título do Documento"; }
  @top-right { content: "Página " counter(page); }
  @bottom-center { content: "Confidencial"; font-style: italic; }
  @bottom-right { content: counter(page); }
}

/* Caixas de margem disponíveis */
@top-left-corner { }
@top-left { }
@top-center { }
@top-right { }
@top-right-corner { }
@bottom-left-corner { }
@bottom-left { }
@bottom-center { }
@bottom-right { }
@bottom-right-corner { }
@left-top { }
@left-middle { }
@left-bottom { }
@right-top { }
@right-middle { }
@right-bottom { }
```

## page-break — Quebra de Página

```css
/* Forçar quebra de página ANTES do elemento */
.section {
  page-break-before: always;
}

/* Forçar quebra de página DEPOIS do elemento */
.section {
  page-break-after: always;
}

/* Evitar quebra DENTRO do elemento */
.card {
  page-break-inside: avoid;
}

/* Valores */
page-break-before: auto;      /* padrão — sem quebra */
page-break-before: always;    /* sempre quebra */
page-break-before: avoid;     /* evita quebra */
page-break-before: left;      /* força próxima página par */
page-break-before: right;     /* força próxima página ímpar */

/* Propriedades modernas (preferir) */
break-before: page;
break-after: page;
break-inside: avoid;
```

### Padrões de Quebra

```css
/* Cada capítulo começa em nova página */
.chapter {
  break-before: page;
}

/* Tabelas não quebram no meio */
table {
  break-inside: avoid;
}

/* Títulos sempre com conteúdo após */
h2, h3 {
  break-after: avoid;
}

/* Evitar órfãs/viúvas */
p {
  orphans: 3;           /* mínimo linhas no final */
  widows: 3;            /* mínimo linhas no início */
}
```

## Estilos Típicos de Impressão

### Reset de Interatividade

```css
@media print {
  /* Remover elementos interativos */
  nav, .sidebar, .ad, .cta, .video, .carousel,
  button, .btn, [role="navigation"] {
    display: none !important;
  }

  /* Remover animações */
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

### Links com URLs

```css
@media print {
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }

  /* Links internos (#) não mostram URL */
  a[href^="#"]::after {
    content: none;
  }

  /* Links de email */
  a[href^="mailto:"]::after {
    content: " (" attr(href) ")";
  }
}
```

### Ajustes de Layout

```css
@media print {
  body {
    font-size: 12pt;           /* tamanho adequado para papel */
    line-height: 1.5;
    color: black;              /* sem economia de tinta */
    background: none;          /* sem background */
  }

  .container {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  /* Cards e grids viram blocos empilhados */
  .card-grid {
    display: block;
  }

  .card {
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ccc;
  }

  /* Imagens não quebram */
  img {
    max-width: 100% !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
```

### Cores e Fundos

```css
@media print {
  /* Economia de tinta */
  * {
    background: transparent !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* Garantir contraste preto/branco */
  body {
    color: black;
  }

  a {
    color: black;
    text-decoration: underline;
  }

  /* Forçar impressão de background quando necessário */
  .has-bg {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

### Tabelas

```css
@media print {
  table {
    font-size: 9pt;
    break-inside: avoid;
  }

  thead {
    display: table-header-group;  /* repetir cabeçalho em cada página */
  }

  tfoot {
    display: table-footer-group;
  }
}
```

## Padrão Completo de Print CSS

```css
/* styles.css — estilos gerais */
body { font-family: serif; }
nav { background: #333; color: white; }

/* print.css — estilos de impressão */
@media print {
  @page {
    size: A4;
    margin: 20mm 25mm;
  }

  @page :first {
    @top-center { content: ""; }
  }

  @page :right {
    @top-right { content: counter(page); }
  }

  @page :left {
    @top-left { content: counter(page); }
  }

  * {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  nav, .sidebar, .ads, .cta, .footer-links {
    display: none !important;
  }

  body {
    font-size: 12pt;
    line-height: 1.6;
    font-family: Georgia, "Times New Roman", serif;
  }

  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #555 !important;
  }

  a[href^="#"]::after { content: none; }

  h1, h2, h3 {
    break-after: avoid;
    page-break-after: avoid;
  }

  img {
    max-width: 100% !important;
    break-inside: avoid;
  }

  table { break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }

  .card {
    break-inside: avoid;
    border: 1px solid #ccc;
  }

  p {
    orphans: 3;
    widows: 3;
  }
}
```

## Carregamento Otimizado

```css
/* CSS de impressão carregado apenas quando necessário */
<link rel="stylesheet" href="print.css" media="print">

/* Técnica: carregar CSS não-crítico com media="print" */
<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
```

## Tabela de Propriedades de Print

| Propriedade | Função | Exemplo |
|---|---|---|
| `size` | Tamanho da página | `A4`, `letter`, `200mm 300mm` |
| `margin` | Margem da página | `20mm` |
| `page-break-before` | Quebra antes | `always`, `avoid` |
| `page-break-after` | Quebra depois | `always`, `avoid` |
| `page-break-inside` | Quebra dentro | `avoid` |
| `break-before` | Quebra moderna | `page`, `column`, `region` |
| `orphans` | Min linhas no fim | `3` |
| `widows` | Min linhas no início | `3` |
| `print-color-adjust` | Renderizar cores | `exact`, `economy` |

## Checklist

- [ ] `@media print` com estilos otimizados para papel
- [ ] Elementos interativos escondidos (nav, botões, ads)
- [ ] `@page` com `size` e `margin` adequados
- [ ] Links mostram URLs via `::after`
- [ ] Cores convertidas para preto (economia de tinta)
- [ ] `break-inside: avoid` em cards, tabelas, imagens
- [ ] `orphans`/`widows` configurados
- [ ] Cabeçalho repetido em tabelas (`table-header-group`)
- [ ] Arquivo de print carregado com `media="print"`
- [ ] `-webkit-print-color-adjust: exact` quando cores são essenciais
