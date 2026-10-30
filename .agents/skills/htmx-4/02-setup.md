# htmx 4 — Instalação e Configuração no Projeto

## 1. Baixar o htmx 4

Substitua o arquivo `www/static/vendor/htmx.min.js` pela versão 4:

```bash
# Na raiz do projeto
curl -L https://unpkg.com/htmx.org@4/dist/htmx.min.js \
  -o www/static/vendor/htmx.min.js
```

Ou, se preferir o bundle com extensões populares:

```bash
curl -L https://unpkg.com/htmx.org@4/dist/htmax.min.js \
  -o www/static/vendor/htmax.min.js
```

## 2. Atualizar o `base.html`

```html
<!-- Antes (versão antiga) -->
<script src="/static/vendor/htmx.min.js"></script>

<!-- Depois (htmx 4) -->
<script src="/static/vendor/htmx.min.js"></script>
```

Se optou pelo bundle:

```html
<script src="/static/vendor/htmax.min.js"></script>
```

## 3. Configurações essenciais para htmx 4

Adicione no `<head>` do `base.html` ou do `layout.html`:

```html
<meta name="htmx-config" content='
  defaultTimeout:30000
  defaultSwap:innerHTML
  history:true
  transitions:true
'>
```

Ou em JSON:

```html
<meta name="htmx-config" content='
  {"defaultTimeout":30000,"defaultSwap":"innerHTML","history":true,"transitions":true}
'>
```

### Explicação das opções para o Task Manager

| Config | Valor | Motivo |
|--------|-------|--------|
| `defaultTimeout` | `30000` | 30s é suficiente para consultas SQL no SQLite |
| `defaultSwap` | `innerHTML` | A maioria das trocas substitui conteúdo interno de divs |
| `history` | `true` | Navegação entre tarefas deve funcionar com voltar/avançar |
| `transitions` | `true` | Animações suaves entre trocas de colunas |

## 4. Verificar a versão carregada

Abra o console do navegador:

```javascript
console.log(htmx.version);
// Deve retornar "4.0.0" ou superior
```

## 5. Estrutura de diretórios atualizada

```
www/
├── templates/
│   ├── base.html              # Layout base com scripts atualizados
│   ├── login.html
│   └── workspace/
│       └── layout.html        # 3 colunas, Alpine.js + htmx 4
├── static/
│   ├── app.js                 # Alpine.js components
│   └── vendor/
│       ├── htmx.min.js        # ✅ htmx 4
│       ├── alpine.min.js      # Alpine.js
│       ├── tailwind-cdn.min.js
│       └── daisyui.min.css
```

## 6. Configurando headers do servidor Axum

O htmx 4 usa `fetch()` e espera `Content-Type: text/html`. No Axum, isso já é o padrão ao retornar `Html<String>`, mas verifique se não há CORS bloqueando:

```rust
use tower_http::cors::CorsLayer;

let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::same_origin())
    .allow_methods(any())
    .allow_headers(any());

let app = Router::new()
    .route("/", get(login_page))
    .layer(cors);
```

Para desenvolvimento, se o frontend estiver em porta diferente:

```rust
let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::predicate(|_, _| true))
    .allow_methods(any())
    .allow_headers(any());
```

## 7. Headers que o servidor Rust deve tratar

O htmx 4 envia headers específicos. O servidor Axum deve reconhecê-los:

| Header | Exemplo | Uso |
|--------|---------|-----|
| `HX-Request` | `true` | Identificar que é uma requisição htmx |
| `HX-Request-Type` | `partial` | `partial` para swaps, `full` para body-level |
| `HX-Target` | `div#task-tree` | ID do elemento alvo |
| `HX-Source` | `button#btn-create` | Elemento que disparou |
| `HX-Boosted` | `true` | Se veio de um link boostado |
| `HX-Current-URL` | `http://...` | URL atual (útil para redirects) |

No handler Rust:

```rust
use axum::http::HeaderMap;

async fn task_tree( headers: HeaderMap, /* ... */) -> impl IntoResponse {
    let is_htmx = headers.get("hx-request")
        .and_then(|v| v.to_str().ok())
        .map(|v| v == "true")
        .unwrap_or(false);

    if is_htmx {
        // Retorna apenas o fragmento HTML
        Html(task_tree_html)
    } else {
        // Retorna a página completa
        WorkspaceLayout { /* ... */ }.render().unwrap()
    }
}
```

## Próximo: [03-three-column-layout.md](03-three-column-layout.md) — Layout TickTick de 3 colunas
