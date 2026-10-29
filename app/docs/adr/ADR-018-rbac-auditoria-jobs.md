# ADR-018 — RBAC por permissões, auditoria append-only e fila de jobs

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Incorporação seletiva do public-v7 |
| **Relacionadas** | ADR-000, ADR-002, ADR-005, ADR-013, ADR-015 |

## Contexto

O esqueleto tinha apenas `users.role` (`admin`/`member`) e nenhuma capacidade de produto para:
autorizar ações por módulo, persistir evidência de auditoria e executar trabalho assíncrono
(retention, mídia, e-mail). O public-v7 depende disso desde o primeiro módulo; sem essas três
capacidades, qualquer módulo novo acabaria inventando sua própria solução.

O objetivo é adicionar o mínimo que serve a todos os módulos, sem container de DI e sem abstração
antes do segundo uso real.

## Decisão

1. **RBAC por permissões (service `access`)**
   - Tabelas `roles` (`permissions` TEXT JSON validado) e `user_roles` (N papéis por usuário).
   - Permissões são tokens `modulo.acao`, `modulo.*` ou `*`; vocabulário declarado pelo módulo
     (a string é validada na criação do papel, não em uma tabela central).
   - `requirePermission(access, token)` é middleware **deny-by-default**; as permissões são
     resolvidas no banco a cada request, então revogar um papel vale imediatamente para sessões e
     JWTs em curso. `users.role` permanece apenas como rótulo legado do `Actor`.
   - Papéis de referência (`admin`, `member`) são garantidos de forma idempotente no boot do service.

2. **Auditoria append-only (service `audit`)**
   - Tabela `audit_logs` com `tenant_id`, ator (snapshot), módulo/ação, alvo, metadados,
     `request_id`, `trace_id`, `prev_hash` e `integrity_hash` (BLAKE3).
   - Cada linha encadeia o hash da anterior do mesmo tenant; `verifyChain()` recalcula a cadeia.
   - `UPDATE`/`DELETE` são bloqueados por trigger; não há API de alteração.
   - A escrita participa da transação do consumidor (`Executor<AppDatabase>`), para que sessão,
     evento e evidência sejam atômicos.
   - Login (sucesso/falha) e logout já registram evidência; módulos registram mutações sensíveis
     com uma chamada explícita, sem middleware de "captura tudo".

3. **Fila de jobs com scheduler (service `jobs`)**
   - Tabela `jobs` com `run_at`, `attempts`, `max_attempts`, `locked_at`, `last_error`,
     `completed_at`.
   - Worker local (single-writer) com lock por tick, retry exponencial (teto de 300 s) e
     dead-letter lógico ao atingir `max_attempts`.
   - `enqueue(executor, ...)` aceita a transação do consumidor; `register(name, handler)` é local ao
     processo; `runOnce()` existe para testes e shutdown.
   - Jobs **não** substituem o outbox: outbox é evento de domínio; `jobs` é trabalho imperativo
     (mídia, retention, exportação).

4. **Sem abstração prematura:** as três capacidades são tabelas + fábricas com dependências explícitas
   (`createAccess`, `createAuditWriter`, `createJobQueue`), descobertas por convenção e ligadas ao
   tenant no composition root. Não há event sourcing, CQRS, plugin system nem fila externa.

## Consequências

**Positivas**

- Qualquer módulo novo já tem autorização, trilha de evidência e execução assíncrona sem inventar
  infraestrutura.
- O RBAC é revogável em tempo real e o default é negar.
- A cadeia BLAKE3 detecta alteração/remoção fora da aplicação; o trigger impede a alteração pela
  própria aplicação.
- A fila usa o mesmo SQLite, sem broker adicional; retry e backoff são observáveis em tabela.

**Custos / negativas**

- `audit_logs` cresce sem retention automática; retenção/expurgo exige decisão (e o trigger bloqueia
  delete — o expurgo terá de ser um caminho explícito com ADR própria).
- O worker de jobs roda em processo separado e fica dormente por padrão (ADR-027); múltiplas
  instâncias exigem coordenação, como no outbox.
- `users.role` convive com `user_roles` até o contrato de remoção da coluna legada.
- O vocabulário de permissões é declarado no manifesto de cada módulo; o gate estático detecta um
  `requirePermission`/`access.can` com token não declarado.

## Verificação

- `deno task check` e `deno task test` incluem:
  - permissão negada por default e autorizada por papel (`*`);
  - middleware 401/403/200;
  - cadeia de auditoria válida e `UPDATE` bloqueado;
  - job concluído e retry até o teto.
- Gates estáticos continuam válidos (services não importam módulos; kernel não importa schema).

## Emenda (2026-10-23) — API administrativa e vocabulário fechado

O RBAC ganhou um módulo HTTP `admin` (somente API, Bearer JWT), sem UI:

| Método | Rota | Permissão | Efeito |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/admin/roles` | `admin.roles.read` | lista papéis do tenant |
| POST | `/api/v1/admin/roles` | `admin.roles.write` | cria papel (slug imutável) |
| PATCH | `/api/v1/admin/roles/:slug` | `admin.roles.write` | edita nome/permissões |
| GET | `/api/v1/admin/permissions` | `admin.roles.read` | vocabulário declarado pelos módulos |
| GET | `/api/v1/admin/users/:userId/roles` | `admin.roles.read` | papéis do usuário |
| POST | `/api/v1/admin/users/:userId/roles` | `admin.roles.write` | atribui papel |
| DELETE | `/api/v1/admin/users/:userId/roles/:slug` | `admin.roles.write` | revoga (idempotente) |

- `AccessControl` ganhou `updateRole`, `removeRole` e `rolesFor`; mutações e evidência
  (`access.role_created`, `access.role_updated`, `access.role_assigned`, `access.role_revoked`)
  rodam na mesma transação.
- `users` é lido pela porta `identity.users`, declarada pelo consumidor; o módulo `admin` não importa
  `identity`.
- O core publica `declaredPermissions` no contexto; `ModuleConfig.permissions` valida formato e
  unicidade no boot, e `scripts/gates.ts` falha quando um módulo usa uma permissão que não declarou.
- `admin` e `member` são papéis de referência e não podem ser editados pela API (evita lockout).
