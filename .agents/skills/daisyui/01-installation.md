# Instalação

## HTML Puro — Via CDN (recomendado para prototipação)

Adicione no `<head>` do HTML:

```html
<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

Ou com temas específicos (menor bundle):

```html
<link href="https://cdn.jsdelivr.net/npm/daisyui@5/themes.css" rel="stylesheet" type="text/css" />
<link href="https://cdn.jsdelivr.net/npm/daisyui@5/daisyui.css" rel="stylesheet" type="text/css" />
```

Para escolher partes específicas:
https://cdn.jsdelivr.net/npm/daisyui@5/chunks.css

## HTML Puro — Tailwind CSS CLI (recomendado para produção)

```bash
# 1. Baixar Tailwind CSS standalone + daisyUI
curl -fsSLo tailwindcss https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64
chmod +x tailwindcss
curl -fsSLo daisyui.mjs https://github.com/saadeghi/daisyui/releases/latest/download/daisyui.mjs
curl -fsSLo daisyui-theme.mjs https://github.com/saadeghi/daisyui/releases/latest/download/daisyui-theme.mjs

# 2. Criar input.css
cat > input.css << 'EOF'
@import "tailwindcss";
@source not "./tailwindcss";
@source not "./daisyui{,*}.mjs";
@plugin "./daisyui.mjs";
EOF

# 3. Compilar
./tailwindcss -i input.css -o output.css
```

Link `output.css` no HTML:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="output.css" rel="stylesheet" />
</head>
<body>
  <button class="btn btn-primary">Hello daisyUI!</button>
</body>
</html>
```

### Rápido (script oficial)

```bash
curl -fsSL https://daisyui.com/fast | bash
# Ou no Windows (PowerShell):
# iex ((New-Object System.Net.WebClient).DownloadString('https://daisyui.com/fast.ps1'))
```

---

## Rust / Leptos (CSR — Trunk)

```bash
# 1. Criar projeto
cargo init task-manager --lib
cd task-manager

# 2. Instalar dependências Rust
cargo add leptos --features=csr
cargo add console_error_panic_hook
rustup target add wasm32-unknown-unknown

# 3. Instalar Tailwind + daisyUI (npm)
npm init -y
npm install -D tailwindcss @tailwindcss/cli daisyui

# 4. Configurar Tailwind
cat > input.css << 'EOF'
@import "tailwindcss";
@source "../**/*.html";
@source "../**/*.rs";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
EOF
```

**`Trunk.toml`**:

```toml
[[hooks]]
stage = "pre_build"
command = "npx"
command_arguments = ["tailwindcss", "-i", "input.css", "-o", "output.css"]
```

**`index.html`**:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link data-trunk rel="css" href="output.css" />
</head>
<body></body>
</html>
```

**`src/lib.rs`**:

```rust
use leptos::prelude::*;

#[component]
pub fn App() -> impl IntoView {
    view! { <button class="btn btn-primary">"Hello daisyUI!"</button> }
}

fn main() {
    console_error_panic_hook::set_once();
    leptos::mount::mount_to_body(|| view! { <App/> });
}
```

---

## Rust / Leptos (SSR — Axum + cargo-leptos)

Ver `AGENTS.md` para setup completo de SSR com Axum.

**`Cargo.toml`** (extra para daisyUI):

```toml
[package.metadata.leptos]
style-file = "style/output.css"
```

**`style/input.css`**:

```css
@import "tailwindcss";
@source "../**/*.html";
@source "../**/*.rs";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

**`package.json`**:

```json
{
  "scripts": {
    "build:css": "tailwindcss -i style/input.css -o style/output.css",
    "dev:css": "tailwindcss -i style/input.css -o style/output.css --watch"
  },
  "devDependencies": {
    "tailwindcss": "^4",
    "@tailwindcss/cli": "^4",
    "daisyui": "^5"
  }
}
```

**Build script** (adicione ao `cargo-leptos` ou execute antes):

```bash
npx tailwindcss -i style/input.css -o style/output.css
cargo leptos build --release
```

---

## Verificação

Após qualquer método de instalação, teste com:

```html
<button class="btn btn-primary">Button</button>
<button class="btn btn-secondary">Button</button>
<button class="btn btn-accent">Button</button>
```

Se aparecerem botões estilizados, a instalação está correta.
