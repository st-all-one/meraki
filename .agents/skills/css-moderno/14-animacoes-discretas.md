# Animações com @starting-style e Transições Discretas

## @starting-style

`@starting-style` define o estado inicial de uma animação/transição para elementos que estão **entrando no DOM** ou mudando de `display: none` para visível.

```css
/* Elemento que aparece com transição suave */
.modal {
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.3s, transform 0.3s;
}

.modal.open {
  opacity: 1;
  transform: scale(1);
}

/* @starting-style: define o estado ANTES do elemento aparecer */
@starting-style {
  .modal {
    opacity: 0;
    transform: scale(0.9);
  }
}
```

### Caso de Uso: Dialog Nativo

```css
/* Dialog nativo com @starting-style para animação de entrada */
dialog {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s, transform 0.3s, overlay 0.3s, display 0.3s;
}

dialog[open] {
  opacity: 1;
  transform: translateY(0);
}

@starting-style {
  dialog[open] {
    opacity: 0;
    transform: translateY(20px);
  }
}

/* Backdrop do dialog */
dialog::backdrop {
  background: rgb(0 0 0 / 0);
  transition: background 0.3s;
}

dialog[open]::backdrop {
  background: rgb(0 0 0 / 0.4);
}

@starting-style {
  dialog[open]::backdrop {
    background: rgb(0 0 0 / 0);
  }
}
```

## transition-behavior: allow-discrete

Permite transicionar **propriedades discretas** (que não são interpoláveis), como `display` e `overlay`:

```css
/* Transicionar display: none → block */
.modal {
  display: none;
  opacity: 0;
  transition:
    display 0.3s allow-discrete,
    opacity 0.3s,
    overlay 0.3s allow-discrete;
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

### Padrão: Toast Notification

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: none;
  opacity: 0;
  transform: translateX(100%);
  transition:
    display 0.3s allow-discrete,
    opacity 0.3s,
    transform 0.3s;
}

.toast.visible {
  display: block;
  opacity: 1;
  transform: translateX(0);
}

@starting-style {
  .toast.visible {
    opacity: 0;
    transform: translateX(100%);
  }
}
```

## Animações com display: none → block

```css
/* Antes de @starting-style: elemento sumia sem transição */
/* Agora: combinação de @starting-style + allow-discrete */

.menu {
  display: none;
  opacity: 0;
  transform: translateY(-8px);

  /* entry animation */
  transition:
    display 0.2s allow-discrete,
    opacity 0.2s,
    transform 0.2s;
}

.menu.open {
  display: block;
  opacity: 1;
  transform: translateY(0);
}

/* Estado inicial para a transição de entrada */
@starting-style {
  .menu.open {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* Estado de saída (já coberto pela regra normal .menu) */
```

## View Transitions API

```css
/* Transições entre páginas ou estados */
@layer utilities {
  /* Nomear elementos para transição */
  .page-header {
    view-transition-name: page-header;
  }

  .page-content {
    view-transition-name: page-content;
  }
}

/* Customizar animação da view transition */
::view-transition-old(page-header) {
  animation: fade-out 0.3s ease;
}

::view-transition-new(page-header) {
  animation: fade-in 0.3s ease;
}

@keyframes fade-out {
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
}

/* Reduzir motion conforme preferência */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Cascade Layers com Animações

```css
@layer components {
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

  @keyframes slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }

  .sidebar {
    animation: slide-in 0.3s ease;
  }

  .sidebar.closing {
    animation: slide-out 0.3s ease forwards;
  }
}
```

## Animação de Propriedades Customizadas

```css
/* Com @property, custom properties são animáveis */
@property --rotation {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.spinner {
  --rotation: 0deg;
  transform: rotate(var(--rotation));
  animation: spin 2s linear infinite;
}

@keyframes spin {
  to { --rotation: 360deg; }
}
```

## Performance Checklist para Animações

- [ ] Animar apenas `transform` e `opacity` (composite)
- [ ] Usar `@starting-style` para animações de entrada
- [ ] Usar `transition-behavior: allow-discrete` para `display`/`overlay`
- [ ] Respeitar `prefers-reduced-motion`
- [ ] `will-change` apenas para elementos que serão animados em seguida
- [ ] `contain: layout style` em elementos animados
- [ ] Preferir `animation` a `transition` para loops
- [ ] Evitar animar `width`, `height`, `top`, `left`, `margin`, `padding`
