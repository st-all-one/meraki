# Animações CSS com @keyframes

## Conceito

Animações CSS permitem **transições entre estados ao longo do tempo** sem JavaScript. Diferente de transições (que só vão de A para B), animações podem ter múltiplos quadros-chave, loops e direções variadas.

## @keyframes — Definição

```css
/* Estrutura básica */
@keyframes slide-in {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Quadros Intermediários (Porcentagens)

```css
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
  70% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0);
  }
}
```

### Múltiplas Propriedades

```css
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

## Propriedades de Animação

### animation-name

```css
.elemento {
  animation-name: slide-in;   /* nome do @keyframes */
  animation-name: none;       /* padrão: sem animação */
}
```

### animation-duration

```css
.elemento {
  animation-duration: 0.3s;   /* duração total */
  animation-duration: 300ms;
  animation-duration: 2s;
}
```

### animation-timing-function

```css
.elemento {
  animation-timing-function: ease;         /* padrão: começa e termina suave */
  animation-timing-function: linear;       /* velocidade constante */
  animation-timing-function: ease-in;      /* acelera no final */
  animation-timing-function: ease-out;     /* desacelera no final */
  animation-timing-function: ease-in-out;  /* suave no início e final */

  /* Curva cúbica personalizada */
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

  /* Saltos (CSS spring) */
  animation-timing-function: steps(4, end);
}
```

### animation-delay

```css
.elemento {
  animation-delay: 0s;        /* começa imediatamente (padrão) */
  animation-delay: 0.5s;      /* espera 0.5s antes de começar */
  animation-delay: -1s;       /* começa no meio da animação (já avançada) */
}
```

### animation-iteration-count

```css
.elemento {
  animation-iteration-count: 1;      /* executa uma vez (padrão) */
  animation-iteration-count: 3;      /* executa 3 vezes */
  animation-iteration-count: infinite; /* loop infinito */
}
```

### animation-direction

```css
.elemento {
  animation-direction: normal;       /* 0% → 100% (padrão) */
  animation-direction: reverse;      /* 100% → 0% */
  animation-direction: alternate;    /* 0% → 100% → 0% → 100%... */
  animation-direction: alternate-reverse; /* 100% → 0% → 100%... */
}
```

### animation-fill-mode

Controla o estado antes e depois da animação:

```css
.elemento {
  animation-fill-mode: none;      /* padrão: volta ao estado inicial */
  animation-fill-mode: forwards;  /* mantém o estado final (100%) */
  animation-fill-mode: backwards; /* aplica o estado inicial (0%) antes do delay */
  animation-fill-mode: both;      /* forwards + backwards */
}
```

### animation-play-state

```css
.elemento {
  animation-play-state: running;  /* animando (padrão) */
  animation-play-state: paused;   /* pausado */
}

/* Pausar no hover */
.elemento:hover {
  animation-play-state: paused;
}
```

### Atalho animation

```css
.elemento {
  animation: slide-in 0.3s ease forwards;
  /* name duration timing-function fill-mode */

  animation: bounce 1s ease-in-out 0.5s 3 alternate;
  /* name duration timing-function delay count direction */
}
```

## Animações em Loop (Spinners, Loading)

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #eee;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes dots {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

.loading-dot:nth-child(1) { animation: dots 1.2s ease infinite; }
.loading-dot:nth-child(2) { animation: dots 1.2s ease 0.2s infinite; }
.loading-dot:nth-child(3) { animation: dots 1.2s ease 0.4s infinite; }
```

## Animações com Múltiplos Passos

```css
/* Animação sequencial com delays */
@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger: cada item começa com delay progressivo */
.item:nth-child(1) { animation: fade-in-up 0.4s ease forwards; }
.item:nth-child(2) { animation: fade-in-up 0.4s ease 0.1s forwards; }
.item:nth-child(3) { animation: fade-in-up 0.4s ease 0.2s forwards; }
.item:nth-child(4) { animation: fade-in-up 0.4s ease 0.3s forwards; }
```

## Animação com steps() — Sprite Sheets

```css
@keyframes walk {
  from { background-position: 0 0; }
  to { background-position: -512px 0; } /* 8 frames de 64px */
}

.sprite {
  width: 64px;
  height: 64px;
  background: url("walk-sprite.png") 0 0 no-repeat;
  animation: walk 1s steps(8) infinite;
}
```

## Múltiplas Animações no Mesmo Elemento

```css
.elemento {
  animation:
    fade-in 0.5s ease forwards,
    pulse 2s ease 0.5s infinite;
}
```

## Animações com @property

(Detalhado em `08-propriedades-registradas.md`)

```css
@property --hue {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes hue-cycle {
  to { --hue: 360deg; }
}

.elemento {
  background: oklch(50% 0.2 var(--hue));
  animation: hue-cycle 3s linear infinite;
}
```

## Performance de Animações

```css
/* ✅ Boa performance (só composite) */
.elemento {
  animation: move 0.3s ease;
}

@keyframes move {
  to { transform: translateX(100px); }   /* composite */
}

/* ❌ Performance ruim (dispara layout) */
@keyframes bad-move {
  to { left: 100px; }                    /* layout */
}

/* ❌ Performance média (dispara paint) */
@keyframes bad-color {
  to { background: red; }                /* paint */
}
```

### Hierarquia de Performance

| Pipeline | Custo | Propriedades |
|---|---|---|
| Composite | Baixo | `transform`, `opacity` |
| Paint | Médio | `color`, `background`, `box-shadow`, `border-radius` |
| Layout | Alto | `width`, `height`, `top`, `left`, `margin`, `padding` |

## animation e Acessibilidade

```css
/* Respeitar prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

/* Ou: animação condicional */
@media (prefers-reduced-motion: no-preference) {
  .elemento {
    animation: slide-in 0.3s ease;
  }
}
```

## Animações de Entrada (com @starting-style)

Ver detalhes em `14-animacoes-discretas.md`.

```css
@starting-style {
  .elemento {
    opacity: 0;
    transform: translateY(10px);
  }
}

.elemento {
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Tabela de Propriedades de Animação

| Propriedade | Valores | Padrão |
|---|---|---|
| `animation-name` | `none` \| `<keyframes-name>` | `none` |
| `animation-duration` | `<time>` | `0s` |
| `animation-timing-function` | `ease` \| `linear` \| `ease-in` \| `ease-out` \| `cubic-bezier()` \| `steps()` | `ease` |
| `animation-delay` | `<time>` | `0s` |
| `animation-iteration-count` | `<number>` \| `infinite` | `1` |
| `animation-direction` | `normal` \| `reverse` \| `alternate` \| `alternate-reverse` | `normal` |
| `animation-fill-mode` | `none` \| `forwards` \| `backwards` \| `both` | `none` |
| `animation-play-state` | `running` \| `paused` | `running` |

## Diferenças: Animação vs. Transição

| Aspecto | `animation` | `transition` |
|---|---|---|
| Estado inicial | Definido em @keyframes | Estado atual do elemento |
| Múltiplos passos | Sim (vários keyframes) | Não (só A → B) |
| Loop | Sim (`infinite`) | Não |
| Auto-reverso | Sim (`alternate`) | Não (manual) |
| Gatilho | Automático ou classe | Mudança de estado |
| Controle | `play-state`, `delay`, `fill-mode` | `delay`, `duration` |

## Keyframe Animations Modernas (Padrões)

```css
/* Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 37%,
    #f0f0f0 63%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
}

/* Entrada de notificação */
@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

## Checklist

- [ ] Animar apenas `transform` e `opacity` (performance)
- [ ] `prefers-reduced-motion` respeitado em todas as animações
- [ ] `animation-fill-mode: forwards` para animações que devem manter estado final
- [ ] `animation-delay` negativo para iniciar animação já em progresso
- [ ] `steps()` usado para sprite sheets e animações discretas
- [ ] Nomes de keyframes semânticos (`slide-in`, `fade-out`, `spin`)
- [ ] `animation-iteration-count: infinite` com moderação (uso de CPU)
- [ ] `will-change` definido antes da animação começar, removido depois
