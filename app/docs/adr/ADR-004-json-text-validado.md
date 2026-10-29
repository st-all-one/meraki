# ADR-004 — Dados relacionais + JSON em TEXT validado

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-003, ADR-013 |

## Contexto

A stack pede “Relacional + JSONB”. SQLite tem JSON1 (texto) e JSONB binário desde 3.45. O driver
`node:sqlite` entrega JSONB como BLOB e exigiria conversão manual em toda leitura; colunas TEXT com
`json_valid` são interoperáveis, legíveis em backup e suficientes para o volume atual.

## Decisão

1. Dados de domínio em **colunas relacionais tipadas**. Metadados, payloads e configurações em
   **TEXT JSON**.
2. Toda coluna JSON tem `CHECK (json_valid(coluna))`; o default é `'{}'`.
3. Consultas por caminho usam `json_extract(col, '$.chave')`; quando quentes, criar **índice de
   expressão** (`CREATE INDEX ... ON tabela (json_extract(...))`).
4. A aplicação faz `JSON.stringify` na escrita e `JSON.parse` na borda de leitura (repositório).
5. Migrar para JSONB binário só com ADR e medição que justifiquem o custo de conversão.

## Justificativa (alternativas descartadas)

- **BLOB JSONB desde já** — descartada: sem ganho medido e com custo de conversão em toda leitura.
- **Tabelas EAV para campos variáveis** — descartada: SQL ilegível e integridade pior.
- **Colunas decorativas para cada variação** — descartada: explode o schema.

## Consequências

**Positivas**
- Schema simples, backup textual, queries SQL nativas.
- CHECK impede JSON inválido no banco.

**Custos / negativas**
- JSON é re-parseado a cada leitura; sem operadores GIN, índices precisam ser explícitos.
- `json_valid` valida sintaxe, não o formato do domínio; Zod cobre a borda da aplicação.

## Exemplo mínimo (comparativo)

```sql
-- ❌ texto livre sem validação
metadata TEXT;

-- ✅ JSON válido + índice para consulta quente
metadata TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata));
CREATE INDEX users_meta_role ON users (json_extract(metadata, '$.role'));
```

## Verificação

Teste de migration aplica o schema; inserir JSON inválido falha (`json_valid`). O seed e a API
validam o formato com Zod antes da escrita.

## Referências

- `src/db/migrations/0001_foundation.sql`
- https://sqlite.org/json1.html
