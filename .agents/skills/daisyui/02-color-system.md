# Sistema de Cores e Temas

## Cores Semânticas (daisyUI)

Diferente de cores fixas como `bg-blue-500`, daisyUI usa **nomes semânticos** que se adaptam ao tema ativo:

| Nome | Uso | Exemplo |
|---|---|---|
| `primary` | Cor principal da marca | `btn-primary`, `bg-primary` |
| `primary-content` | Texto sobre primary | `text-primary-content` |
| `secondary` | Cor secundária | `badge-secondary` |
| `accent` | Cor de destaque | `checkbox-accent` |
| `neutral` | Fundos neutros | `bg-neutral` |
| `base-100` | Fundo da página (mais claro) | `bg-base-100` |
| `base-200` | Fundo de cards/elevação | `bg-base-200` |
| `base-300` | Fundo de bordas/elevação maior | `bg-base-300` |
| `base-content` | Texto principal | `text-base-content` |
| `info` | Informativo | `alert-info` |
| `success` | Sucesso | `alert-success` |
| `warning` | Aviso | `alert-warning` |
| `error` | Erro | `alert-error` |

### Por que usar cores semânticas?

```html
<!-- ❌ Hardcoded — não adapta ao tema escuro -->
<div class="bg-blue-500 text-white">Conteúdo</div>

<!-- ✅ Semântico — adapta automaticamente a qualquer tema -->
<div class="bg-primary text-primary-content">Conteúdo</div>
```

### Opacidade

```html
<p class="text-base-content/50">Texto com 50% de opacidade (muted)</p>
<p class="text-base-content/80">Texto com 80% de opacidade</p>
```

---

## Temas

### Temas Nativos Disponíveis

`light`, `dark`, `cupcake`, `bumblebee`, `emerald`, `corporate`, `synthwave`, `retro`, `cyberpunk`, `valentine`, `halloween`, `garden`, `forest`, `aqua`, `lofi`, `pastel`, `fantasy`, `wireframe`, `black`, `luxury`, `dracula`, `cmyk`, `autumn`, `business`, `acid`, `lemonade`, `night`, `coffee`, `winter`, `dim`, `nord`, `sunset`, `carrot`, `abyss`, `silk`

### Configuração

**Ativar temas específicos** (CSS):

```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark, cupcake, nord;
}
```

**Ativar todos** (maior bundle):

```css
@plugin "daisyui" {
  themes: all;
}
```

**Aplicar tema a um elemento**:

```html
<html data-theme="dark">
<!-- ou em um trecho específico -->
<section data-theme="cupcake">...</section>
```

### Theme Controller (troca CSS-only)

```html
<!-- Checkbox: alterna entre temas -->
<input type="checkbox" class="theme-controller toggle" value="dark" />

<!-- Radio: seleciona um tema específico -->
<input type="radio" name="theme" class="theme-controller" value="dark" />
<input type="radio" name="theme" class="theme-controller" value="cupcake" />
```

### Tema Customizado

```css
@plugin "daisyui/theme" {
  name: "mytheme";
  default: true;
  prefersdark: false;
  color-scheme: "light";
  --color-primary: oklch(45% 0.24 277.02);
  --color-secondary: oklch(65% 0.24 27.58);
  --color-base-100: oklch(98% 0 0);
  --color-base-content: oklch(20% 0 0);
  /* ... demais variáveis ... */
}
```

### Tema por seção (aninhamento)

```html
<div data-theme="dark">
  <p>Este texto está no tema dark</p>
  <div data-theme="cupcake">
    <p>Este texto está no tema cupcake</p>
  </div>
</div>
```

---

## Border Radius

daisyUI define 3 tokens de border radius customizáveis por tema:

| Variável | Uso | Exemplo |
|---|---|---|
| `--radius-box` | Componentes grandes (card, modal, alert) | `rounded-box` |
| `--radius-field` | Componentes médios (button, input, select) | `rounded-field` |
| `--radius-selector` | Componentes pequenos (checkbox, toggle, badge) | `rounded-selector` |

```html
<div class="rounded-box bg-base-200 p-4">Card com radius do tema</div>
```
