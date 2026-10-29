# ADR-005 — Mensageria por outbox transacional + polling controlado

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-003, ADR-013 |

## Contexto

PostgreSQL oferecia `LISTEN/NOTIFY`; SQLite não tem servidor nem pub/sub nativo. Precisamos manter
atomicidade entre a regra de negócio e a publicação do evento, sem broker externo. As opções eram a
extensão **Honker** (Rust, semântica de fila sobre `PRAGMA data_version`) ou **polling controlado**
em uma tabela de outbox.

## Decisão

1. Tabela `domain_events` é o **outbox**: a inserção acontece na mesma transação do caso de uso.
2. Worker local drena `processed_at IS NULL`, em ordem de `occurred_at`, lote de 50, intervalo
   configurável (`EVENTS_POLL_INTERVAL_MS`, padrão 250 ms).
3. Semântica **at-least-once**: handlers são idempotentes. Falha incrementa `attempts` e grava
   `last_error`; ao atingir 5 tentativas o evento é marcado como processado (dead-letter lógico) para
   não bloquear a fila.
4. `publish()` agenda um flush imediato; o polling periódico é a garantia. `bus.flush()` existe para
   testes e pós-commit.
5. O worker do **outbox** roda no processo da aplicação. A fila de **jobs** é diferente: fica
   dormente e, quando ativada, roda em worker separado (ADR-027), sem polling no main thread.
6. Honker permanece como upgrade documentado, condicionado a ADR e medição de latência.

## Por que não Honker agora

Honker é a evolução natural se a latência de evento se tornar requisito. Não foi adotado na fundação
por quatro motivos concretos:

1. **Não elimina polling, troca o intervalo.** O backend estável lê `PRAGMA data_version` a cada
   **1 ms** em uma thread watcher; nós lemos um índice parcial a cada 250 ms. Ganha-se latência
   (p50 de milissegundos) e despertar cross-process, mas o custo de um poller permanente continua.
2. **Artefato nativo por plataforma.** Honker é uma extensão SQLite (`libhonker_ext`) + bindings.
   Não há binding Deno; o caminho seria carregar a extensão no `node:sqlite`. O Deno expõe
   `loadExtension`, mas não o `enableLoadExtension` do Node — exige validação e distribuição do
   binário em Linux/macOS/Windows, dev e imagem Docker.
3. **Maturidade.** O próprio README se declara **alpha** (“better than experimental, not
   beta-quality yet”). A fundação prioriza uma dependência que não muda de contrato no próximo mês.
4. **Escala atual.** Um processo, um arquivo, volume baixo. A tabela `domain_events` já é o outbox
   durável, auditável e backupável; Honker adicionaria outro schema (`_honker_*`) ou substituiria
   este, sem ganho mensurável hoje.

**Gatilhos para adotar:** requisito de p95 < 50 ms, múltiplos processos/workers no mesmo arquivo,
ou necessidade de fila com visibility timeout/cron/prioridade que não se queira manter. Nesse caso:
ADR nova, spike com arquivo real (não `:memory:`), benchmark de latência e CPU ociosa, binário
pinado na imagem e migração do outbox.

## Justificativa (alternativas descartadas)

- **Honker agora** — descartada: extensão nativa/FFI, build e deploy mais complexos; o volume atual
  não exige latência sub-250 ms. Ver seção acima para os gatilhos.
- **Broker externo (RabbitMQ/Redis Streams)** — descartada: outra infraestrutura e consistência
  transacional perdida.
- **NOTIFY simulado em trigger** — descartada: trigger não acorda worker; efeitos externos em trigger
  são frágeis.
- **Fila em memória** — descartada: perde eventos no restart.

## Consequências

**Positivas**
- Zero dependência nativa; atomicidade real; observável por SQL (`processed_at`, `attempts`).
- O mesmo mecanismo funciona em teste e produção.

**Custos / negativas**
- Latência mínima de até um intervalo; polling periódico mesmo ocioso (uma query indexada).
- Um único drenador; múltiplas instâncias exigem coordenação.
- Sem entrega exatamente-uma-vez; handlers precisam ser idempotentes.

## Exemplo mínimo (comparativo)

```ts
// ❌ publica antes/depois da transação, perde evento se o processo cair
await insertOrder(order);
await fetch("http://broker/events", { method: "POST" });

// ✅ evento na mesma transação (outbox); worker local entrega
await db.transaction().execute(async (trx) => {
  await trx.insertInto("orders").values(order).execute();
  await bus.publish(trx, { name: "order.created", tenantId, payload: { order_id: order.id } });
});
```

## Verificação

Teste de integração publica um evento e aguarda a entrega; o banco mostra `processed_at` preenchido e
`attempts = 1`. O painel exibe a contagem de entregas da instância.

## Referências

- `src/services/events/events.ts`
- https://honker.dev/ (watcher de 1 ms e latência p50 de milissegundos)
- https://github.com/russellromney/honker (status alpha declarado no README)
