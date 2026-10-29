# ADR-008 — Cache-Control + ETag/304 + CSP sem inline

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-006, ADR-009, ADR-011 |

## Contexto

Páginas server-rendered com HTMX podem ser cacheadas na borda se o corpo for determinístico. CSRF
com token embutido no HTML e CSP por nonce quebram o ETag e podem vazar token em cache público. O
`v6` desligou CSP para destravar cache; queremos resolver na origem.

## Decisão

1. Middleware `httpCache()`:
   - GET/HEAD, status 200, sem `Set-Cookie`;
   - `ETag` forte = `"` + Blake3(corpo) + `"`;
   - `If-None-Match` compatível → **304** sem corpo;
   - público: `Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=300`;
   - formulários/sessão: `private, no-store`; `Vary: Accept-Encoding` apenas.
2. **CSRF fora do corpo:** `hono/csrf` valida `Origin` em métodos mutantes; nenhum token em HTML.
3. **CSP estática, sem nonce e sem inline:** `script-src 'self'`, `style-src 'self'`,
   `frame-ancestors 'none'`, `form-action 'self'`. O gate proíbe `<script>` sem `src`, `style=` e
   `on*=` nas views.
4. Assets locais: `Cache-Control: public, max-age=3600` (vendor); CSS gerado no build.
5. Valkey guarda o fragmento de status (`/_/status`, 10 s) e o rate limit. É aceleração; a fonte da
   verdade é SQLite.
6. Nunca minificar HTML em runtime; compressão fica na borda.

## Justificativa (alternativas descartadas)

- **Nonce por request no HTML** — descartada: quebra ETag e cria *static nonce vulnerability* em
  cache de borda.
- **Token CSRF no HTML** — descartada: corpo varia por sessão e vaza em cache público.
- **Desligar CSP** — descartada: regressão de segurança já vista no legado.
- **Minificar HTML em runtime** — descartada: frágil e sem ganho frente a gzip/brotli.

## Consequências

**Positivas**
- 304 real; HTML público seguro em cache compartilhado; CSP simples e cacheável.
- Páginas com formulário não são cacheadas publicamente (correto).

**Custos / negativas**
- Todo HTML público precisa ser determinístico (sem data/hora, sem dado de sessão).
- Se um nonce for inevitável, aquela página não pode ser cacheada na borda.

## Exemplo mínimo (comparativo)

```ts
// ❌ corpo varia por request e cache público vaza token
<html><meta name="csrf-token" content={token}>

// ✅ HTML determinístico, token fora do corpo, ETag + 304
const etag = `"${blake3Hex(body)}"`;
if (ifNoneMatch === etag) return new Response(null, { status: 304, headers });
```

## Verificação

Teste HTTP confirma ETag estável, 304 e ausência de cache em métodos mutantes; smoke `curl -I`
mostra `Cache-Control`, `ETag` e CSP; Playwright/axe cobrem a camada visível.

## Referências

- `src/kernel/http/cache.ts`, `src/kernel/http/security.ts`
- `public-v7/wiki/adr/ADR-022-cache-resposta-etag-csrf.md`
