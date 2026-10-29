# ADR-027 — Jobs em worker separado, dormente por padrão

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (atualizado em 2026-10-26) |
| **Data** | 2026-10-25 |
| **Plano de origem** | Revisão tecnológica |
| **Relacionadas** | ADR-005, ADR-018 |

## Contexto

O service `jobs` existia e era iniciado por `services.start()` no processo HTTP. O worker fazia
polling a cada `JOBS_POLL_INTERVAL_MS`, mesmo sem nenhum produtor/handler real. Isso coloca trabalho
de fila no mesmo event loop que renderiza HTML e atende HTMX.

A fila continua sendo útil para trabalhos futuros (e-mail, mídia, exportação), mas não deve custar
nada enquanto não houver um caso de uso. O requisito é: **main thread focada em renderização e
interatividade; jobs em processo separado, ativados explicitamente.**

## Decisão

1. O service `jobs` continua descoberto e disponível (contrato e `enqueue` transacional), mas o
   manifesto **não declara `start`**. `services.start()` no processo HTTP não cria timer de jobs.
2. `JobQueue.start()` permanece a API do worker dedicado. Um processo separado deve:
   - abrir a conexão SQLite com o mesmo `DB_PATH` e `PRAGMA busy_timeout`;
   - resolver tenant e dependências;
   - registrar handlers idempotentes;
   - chamar `start()` e tratar `SIGTERM` com `stop()`.
3. O worker é um **segundo processo/systemd unit**, nunca uma segunda instância da aplicação HTTP.
   A lease é por papel em `process_locks`: `web` e `worker` coexistem no mesmo SQLite; dois processos
   do mesmo papel continuam proibidos. A antiga `instance_lock` fica apenas para compatibilidade
   up-only.
4. Handlers são registrados pelos módulos durante `createRuntime` (worker), não no `main.ts` da
   aplicação web. O comando é `somlos worker`; ele não monta HTTP nem inicia o outbox.
   O `enqueue` pode ser chamado de qualquer transação de módulo via `Executor<AppDatabase>`.
5. O comando `worker` existe, mas nenhum handler de produto é registrado enquanto não houver o
   primeiro caso de uso real; sem handlers, o processo não processa trabalho de domínio. Testes
   registram handlers descartáveis explicitamente. Nenhum job placeholder entra no runtime.
6. O outbox de eventos (`domain_events`) permanece no processo da aplicação porque é o mecanismo de
   consistência do domínio; a fila de jobs é o trabalho pesado que sai para o worker.

## Como implementar um job

```ts
// Runtime worker: módulos registram handlers no create; main só liga a fila.
const runtime = await createRuntime("worker");
const jobs = runtime.services.get<JobQueue>("jobs");
jobs.start();
```

O produtor enfileira na transação do caso de uso:

```ts
await jobs.enqueue(trx, {
  name: "media.generate_thumbnail",
  payload: { mediaId },
  uniqueKey: `thumb:${mediaId}`,
});
```

## Justificativa (alternativas descartadas)

- **Worker no processo HTTP** — descartado: polling e handlers competem com render/HTMX.
- **Cron externo chamando a app** — descartado: transforma HTTP em transporte de job e exige
  autenticação/endpoint extra.
- **Remover a fila** — descartado: o contrato e a tabela são pequenos e serão necessários; o custo
  atual é apenas código dormente.
- **Broker externo** — descartado: SQLite + outbox/lease já resolve o volume single-instance.

## Consequências

**Positivas**
- Main thread sem timer/worker de jobs.
- Falha de job não derruba o servidor HTTP.
- Ativação explícita, com limites e idempotência documentados.

**Custos / negativas**
- Há um segundo processo para operar quando jobs forem ativados.
- Handlers precisam ser registrados no worker; não há descoberta mágica de handlers.
- O operador deve garantir uma única instância do worker por arquivo SQLite.

## Verificação

- Teste de integração usa `jobs.runOnce()` e confirma retry/dead-letter.
- `services.start()` não inicia jobs; smoke verifica ausência de polling em repouso.
- `somlos doctor` mostra `jobsPending`/`jobsFailed` e as leases `web`/`worker`.
- `tests/integration/runtime_test.ts` verifica que web não inicia jobs/outbox, worker não inicia
  outbox, job executa no worker e shutdown libera a lease.

## Referências

- `src/services/jobs/service.ts`, `src/services/jobs/jobs.ts`
- `src/kernel/service.ts`, `src/main.ts`
- ADR-005, ADR-018
