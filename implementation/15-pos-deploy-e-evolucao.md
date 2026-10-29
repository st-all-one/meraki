# 15 — Pós-deploy e evolução

**Objetivo:** usar o produto, medir atrito e decidir o próximo passo sem voltar à sobre-engenharia.

**Duração esperada:** contínuo; primeira revisão em 2 semanas.

## 15.1 Primeiras 2 semanas

- Todo o time usa a home **Minhas tarefas** e o board diariamente.
- Uma conversa por tarefa (não WhatsApp) para decisões.
- Chat Geral para ideias; canal de projeto para o projeto.
- Canvas usado em pelo menos uma tarefa com decisão visual.
- PWA instalada no celular; push ativado; inbox consultado.
- Admin revisa usuários/cargos; ninguém com admin desnecessário.

## 15.2 Medir sem analytics externo

Coletar manualmente/planilha:

| Pergunta | Como |
|---|---|
| Tempo para criar/organizar uma tarefa | cronômetro em 5 tarefas reais |
| Quantas tarefas ficam sem responsável/vencidas | consulta SQL/lista |
| Distribuição Q1–Q4 e overrides | contagem por prioridade/`priority_override` |
| Tags usadas para agrupar | contagem por tag e itens sem tag |
| Mensagens com Markdown vs texto | amostra de conversas |
| Anexos usados | contagem por tarefa |
| Canvas usado | contagem de tarefas com canvas |
| PWA/push | instalações, subscriptions ativas, notificações lidas |
| Erros/409/429 | logs do `journalctl` |
| Backup/restore | data do último teste |
| Mobile | uma pessoa usa só no celular por um dia |

## 15.3 Critérios para evoluir

| Necessidade | Gatilho | Custo/abordagem |
|---|---|---|
| Notificações | tarefas atribuídas são esquecidas | e-mail diário via cron ou inbox simples; não WebSocket |
| Labels | recorte transversal repetido | tabela + filtro |
| Views salvas | mesmos filtros recriados toda semana | tabela + URL salva |
| Canvas colaborativo | duas pessoas precisam editar ao mesmo tempo | já no MVP; evoluir para CRDT só com conflito real |
| Notificações por e-mail | push não é visto fora do app | SMTP/worker; não no MVP |
| Histórico de mensagens | auditoria de edição exigida | tabela de edições |
| Anexos avançados | antivírus/thumbnail | worker/decoder; não no MVP |
| API | CLI/integração real | token + endpoints; não antes |
| SSO/2FA | política da empresa | IdP; não no MVP |
| Multi-tenant | segunda empresa | workspace_id/RLS; reavaliar stack |

## 15.4 Não fazer sem gatilho

- SPA/React no shell.
- Redis, S3, worker, fila, OTel.
- DMs/canais privados no chat.
- Gantt, sprints, campos customizados, workflow configurável.
- RBAC com catálogo/codenames.
- Editor rico WYSIWYG; Markdown resolve.
- Notificações em tempo real no board.
- Colaboração multi-cursor no canvas.

## 15.5 Operação contínua

- Backup diário; restore mensal.
- `deno task check`/testes antes de cada deploy.
- Revisar dependências mensalmente (Deno, Excalidraw, Hono).
- Revisar acessos/cargos trimestralmente.
- Limpar anexos órfãos com `doctor --prune`.
- Monitorar disco e logs.

## 15.6 Dívida técnica conhecida

- Chat/canvas em um único processo; múltiplas instâncias exigem pub/sub.
- SSE em memória; reinício força reconexão.
- Canvas colaborativo em um processo; sem CRDT/undo distribuído; snapshots por amostragem.
- Sem e-mail/notificações.
- Sem busca FTS.
- Sem antivírus de anexo.
- Sem 2FA/SSO.

Nenhuma dessas dívidas bloqueia 10 pessoas; documente e só pague quando o uso doer.

## Aceite

- [ ] Time usando as telas principais por 2 semanas.
- [ ] Nenhum incidente de perda de dado.
- [ ] Backup/restore testado.
- [ ] PWA instalada e push útil (sem spam); subscriptions saudáveis.
- [ ] Lista de atritos priorizada por uso, não por “feature nova”.
- [ ] Próxima fase escolhida por gatilho, não por entusiasmo.
