# 03 — Dados, migrations e seed

**Objetivo:** substituir o schema de produto do Somlos por um schema de **demandas** (tarefas oficiais + issues sugeridas), pastas, conversas, anexos e canvas colaborativo, com histórico permanente.

**Duração esperada:** 2–3 dias.

## 3.1 Estratégia

Não há dados de produção. Rebaseie as migrations em uma baseline limpa; não tente alterar 18 migrations de CMS/mídia.

```text
src/db/migrations/
  0001_core.sql
  0002_demands.sql
  0003_attachments.sql
  0004_conversations.sql
  0005_canvases.sql
  0006_notifications.sql
```

- IDs `text` (UUIDv7).
- Timestamps ISO 8601 UTC em `text`.
- `STRICT`; FKs ligadas (`PRAGMA foreign_keys=ON`).
- `tenant_id` em todas as tabelas de domínio.
- **Sem delete duro**; arquivamento e histórico.
- Comentários de demanda são o canal `chat` `scope=demand`; **não** há tabela `comments`.

## 3.2 Tabelas

### 0001_core

- `tenants` (id, slug, name, created_at).
- `users`:
  - `id`, `tenant_id`, `email` (collate nocase unique por tenant), `display_name`, `password_hash`;
  - `role` check `admin|manager|developer`;
  - `must_change_password` 0/1 default 1, `password_changed_at`;
  - `active` 0/1, `created_at`, `updated_at`.
- `sessions`:
  - `id`, `tenant_id`, `user_id`, `token_hash` unique, `user_agent`, `ip`;
  - `created_at`, `last_seen_at`, `expires_at`, `revoked_at`.
- `audit_logs`:
  - `id`, `tenant_id`, `actor_id`, `actor_email`, `action`, `target`, `metadata` (JSON text), `request_id`, `created_at`.

### 0002_demands

`projects` são as **pastas** que agrupam tarefas e issues.

- `projects`:
  - `id`, `tenant_id`, `key` (collate nocase), `name`, `next_seq`;
  - `created_by`, `archived_at`, `created_at`, `updated_at`;
  - unique `(tenant_id, key)`.

- `items` (a UI chama de **demanda**):
  - `id`, `tenant_id`, `project_id`, `seq`;
  - `kind` check `task|issue`;
  - `title`, `description_md` (Markdown, default '');
  - `status` text:
    - tarefa: `backlog|todo|doing|review|done`;
    - issue: `open|accepted|rejected`;
    - check no banco: união dos valores; a regra por `kind` fica no app.
  - `blocked` 0/1, `blocked_reason`;
  - `importance` check `low|medium|high` default `medium` — eixo de importância da matriz;
  - `priority_override` check `q1|q2|q3|q4` ou null — ajuste manual do gerente/admin;
  - `priority_override_by`, `priority_override_at`, `priority_override_reason`;
  - `start_date`, `end_date` (`YYYY-MM-DD`); obrigatórios em `kind='task'`, opcionais em issue;
  - `assignee_id`, `po_id` (somente tarefa; `assignee_id` obrigatório em task);
  - `completed_at`, `created_by`;
  - `promoted_at`, `promoted_by` (issue→tarefa);
  - `version` default 1;
  - `created_at`, `updated_at`, `archived_at`;
  - unique `(project_id, seq)`;
  - `check (start_date is null or end_date is null or start_date <= end_date)`;
  - `check (kind <> 'task' or (start_date is not null and end_date is not null and assignee_id is not null))`.

- `tags` (globais por tenant; agrupam demandas entre pastas):
  - `id`, `tenant_id`, `name`, `slug`;
  - `created_by`, `created_at`, `updated_at`, `archived_at`;
  - unique `(tenant_id, slug)`, unique `(tenant_id, name collate nocase)`.

- `item_tags`:
  - `item_id`, `tag_id`, `created_at`; PK `(item_id, tag_id)`;
  - índices `(tag_id, item_id)` e `(item_id)`.

- `demand_events` (append-only; base para análise futura):
  - `id`, `tenant_id`, `item_id`, `actor_id`;
  - `kind` (`created|edited|status|assignee|po|importance|priority|start|end|blocked|title|description|tags|archived|restored|promoted|attachment|canvas|conversation`);
  - `from_value`, `to_value` (texto/JSON), `metadata` (JSON text);
  - `created_at`.
  - Nunca atualizar/deletar; cada mudança gera uma linha na mesma transação.

Índices:

- `items(tenant_id, kind, status, updated_at) where archived_at is null` — índice geral.
- `items(project_id, kind, status, end_date) where archived_at is null`.
- `items(assignee_id, status, end_date) where archived_at is null`.
- `items(po_id, status, end_date) where archived_at is null`.
- `items(project_id, seq)` unique.
- `item_tags(tag_id, item_id)`.
- `demand_events(item_id, created_at)`.

### 0003_attachments

- `attachments`:
  - `id`, `tenant_id`, `uploader_id`;
  - `sha256`, `mime`, `bytes`, `width`, `height`;
  - `storage_key` unique (`attachments/<aa>/<bb>/<sha256>`);
  - `original_name`, `created_at`, `deleted_at`;
  - unique `(tenant_id, sha256)`; `bytes > 0`.
- `demand_attachments`:
  - `item_id`, `attachment_id`, `kind` check `file|canvas_export`;
  - `created_at`; PK `(item_id, attachment_id)`.

### 0004_conversations

- `chat_channels`:
  - `id`, `tenant_id`, `scope` check `general|project|demand`;
  - `project_id` (só project), `demand_id` (só demand);
  - `name`, `created_at`, `archived_at`;
  - check de coerência:
    - general: project_id null, demand_id null;
    - project: project_id not null, demand_id null;
    - demand: demand_id not null, project_id null.
  - índices únicos parciais: um general por tenant, um project por project_id, um demand por demand_id.
- `chat_messages`:
  - `id`, `tenant_id`, `channel_id`, `author_id`, `body_md`;
  - `body_md` 1..10000; `created_at`, `edited_at`, `deleted_at`;
  - índice `(channel_id, created_at)`.
- `chat_message_edits` (append-only):
  - `id`, `message_id`, `old_body_md`, `edited_by`, `edited_at`.
- `chat_reads`:
  - `channel_id`, `user_id`, `last_read_message_id`, `updated_at`; PK.
- `chat_message_attachments`:
  - `message_id`, `attachment_id`; PK; FK cascade na mensagem.

### 0005_canvases

- `whiteboards`:
  - `id`, `tenant_id`, `demand_id` **unique** (um canvas por demanda);
  - `scene_json`, `scene_version` default 1;
  - `created_by`, `created_at`, `updated_at`, `archived_at`.
- `whiteboard_snapshots` (append-only; histórico):
  - `id`, `whiteboard_id`, `scene_json`, `scene_version`;
  - `created_by`, `created_at`, `reason` check `autosave|manual|export|join`.
- `whiteboard_sessions` (para análise):
  - `id`, `whiteboard_id`, `user_id`, `joined_at`, `left_at`.
- `whiteboard_files`:
  - `whiteboard_id`, `excalidraw_file_id`, `attachment_id`;
  - PK `(whiteboard_id, excalidraw_file_id)`.
- `whiteboard_exports`:
  - `id`, `whiteboard_id`, `attachment_id`, `format` check `excalidraw|png|svg`;
  - `created_by`, `created_at`.

### 0006_notifications

- `notifications`:
  - `id`, `tenant_id`, `user_id`, `kind` (`assigned|po|message|issue|promoted|system`);
  - `title`, `body`, `url`, `data_json`, `created_at`, `read_at`, `pushed_at`;
  - índice `(user_id, read_at, created_at)`.
- `push_subscriptions`:
  - `id`, `tenant_id`, `user_id`, `endpoint_hash` unique, `endpoint`, `p256dh`, `auth`;
  - `user_agent`, `created_at`, `last_seen_at`, `disabled_at`.
- `notification_preferences`:
  - `user_id` PK, `push_enabled`, `assignments`, `po_changes`, `demand_messages`, `new_issues`, `hide_details`, `updated_at`.
- `push_deliveries`:
  - `notification_id`, `subscription_id`, `status` (`pending|sent|failed|gone`);
  - `attempts`, `last_error`, `next_attempt_at`, `updated_at`; PK composta.

## 3.3 Regras de domínio

- Tarefa oficial: `kind=task`; criada/arquivada por manager/admin; `po_id` definido por manager/admin.
- Tarefa exige `start_date`, `end_date` e `assignee_id`; `start_date <= end_date`; datas são inclusivas e calendário puro (`YYYY-MM-DD`), sem hora/timezone.
- Issue: `kind=issue`; criada/editada por qualquer usuário; arquivada pelo autor ou admin; promovida a tarefa por manager/admin.
- Promover issue:
  - exige preencher `start_date`, `end_date` e `assignee_id`;
  - `kind='task'`, `status='backlog'`, `promoted_at/by`, `po_id` (opcional no ato), evento `promoted`.
- `seq` por pasta, na mesma transação do insert (`next_seq`).
- `done` seta `completed_at`; reabrir limpa; `done` limpa `blocked`.
- Update com `version` no `WHERE`; 0 linhas → 409.
- Arquivar/restaurar gera evento; não apaga.
- Área de análise futura: eventos + timestamps + snapshots + IDs estáveis; nunca sobrescrever histórico.

### Prioridade Eisenhower

A prioridade **não é digitada**: é calculada na leitura a partir de `end_date`, `importance` e `status`, para não ficar velha quando o dia passa. Eisenhower exige dois eixos; a urgência vem do fim e a **importância** é o único input humano (default `medium`). O quadrante nunca é um select comum.

```text
urgente     = end_date <= hoje + 2 dias  (inclui atrasada)
importante  = importance in ('medium', 'high')
Q1 = urgente + importante      "Fazer agora"
Q2 = não urgente + importante  "Agendar"
Q3 = urgente + não importante  "Delegar"
Q4 = não urgente + não importante "Depois"
```

- `done` não tem prioridade efetiva; exibe `—`. Tarefas abertas sempre têm uma.
- `priority_override` (q1..q4) só pode ser escrito por manager/admin; autor do override e data ficam gravados. O valor efetivo é `override ?? calculado`; a UI mostra `manual` e o valor automático no detalhe.
- Limpar o override volta ao automático. Mudança de data/importância não apaga override.
- Limiares (2 e 7 dias) ficam em uma única função pura, testada com relógio injetado; não são configuração de banco.
- O `priority` devolvido pela API/export é o efetivo; `priority_source` é `auto|manual|none`.
- Ordenação: atrasadas → bloqueadas → Q1→Q4 → `end_date` → `updated_at`; concluídas no fim. Filtro “Precisam de atenção” = atrasadas + Q1 + bloqueadas.

### Tags

- Tags são globais no tenant e cruzam pastas; uma demanda pode ter até **8** tags.
- Nome: 1–30 caracteres, sem `#`; `trim`, espaços colapsados, comparação case-insensitive; `slug` kebab-case único.
- Qualquer usuário autenticado cria tags ao editar uma demanda; manager/admin renomeia/arquiva. Tag arquivada permanece nos itens existentes, mas não aparece no seletor.
- Anexar/remover tag gera evento `tags` com `{added, removed}`; renomear/arquivar gera `audit_logs`.
- Filtro `tag=slug` repetido usa **AND** (todas as tags). A busca textual inclui nome das tags.

## 3.4 SQLite

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

Uma conexão de escrita; transações curtas.

## 3.5 Seed

`scripts/seed.ts` cria apenas:

1. tenant `default`;
2. admin inicial (dev; produção usa `create-admin`);
3. uma pasta de exemplo vazia;
4. canal `general`.

Não criar tarefas/issues/mensagens de demonstração.

`meraki create-admin`:

```bash
meraki create-admin --email admin@empresa --name "Admin"
# senha temporária gerada e impressa uma vez
```

## 3.6 Schema TS e migrations

- `src/db/schema.ts` agrega só as tabelas acima.
- `scripts/migrate.ts`: migrations embutidas, checksum, up-only; falhar em divergência.
- `scripts/doctor.ts`: migrations, `integrity_check`, FKs, general, órfãos de anexos.
- `scripts/backup.ts`: backup online + `attachments`.

## Aceite

- [ ] `meraki migrate` em SQLite vazio cria o schema.
- [ ] FK/integrity/doctor passam.
- [ ] Seed cria tenant/admin/pasta/general.
- [ ] Tarefa e issue coexistem; `kind`/status/PO validados.
- [ ] Promoção issue→tarefa gera evento e mantém histórico.
- [ ] Um canal `demand` por item; um canvas por item.
- [ ] `demand_events`/`whiteboard_snapshots` são append-only.
- [ ] Tabelas de notificação/push criadas; endpoint hash único.
- [ ] Índice geral ordena por `updated_at`.

## Riscos

- **Status misto**: o banco permite união, mas o app precisa rejeitar combinação inválida (`issue` com `doing`, `task` com `open`).
- **PO em issue**: não permitir; só após promoção.
- **Histórico**: não usar `UPDATE`/`DELETE` em eventos; se corrigir, insira novo evento.
- **Canvas**: snapshots podem crescer; definir retenção (ex.: 1 por minuto + manual/export) sem perder o último.
