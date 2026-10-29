# 06 — Demandas e visões

**Objetivo:** entregar o índice geral de demandas, tarefas oficiais, issues sugeridas, pastas e as visões de lista/quadro/calendário.

**Duração esperada:** 5–7 dias.

## 6.1 Modelo de produto

- `items.kind = task` → **tarefa oficial**.
- `items.kind = issue` → **issue/sugestão**.
- Pasta (`projects`) agrupa tarefas e issues.
- Índice `/demands` mostra **todas** as demandas; é a home.
- Tarefa tem `po_id`, `start_date`, `end_date`, `assignee_id`, `importance` e prioridade Eisenhower calculada; issue não tem PO/datas até ser promovida.
- Manager/admin criam tarefa, arquivam/restauram tarefa e definem PO; todos criam issue e editam demandas existentes.
- Issue pode ser promovida a tarefa por manager/admin; o histórico permanece.
- Tags são globais no tenant, atravessam pastas e servem para agrupar/filtrar ideias.

## 6.2 Rotas

```text
GET  /demands                           índice geral (home)
GET  /my                                Minhas tarefas
GET  /projects                          pastas
GET  /projects/:key                     lista de demandas da pasta
GET  /projects/:key/board               quadro (tarefas)
GET  /projects/:key/calendar            calendário (tarefas por início/fim)
GET  /items/:id                         detalhe da demanda
POST /projects                          criar pasta (admin)
POST /projects/:key                     editar/arquivar pasta (admin)
POST /items                             criar tarefa (admin/manager) ou issue (todos)
POST /items/:id                         editar campos (inclui tags)
POST /items/:id/status                  mover status
POST /items/:id/archive                 arquivar (regra por kind)
POST /items/:id/restore                 restaurar
POST /items/:id/promote                 issue → tarefa (admin/manager)
POST /items/:id/po                      definir PO (admin/manager, só task)
POST /items/:id/priority                override/limpar prioridade (admin/manager, só task)
GET  /admin/tags                        renomear/arquivar tags (admin/manager)
POST /admin/tags/:id                    renomear/arquivar tag (admin/manager)
GET  /demands/export.csv                índice filtrado
GET  /items/:id/export.md               demanda + conversa/anexos
GET  /search?q=                         busca
```

Toda mutação: sessão → CSRF → carregar com `tenant_id` → autorizar → validar → transação → `demand_events`.

## 6.3 Índice geral `/demands`

É a tela mais importante.

Colunas desktop:

```text
Tipo | ID | Título | Pasta | Status | PO | Responsável | Início → Fim | Prioridade | Tags
```

- Tipo: badge **Tarefa** ou **Issue**; issue com cor mais neutra.
- Filtros: tipo (task/issue), status, pasta, PO, responsável, tag (repetível, AND), prioridade (q1..q4), “Prontas”, “Precisam de atenção”, texto.
- **Prontas** (`?ready=1`): `kind=task`, `status != done`, `blocked=0`, `start_date <= hoje`; derivado na query, sem coluna.
- Ordenação padrão: atrasadas → bloqueadas → Q1→Q4 → fim → atualização; concluídas no fim.
- Prioridade é badge textual: `Q1 · Fazer agora`, `Q2 · Agendar`, `Q3 · Delegar`, `Q4 · Depois`; `manual` quando há override; `—` em concluídas/issues.
- Tags aparecem como chips; mobile mostra no máximo 3 + `+N`.
- Contadores no topo: tarefas abertas, issues abertas, atrasadas, bloqueadas, Q1.
- “Atualizar” manual + opcional `hx-trigger="every 60s"` nos contadores/lista; sem WebSocket.
- URL contém todos os filtros; compartilhável.
- Mobile: cards; tipo/status/período/prioridade/tags visíveis; filtros em drawer.
- Todos os cargos veem o índice; exportar é permitido a todos.
- Issues não têm PO/datas; coluna mostra “—”; tarefa sem PO mostra “Sem PO”.

## 6.4 Criar/editar

- Botão **Nova issue** para todos; **Nova tarefa** só admin/manager.
- Formulário de tarefa: pasta, título, descrição Markdown, status, **início**, **fim**, **responsável**, **importância**, PO, **tags**, anexos.
- `início`, `fim` e `responsável` são obrigatórios na tarefa; `início ≤ fim`; erro no campo, sem salvar parcial.
- A prioridade não é um select no formulário: mostra “calculada ao salvar” com a regra Q1–Q4.
- Formulário de issue: pasta, título, descrição, importância, tags, anexos; status inicial `open`; sem datas/responsável/PO/prioridade.
- Developer não vê “Nova tarefa”; se tentar POST, 403.
- Edição de tarefa: todos os cargos (conteúdo/status/assignee/início/fim/importância/tags); PO e override de prioridade só manager/admin.
- Edição de issue: todos; PO/datas não aparecem; promoção só manager/admin.
- Manager/admin: arquivar/restaurar tarefa; autor/admin: arquivar/restaurar issue.
- Mudança de `kind` só via promotor; não editar `kind` no formulário.
- Tag input: texto com autocomplete; vírgula/Enter confirma; cria tag inexistente; máximo 8; normaliza nome e detecta duplicata case-insensitive.
- Override: manager/admin escolhe Q1–Q4 no detalhe e pode “Voltar ao automático”; motivo é opcional e auditado.

## 6.5 Promoção de issue

- Ação “Promover a tarefa” na issue (manager/admin).
- Confirmação; escolher pasta (padrão da issue), PO (opcional), **início**, **fim** e **responsável** obrigatórios.
- Transação:
  - `kind='task'`, `status='backlog'`, `promoted_at/by`;
  - `po_id` definido ou null; datas/assignee preenchidos;
  - evento `promoted` com `from=issue`, `to=task`, metadata;
  - issue deixa de aparecer como sugestão e passa a tarefa oficial.
- A prioridade passa a ser calculada na promoção; tags são preservadas.
- Conversa, anexos e canvas permanecem ligados à mesma demanda.
- Não criar uma segunda tarefa.

## 6.6 Lista da pasta

- Inclui tarefas e issues; filtro de tipo.
- Colunas: Tipo, ID, Título, Status, PO, Responsável, Início → Fim, Prioridade, Tags.
- Edição inline de status/assignee; PO select só manager/admin e só task; datas/importância/tags no inspector.
- Agrupamento por status opcional.
- Paginação 50.
- Mobile: cards com período, prioridade e até 3 tags.

## 6.7 Quadro

- **Somente tarefas oficiais**; issues ficam no índice/lista.
- 5 colunas: Backlog, A fazer, Em andamento, Em revisão, Concluído.
- Card: ID, título, PO, responsável, início→fim, prioridade, tags, bloqueado.
- Prioridade é calculada; card mostra Q1–Q4 e badge `manual` quando aplicável.
- Drag muda somente status; menu “Mover para” acessível.
- Coluna concluída comprimida; limite 100 cards/coluna.
- Mobile: scroll horizontal com snap.

## 6.8 Calendário

- Tarefas com `start_date`/`end_date`; barra do início ao fim, inclusive.
- Issues não aparecem (sem datas); tasks sem datas são impossíveis por validação.
- Mês + agenda do dia; clique abre tarefa.
- Somente leitura; sem drag de data.
- Tarefa atrasada/hoje destacada por texto + cor, não só cor.

## 6.9 Minhas tarefas

- Tarefas em que sou assignee ou PO.
- Seções: Atrasadas, Hoje, Próximos 7 dias, Depois, Concluídas recentemente.
- Cada linha mostra status, fim, prioridade Q1–Q4, tags e bloqueio.
- Issues atribuídas? Não no MVP; issues são sugestões sem responsável.
- Atalho para `/demands`.

## 6.10 Detalhe da demanda

```text
breadcrumb
tipo (Tarefa/Issue) | ID | título editável
status | responsável | PO (task) | início → fim | prioridade (auto/manual)
importância | tags
descrição Markdown
abas: Conversa | Anexos | Canvas | Histórico
```

- Tarefa: PO editável por manager/admin; prioridade somente leitura para developer.
- Manager/admin: override de prioridade no menu “Prioridade”, com “Voltar ao automático” e motivo opcional.
- Detalhe mostra “Automática: Q2” quando há override manual.
- Issue: botão “Promover a tarefa” para manager/admin; sem PO/datas/prioridade.
- Tags editáveis por todos; chips com link para `/demands?tag=slug`.
- Aba **Conversa**: canal `demand` (fase 08).
- Aba **Anexos** (fase 07).
- Aba **Canvas** (fase 10).
- Aba **Histórico**: `demand_events` cronológico; autor, tipo, de/para.
- Desktop: inspector; mobile: full-screen.

## 6.11 Histórico e análise futura

- Toda mudança gera `demand_events` append-only com `from`/`to`/metadata.
- Não sobrescrever histórico; edições de descrição geram evento.
- Eventos de início/fim, importância, override/limpeza de prioridade, tags, promoção, PO, archive/restore, anexo, canvas.
- O evento de prioridade guarda `source`, `override`, `calculated` e motivo.
- Dados suficientes para, no futuro, medir tempo em status, throughput, aging, distribuição Q1–Q4, uso de tags, issues aceitas, PO/assignee.

## 6.12 Exportação

- CSV do índice/lista: Tipo, ID, Título, Pasta, Status, PO, Responsável, Início, Fim, Importância, Prioridade, Origem da prioridade, Tags, Bloqueado, Atualizado.
- Tags no CSV em uma coluna, separadas por `;`; prioridade como `Q1`–`Q4`.
- Markdown da demanda: campos, descrição, histórico e conversa; anexos como links auth.
- CSV injection: prefixar `= + - @` com `'`.
- Todos os cargos exportam o que podem ver.

## 6.13 Testes

- Developer cria issue; POST de task → 403.
- Manager cria/arquiva tarefa; define PO; não gerencia usuários/pastas.
- Admin gerencia pastas/usuários.
- Issue autor arquiva; outro developer não; manager não (a menos que autor).
- Promoção mantém ID/conversa/anexos/canvas e cria evento.
- Tarefa sem início, fim ou responsável → 422; início > fim → 422.
- Cálculo Q1–Q4 com relógio fixo: atrasada; `hoje+2`; `hoje+3`; importância low/medium/high; concluída sem prioridade.
- Override por manager/admin; developer → 403; “voltar ao automático” limpa; detalhe mostra automática + manual.
- Índice filter/kind/status/PO/tag/priority/ready; contadores; ordenação Q1→Q4.
- `ready=1` exclui bloqueada, concluída e `start_date > hoje`; não exige dependência.
- Board só tasks; calendário só tasks com intervalo; Minhas tarefas.
- Tags: normalização, duplicata case-insensitive, máximo 8, criar/anexar/remover, filtro AND, renomear/arquivar, XSS no nome.
- 409 de versão; eventos de data/importância/prioridade/tags.
- CSV/Markdown; permissões; mobile.

## Aceite

- [ ] `/demands` é a home e mostra tarefas + issues.
- [ ] Developer não vê/cria tarefa; cria issue.
- [ ] Manager cria/arquiva tarefa e define PO; nada além disso.
- [ ] Tarefa exige início, fim e responsável.
- [ ] Prioridade Q1–Q4 calculada por fim + importância; override de manager/admin.
- [ ] Tags criadas, filtradas (AND) e exibidas no índice/board/detalhe.
- [ ] Filtro “Prontas” usa início/blocked/status, sem coluna nova.
- [ ] Issue promovida vira tarefa sem perder histórico/conversa/anexos/canvas.
- [ ] Lista/board/calendário/Minhas tarefas.
- [ ] Histórico append-only.
- [ ] Export CSV/Markdown.
- [ ] Mobile/desktop.

## Riscos

- **Board com issues**: não; board é oficial.
- **PO em issue**: só após promoção.
- **Manager com poder extra**: revisar rotas; não dar gestão de pasta/usuário.
- **Prioridade “sumir”**: é calculada na leitura; nunca gravar valor automático no banco.
- **Override esquecido**: sempre mostrar `manual` + valor automático e oferecer “voltar ao automático”.
- **Tags duplicadas**: normalizar slug/nome antes de inserir; limite por item.
- **Histórico perdido**: eventos na mesma transação; nunca update/delete.
- **Índice lento**: índices por kind/status/end_date; paginação.
