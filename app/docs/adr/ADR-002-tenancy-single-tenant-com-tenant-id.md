# ADR-002 — Tenancy single-tenant operacional com `tenant_id` desde o dia zero

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-003, ADR-006 |

## Contexto

O modelo de tenant é “[conforme o projeto]”. A fundação precisa de um padrão que não exija migração
destrutiva quando o produto definir multi-tenancy. SQLite tem um escritor por arquivo; o modelo de
tenancy impacta diretamente a contenção e o isolamento.

## Decisão

1. **Um processo serve um tenant lógico**, resolvido por `TENANT_SLUG` no boot.
2. **Toda tabela de domínio carrega `tenant_id`** com FK, índice e filtro em todos os repositórios.
3. Isolamento de dados é garantido na aplicação (não há RLS no SQLite).
4. Evolução para multi-tenant:
   - poucos tenants → mesmo arquivo com `tenant_id` (atual);
   - muitos tenants com escrita intensa → **um arquivo SQLite por tenant**, com o mesmo schema; a
     aplicação roteia pelo tenant do ator.

## Justificativa (alternativas descartadas)

- **Banco por tenant desde já** — descartada: multiplica migrações e conexões sem demanda atual.
- **Sem `tenant_id`, adicionar depois** — descartada: exigiria migração de dados e reescrita de
  todas as queries.
- **RLS/roles** — não existe no SQLite; a fronteira é a aplicação + filesystem.

## Consequências

**Positivas**
- Consultas atuais permanecem válidas; deploy por cliente é possível hoje.
- Migração futura para arquivo-por-tenant não muda o schema nem os casos de uso.

**Custos / negativas**
- `tenant_id` é redundante no modo single-tenant; toda query precisa filtrá-lo.
- Um `tenant_id` esquecido é bug de isolamento; revisão e testes cobrem login/dashboard/API.

## Exemplo mínimo (comparativo)

```ts
// ❌ vaza dados entre tenants
db.selectFrom("users").selectAll();

// ✅ sempre escopado
db.selectFrom("users").selectAll().where("tenant_id", "=", actor.tenantId);
```

## Verificação

Índice único `(tenant_id, lower(email))`; seed e login recebem o tenant resolvido no boot; testes de
integração exercitam o caminho autenticado.

## Referências

- `src/services/tenancy/tenant.ts`
- `src/db/migrations/0001_foundation.sql`
