# ADR-036 — E-mail transacional: SMTP, fila e templates fechados

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito e implementado (2026-10-26) |
| **Data** | 2026-10-26 |
| **Relacionadas** | ADR-005, ADR-018, ADR-027, ADR-028 |

## Contexto

O serviço 06 (`implementaion/10-servicos/06-email-notificacoes.md`) precisa de um transporte
substituível, envio assíncrono e um consumidor real. O primeiro consumidor é a redefinição de senha
do módulo `identity`: token opaco, TTL curto, uso único e link same-origin.

Requisitos rígidos:

- nenhum request HTTP pode bloquear em SMTP;
- nenhum token, corpo ou destinatário em log;
- templates internos (o formulário público nunca fornece HTML/assunto);
- retry idempotente no worker;
- desenvolvimento/teste sem rede.

## Decisão

1. **Serviço headless** em `src/services/mail/` (`contract.ts`, `templates.ts`, `transport.ts`,
   `mail.ts`, `job.ts`, `service.ts`). O módulo consumidor enfileira `mail.send`; o serviço não
   importa módulos.
2. **SMTP com `nodemailer@7.0.11` (MIT-0)**. A versão é pinada em `deno.json`/`deno.lock`; o Deno
   executa o pacote via compatibilidade Node (`node:net`/`node:tls`). Não há cliente SMTP próprio
   (MIME, STARTTLS e auth são superfície grande demais para manter).
   - `MAIL_TRANSPORT=smtp` lê `SMTP_URL` (`smtp://`/`smtps://`), com timeout de conexão/saúde.
   - `MAIL_TRANSPORT=log` não abre socket; é o default em desenvolvimento/teste.
   - Produção falha no boot se o transporte não for `smtp`, se `MAIL_FROM` for o default ou se a URL
     não usar TLS.
3. **Template fechado**. O payload do job carrega `template` + `data`; cada template valida seus
   dados com Zod e gera assunto/texto/HTML internamente. O serviço recusa destinatário inválido,
   assunto com CRLF e URL que não seja da origem de `APP_URL`. Não há assunto/corpo arbitrário.
4. **Idempotência persistida**. `mail_deliveries` guarda `(tenant_id, idempotency_key)` com status
   `sent` e `message_id`. Antes de enviar, o serviço consulta a chave; depois de aceitar no SMTP,
   grava a linha. Retry normal não duplica. A janela crash-após-SMTP-antes-do-INSERT continua
   at-least-once (SMTP não oferece exactly-once); a chave no header `X-Somlos-Idempotency-Key`
   permite deduplicação futura no provedor.
5. **Fila**. `mail.send` é registrado pelo próprio serviço `mail` no worker (`somlos worker`), ao
   lado de `media.gc`. O produtor usa `jobs.enqueue(trx, …)` na mesma transação do token de reset.
   Sem worker, o job fica pendente; isso é visível e não finge entrega.
6. **Tokens de reset** vivem em `password_reset_tokens` (identity): BLAKE3 do token, TTL
   `PASSWORD_RESET_TTL_SECONDS` (30 min), uso único e invalidação dos anteriores. O token em claro
   só existe na URL enviada e no payload do job, nunca em log/auditoria.
7. **Mailpit** entra no Compose apenas no perfil `debug`, nas portas `50325` (SMTP) e `50326` (UI,
   loopback). Produção usa SMTP/relay real; templates têm texto e HTML; `MAIL_REPLY_TO` é validado.
8. **Logs** só carregam `template`, `status`, `transport` e `message_id`. O renderer de log já
   redige chaves com token/e-mail/senha; ainda assim o serviço não inclui destinatário/corpo.

## Consequências

- Envio é assíncrono e sobrevive a restart; falha de SMTP vira retry/backoff/dead-letter.
- A dependência nova fica restrita ao serviço `mail`; o kernel e os módulos não conhecem nodemailer.
- `mail_deliveries` cresce por envio; a retenção/limpeza é operacional (não há PII: só chave e
  template).
- Webhook de bounce/complaint e tabela de supressão continuam fora da primeira versão.
- Anexos ficam fora; mídia/PDF é entregue por link autorizado.

## Verificação

- Unitários: escape de HTML, URL same-origin, CRLF, destinatário inválido, transporte log sem rede.
- Integração: transporte fake, idempotência, falha→retry, job `mail.send` inválido não entrega,
  token de reset de uso único e revogação de sessões.
- E2E (Docker + Mailpit): pedido de reset chega ao Mailpit, link abre o formulário, axe/reflow.
- `deno task check`, `deno task test` e E2E com `E2E_MAILPIT_URL` verdes.

## Referências

- `src/services/mail/`, `src/modules/identity/http/routes.tsx`
- `src/services/jobs/`, ADR-027
- `nodemailer` 7.0.11 (MIT-0), Mailpit `v1.32.0`
