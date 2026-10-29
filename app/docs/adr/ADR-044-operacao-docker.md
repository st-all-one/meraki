# ADR-044 — Operação Docker, `.env` na raiz e volume host

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-29) |
| **Substitui** | ADR-025 (deploy binário + systemd) |
| **Relacionadas** | ADR-002, ADR-013, ADR-023, ADR-043 |

## Contexto

O deploy systemd + binário atendia um host dedicado, mas cria dois caminhos de operação e duplica
configuração (`deploy/meraki.env.example` + `.env`). O Meraki precisa rodar igual ao Somlos:
Docker Compose no desenvolvimento e na produção, com SQLite e anexos persistidos no host.

## Decisão

1. **Docker é o caminho único de execução.** `compose.yaml` na raiz sobe `app` + `caddy`;
   `compose.prod.yaml` sobrepõe `APP_ENV=production`, URL pública e Caddyfile de LB. Makefile é a
   interface: `make dev`, `make prod`, `make down`.
2. **Um único `.env` na raiz do repositório.** Ele é o ponto único de URLs, segredos, limites e
   caminhos. `compose.yaml` usa `env_file: .env`; o modo dev/prod vem do Makefile/overlay, não de
   arquivos de ambiente paralelos. `.env.example` é versionado; `.env` é ignorado e `0600`.
3. **Persistência no host por bind mount.** `${HOST_DATA_PATH:-./data}:/app/data:Z` contém
   `meraki.sqlite3`, `-wal`, `attachments/` e `backups/`. O container roda com `UID:GID` do host; o
   Makefile cria `data/` em `0700` e o entrypoint aplica `umask 077`. Volumes nomeados ficam só para
   estado do Caddy.
4. **Segurança do container.** App com `read_only`, `cap_drop: ALL`, `no-new-privileges`, tmpfs
   `/tmp`, `pids_limit`, `nofile` e graceful stop. Caddy mantém apenas `NET_BIND_SERVICE` porque a
   imagem oficial tem a capability no binário; publica somente `127.0.0.1:50380` por padrão.
5. **Borda.** Em dev, Caddy HTTP em `50380` sobrescreve `X-Forwarded-For`. Em produção, o TLS é do
   LB externo e `Caddyfile.prod` preserva `X-Forwarded-*`; `PROD_APP_URL` deve ser a origem pública
   exata. Para LB externo, `EDGE_BIND=0.0.0.0` + firewall.
6. **Migrations no boot do container** (`AUTO_MIGRATE=true`) e seed somente fora de produção
   (`SEED_ON_BOOT=true`). Atualização continua sendo backup → build/restart → doctor; migrations
   up-only, rollback com schema novo exige restore.
7. **Artefatos removidos:** unit systemd, timer, script de backup shell e Caddyfile de host foram
   substituídos por `compose*.yaml`, `Makefile`, `app/Dockerfile`, `app/docker/entrypoint.sh` e
   `app/docker/caddy/`.

## Consequências

- Um comando (`make dev`/`make prod`) sobe o produto; não há dependência de Deno no host para rodar.
- O binário continua possível como artefato opcional, mas não é o caminho operacional.
- Build da imagem precisa de rede para resolver npm/Deno; runtime não acessa registry.
- Backup/restore seguem `make backup`/`make restore`, agora sempre sobre o volume Docker.
