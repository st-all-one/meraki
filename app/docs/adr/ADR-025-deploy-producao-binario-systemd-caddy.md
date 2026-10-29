# ADR-025 — Deploy de produção: binário + systemd + Caddy

| Campo | Valor |
| :--- | :--- |
| **Status** | Histórico; substituído por ADR-044 (Docker) |
| **Data** | 2026-10-24 |
| **Plano de origem** | Operação |
| **Relacionadas** | ADR-009, ADR-013, ADR-014, ADR-023 |

## Contexto

O Compose é o ambiente local e de integração. Produção precisa de um processo persistente,
reinício automático, segredos fora do repositório, migrações deliberadas e uma borda TLS. O
`.STAGING.md` registrava systemd/supervisor e proxy reverso como pendência.

O projeto já gera um binário único (ADR-014) com views, assets e migrations embutidos, e o Caddy é
a borda única (ADR-023). Falta fixar como isso roda fora do Docker.

## Decisão

1. **Produção roda o binário `somlos` sob systemd**, com usuário dedicado `somlos`, diretório de
   estado `/var/lib/somlos` e configuração em `/etc/somlos/somlos.env` (modo `0600`).
2. **Caddy nativo é a borda.** Duas topologias suportadas:
   - **TLS no Caddy:** `https://dominio:50343` com certificado gerenciado fora do Caddy
     (`tls cert key`); `APP_URL=https://dominio:50343`.
   - **TLS em LB externo:** Caddy escuta só em `127.0.0.1:50380`; o LB termina TLS e encaminha
     `X-Forwarded-Proto`. Nesse caso, ajuste `TRUST_PROXY_HOPS` para o número real de proxies.
3. **Nenhuma porta 80/443 do projeto é publicada.** As portas continuam na faixa `503xx`
   (ADR-023). Certificados são renovados fora do processo (certbot/hook ou LB) e o Caddy recarrega.
4. **Migração é passo de deploy, não do `ExecStart`.** O procedimento é: backup verificado →
   `somlos migrate` → `systemctl restart somlos`. O unit não migra sozinho para não transformar
   restart em alteração de schema sem backup. Com banco já migrado e migration pendente,
   `APP_ENV=production` exige backup local recente (<24 h) com BLAKE3/integridade válidos.
5. **Backup SQLite diário** por `somlos backup` (API de backup online do `node:sqlite`,
   consistente com a app rodando), checksum BLAKE3 e retenção local de 30 dias. Com
  `--offsite --prune-remote`, envia e aplica retenção remota opcional (pares completos,
  `BACKUP_REMOTE_RETENTION_DAYS`, preserva o mais novo); com apenas `--offsite`, envia banco +
  sidecar ao S3 (`STORAGE_*`, `BACKUP_S3_PREFIX`). Lifecycle do bucket continua alternativa;
  monitoramento/alerta fica com `somlos doctor` + agendador externo. Timer
  `somlos-backup.timer`; restore verificado por
   `somlos restore` (BLAKE3 + `integrity_check`, com `.pre-restore-*`).
6. **Uma instância por papel no SQLite.** Web e worker adquirem leases separadas na tabela
   `process_locks` (`role=web|worker`, heartbeat + TTL); dois processos do mesmo papel são
   recusados, mas web + worker coexistem no mesmo arquivo.
   Ainda assim, não habilitar `--scale`/réplicas do unit.
7. **Endurecimento do unit:** `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`,
   `PrivateTmp`, `PrivateDevices`, `StateDirectory`, `UMask=0077`, `CapabilityBoundingSet=`.
   `MemoryDenyWriteExecute` **não** é usado: o V8 do Deno precisa de JIT.
8. Artefatos em `deploy/`: unit, timer, script de backup, Caddyfiles e env examples.

## Justificativa (alternativas descartadas)

- **Docker Compose em produção** — possível, mas o alvo de produção é o binário único; Compose
  continua sendo desenvolvimento/integração.
- **Migrar no boot do unit** — acopla restart a mudança de schema e remove o gate de backup.
- **Publicar 80/443** — viola a faixa `503xx` e expõe outra superfície.
- **Supervisor sem hardening** — mais uma dependência; systemd já entrega restart, logs, límites e
  sandbox.
- **SQLite copiado a quente** — `cp` com WAL não é backup consistente; `.backup` é.

## Consequências

**Positivas**

- Processo único, reinício automático, segredos e dados com permissões restritas.
- Deploy reprodutível e auditável; backup antes de schema.
- Caddy mantém a borda e as portas da ADR-023.

**Custos / negativas**

- Requer `sqlite3` no host para o backup e Caddy instalado.
- Certificado/TLS e offsite ficam fora do processo (procedimento operacional).
- O binário precisa ser recompilado por arquitetura/SO.

## Verificação

- `systemd-analyze verify deploy/systemd/somlos.service` sem erros.
- `caddy validate` nos Caddyfiles de produção.
- `deno task build:bin:linux` + `somlos migrate`/`somlos backup` em DB temporário, checksum
  conferido e retenção exercitada.
- `curl http://127.0.0.1:50380/healthz` (modo LB) ou `https://dominio:50343/healthz` (modo TLS).

## Referências

- `deploy/README.md`, `deploy/systemd/`, `deploy/caddy/`
- `scripts/backup.ts`
- ADR-013 (migrações), ADR-014 (binário), ADR-023 (Caddy/portas)
