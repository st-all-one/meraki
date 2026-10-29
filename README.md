# Meraki

Índice de demandas para um time pequeno: tarefas oficiais, issues sugeridas, pastas, tags,
conversas Markdown, anexos, canvas colaborativo, PWA e push. Derivado do Somlos, com escopo cortado
(sem CMS, e-mail, worker, Valkey/RustFS, OTel ou SPA).

## Stack

| Aspecto | Decisão |
| --- | --- |
| Runtime | Deno 2.9 / TypeScript |
| HTTP | Hono + JSX SSR + HTMX |
| Banco | SQLite WAL via `node:sqlite`, migrations up-only |
| Storage | disco local no volume `data/` (SQLite + WAL + anexos) |
| Borda | Caddy (HTTP local em dev; TLS no LB em produção) |
| Operação | Docker Compose + Makefile; sem systemd |
| UI | CSS próprio, mobile-first, sem CDN/fonte externa |
| Tempo real | SSE no chat; WebSocket no canvas |

## Subir

Único ponto de configuração: **`.env` na raiz**.

```bash
cp .env.example .env
# edite DEV_APP_URL/PROD_APP_URL e VAPID_* se necessário
make dev
```

- URL dev: <http://localhost:50380>
- Login seed: `admin@meraki.local` / `troque-esta-senha`
- Dados no host: `./data/meraki.sqlite3` + `./data/attachments/`
- O container roda como seu UID/GID; `data/` fica `0700` e os arquivos `0600`.

Produção (TLS terminado no LB externo):

```bash
# .env: ajuste PROD_APP_URL e EDGE_BIND
make prod
```

`make prod` usa `compose.prod.yaml`: `APP_ENV=production`, sem seed, `PROD_APP_URL` obrigatório e
Caddy preservando `X-Forwarded-*` do LB. Para LB externo, publique a borda com
`EDGE_BIND=0.0.0.0` e restrinja no firewall; o padrão é `127.0.0.1:50380`.

## Comandos

| Comando | Efeito |
| --- | --- |
| `make dev` | build + app + Caddy em desenvolvimento, com migrate/seed no boot |
| `make prod` | build + app + Caddy com `APP_ENV=production` |
| `make down` | derruba containers; preserva `data/` |
| `make logs` | logs de app + Caddy |
| `make ps` | estado dos containers |
| `make shell` | shell no container da app |
| `make migrate` | aplica migrations no volume |
| `make seed` | aplica seed de demonstração |
| `make admin EMAIL=... [NAME=...]` | cria admin com senha temporária |
| `make backup` | SQLite online + WAL + anexos em `data/backups/` |
| `make doctor` | integridade, FKs e migrations |
| `make restore BACKUP=meraki-... [MODE=prod]` | para a app, restaura e sobe no modo escolhido |
| `make reset` | **destrutivo**: apaga o SQLite e recria schema |
| `make check` / `make test` | fmt/lint/types/gates e testes (host, requer Deno) |
| `make e2e` | Playwright contra a app em execução |

Atualização em produção: `make backup` → `make prod` (o entrypoint migra no boot) → `make doctor`.
Rollback com schema novo exige `make restore`; migrations não desfazem.

## Estrutura

```text
compose.yaml / compose.prod.yaml   app + Caddy
Makefile                           operação Docker
.env                               configuração única (não versionado)
data/                              volume host: SQLite, WAL, anexos, backups
app/
  Dockerfile / .dockerignore
  docker/entrypoint.sh             migrate/seed e comandos
  docker/caddy/                    Caddy dev e prod/LB
  src/
    main.ts                        CLI, migrations, servidor e shutdown
    app.tsx                        composição HTTP: static, CSP, sessão, módulos, erros
    runtime.ts                     discovery de services/módulos, portas e tenant
    kernel/                        base sem domínio: db, config, auth, HTTP, tempo, descoberta
    services/                      auth, tenancy, attachments, conversations, notifications, realtime
    modules/                       identity, demands, attachments, conversations, canvas, notifications, system
      <nome>/module.ts             manifesto (config, create, provides/requires)
    layout/                        shell, componentes e Markdown compartilhados
    db/                            composição de schema, seed, backup/restore
  tests/                           unitários
  e2e/                             Playwright
  docs/adr/                        ADRs preservadas + decisões do fork/container
```

Fronteiras: kernel não importa camadas de cima; service não importa módulo; módulo não importa outro
módulo; leituras cruzadas passam por `context.ports`. `make check` inclui esses gates.

## Limites conhecidos

- Uma instância: SSE, canvas e push não compartilham estado entre réplicas.
- Sem CRDT no canvas; snapshots a cada 2 s.
- Sem antivírus, FTS, e-mail ou reset de senha.
- Web Push depende dos endpoints do navegador (FCM/APNs/Mozilla).
- Produção pressupõe TLS no LB; Caddy local não emite certificado.
