# ADR-006 — Autenticação: token opaco em SQLite + JWT curto na API

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-002, ADR-007, ADR-008 |

## Contexto

O browser precisa de sessão revogável server-side; a API precisa de credencial stateless de curta
duração. O requisito é “Opaque Tokens (PG) + JWT”; com SQLite, o padrão conceitual não muda.

## Decisão

1. **Browser:** token opaco de 256 bits (CSPRNG, base64url) em cookie `somlos_session` `HttpOnly`,
   `SameSite=Lax`, `Secure` em produção. O banco guarda apenas `blake3(token)`; a tabela `sessions` é
   o ledger (expiração, revogação, `last_seen_at`).
2. **API:** `POST /api/v1/auth/token` valida credenciais e emite **JWT HS256** de 15 min
   (`JWT_EXPIRES_IN`). JWT nunca é aceito em cookie; a API só lê `Authorization: Bearer`.
3. Login cria sessão e publica `identity.session_started`; logout revoga a sessão e publica
   `identity.session_ended`.
4. Sliding expiration atualiza `last_seen_at` no máximo a cada 5 minutos; expiração absoluta é
   `SESSION_TTL_SECONDS` (7 dias por padrão).
5. Rate limit de login por `e-mail + IP` no Valkey; fail-open se o cache cair.
6. Falha de login é genérica e executa um hash descartável quando o e-mail não existe
   (anti-enumeração por conteúdo e por tempo).
7. Sem “remember me”, 2FA, reset por e-mail ou SSO nesta fundação.

## Justificativa (alternativas descartadas)

- **Só JWT no browser** — descartada: sem revogação real e exige proteção extra contra XSS/CSRF.
- **Só sessão opaca na API** — descartada: API stateless é requisito; token de sessão em cada request
  adiciona lookup e não é o padrão mobile/integração.
- **JWT longo** — descartada: roubo de token vale por horas/dias; 15 min limita o dano.
- **Cookie com JWT** — descartada: mistura CSRF e API; a API é explicitamente Bearer.

## Consequências

**Positivas**
- Revogação imediata no browser; API sem cookie (não sofre CSRF).
- Ledger de sessões permite auditoria e expiração.

**Custos / negativas**
- JWT não é revogável antes do `exp`; por isso é curto.
- Sessões exigem limpeza periódica (índice em `expires_at` já existe; job futuro).
- Produção exige `JWT_SECRET` forte e TLS para o cookie `Secure`.

## Exemplo mínimo (comparativo)

```ts
// ❌ token em claro e sem revogação
await db.insertInto("sessions").values({ token: raw, user_id }).execute();

// ✅ hash + ledger; cookie httpOnly no browser
await db.insertInto("sessions").values({ token_hash: blake3Hex(raw), user_id, expires_at }).execute();
setCookie(c, "somlos_session", raw, { httpOnly: true, sameSite: "Lax", secure: isProduction });
```

## Verificação

Testes cobrem login por formulário, `Set-Cookie`, acesso a `/app`, emissão/uso de JWT, logout e
rejeição de sessão revogada. Rate limit retorna `429` com `Retry-After`.

## Referências

- `src/services/auth/*`, `src/modules/identity/*`
- `public-v7/wiki/adr/ADR-037-autenticacao-do-cms.md`
