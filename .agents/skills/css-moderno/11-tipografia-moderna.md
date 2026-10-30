# Tipografia Moderna

## Font Loading com @font-face

```css
@font-face {
  font-family: "Inter";
  src:
    local("Inter Variable"),
    url("/fonts/Inter.woff2") format("woff2") tech(variations);
  font-display: swap;          /* exibe fallback imediatamente */
  font-weight: 100 900;        /* range para variable fonts */
  font-stretch: 75% 125%;
}

@font-face {
  font-family: "Inter Fallback";
  src: local("Arial"), local("Helvetica");
  size-adjust: 98%;           /* ajuste para reduzir layout shift */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

### font-display Estratégico

| Valor | Comportamento | Uso |
|---|---|---|
| `swap` | FOUT (flash of unstyled text) | Fontes de corpo |
| `block` | FOIT curto (3s) | Fontes de ícone |
| `optional` | Exibe fallback se não carregar em 100ms | Fontes decorativas |
| `fallback` | Swap com curto período de bloqueio | Fontes secundárias |

```css
/* Performance: font-display: swap + size-adjust reduzem CLS */
@font-face {
  font-family: "Body";
  src: url("/fonts/SourceSerif.woff2") format("woff2");
  font-display: swap;
  size-adjust: 100%;
  ascent-override: 90%;
}
```

## Variable Fonts

```css
/* Definição */
@font-face {
  font-family: "Recursive";
  src: url("/fonts/Recursive.woff2") format("woff2") tech(variations);
  font-weight: 300 1000;
  font-stretch: 50% 150%;
}

/* Uso */
.texto {
  font-family: "Recursive", system-ui, sans-serif;
  font-weight: 450;            /* peso intermediário */
  font-stretch: 110%;          /* largura estendida */
  font-variation-settings:
    "MONO" 0,                  /* eixo personalizado */
    "CASL" 0.5;               /* casual (Recursive) */
}
```

### Eixos Registrados (OpenType)

| Tag | Propriedade Mapeada | Range Típico |
|---|---|---|
| `wght` | `font-weight` | 100–900 |
| `wdth` | `font-stretch` | 50–200 (%) |
| `slnt` | `font-style: oblique` | -90–90 (deg) |
| `ital` | `font-style: italic` | 0 ou 1 |
| `opsz` | `font-optical-sizing` | varia por fonte |

## Text Wrap Moderno

```css
/* balance: linhas finais equilibradas (títulos) */
h1, h2, h3 {
  text-wrap: balance; /* máximo 6 linhas */
}

/* pretty: evita órfãs (parágrafos) */
p {
  text-wrap: pretty;  /* evita única palavra na última linha */
}

/* stable: sem quebra em edição (inputs) */
.contenteditable {
  text-wrap: stable;
}

/* wrap: comportamento padrão */
.normal { text-wrap: wrap; }
```

## Overflow e Quebra de Texto

```css
/* Controle de quebra de linha */
.texto {
  overflow-wrap: break-word;  /* quebra palavras longas */
  word-break: auto-phrase;    /* quebra em limites naturais (Chrome 125+) */
  hyphens: auto;              /* hifenização automática */
  hyphenate-character: "\2010"; /* caractere de hifenização */
}

/* Truncamento com reticências */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Truncamento multi-linha */
.clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## Espaçamento de Texto

```css
.texto {
  /* Propriedades lógicas */
  text-indent: 2em;
  letter-spacing: 0.02em;
  word-spacing: 0.05em;

  /* Espaçamento entre linhas */
  line-height: 1.6;          /* relativo (sem unidade) */
  line-height: clamp(1.4, 1.4 + 0.2vw, 1.8);

  /* Ajustes finos */
  font-kerning: normal;      /* kerning OpenType */
  font-smooth: auto;
  -webkit-font-smoothing: antialiased;
}
```

## Initial Letter (Drop Cap)

```css
/* Capitular — primeira letra destacada */
p:first-of-type::first-letter {
  initial-letter: 3;         /* altura: 3 linhas */
  initial-letter: 3 2;       /* altura 3, profundidade 2 */
  margin-right: 0.5em;
  font-weight: 700;
  color: var(--color-primary);
}
```

## White-space: Guia Completo

```css
/* Tabela de comportamentos */
.pre { white-space: pre; }          /* preserva tudo, não quebra */
.pre-wrap { white-space: pre-wrap; }  /* preserva, quebra */
.pre-line { white-space: pre-line; }  /* preserva quebras, colapsa espaços */
.nowrap { white-space: nowrap; }    /* não quebra */

/* Casos de uso */
code { white-space: pre-wrap; }     /* código preserva indentação */
.address { white-space: pre; }      /* endereço preserva linhas */
.email { white-space: nowrap; }     /* email não quebra */
.tag { white-space: nowrap; }       /* tags inline */

/* Preservar quebras em elementos editáveis */
[contenteditable] {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
```

## Hifenização

```css
.texto {
  hyphens: auto;
  hyphenate-limit-chars: 6 3 2; /* mín 6 letras, mín 3 antes, mín 2 depois */
  hyphenate-limit-lines: 2;     /* no máximo 2 linhas seguidas com hífen */
  hyphenate-limit-zone: 8%;     /* zona de hifenização */
}
```

## Sistemas de Font Stack

```css
/* Font stacks modernos */
:root {
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif;
  --font-serif: Georgia, "Noto Serif", "Times New Roman", serif;
  --font-mono: "Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace;
  --font-heading: var(--font-sans);
  --font-body: var(--font-sans);

  /* Fontes com fallback ajustado para CLS */
  --font-brand: "Inter Variable", "Inter Fallback", var(--font-sans);
}
```

## Performance Tipográfica

1. **font-display: swap** + `size-adjust` no fallback — reduz CLS
2. **WOFF2** sempre (compressão ~30-50% sobre WOFF)
3. **Variable fonts**: um arquivo substitui múltiplos pesos
4. **Preload** de fontes críticas:
   ```html
   <link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>
   ```
5. **unicode-range** para carregar apenas caracteres necessários
6. **font-family stack sempre termina com genérico** (serif, sans-serif, monospace)
