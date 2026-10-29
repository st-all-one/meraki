# ADR-043 — Fork Meraki: cortes de escopo e runtime SQLite

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-29) |
| **Substitui parcialmente** | ADR-003 (Kysely), ADR-005/009/010/018/027/036 (serviços removidos) |
| **Relacionadas** | ADR-001, ADR-013, ADR-017, ADR-028 |

## Contexto

O Meraki é derivado do Somlos @ `96ade82`, mas o produto é um índice de demandas para um time de
10 pessoas, não um CMS com mídia, assinatura, e-mail e workers. O plano `implementation/` corta
Valkey, RustFS, OTel, jobs, SMTP, JWT de API e o editor rico.

## Decisão

1. **Mantém** a filosofia do Somlos: monolito modular DDD simplificado, kernel sem domínio,
   services headless descobertos por convenção, módulos com manifesto, portas para chamadas
   cruzadas, schema composto na raiz, migrations up-only junto ao dono, composition root explícito,
   JSX + HTMX, CSP estrita, Argon2id + Blake3, sessão opaca, `tenant_id`, UUIDv7 e timestamps ISO.
2. **Corta** CMS, páginas, notícias, contatos, galeria, mapas, assinatura, mídia, TipTap, SMTP,
   OTel, JWT de API, outbox/jobs, Valkey, RustFS e tipos de conteúdo.
3. **Runtime SQLite**: mantém `node:sqlite`, WAL, `BEGIN IMMEDIATE`, `foreign_keys`, checksum de
   migration e IDs no relógio. A implementação do Meraki usa `node:sqlite` direto e não usa Kysely
   nesta primeira versão; o schema TS continua composto em `src/db/schema.ts`. A troca para Kysely
   exigiria reescrever consultas síncronas para assíncronas e não traz ganho para 10 pessoas. Esta
   é a única emenda relevante ao ADR-003.
4. **Migrations** seguem ADR-013: `src/db/migrations/` só para fundação cruzada e
   `src/modules|services/<dono>/migrations/` para o restante, com versão global.
5. **Portas**: leituras cruzadas passam por `context.ports` (ex.: `demands.lookup` para anexos e
   canvas). Módulos nunca importam outro módulo.
6. **Tempo/IDs**: `src/kernel/time/clock.ts` é o ponto canônico para novos IDs e timestamps; views
   podem formatar datas para exibição.

## Consequências

- O fork preserva a fronteira física e a composição do Somlos, com menos superfície.
- Kysely não é dependência de runtime; a dívida está documentada e pode ser paga com ADR nova.
- Worker, S3, Redis e e-mail ficam fora até gatilho de uso (ADR-015 do plano de produto).
