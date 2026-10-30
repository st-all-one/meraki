# Meta Tags e Script Types Avançados

## 1. Meta Tag com `name` — Valores Específicos

### `<meta name="color-scheme">`

Indica suporte a temas claro/escuro no nível do documento.

```html
<meta name="color-scheme" content="dark light" />
```

Valores: `normal`, `light`, `dark`, `light dark`, `dark light`, `only light`. O primeiro valor indica preferência. Compatível com `prefers-color-scheme` no CSS.

Uso com `media` query:

```html
<meta name="color-scheme" content="dark light" media="(prefers-color-scheme: dark)" />
```

### `<meta name="referrer">`

Controla o header HTTP `Referer` dos requests enviados pelo documento.

```html
<meta name="referrer" content="no-referrer" />
```

Valores:

| Valor | Comportamento |
|-------|--------------|
| `no-referrer` | Não envia Referer |
| `origin` | Apenas origin |
| `no-referrer-when-downgrade` | Full URL para mesma segurança; nada para downgrade (default) |
| `origin-when-cross-origin` | Full URL mesma origin; apenas origin para cross-origin |
| `same-origin` | Full URL mesma origin; nada para cross-origin |
| `strict-origin` | Origin para mesma segurança; nada para downgrade |
| `strict-origin-when-cross-origin` | Full URL mesma origin; origin para mesma segurança; nada para downgrade |
| `unsafe-URL` | Full URL sempre |

> [!WARNING]
> Inserir `<meta name="referrer">` dinamicamente com `document.write()` ou `appendChild()` causa comportamento imprevisível. Políticas conflitantes resultam em `no-referrer`.

### `<meta name="robots">`

Controla crawl e indexação por mecanismos de busca.

```html
<meta name="robots" content="noindex, nofollow" />
```

Valores comuns: `index`, `noindex`, `follow`, `nofollow`, `all`, `none`, `noarchive`, `nosnippet`, `noimageindex`, `nocache` (sinônimo de `noarchive`).

### `<meta name="theme-color">`

Cor da interface do navegador (ex: Chrome Android toolbar).

```html
<meta name="theme-color" content="#4285f4" />

<!-- Diferentes cores para light/dark -->
<meta name="theme-color" content="cornflowerblue" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="dimgray" media="(prefers-color-scheme: dark)" />
```

## 2. Meta Tag com `http-equiv`

### Valores suportados

| `http-equiv` | Descrição |
|-------------|-----------|
| `content-security-policy` | Define CSP (ver `05_SECURITY.md`) |
| `content-type` | `content="text/html; charset=utf-8"` |
| `default-style` | Nome do stylesheet CSS padrão |
| `refresh` | Recarregar ou redirecionar após N segundos |
| `content-language` | ~~Deprecated~~ — usar `lang` |
| `set-cookie` | ~~Deprecated~~ — browsers ignoram |
| `x-ua-compatible` | ~~Deprecated~~ — legacy IE |

### `http-equiv="refresh"`

```html
<!-- Recarregar após 5 minutos -->
<meta http-equiv="Refresh" content="300" />

<!-- Redirecionar após 3 segundos -->
<meta http-equiv="refresh" content="3;url=https://example.com" />
```

> [!WARNING]
> Refresh automático pode ser desorientador para usuários de screen reader. Garanta tempo suficiente para leitura.

### `http-equiv="content-security-policy"`

```html
<meta http-equiv="Content-Security-Policy" content="default-src https:" />
```

Equivalente ao HTTP header `Content-Security-Policy`.

## 3. Script Types

### `<script type="importmap">`

Define um mapa de importação para JavaScript modules. Permite usar "bare module specifiers".

```html
<script type="importmap">
{
  "imports": {
    "lodash": "https://cdn.example.com/lodash.js",
    "utils/": "./modules/utils/"
  }
}
</script>

<script type="module">
  import _ from "lodash";
  import { format } from "utils/format.js";
</script>
```

- Deve vir **antes** de qualquer `<script type="module">` que use os specifiers mapeados
- `src`, `async`, `defer`, `nomodule`, `crossorigin`, `integrity`, `referrerpolicy` NÃO são permitidos
- Aplica-se a `import` statements e `import()` dinâmico, não a `<script src="...">`

### `<script type="speculationrules">` (experimental)

Define regras de pré-busca e pré-renderização (Speculation Rules API).

```html
<script type="speculationrules">
{
  "prefetch": [
    {
      "urls": ["next.html", "next2.html"],
      "requires": ["anonymous-client-ip-when-cross-origin"],
      "referrer_policy": "no-referrer"
    }
  ],
  "prerender": [
    {
      "where": { "href_matches": "/next/*" },
      "eagerness": "eager"
    }
  ]
}
</script>
```

**Tipos de regras:**
- `prefetch`: Baixa o body da resposta (sem subrecursos)
- `prerender`: Renderiza completo em aba invisível (incluindo JS, subrecursos)

**Modos de source:**
- `"list"` (via `urls`) — URLs explícitas
- `"document"` (via `where`) — Match por padrões de URL nos links da página

**Eagerness:** `eager` (assim que possível), `moderate`, `conservative` (hover por 200ms)

> [!NOTE]
> `src`, `async`, `defer`, `nomodule`, `crossorigin`, `integrity`, `referrerpolicy` NÃO são permitidos. Pode também ser definido via HTTP header `Speculation-Rules`.
