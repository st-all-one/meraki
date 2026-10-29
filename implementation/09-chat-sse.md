# 09 — Chat em tempo real com SSE

**Objetivo:** chat de equipe e por projeto com Markdown, anexos, não lidos e atualização em tempo real — sem WebSocket.

**Duração esperada:** 3–4 dias.

## 9.1 Escopo

- Canais:
  - `general`: um por instância, criado no seed;
  - `project`: um por projeto, criado ao abrir/criar o projeto;
  - `demand`: um por demanda, criado na fase 08.
- Sem DMs, canais privados, threads, reações, presença, “digitando”, chamadas.
- Markdown + anexos reutilizados da fase 08/07.
- Mensagens editáveis/arquiváveis com permissão; sem delete duro.
- Não há notificação por e-mail.

## 9.2 UI

Desktop:

```text
┌──────────────┬───────────────────────────────────────────────┐
│ canais       │ mensagens (scroll)                            │
│ # Geral      │  autor • hora • Markdown • anexos             │
│ # Projeto X  │                                               │
│ # MER-42     ├───────────────────────────────────────────────┤
│              │ composer Markdown + anexo + Enviar            │
└──────────────┴───────────────────────────────────────────────┘
```

- Mobile: lista de canais → canal full; voltar; composer fixo.
- Canais `demand` não aparecem na lista geral de chat; são acessados pela demanda. A lista de chat mostra Geral + projetos; conversas de demanda são acessadas pela demanda.
- Badge de não lidos por canal; “marcar como lido” ao abrir/rolar até o fim.
- Mensagens do próprio usuário com leve destaque; sem bolha de mensageiro pessoal.
- Edição inline; “editado”; arquivada mostra “removida”.

## 9.3 Rotas

```text
GET  /chat                              lista de canais + geral
GET  /chat/channels/:id                 página do canal
GET  /chat/channels/:id/messages        partial de histórico (paginação)
GET  /chat/channels/:id/events          SSE
POST /chat/channels/:id/messages        enviar (multipart)
POST /messages/:id/edit                 editar
POST /messages/:id/archive              arquivar
POST /chat/channels/:id/read            marcar até a última mensagem
```

Todas: sessão + autorização do canal + `no-store`.
POST: CSRF + validação + rate limit.

## 9.4 SSE

### Servidor

- `hono/streaming` `streamSSE`.
- Broker em memória:

```ts
Map<channelId, Set<{ write(event): Promise<void>; close(): void }>>
```

- Um processo = um broker. Reinício = clientes reconectam e recuperam do SQLite.
- Ao conectar:
  1. autorizar o canal;
  2. registrar no broker;
  3. enviar `hello` com `lastEventId` do cliente;
  4. buscar mensagens após `Last-Event-ID` (ou últimas 50) e enviar;
  5. heartbeat a cada 15 s;
  6. remover no abort/erro.
- Headers:
  - `Content-Type: text/event-stream`;
  - `Cache-Control: no-store`;
  - `X-Accel-Buffering: no`;
  - `Connection: keep-alive`.
- Rechecar sessão a cada 60 s; se revogada, encerrar.
- Limite de conexões SSE por usuário (ex.: 5) e por canal (ex.: 20).

### Evento

```text
id: <message_id>
event: message
data: {"id":"...","html":"...","author":"...","created_at":"..."}
```

- `html` é o partial renderizado no servidor (Markdown seguro + anexos).
- `message.updated`, `message.archived` para edição/arquivamento.
- Nunca enviar HTML cru do cliente.

### Cliente

- `EventSource('/chat/channels/:id/events')`.
- Deduplicar por `id` (o POST também devolve o partial).
- Se `EventSource` falhar, mostrar “reconectando…” e tentar a cada 5 s.
- Ao reconectar, `Last-Event-ID` recupera o intervalo.
- Sem `innerHTML` de conteúdo não confiável; o HTML é do servidor, mas ainda passe por template seguro.

## 9.5 Envio

1. POST multipart com `body_md` + até 3 anexos.
2. Autorizar `create` no canal (demand: permissão na demanda).
3. Validar 1..10.000 caracteres (ou vazio + anexo).
4. Rate limit 30/min por usuário/canal.
5. Transação: mensagem + vínculos de anexos.
6. Renderizar partial; publicar no broker; responder partial.
7. Atualizar `chat_reads` do autor.

Se o broker falhar, a mensagem persiste; o cliente vê o partial da resposta e o histórico na próxima carga.

## 9.6 Não lidos

- `chat_reads.last_read_message_id`/`updated_at`.
- Ao abrir/rolar até o fim, POST `/read` com o último id visível.
- Badge = mensagens após `last_read_message_id` (ou todas, se null).
- Não usar “read receipt” por mensagem; é contador de canal.

## 9.7 Segurança e abuso

- Autorização em cada subscribe e POST; não confiar em `channel_id` do cliente.
- Canal `demand`: acesso derivado da demanda; canal `project`: projeto visível; general: todos.
- `no-store`; sem CORS; CSP `connect-src 'self'`.
- Limite de corpo/tamanho de frame; heartbeat; timeout de conexão ociosa (ex.: 10 min).
- Flood: 30 msg/min; 429; desconectar se repetir.
- Logs sem corpo/markdown.
- XSS: Markdown da fase 08; nunca renderizar HTML do cliente.

## 9.8 Testes

- Duas sessões no mesmo canal: A envia, B recebe <1 s.
- Reconexão com `Last-Event-ID` recupera mensagens perdidas.
- Sem sessão → 401/403; canal de outro projeto → 403.
- POST sem CSRF → 403.
- Rate limit → 429.
- Editar/arquivar reflete nos dois clientes.
- Anexo no chat aparece e baixa com auth.
- Broker limpa conexões no abort; sem vazamento.
- Conversa da demanda não aparece na lista de canais gerais.

## Aceite

- [ ] Geral e projeto funcionam; conversa da demanda.
- [ ] SSE entrega mensagens, edições e arquivamentos.
- [ ] Markdown e anexos renderizam corretamente.
- [ ] Não lidos e marcar como lido funcionam.
- [ ] Reconexão não perde nem duplica.
- [ ] Permissões/CSRF/rate limit testados.
- [ ] Sem WebSocket, sem Redis.

## Riscos

- **SSE e proxy**: Caddy precisa de `flush_interval -1`/sem buffering; testar.
- **Um processo**: múltiplas instâncias exigiriam pub/sub; não no MVP.
- **Deduplicação**: POST + SSE pode duplicar; use id.
- **Conexões abertas**: limite e timeout; monitorar.
