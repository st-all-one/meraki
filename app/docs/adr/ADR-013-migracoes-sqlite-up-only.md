# ADR-013 — Migrations SQLite up-only com checksum e expand & contract

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23; emenda de localização em 2026-10-26) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-003, ADR-004 |

## Contexto

Migrations precisam ser reproduzíveis e não destrutivas. SQLite tem `ALTER TABLE` limitado e
`DROP COLUMN` disponível apenas em versões recentes; rollback por `down()` tende a perder dados.
Seeds usados como bootstrap deixam ambientes dependentes de dados de demonstração.

## Decisão

1. Migrations são arquivos SQL numerados em `<dono>/migrations/`, aplicados em **ordem global**
   pelo runner:
   - fundação e primitivas de kernel: `src/db/migrations/`;
   - módulo: `src/modules/<nome>/migrations/`;
   - serviço headless: `src/services/<nome>/migrations/`.

   A versão é o nome do arquivo (`0007_pages`), única em todo o repositório; o checksum é do
   conteúdo. Mover o arquivo de pasta não altera a versão nem reaplica a migration.
2. `schema_migrations(version, checksum, applied_at)` registra o **Blake3** do arquivo; se o conteúdo
   mudar depois de aplicado, o runner falha (nunca reaplica silenciosamente).
3. Cada migration roda em `BEGIN IMMEDIATE` + `COMMIT`; erro → `ROLLBACK`.
4. **Up-only:** não há `down()` executável. Remoções seguem **expand & contract** em duas releases.
5. O gate proíbe `DROP TABLE`/`DROP COLUMN` sem `-- gate:allow-drop`; o uso exige justificativa e
   revisão.
6. Seeds não definem o sistema: são demonstração, recusam produção e são idempotentes.
7. `--reset` é destrutivo e proibido com `APP_ENV=production`; usado apenas em desenvolvimento/teste.

## Emenda 2026-10-26 — SQL junto ao dono, ordem global

O SQL foi retirado da pasta central `migrations/` para reduzir acoplamento de autoria. O runner
continua único e global: descobre `src/**/migrations/*.sql`, rejeita versão duplicada e aplica em
ordem lexicográfica de versão. O ledger `schema_migrations` não muda.

Migrations que cruzam mais de um dono (por exemplo, a fundação inicial e o pacote
`access`/`audit`/`jobs`) permanecem em `src/db/migrations/`, que é a camada de composição da
fundação. Uma migration não deve ser movida para um módulo só para parecer local.

## Justificativa (alternativas descartadas)

- **`down()` com DROP** — descartada: risco de perda irreversível; rollback de schema é restore.
- **Reescrever migration aplicada** — descartada: ambientes divergem; checksum detecta e falha.
- **Ferramenta externa (kysely-ctl/dbmate)** — descartada: runner de ~120 linhas cobre o caso e
  mantém a lógica auditável.
- **Ledger separado por módulo** — descartada: SQLite tem um único arquivo e uma única ordem; dois
  ledgers não definem a sequência entre dependências (ex.: `pages` antes de `tenants`).
- **Seed como bootstrap** — descartada: ambiente novo dependeria de dados demo.

## Consequências

**Positivas**
- Rollback nunca apaga dados por acidente; schema e código avançam juntos.
- Runner pequeno, sem dependência extra, com checksum e transação.

**Custos / negativas**
- Remoções levam duas releases; `--reset` exige disciplina.
- Backup antes de migration em produção continua obrigatório.
- Concorrência de migração é single-process (SQLite local); não há advisory lock de servidor.

## Exemplo mínimo (comparativo)

```sql
-- ❌ destrutivo e irreversível
DROP TABLE users;

-- ✅ expand & contract: adiciona nova, migra dados, remove só na release seguinte
ALTER TABLE users ADD COLUMN email_normalized TEXT;
UPDATE users SET email_normalized = lower(email);
-- release posterior: DROP COLUMN email_normalized -- gate:allow-drop
```

## Verificação

Rodar `deno task migrate` duas vezes não duplica; alterar um arquivo aplicado falha por checksum;
gate falha em DROP sem marcador. `deno task db:reset` recusa produção.

## Referências

- `scripts/migrate.ts`, `scripts/migration-files.ts`, `scripts/gates.ts`
- `src/db/migrations/`, `src/modules/*/migrations/`, `src/services/*/migrations/`
- `public-v7/wiki/adr/ADR-017-migrations-seguras-dados-desacoplados.md`
