# Acessibilidade CSS

## Prefers-reduced-motion

```css
/* Respeitar preferência do usuário */
@layer utilities {
  @media (prefers-reduced-motion: no-preference) {
    .animatable {
      transition: transform 200ms ease, opacity 200ms ease;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

## Prefers-color-scheme

```css
:root {
  color-scheme: light dark;
}

@layer base {
  :root {
    --color-bg: white;
    --color-text: black;
    --color-link: blue;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: #121212;
      --color-text: #e0e0e0;
      --color-link: #8ab4f8;
    }
  }
}

/* Alta resolução de contraste */
@media (prefers-contrast: more) {
  :root {
    --color-text: black;
    --color-bg: white;
    --border-width: 2px;
  }
}
```

## Color-scheme

```css
/* Informa o navegador que a página suporta dark mode */
:root {
  color-scheme: light dark;
}

/* Por componente */
.modal {
  color-scheme: dark; /* força scrollbar dark mesmo em página light */
}

/* Define cores de elemento nativo (scrollbar, seleção) */
:root {
  color-scheme: light dark;
  accent-color: var(--color-primary);
}
```

## Accent-color

```css
/* Cores de elementos de formulário nativos */
:root {
  accent-color: var(--color-primary);
}

/* Por tipo de input */
input[type="checkbox"] {
  accent-color: var(--color-primary);
}

input[type="range"] {
  accent-color: var(--color-primary);
}

/* Fallback para navegadores sem suporte */
@supports (accent-color: auto) {
  input { accent-color: var(--color-primary); }
}
```

## Focus-visible

```css
/* Focus apenas para teclado (não para clique) */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Remover focus ring padrão APENAS quando focus-visible é suportado */
:focus:not(:focus-visible) {
  outline: none;
}
```

## Display: Contents — Cuidados de Acessibilidade

```css
/* ⚠️ display: contents remove o elemento da árvore de acessibilidade */
/* Filhos permanecem, mas o elemento em si some para leitores de tela */

/* ❌ Perigoso: botão com display: contents some do leitor de tela */
.btn {
  display: contents; /* leitor de tela não vê o botão */
}

/* ✅ Correto: usar subgrid em vez de display: contents */
.grid-item {
  display: grid;
  grid-template-columns: subgrid;
  /* Mantém o elemento na árvore de acessibilidade */
}
```

## Text Spacing (WCAG 1.4.12)

```css
/* Respeitar customizações de texto do usuário */
* {
  /* Não usar dimensões fixas que impeçam spacing customizado */
  line-height: 1.5;     /* mínimo WCAG */
  letter-spacing: 0.12em;
  word-spacing: 0.16em;
}

/* Garantir que texto não corte com spacing customizado */
.text-container {
  overflow: visible;   /* não cortar texto com zoom */
  max-width: 70ch;     /* largura ideal de leitura */
}
```

## Reduced Transparency

```css
@media (prefers-reduced-transparency: reduce) {
  * {
    opacity: 1 !important;
    backdrop-filter: none !important;
    background-blend-mode: normal !important;
  }
}
```

## Tabela de Mídia Features de Acessibilidade

| Media Query | Propósito |
|---|---|
| `prefers-reduced-motion` | Reduzir animações |
| `prefers-color-scheme` | Tema claro/escuro |
| `prefers-contrast` | Alto/menos contraste |
| `prefers-reduced-transparency` | Reduzir transparência |
| `prefers-reduced-data` | Reduzir dados (imagens/vídeos) |
| `inverted-colors` | Cores invertidas |
| `forced-colors` | Modo de alto contraste do SO |

```css
/* Exemplo completo */
@layer utilities {
  @media (prefers-reduced-data: reduce) {
    .hero-image { background: none; }
    .lazy-video { display: none; }
  }

  @media (forced-colors: active) {
    .btn { border: 2px solid ButtonText; }
  }
}
```

## Skip Link

```css
/* Link de pular para conteúdo — invisible até foco */
.skip-link {
  position: absolute;
  top: -100%;
  left: 8px;
  z-index: 9999;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border-radius: 0 0 8px 8px;
}

.skip-link:focus {
  top: 0;
}
```

## Checklist de Acessibilidade CSS

- [ ] `color-scheme: light dark` no `:root`
- [ ] `accent-color` definido globalmente
- [ ] `prefers-reduced-motion` com animações condicionais
- [ ] `prefers-color-scheme` para tema escuro
- [ ] `:focus-visible` em vez de `:focus`
- [ ] Nunca usar `display: contents` em elementos interativos
- [ ] `line-height`, `letter-spacing`, `word-spacing` sem valores fixos
- [ ] Texto nunca truncado sem `overflow: visible` em zoom
- [ ] Skip link implementado
- [ ] Contraste WCAG AA/AAA via `color-contrast()` ou verificação manual
