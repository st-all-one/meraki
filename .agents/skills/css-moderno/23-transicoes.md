# Transições CSS

## Conceito

Transições permitem que **mudanças de estado CSS ocorram suavemente** ao longo do tempo, em vez de instantaneamente. São o mecanismo mais simples para animar interações do usuário.

```css
/* Estado normal */
.btn {
  background: blue;
  color: white;
}

/* Estado hover — a transição suaviza a mudança */
.btn:hover {
  background: darkblue;
}
```

## Propriedades de Transição

### transition-property

```css
.elemento {
  transition-property: all;             /* todas as propriedades animáveis */
  transition-property: transform;      /* apenas transform */
  transition-property: opacity, transform; /* lista específica */
  transition-property: none;           /* sem transição */
}
```

**Regra**: Listar propriedades específicas é mais performático que `all`.

### transition-duration

```css
.elemento {
  transition-duration: 0.3s;    /* duração em segundos */
  transition-duration: 300ms;   /* duração em milissegundos */
}
```

### transition-timing-function

```css
.elemento {
  transition-timing-function: ease;           /* padrão: suave no início e fim */
  transition-timing-function: linear;         /* velocidade constante */
  transition-timing-function: ease-in;        /* acelera no final */
  transition-timing-function: ease-out;       /* desacelera no final */
  transition-timing-function: ease-in-out;    /* suave em ambos */
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-timing-function: steps(2, jump-end);
}
```

### transition-delay

```css
.elemento {
  transition-delay: 0s;      /* começa imediatamente (padrão) */
  transition-delay: 0.2s;    /* espera 200ms antes de começar */
  transition-delay: -0.1s;   /* começa no meio da transição */
}
```

### Atalho transition

```css
.elemento {
  transition: transform 0.3s ease;
  /* property duration timing-function */

  transition: opacity 0.2s ease, transform 0.3s ease 0.1s;
  /* múltiplas: cada propriedade com sua duração/timing/delay */

  transition: all 0.3s ease;  /* todas as propriedades */
}
```

## Transições Múltiplas com Tempos Diferentes

```css
.elemento {
  /* transform e opacity com durações diferentes */
  transition:
    transform 0.3s ease,
    opacity 0.2s ease 0.1s;    /* opacity começa 100ms depois */
}

.elemento:hover {
  transform: scale(1.1);
  opacity: 0.8;
}
```

## Gatilhos de Transição

Qualquer mudança de estado CSS pode disparar uma transição:

```css
/* Hover */
.btn {
  background: var(--color-primary);
  transition: background 0.2s ease;
}
.btn:hover { background: var(--color-primary-dark); }

/* Focus */
.input {
  border-color: #ccc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

/* Active */
.btn:active { transform: scale(0.97); }

/* Class toggle via JS */
.modal {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.modal.open { opacity: 1; }

/* Atributo seletor */
.card[data-state="expanded"] {
  max-height: 500px;
  transition: max-height 0.3s ease;
}
.card[data-state="collapsed"] {
  max-height: 0;
  overflow: hidden;
}
```

## Propriedades que Podem Ser Transicionadas

### ✅ Propriedades Recomendadas (Composite)

```css
.elemento {
  transition: transform 0.3s ease;     /* composite — barato */
  transition: opacity 0.3s ease;       /* composite — barato */
  transition: filter 0.3s ease;        /* composite — médio */
}
```

### ⚠️ Propriedades com Cuidado (Paint)

```css
.elemento {
  transition: background 0.3s ease;       /* paint — médio */
  transition: color 0.2s ease;            /* paint — médio */
  transition: box-shadow 0.3s ease;       /* paint — médio */
}
```

### ❌ Propriedades a Evitar (Layout)

```css
.elemento {
  transition: width 0.3s ease;        /* layout — caro */
  transition: height 0.3s ease;       /* layout — caro */
  transition: margin 0.3s ease;       /* layout — caro */
  transition: top 0.3s ease;          /* layout — caro */
  transition: padding 0.3s ease;      /* layout — caro */
}
```

## Transições e Display

`display` não é animável diretamente. Use `transition-behavior: allow-discrete` (moderno):

```css
.modal {
  display: none;
  opacity: 0;
  transition:
    display 0.3s allow-discrete,
    opacity 0.3s;
}

.modal.open {
  display: block;
  opacity: 1;
}

@starting-style {
  .modal.open {
    opacity: 0;
  }
}
```

(Ver `14-animacoes-discretas.md` para detalhes.)

## Transições com Custom Properties

Sem `@property`, custom properties NÃO transicionam:

```css
/* ❌ Não funciona: --bg-color é string genérica */
:root { --bg-color: blue; }
.elemento { background: var(--bg-color); transition: --bg-color 0.3s; }
.elemento:hover { --bg-color: red; }

/* ✅ Funciona: @property registra o tipo */
@property --bg-color {
  syntax: "<color>";
  inherits: true;
  initial-value: blue;
}

.elemento {
  transition: --bg-color 0.3s;
}
.elemento:hover { --bg-color: red; }
```

## Transições de Transform

```css
.card {
  transform: scale(1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
}
```

### Boas Práticas para Transform

```css
/* ✅ Sempre usar transform para movimento */
.elemento {
  transition: transform 0.3s ease;
}
.elemento:hover { transform: translateX(8px); }

/* ❌ Evitar: propriedades de layout */
.elemento {
  transition: margin-left 0.3s ease;
}
.elemento:hover { margin-left: 8px; }
```

## Transições de Entrada e Saída

```css
.tooltip {
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}
```

## Tabela de Timing Functions

| Função | Curva | Característica |
|---|---|---|
| `ease` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Suave no início e fim |
| `linear` | `cubic-bezier(0, 0, 1, 1)` | Velocidade constante |
| `ease-in` | `cubic-bezier(0.42, 0, 1, 1)` | Acelera gradualmente |
| `ease-out` | `cubic-bezier(0, 0, 0.58, 1)` | Desacelera gradualmente |
| `ease-in-out` | `cubic-bezier(0.42, 0, 0.58, 1)` | Suave em ambos |

## Tabela de Decisão

| Efeito | Propriedade | Performance |
|---|---|---|
| Movimento | `transform: translateX()` | ✅ Composite |
| Escala | `transform: scale()` | ✅ Composite |
| Rotação | `transform: rotate()` | ✅ Composite |
| Fade | `opacity` | ✅ Composite |
| Cor de fundo | `background-color` | ⚠️ Paint |
| Sombra | `box-shadow` | ⚠️ Paint |
| Tamanho | `width` / `height` | ❌ Layout |
| Posição | `top` / `left` | ❌ Layout |
| Borda | `border-width` | ❌ Layout |

## Acessibilidade

```css
/* Reduzir movimento */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
  }
}

/* Animação condicional */
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition: transform 0.2s ease;
  }

  .card:hover {
    transform: translateY(-2px);
  }
}
```

## Checklist

- [ ] `transition` com propriedades específicas em vez de `all`
- [ ] Animar apenas `transform` e `opacity` para performance
- [ ] `transition-behavior: allow-discrete` para `display`/`overlay`
- [ ] `@starting-style` para animações de entrada
- [ ] `prefers-reduced-motion` respeitado
- [ ] `transition-delay` usado com moderação (pode parecer lento)
- [ ] Custom properties animáveis registradas com `@property`
- [ ] Durações consistentes no sistema de design (200-300ms interação, 300-500ms entrada)
