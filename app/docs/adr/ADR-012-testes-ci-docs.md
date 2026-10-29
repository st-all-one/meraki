# ADR-012 — Testes, CI e documentação

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-000, ADR-001, ADR-003, ADR-013 |

## Contexto

Uma fundação precisa provar que o caminho crítico funciona e impedir erosão. O projeto usa GitLab e
Deno, e a memória de decisões precisa sobreviver a trocas de pessoas/agentes.

## Decisão

1. **Estático:** `deno fmt --check`, `deno lint`, `deno check` e `scripts/gates.ts`
   (fronteiras, CSP, migrations, env documentado, segredos). `deno task check` roda tudo.
2. **Dinâmico:** `Deno.test` em estilo BDD (`@std/testing/bdd`), nomes em português, dados de
   entrada/saída validados com **Zod**. Integração usa SQLite real, não mock de SQL.
3. **E2E:** **Playwright** + **axe-core**; violações `serious`/`critical` são gate. Smoke cobre home,
   HTMX, login e publicação de evento.
4. **CI GitLab:** `lint → test → e2e → build → deploy(manual)`. Testes não dependem de serviço de
   banco; e2e usa Valkey como serviço e a app via `webServer`.
5. **Documentação:** decisões em `docs/adr/` (uma por arquivo, com exemplo mínimo) e
   operação/arquitetura em `docs/wiki/`; README é a porta de entrada. ADR substituída é marcada,
   nunca apagada.
6. **Memória:** Knudge (`kd`); `AGENTS.md` define o protocolo e as regras de arquitetura.

## Justificativa (alternativas descartadas)

- **Mockar Kysely/SQLite** — descartado: esconde SQL inválido e transações; integração real é rápida.
- **Só testes E2E** — descartado: lento e não localiza a falha; a pirâmide continua válida.
- **Cobertura como meta única** — descartada: incentiva teste vazio; cobrimos comportamento e
  invariantes.
- **Commits automáticos de agente** — proibido por `AGENTS.md`; o humano controla o histórico.

## Consequências

**Positivas**
- Regressões de arquitetura/segurança falham cedo; pipeline barato (SQLite).
- Testes de integração usam o mesmo dialeto e migrations da produção.

**Custos / negativas**
- E2E precisa instalar Chromium e um servidor no ar.
- Integração exige `DB_PATH` com sufixo `_test.sqlite3`; reset fora disso é bloqueado.
- Teste não deve fixar texto de implementação nem wiring; cobre comportamento e invariantes.

## Exemplo mínimo (comparativo)

```ts
// ❌ teste tautológico / wiring
assertEquals(typeof createApp, "function");

// ✅ comportamento observável com dados validados
it("rejeita login inválido", async () => {
  const res = await app.request("/login", { method: "POST", body: invalidCredentials });
  assertEquals(res.status, 401);
});
```

## Verificação

`deno task check` verde; `deno task test` verde; `cd e2e && npx playwright test` verde. O pipeline
`.gitlab-ci.yml` reproduz os três estágios.

## Referências

- `scripts/gates.ts`, `tests/`, `e2e/`, `.gitlab-ci.yml`
- `public-v7/wiki/adr/ADR-038-cobertura-90-e-rigor-de-nao-regressao.md`
