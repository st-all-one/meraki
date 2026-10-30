# htmx 4 — Migrando do htmx 2 para 4

## Checklist de Migração

Siga esta ordem para migrar o Task Manager do htmx 2 para o htmx 4.

### Passo 1: Substituir o arquivo JS

```bash
cp www/static/vendor/htmx.min.js www/static/vendor/htmx.min.js.v2.bak
curl -L https://unpkg.com/htmx.org@4/dist/htmx.min.js \
  -o www/static/vendor/htmx.min.js
```

### Passo 2: Atualizar atributos renomeados

Use o upgrade checker do htmx 4:

```bash
npx htmx.org@4 upgrade-check -- www/templates/ www/src/
```

Ou faça manualmente:

| htmx 2 | htmx 4 | Ação |
|--------|--------|------|
| `hx-disable` | `hx-ignore` | Renomear **primeiro** |
| `hx-disabled-elt` | `hx-disable` | Renomear **depois** |
| `hx-vars` | `hx-vals` com `js:` | Substituir |
| `hx-ext` | Remover | Extensões carregam via `<script>` |
| `hx-params` | Evento `htmx:config:request` | Substituir |

### Passo 3: Tabela de substituições para o código existente

#### `hx-disable` → `hx-ignore`

```html
<!-- Antes (htmx 2) -->
<div hx-disable>
  <!-- htmx não processa este elemento -->
</div>

<!-- Depois (htmx 4) -->
<div hx-ignore>
  <!-- htmx não processa este elemento -->
</div>
```

#### `hx-disabled-elt` → `hx-disable`

```html
<!-- Antes (htmx 2) -->
<button hx-post="/tasks" hx-disabled-elt="this">Criar</button>

<!-- Depois (htmx 4) -->
<button hx-post="/tasks" hx-disable="this">Criar</button>
```

#### `hx-vars` → `hx-vals`

```html
<!-- Antes (htmx 2) -->
<button hx-post="/tasks" hx-vars="source:'ui'">Criar</button>

<!-- Depois (htmx 4) -->
<button hx-post="/tasks" hx-vals='js:{source:"ui"}'>Criar</button>
```

### Passo 4: Adicionar `:inherited` para herança explícita

Procure por padrões de herança implícita no workspace/layout.html:

```html
<!-- Antes (htmx 2): implícito -->
<div hx-target="#task-detail">
  <button hx-get="/task/1">Carregar</button>
</div>

<!-- Depois (htmx 4): explícito -->
<div hx-target:inherited="#task-detail">
  <button hx-get="/task/1">Carregar</button>
</div>
```

Ou, para migração rápida, ative herança implícita:

```html
<script>
  htmx.config.implicitInheritance = true;
</script>
```

### Passo 5: Atualizar nomes de eventos

Se você usa `hx-on:*` com eventos htmx:

```html
<!-- Antes (htmx 2) -->
<button hx-on:htmx:afterRequest="...">
<button hx-on:htmx:beforeSwap="...">

<!-- Depois (htmx 4) -->
<button hx-on:htmx:after:request="...">
<button hx-on:htmx:before:swap="...">
```

Tabela completa de eventos renomeados:

| htmx 2 | htmx 4 |
|--------|--------|
| `htmx:afterRequest` | `htmx:after:request` |
| `htmx:beforeRequest` | `htmx:before:request` |
| `htmx:afterSwap` | `htmx:after:swap` |
| `htmx:beforeSwap` | `htmx:before:swap` |
| `htmx:afterSettle` | `htmx:after:settle` |
| `htmx:configRequest` | `htmx:config:request` |
| `htmx:responseError` | `htmx:response:error` |
| `htmx:sendError` | `htmx:error` |
| `htmx:load` | `htmx:after:init` |
| `htmx:afterOnLoad` | `htmx:after:init` |

### Passo 6: Remover extensões via `hx-ext`

No htmx 4, extensões carregam via script, não via atributo:

```html
<!-- Antes (htmx 2) -->
<script src="/static/vendor/htmx.min.js"></script>
<script src="/static/vendor/ext/sse.js"></script>
<div hx-ext="sse" sse-connect="/events">
</div>

<!-- Depois (htmx 4) -->
<script src="/static/vendor/htmx.min.js"></script>
<script src="/static/vendor/ext/sse.js"></script>
<div hx-sse:connect="/events">
</div>
```

### Passo 7: Atualizar `hx-swap` scroll modifiers

```html
<!-- Antes (htmx 2) -->
<div hx-swap="innerHTML show:#other:top"></div>

<!-- Depois (htmx 4) -->
<div hx-swap="innerHTML show:top showTarget:#other"></div>
```

### Passo 8: Verificar timeouts

O htmx 4 tem timeout padrão de 60s. Se alguma operação precisa de mais tempo:

```html
<button hx-post="/tasks/bulk"
        hx-config="timeout:120000">
  Importar Tarefas
</button>
```

### Passo 9: Testar tratamento de erros

No htmx 4, erros 4xx/5xx são trocados. Verifique se:

1. **Formulários com validação**: o servidor retorna `422` com HTML de erro → esse HTML aparecerá no target
2. **Erros inesperados**: retornam `500` com HTML amigável
3. **Use `hx-status`** para controlar onde cada código de erro aparece:

```html
<form hx-post="/tasks"
      hx-status:422="target:#errors"
      hx-status:500="swap:none">
  <div id="errors"></div>
</form>
```

### Passo 10: Atualizar JavaScript

Se você usa a API JavaScript do htmx:

```javascript
// Antes (htmx 2)
htmx.addClass(el, 'active');
htmx.removeClass(el, 'inactive');
htmx.toggleClass(el, 'visible');
htmx.closest(el, '.container');
htmx.remove(el);
htmx.logAll();

// Depois (htmx 4) — usar API nativa
el.classList.add('active');
el.classList.remove('inactive');
el.classList.toggle('visible');
el.closest('.container');
el.remove();
htmx.config.logAll = true;
```

### Passo 11: Verificar OOB swap order

No htmx 2, OOB swaps aconteciam antes do conteúdo principal. No htmx 4, o conteúdo principal vai primeiro.

Se você depende dessa ordem (raro), reestruture para que cada swap seja independente.

### Passo 12: Testar navegação histórica

O htmx 4 não usa mais localStorage para cache de histórico. Teste:

1. Navegar entre tarefas (via `hx-get` + `hx-push-url`)
2. Botão "Voltar" do navegador
3. Botão "Avançar" do navegador

Se precisar do comportamento antigo (reload completo ao voltar):

```javascript
htmx.config.history = 'reload';
```

## Tabela de Migração Rápida

| Área | htmx 2 | htmx 4 |
|------|--------|--------|
| **Arquivo JS** | `htmx.org@1` ou `@2` | `htmx.org@4` |
| **Engine** | `XMLHttpRequest` | `fetch()` |
| **Timeout** | 0 (infinito) | 60000ms |
| **Herança** | Implícita | Explícita (`:inherited`) |
| **Erros 4xx/5xx** | Ignorados | Trocados |
| **hx-disable** | Desabilitar processamento | Renomeado para `hx-ignore` |
| **hx-disabled-elt** | Desabilitar elemento | Renomeado para `hx-disable` |
| **hx-vars** | Variáveis JS inline | Removido, usar `hx-vals='js:{...}'` |
| **hx-ext** | Declarar extensões | Removido (script direto) |
| **hx-params** | Controlar parâmetros | Removido (usar evento) |
| **Scroll swap** | `show:#el:top` | `show:top showTarget:#el` |
| **Queue trigger** | `queue:all` | Removido (usar `hx-sync`) |
| **OOB swap order** | Antes do main | Depois do main |
| **Eventos** | `htmx:afterSwap` | `htmx:after:swap` |

## Modo de Compatibilidade

Se precisar migrar gradualmente, ative a compatibilidade:

```html
<script>
  // Restaura herança implícita
  htmx.config.implicitInheritance = true;

  // Restaura comportamento de não trocar erros
  htmx.config.noSwap = [204, 304, '4xx', '5xx'];

  // Restaura timeout infinito
  htmx.config.defaultTimeout = 0;
</script>
<script src="/static/vendor/htmx.min.js"></script>
```

Ou carregue a extensão `htmx-2-compat`:

```html
<script src="/static/vendor/htmx.min.js"></script>
<script src="/static/vendor/ext/htmx-2-compat.js"></script>
```

Mas o **recomendado** é migrar completamente e usar os novos recursos.
