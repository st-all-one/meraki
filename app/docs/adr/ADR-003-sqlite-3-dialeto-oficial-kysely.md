# ADR-003 — SQLite 3 com `SqliteDialect` oficial do Kysely e `node:sqlite`

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) — substitui a decisão inicial PostgreSQL 18 |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-000, ADR-004, ADR-005, ADR-013 |

## Contexto

A stack inicial previa PostgreSQL 18. O projeto é um monolito modular de um servidor por instância;
um banco separado adiciona container, credenciais, rede e backup próprios. SQLite 3.45+ traz JSONB
binário; o Deno 2.9 embarca SQLite 3.53. O Kysely publicou um dialeto SQLite **oficial**
(`SqliteDialect`), evitando dialetos comunitários.

## Decisão

1. **SQLite 3 como fonte da verdade**, arquivo local em `DB_PATH` (`./data/somlos.sqlite3`).
2. Driver **`node:sqlite`** (`DatabaseSync`) com adaptador mínimo que implementa o contrato público
   do `SqliteDialect` (`prepare`, `reader`, `all`, `run`, `iterate`, `close`).
3. **`SqliteDialect` oficial do Kysely** — não usar `@marshift/*` nem `@soapbox/*`.
4. PRAGMAs no boot: `journal_mode=WAL`, `synchronous=NORMAL`, `foreign_keys=ON`,
   `busy_timeout=DB_BUSY_TIMEOUT_MS`.
5. O adaptador converte o `begin` do Kysely em **`BEGIN IMMEDIATE`**: o lock de escrita é adquirido
   no início da transação, evitando upgrade tardio e `SQLITE_BUSY` com WAL.
6. IDs `TEXT` UUIDv7 gerados na aplicação; timestamps `TEXT` ISO-8601 UTC.
7. O container `postgres` foi removido do Compose. Backup é snapshot do diretório `data/`.

## Justificativa (alternativas descartadas)

- **Manter PostgreSQL** — descartada: operação desproporcional para um arquivo local e um servidor.
- **PGlite (Postgres WASM)** — descartada: preserva SQL Postgres, mas não é SQLite e adiciona wasm;
  o requisito é simplicidade local.
- **`@marshift/kysely-deno-sqlite3`** — descartada após o dialeto oficial; uma dependência a menos.
- **better-sqlite3 via N-API** — descartada: binário nativo desnecessário; `node:sqlite` é built-in.

## Consequências

**Positivas**
- Zero servidor de banco; transações locais e testes rápidos; deploy de um container.
- Contrato oficial do Kysely, sem dialeto de terceiros.

**Custos / negativas**
- Um escritor por arquivo; sem replicação/HA nativa; sem `GRANT/REVOKE`.
- Throughput de escrita limitado; queries longas bloqueiam escrita (manter curtas).
- Backup exige cuidado com `-wal`/`-shm`; hoje o procedimento suportado para a app.

## Exemplo mínimo (comparativo)

```ts
// ❌ dialeto de terceiros + driver exótico
new DenoSqlite3Dialect({ database: new Database("app.db") });

// ✅ oficial + adaptador local explícito
const db = new Kysely<AppDatabase>({
  dialect: new SqliteDialect({ database: new DenoSqliteDatabase("./data/app.sqlite3") }),
});
```

## Verificação

- `deno task test` executa integração real em arquivo SQLite com WAL.
- `PRAGMA journal_mode` retorna `wal`; `readyz` reporta `SQLite 3`.
- `deno check` valida o adaptador contra `SqliteDatabase`/`SqliteStatement` oficiais.

## Referências

- https://kysely-org.github.io/kysely-apidoc/classes/SqliteDialect.html
- `src/kernel/db/database.ts`, `src/db/schema.ts`, `scripts/migrate.ts`
