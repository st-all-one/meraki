# Boas Práticas, Troubleshooting e Performance

## Boas Práticas

### 1. Use Cores Semânticas, Nunca Hardcoded

```html
<!-- ❌ Ruim: quebra ao mudar de tema -->
<div class="bg-blue-500 text-white">Card</div>

<!-- ✅ Bom: adapta a qualquer tema -->
<div class="bg-primary text-primary-content">Card</div>

<!-- ✅ Excelente: usa opacidade para muted text -->
<p class="text-base-content/60">Texto secundário</p>
```

### 2. Prefira Componentes a Utilitários Puros

```html
<!-- ❌ Ruim: dezenas de classes -->
<div class="flex items-center gap-2 rounded-lg border bg-white p-4 shadow dark:bg-gray-800">
  Conteúdo
</div>

<!-- ✅ Bom: componente semântico + poucos utilitários -->
<div class="card bg-base-100 shadow-sm">
  <div class="card-body">Conteúdo</div>
</div>
```

### 3. Use `data-theme` para Escopo

```html
<!-- Tema global -->
<html data-theme="dark">

<!-- Tema em seção específica -->
<section data-theme="cupcake">
  <!-- conteúdo com tema cupcake -->
</section>

<!-- Aninhamento de temas -->
<div data-theme="dark">
  <p>Escuro</p>
  <div data-theme="light">
    <p>Claro (aninhado)</p>
  </div>
</div>
```

### 4. Responsividade com Drawer

```html
<!-- Sidebar sempre visível em lg, toggle em mobile -->
<div class="drawer lg:drawer-open">
  <input id="toggle" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">...</div>
  <div class="drawer-side">...</div>
</div>
```

### 5. Modal: Prefira HTML dialog Element

```html
<!-- ✅ Recomendado: dialog nativo -->
<button onclick="myModal.showModal()">Abrir</button>
<dialog id="myModal" class="modal">
  <div class="modal-box">...</div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- ✅ Popover API (para SPAs sem dialog) -->
<button popovertarget="pop">Abrir</button>
<div id="pop" class="dropdown-content" popover>...</div>
```

### 6. Performance CSS

- Ative **apenas os temas necessários**, não `themes: all`
- Use `include`/`exclude` para remover componentes não usados
- Evite classes dinâmicas (`btn-${color}`) — Tailwind não detecta
- Em monorepos, use `@source` explícito em vez de detecção automática

```css
@plugin "daisyui" {
  themes: light, dark, cupcake;     /* só 3 temas */
  exclude: rootscrollgutter, svg;   /* remove o que não usa */
}
```

### 7. Acessibilidade

- Use `<button>` para ações — não `<div role="button">` a menos que necessário (Safari bug)
- Modal com `dialog` nativo: fecha com `Esc`, foco gerenciado
- Adicione `role="progressbar"` em `radial-progress`
- Labels com `for`/`id` em inputs

---

## Troubleshooting

### "Class names não funcionam"

**Causa**: Tailwind não encontrou as classes no source.

**Solução**:
```css
@source "./src/**/*.rs";   /* Leptos */
@source "./**/*.html";     /* HTML */
```

Ou desabilite detecção automática e use `@source` explícito:

```css
@config "./tailwind.config.js";
@source "./src/";
```

### "CSS muito grande"

**Causa**: `themes: all` + detecção automática detectando strings indesejadas.

**Solução**:
```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

### "Checkbox/Toggle/Radio quebrados"

**Causa**: Conflito com `@tailwindcss/forms`.

**Solução**: Remova `@tailwindcss/forms` (daisyUI já estiliza form elements) ou use `strategy: 'class'`.

### "Temas não funcionam"

**Causa**: Faltou `data-theme` no HTML ou tema não foi ativado na config.

**Solução**:
```html
<html data-theme="dark">
```

```css
@plugin "daisyui" {
  themes: dark;
}
```

### "Tema escuro não aparece automaticamente"

**Causa**: Nenhum tema marcado com `--prefersdark`.

**Solução**:
```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

### "Modal não abre em SPA"

**Causa**: Frameworks SPA (como Leptos) interceptam links `<a href="#modal">`.

**Solução**: Use `dialog.showModal()` em vez de anchor links.

```rust
// Leptos: abrir modal
let dialog = document().get_element_by_id("my-modal")
    .and_then(|el| el.dyn_into::<web_sys::HtmlDialogElement>().ok());
if let Some(d) = dialog { let _ = d.show_modal(); }
```

### "Dropdown não fecha"

**Causa**: Elementos como `<dialog>` dentro do dropdown roubam o foco.

**Solução**: Use Popover API ou details/summary em vez de CSS focus.

### "Hydration mismatch com Leptos SSR"

**Causa**: Código browser-only (`web_sys`) executando no servidor.

**Solução**: Envolva em `Effect::new` ou use `#[island]`:

```rust
#[island]
fn ThemeToggle() -> impl IntoView {
    // código só roda no cliente
}
```

---

## Comparação: HTML vs Leptos

| Aspecto | HTML Puro | Leptos (CSR) |
|---|---|---|
| Setup | CDN ou CLI | Trunk + Tailwind CLI |
| Reatividade | JS manual | Signals, Effects |
| Modal | `onclick` | `dialog.show_modal()` via `web_sys` |
| Lista dinâmica | `innerHTML` + rerender | `For` component (keyed) |
| Estado | Objeto global | `RwSignal` + context |
| Bundle | CSS + JS inline | WASM (maior, mas mais capaz) |
| SEO | Manual | SSR disponível |
| Build | Nenhum | `cargo leptos build` |

---

## Checklist de Implementação

### Inicial
- [ ] Tailwind CSS + daisyUI instalados (CDN, CLI, ou npm)
- [ ] `themes` configurado (evitar `all`)
- [ ] `@source` apontando para os arquivos fonte
- [ ] Tema padrão definido via `data-theme` no `<html>`

### Layout 3 Colunas
- [ ] Drawer com `lg:drawer-open` para sidebar responsiva
- [ ] Navbar com botão hamburger (`lg:hidden`)
- [ ] Coluna de detalhes `hidden lg:block` com `w-96`
- [ ] Altura calculada: `h-[calc(100vh-57px)]` ou similar

### Componentes
- [ ] Botões com variantes semânticas (`btn-primary`, `btn-ghost`)
- [ ] Inputs com `input-bordered` ou `input-ghost`
- [ ] Badges para status com cores semânticas
- [ ] Checkbox para conclusão de tarefa
- [ ] Modal via `<dialog>` para nova tarefa / detalhes mobile
- [ ] Toast para feedback de ações
- [ ] Dropdown para menu do usuário

### Temas
- [ ] Theme toggle funcional (data-theme alternando)
- [ ] Cores semânticas em toda a UI (sem `bg-blue-500` etc.)
- [ ] Opacidade para textos muted (`text-base-content/60`)

### Leptos Específico
- [ ] `AppState` com `RwSignal` para estado global
- [ ] `provide_context` / `use_context` para injeção de estado
- [ ] `For` component para lista de tarefas (keyed)
- [ ] `bind:value` para formulários
- [ ] `prop:checked` para checkboxes
- [ ] `web_sys::HtmlDialogElement` para modais
- [ ] Toast com `set_timeout` para auto-dismiss
