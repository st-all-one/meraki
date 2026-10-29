# 13 — Testes e aceitação

**Objetivo:** provar os fluxos críticos e impedir regressão de permissão, CSRF, Markdown, anexos, SSE, canvas colaborativo e histórico antes do deploy.

**Duração esperada:** 3–4 dias.

## 13.1 Pirâmide

| Camada | O que cobre | Ferramenta |
|---|---|---|
| Unit | validação, markdown, permissões, path, quotas, datas | `Deno.test` |
| HTTP | rotas, auth, CSRF, 409, upload, SSE, export | `Deno.test` + server in-process |
| E2E | fluxo desktop/mobile, dois usuários no chat/canvas | Playwright |
| Manual | a11y, restore, Caddy/SSE/WS, mobile físico | checklist |

## 13.2 Banco de teste

- SQLite temporário por arquivo/suíte (`mkdtemp`), nunca `data/meraki.sqlite3`.
- Migrations no `beforeAll`; seed mínimo; cleanup no `afterAll`.
- Sem `isolate:false` compartilhando estado; sem ordem dependente.
- `DB_PATH`/`DATA_PATH` isolados; uploads em temp.
- SSE/WS em porta efêmera.

## 13.3 Matriz de testes

### Auth/permissões

- Login válido/inválido/bloqueado; rate limit; logout; sessão expirada.
- CSRF form/JSON cross-origin → 403; same-origin → ok.
- Admin cria/bloqueia/desbloqueia usuário; define manager/developer; último admin/auto-bloqueio protegidos.
- Manager cria/arquiva tarefa, define PO e faz override de prioridade; **não** gerencia usuário/pasta.
- Developer cria issue; POST task → 403; não arquiva task; não define PO; não promove issue; não faz override; não renomeia tag.
- Developer edita tarefa existente (status/assignee/título/descrição) — intencional.
- Issue: autor arquiva; outro developer não; manager só se autor; admin qualquer.
- IDOR: item/anexo/mensagem/canal/canvas de outra pasta/tenant → 403/404.

### Demandas

- Índice `/demands` mostra task + issue; filtros kind/status/pasta/PO/assignee/tag/priority/ready; contadores.
- `ready=1`: inclui start<=hoje, exclui blocked/done/futuras; não cria coluna.
- Criar tarefa incrementa `seq`; criar issue também; concorrência não duplica.
- Tarefa exige `start_date`, `end_date`, `assignee_id`; `start_date > end_date` → 422.
- Prioridade com relógio fixo: atrasada, `hoje+2`, `hoje+3`, `hoje+7`, `hoje+8`; low/medium/high; done → `—`.
- Override manager/admin; developer 403; limpar volta ao automático; detalhe mostra auto + manual.
- Tags: normalização/duplicata case-insensitive; máximo 8; criar/anexar/remover; filtro AND; renomear/arquivar; XSS.
- Status válido por kind: task backlog/todo/doing/review/done; issue open/accepted/rejected.
- Promover issue → task: exige datas/assignee; mantém id, tags, conversa, anexos, canvas; gera evento; não duplica.
- PO só task; manager/admin; usuário ativo.
- Arquivar/restaurar task (manager/admin) e issue (autor/admin).
- Update com versão antiga → 409.
- Histórico `demand_events` append-only.
- Export CSV/Markdown; CSV injection.
- Board só tasks; calendar tasks com início/fim; Minhas tarefas.

### Markdown/conversa

- Markdown básico, tabela, código, link, checkbox.
- XSS: HTML cru, `javascript:`, `data:`, imagem Markdown, atributo.
- Preview e render final seguros e equivalentes.
- Editar/arquivar própria mensagem; alheia → 403; admin qualquer.
- Anexo no composer; falha não cria mensagem.
- Canal `demand` único por demanda.
- Issue e task compartilham o mesmo comportamento.

### Chat/SSE

- Duas sessões: mensagem chega <1 s.
- Reconexão com `Last-Event-ID` sem perder/duplicar.
- Sem auth/acesso → 401/403.
- Rate limit → 429.
- Edição/arquivamento refletem.
- Broker limpa conexões.
- Canais demand não aparecem na lista Geral/projetos.

### Anexos

- PNG/JPEG/PDF; SVG/HTML/ZIP/MIME falso rejeitados.
- Re-encode remove EXIF; limite de pixels.
- Download auth; path traversal; dedupe; quota.
- Doctor/prune; backup/restore.

### Canvas colaborativo

- Dois contextos: ambos editam; veem elementos e cursores; nomes/cores identificados.
- Admin/manager/developer com acesso abrem e editam; sem acesso → 403.
- Modal full-screen; foco; `Esc`; mobile.
- Persister salva; se sair, promove outro; recarregar mantém.
- Snapshots/sessões append-only.
- Upload de imagem; peer recebe; recarregar mantém.
- Export `.excalidraw`/PNG/SVG; anexo; download auth.
- CSP do shell estrita; frame com allowances; WS origin; sem domínio externo.
- Reconexão/limite de mensagens.

### PWA e notificações

- Manifest válido; ícones; `start_url`; install prompt (Chrome).
- SW registra; offline.html sem rede; HTML autenticado/anexos/chat/canvas **não** no Cache Storage.
- Push: permissão negada/concedida; subscription salva; push com app fechado; click same-origin.
- `pushsubscriptionchange`; 404/410 desativa; preferências on/off.
- Auto-atribuição não notifica; mensagem de demanda notifica seguidores; Geral/projeto não gera push.
- iOS: instrução de instalar; teste manual em PWA instalada.
- Endpoint inválido/SSRF rejeitado; VAPID privada fora do repo.

### Segurança

- Headers/CSP; `no-store`; sem CORS `*`.
- Logs sem corpo/segredo/endpoint.
- Upload/SSE/WS/JSON limits.
- Dependências/lockfile.

## 13.4 E2E (Playwright)

1. Admin login → criar pasta → criar usuário manager/developer → bloquear/desbloquear.
2. Manager login → criar tarefa com início/fim/responsável, definir PO, ver Q calculado, override, arquivar/restaurar.
3. Developer login → criar issue com tags; não vê “Nova tarefa”; promover (manager, com datas/assignee) → vira task.
4. Índice `/demands`: filtros kind/status/PO/tag/priority; contadores; mobile cards com período/Q/tags.
5. Lista/board/calendário; drag e menu; atividade.
6. Demanda: conversa Markdown + anexo; recarregar; editar.
7. Chat Geral: duas abas; A envia, B recebe; reconectar; anexo.
8. Canvas: abrir modal; duas abas editam ao mesmo tempo; presença; recarregar; exportar; ver em Anexos.
9. Mobile 390×844: bottom nav, cards, detalhe, composer, canvas modal.
10. PWA: instalar; offline; inbox; push de teste; click.
11. CSP/rede: nenhuma request externa.

Use `storageState` por cargo; não dependa de ordem.

## 13.5 Acessibilidade

- Teclado: login, criar issue, mover status, abrir conversa, enviar, anexar, canvas (controles Excalidraw).
- Foco visível; `Esc` fecha; retorno de foco.
- `aria-live` para salvar/erro/nova mensagem.
- Contraste AA; labels; tabela semântica.
- Teste manual com leitor de tela; axe se disponível.

## 13.6 Performance

- Índice 2.000 demandas paginado 50: <300 ms local.
- Board 5×100 tasks: sem travar.
- Chat 50 mensagens; SSE sem reload.
- Canvas 10 participantes/2.000 elementos: aceitável; medir.
- Upload 10 MB: progresso/timeout.
- Sem N+1 evidente; índices por kind/status/updated_at.

## 13.7 Backup/restore

- Criar pasta, task, issue, conversa, anexo, canvas e snapshot.
- `meraki backup`; apagar `DATA_PATH`; `meraki restore`; validar.
- `doctor` após restore.
- Migration pendente falha com mensagem clara.

## 13.8 Comandos

```bash
cd app
deno task check
deno task test
deno task build:bin
cd e2e && npm ci && npx playwright test
```

Servidor E2E com `DATA_PATH` temp, `APP_ENV=test`.

## Aceite

- [ ] Unit + HTTP verdes.
- [ ] E2E desktop/mobile verdes.
- [ ] Matriz de cargos/CSRF coberta.
- [ ] Developer não cria/arquiva task; cria issue.
- [ ] Manager só tem task create/archive/PO/override/tags a mais.
- [ ] Tarefa sem datas/assignee e início > fim rejeitados; Q1–Q4 com relógio fixo.
- [ ] Tags com normalização/limite/filtro AND e permissões.
- [ ] Promoção de issue preserva tudo e exige datas/assignee.
- [ ] XSS/upload/path/IDOR cobertos.
- [ ] Canvas colaborativo com dois usuários.
- [ ] Backup/restore.
- [ ] PWA instalável/offline; push/browser/celular; nenhum dado autenticado no cache.
- [ ] Sem request externa.

## Riscos

- **Testes de integração compartilhando banco**: use temp por suíte.
- **E2E frágil**: `data-testid` estáveis.
- **SSE/WS**: porta efêmera, timeout generoso.
- **Canvas**: teste smoke de colaboração, não cada ferramenta.
- **Push**: depende do navegador/SO; teste manual além do mock.
