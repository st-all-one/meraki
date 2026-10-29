# 04 — Auth, cargos e permissões

**Objetivo:** login sólido, três cargos e quatro ações, com a regra explícita: **manager só se diferencia de developer por criar/arquivar tarefa, definir PO, sobrepor prioridade e gerenciar tags**; admin gerencia usuários e pastas.

**Duração esperada:** 1–2 dias.

## 4.1 Modelo

`users.role`:

```text
admin | manager | developer
```

Adicione em `users` (migration nova):

- `must_change_password` 0/1 default 1 para usuário criado por admin;
- `password_changed_at` text;
- `active` já existe; usuário bloqueado não loga e tem sessões revogadas.

Ações:

```text
create | edit | archive | export
```

Não crie `roles`, `permissions`, `user_roles` ou codenames. A regra é função pequena e testável.

## 4.2 Matriz

| Recurso / ação | Admin | Manager | Developer |
|---|---|---|---|
| Usuários: criar, bloquear, definir manager | sim | — | — |
| Pasta/projeto: criar/editar/arquivar | sim | — | — |
| Pasta/projeto: ver/exportar | sim | sim | sim |
| Índice de demandas: ver/exportar | sim | sim | sim |
| Tarefa: criar | sim | **sim** | **não** |
| Tarefa: editar conteúdo/status/assignee | sim | sim | sim |
| Tarefa: arquivar/restaurar | sim | **sim** | **não** |
| Tarefa: definir `po_id` | sim | **sim** | **não** |
| Tarefa: override/limpar prioridade | sim | **sim** | **não** |
| Tags: criar/anexar/remover | sim | sim | sim |
| Tags: renomear/arquivar | sim | **sim** | **não** |
| Issue: criar | sim | sim | sim |
| Issue: editar | sim | sim | sim |
| Issue: arquivar/restaurar | qualquer | autor | autor |
| Issue: promover a tarefa | sim | **sim** | **não** |
| Conversa/anexos: criar | sim | sim | sim |
| Conversa/anexos: editar/arquivar | qualquer | autor | autor |
| Canvas: abrir/editar | sim | sim | sim |
| Canvas: exportar | sim | sim | sim |
| Exportar index/lista/board/calendário | sim | sim | sim |

Regras:

- Manager **não** gerencia usuários, pastas/projetos, chat de terceiros, tarefas de terceiros além do permitido, nem permissões.
- Developer **não** cria/arquiva tarefas, não define PO, não sobrescreve prioridade, não promove issue e não renomeia/arquiva tags.
- Developer pode criar e editar issues; arquivar/restaurar apenas as próprias.
- Todos editam tarefas existentes (status, assignee, início/fim, importância, tags, título/descrição), mas a criação/arquivamento é manager/admin.
- `po_id` só em tarefa; qualquer usuário ativo pode ser PO.
- Qualquer usuário cria/anexa tags; renomear/arquivar é manager/admin.
- Override de prioridade exige manager/admin e grava autor/data; developer recebe 403.
- Admin não pode bloquear o último admin nem se autobloquear.
- Sem signup público; admin cria usuários com senha temporária.

## 4.3 Implementação

Crie `src/kernel/authz.ts` (ou no domínio de identity):

```ts
type Action = "create" | "edit" | "archive" | "export";
type Role = "admin" | "manager" | "developer";
type Resource = "project" | "demand" | "message" | "attachment" | "canvas" | "user";

function can(
  actor: { id: string; role: Role },
  action: Action,
  resource: Resource,
  context?: {
    kind?: "task" | "issue";
    ownerId?: string | null;
    assigneeId?: string | null;
    poId?: string | null;
  },
): boolean;
```

Regras:

- `admin`: tudo; além disso, `user` e `project` são exclusivos.
- `manager`:
  - `create`/`archive` em `demand` com `kind=task`: true;
  - `edit` em `demand`: true (como developer);
  - `create`/`edit`/`archive` em `demand` com `kind=issue`: como autor (create true; edit true; archive só autor);
  - `override_priority` em task: true;
  - `rename`/`archive` de `tag`: true;
  - `project`/`user`: false;
  - `message`/`attachment`: create/edit true; archive só autor;
  - `canvas`: tudo;
  - `export`: true.
- `developer`:
  - `create` em `demand` somente `kind=issue`;
  - `edit` em `demand` (task/issue): true;
  - `archive` em `demand` somente issue própria;
  - `create`/`edit` em `message`/`attachment`: true; archive só própria;
  - `canvas`: abrir/editar/exportar;
  - `export`: true;
  - `create`/`attach`/`detach` de `tag`: true; rename/archive: false;
  - `override_priority`: false;
  - `project`/`user`: false.
- `po_id` é campo de tarefa; só manager/admin alteram.
- `priority_override` é campo de tarefa; só manager/admin alteram/limpam.
- Tags são globais; qualquer usuário cria/anexa, manager/admin renomeia/arquiva.

Helpers:

```ts
requireLogin(c);
requireRole(c, ["admin"]);
requireCan(c, "create", "demand", { kind: "task" });
requireCan(c, "archive", "demand", { kind: "task" });
requireCan(c, "archive", "demand", { kind: "issue", ownerId: item.created_by });
```

Toda rota mutante:

1. sessão;
2. CSRF/origin;
3. carregar recurso com `tenant_id`;
4. autorizar;
5. validar;
6. transação;
7. evento/atividade.

## 4.4 Login e sessão

- Mantenha Argon2id, decoy hash, erro genérico e auditoria do Somlos.
- Sessão opaca 256 bits; banco guarda `blake3`; cookie `HttpOnly; Secure; SameSite=Lax; Path=/`.
- TTL 7 dias; `last_seen_at` a cada 5 min; logout revoga.
- Rate limit: 5/min por hash(`email|ip`), em memória.
- Sem signup/reset por e-mail/JWT de API.
- Senha mínima 12; admin cria com senha temporária e `must_change_password=1`.
- Troca de senha revoga outras sessões.

## 4.5 Admin de usuários

Rotas (todas `admin`):

```text
GET  /admin/users                 lista (nome, e-mail, cargo, ativo)
GET  /admin/users/new             formulário
POST /admin/users                 cria + senha temporária
GET  /admin/users/:id             editar cargo/ativo
POST /admin/users/:id             salvar (role manager/developer, active)
POST /admin/users/:id/block       bloquear + revogar sessões
POST /admin/users/:id/unblock     desbloquear
POST /admin/users/:id/password    redefine senha temporária
```

Regras:

- “Definir se é gerente” = trocar `role` entre `manager` e `developer`.
- Não permitir que o último admin ativo seja bloqueado/rebaixado.
- Não permitir auto-bloqueio.
- Senha temporária exibida uma vez; não logar.
- Usuário bloqueado não loga; sessões revogadas.
- Não mostrar hash.

## 4.6 Pastas/projetos

- Admin cria/edita/arquiva pastas; manager/developer apenas veem/exportam.
- A pasta agrupa tarefas e issues; não há ACL por pasta no MVP.
- Renomear “Projeto” na UI para **“Pasta”** quando o contexto for agrupamento; mantenha `projects` no banco.

## 4.7 UX

- Login mobile-first; sem “esqueci a senha”.
- Admin: tabela simples, botão “Tornar manager/developer”, bloquear com confirmação.
- Novo usuário: senha temporária + aviso para trocar no primeiro login.
- Menu de conta: trocar senha, sair.
- Botão “Nova tarefa” só para admin/manager; “Nova issue” para todos.

## 4.8 Testes

- Matriz completa por cargo × ação × recurso × kind × ownership.
- Developer não cria/arquiva tarefa, não define PO, não sobrescreve prioridade e não renomeia tag; cria issue.
- Manager não gerencia usuários/pastas; cria/arquiva tarefa, define PO, sobrescreve prioridade e gerencia tags.
- Issue: autor arquiva; outro developer não; manager/admin conforme matriz.
- Admin bloqueia usuário → login falha e sessão revogada.
- Último admin protegido; auto-bloqueio proibido.
- CSRF, IDOR, sessão expirada.
- `must_change_password` redireciona.

## Aceite

- [ ] Três cargos no banco/UI.
- [ ] Manager só tem os privilégios extras definidos na matriz.
- [ ] Developer cria issue e não cria tarefa; não sobrescreve prioridade; não renomeia tag.
- [ ] Admin cria/bloqueia/desbloqueia e define manager/developer.
- [ ] PO e override de prioridade só em tarefa, alteráveis por manager/admin.
- [ ] Pastas só admin gerencia.
- [ ] Matriz testada; servidor é a defesa.
- [ ] Último admin/auto-bloqueio protegidos.

## Riscos

- **Manager com privilégio a mais**: qualquer exceção além de task create/archive/PO/override/tags deve ser removida.
- **Developer editando tarefa**: é intencional; audite e mantenha histórico.
- **Issue arquivada por terceiro**: bloqueie; só autor/admin.
- **PO inexistente/inativo**: validar usuário ativo; se bloquear, manter o id e sinalizar.
