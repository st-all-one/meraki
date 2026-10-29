# 14 — Deploy e runbook

**Objetivo:** colocar o binário em um servidor Linux privado, acessível pela web sem allowlist de IP, com TLS, backup e rollback.

**Duração esperada:** 1–2 dias.

## 14.1 Pré-requisitos

- Linux x86_64 com systemd e Caddy 2.
- DNS do domínio apontando para o servidor.
- Portas 80/443 liberadas; SSH restrito por chave.
- Nenhum Docker/Deno/Node necessário no servidor.
- Build feito na mesma arquitetura/SO:

```bash
cd app
deno task build:bin:linux
sha256sum dist/meraki-linux-x64
```

## 14.2 Usuário e diretórios

```bash
sudo useradd --system --home /var/lib/meraki --shell /usr/sbin/nologin meraki
sudo install -d -o meraki -g meraki -m 0700 /var/lib/meraki
sudo install -d -o meraki -g meraki -m 0700 /var/lib/meraki/attachments
sudo install -d -o meraki -g meraki -m 0700 /var/backups/meraki
sudo install -d -o root -g meraki -m 0750 /etc/meraki
sudo install -d -o root -g root -m 0755 /opt/meraki
```

O binário fica em `/usr/local/bin/meraki`; dados em `/var/lib/meraki`; backup em `/var/backups/meraki`; config em `/etc/meraki`.

## 14.3 Instalação do binário

```bash
sudo install -o root -g root -m 0755 dist/meraki-linux-x64 /usr/local/bin/meraki
meraki --version 2>/dev/null || true
```

Guarde o SHA-256 e a versão no runbook.

## 14.4 Configuração

Crie `/etc/meraki/meraki.env` (`root:meraki`, `0640`):

```dotenv
APP_ENV=production
APP_NAME=Meraki
APP_URL=https://meraki.example.com
PORT=50300
TRUST_PROXY_HOPS=1
LOG_LEVEL=info

DATA_PATH=/var/lib/meraki
DB_PATH=/var/lib/meraki/meraki.sqlite3
DB_BUSY_TIMEOUT_MS=5000

SESSION_COOKIE=meraki_session
SESSION_TTL_SECONDS=604800

RATE_LIMIT_LOGIN_PER_MINUTE=5
RATE_LIMIT_CHAT_PER_MINUTE=30
RATE_LIMIT_UPLOAD_PER_MINUTE=10

MAX_UPLOAD_BYTES=10485760
MAX_UPLOAD_FILES=3
MAX_CHAT_BODY=10000

# Web Push (gerar uma vez com `meraki push:keys`)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@meraki.example.com

# Não definir SEED_* em produção.
```

Regras:

- `APP_URL` exato, com `https`; CSRF/links dependem dele.
- `DATA_PATH`/`DB_PATH` absolutos.
- Sem `JWT_SECRET`, `VALKEY_URL`, `STORAGE_*`, `SMTP_*`, `OTEL_*`.
- `VAPID_PRIVATE_KEY` é segredo; nunca no Git. Rotação invalida subscriptions existentes.
- Segredos de sessão são tokens no banco; não há segredo global além do cookie.

## 14.5 Migração e primeiro admin

```bash
sudo -u meraki bash -c 'set -a; . /etc/meraki/meraki.env; set +a; meraki push:keys'
sudo -u meraki bash -c 'set -a; . /etc/meraki/meraki.env; set +a; meraki migrate'
sudo -u meraki bash -c 'set -a; . /etc/meraki/meraki.env; set +a; meraki doctor'
sudo -u meraki bash -c 'set -a; . /etc/meraki/meraki.env; set +a; meraki create-admin --email admin@empresa.com --name "Admin"'
```

- `push:keys` imprime o par VAPID uma vez; copie para `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` no env antes de iniciar o serviço.
- `create-admin` imprime a senha temporária uma vez; guarde e entregue por canal seguro.
- O admin deve trocar a senha no primeiro login.
- Nunca rodar `seed` em produção.

Se preferir não passar env por `xargs` (valores com espaço), use `EnvironmentFile` no systemd e um comando `systemd-run`/script wrapper.

## 14.6 systemd

`/etc/systemd/system/meraki.service`:

```ini
[Unit]
Description=Meraki
After=network-online.target
Wants=network-online.target

[Service]
Type=exec
User=meraki
Group=meraki
WorkingDirectory=/opt/meraki
EnvironmentFile=/etc/meraki/meraki.env
Environment=DENO_NO_UPDATE_CHECK=1
ExecStart=/usr/local/bin/meraki
Restart=on-failure
RestartSec=5
TimeoutStartSec=60
TimeoutStopSec=30
KillSignal=SIGTERM
StateDirectory=meraki
StateDirectoryMode=0700
UMask=0077
LimitNOFILE=4096

NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectKernelLogs=true
ProtectControlGroups=true
ProtectClock=true
ProtectHostname=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=true
RestrictSUIDSGID=true
LockPersonality=true
RemoveIPC=true
CapabilityBoundingSet=
AmbientCapabilities=
SystemCallArchitectures=native
ReadWritePaths=/var/lib/meraki

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now meraki
sudo systemctl status meraki --no-pager
journalctl -u meraki -n 100 --no-pager
```

Não use `MemoryDenyWriteExecute`: o V8 do Deno precisa de JIT.

## 14.7 Caddy

`/etc/caddy/Caddyfile`:

```caddyfile
{
  admin off
  persist_config off
}

meraki.example.com {
  encode zstd gzip

  header {
    -Server
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
  }

  @sw path /sw.js
  header @sw Cache-Control "no-cache"

  @manifest path /manifest.webmanifest
  header @manifest Content-Type "application/manifest+json"

  request_body {
    max_size 32MB
  }

  reverse_proxy 127.0.0.1:50300 {
    health_uri /healthz
    health_interval 5s
    health_timeout 2s
    lb_try_duration 5s
    lb_try_interval 250ms
    flush_interval -1
  }
}
```

- `flush_interval -1` é essencial para SSE (chat) não bufferizar; Caddy encaminha WebSocket (canvas) automaticamente, mas teste o upgrade.
- Caddy faz TLS/ACME; se o TLS for externo, use o modo LB do Somlos e `APP_URL` correspondente.
- Caddy **não** serve `DATA_PATH`; anexos passam pelo app.
- `request_body max_size 32MB` alinhado a 3×10 MB + overhead.
- Sem allowlist de IP; a proteção é auth + rate limit + TLS.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 14.8 Backup

`/etc/systemd/system/meraki-backup.service`:

```ini
[Unit]
Description=Meraki backup
After=meraki.service

[Service]
Type=oneshot
User=meraki
Group=meraki
EnvironmentFile=/etc/meraki/meraki.env
ExecStart=/usr/local/bin/meraki backup
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/backups/meraki
```

`meraki-backup.timer`:

```ini
[Unit]
Description=Daily Meraki backup

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=15m

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now meraki-backup.timer
sudo systemctl list-timers meraki-backup.timer
sudo -u meraki env $(cat /etc/meraki/meraki.env | xargs) meraki backup
```

- Backup inclui SQLite + `attachments/`; guarde checksum.
- Retenção 14 dias; offsite com `rsync`/`restic` se desejado.
- Teste restore em `/tmp` mensalmente.

## 14.9 Smoke de produção

```bash
curl -fsS https://meraki.example.com/healthz
curl -fsS https://meraki.example.com/readyz
curl -I https://meraki.example.com/login
```

Depois, no navegador:

1. login admin; trocar senha;
2. criar projeto/tarefa;
3. mover no board;
4. conversa com Markdown e anexo;
5. chat Geral em duas abas;
6. canvas: desenhar, recarregar, exportar;
7. developer/manager: conferir permissões;
8. baixar anexo sem sessão → 401/403;
9. conferir Network sem domínio externo;
10. `journalctl` sem erro/segredo.

## 14.10 Rollback

- Antes de migrar: `meraki backup` e copiar o binário anterior.
- Migrations são up-only; se a nova versão falhar:
  1. `systemctl stop meraki`;
  2. restaurar binário anterior;
  3. se o schema mudou de forma incompatível, restaurar o backup em `DB_PATH` (com app parado);
  4. `systemctl start meraki`; `doctor`; smoke.
- Nunca “corrigir” migration aplicada; crie nova.

## 14.11 Monitoramento

- `systemctl status meraki`, `journalctl -u meraki`.
- `/healthz` (processo) e `/readyz` (SQLite + diretório de anexos).
- Disco: `df -h /var/lib/meraki`; alerta em 80%.
- Backup: verificar timer e checksum.
- SSE: conexões abertas e erros no log; Caddy sem buffering.
- Sem APM externo; logs locais.

## Aceite

- [ ] Binário instalado e serviço ativo.
- [ ] Migrate/doctor/create-admin executados.
- [ ] Caddy/TLS/HSTS ativos; SSE sem buffering.
- [ ] Smoke dos 12 passos concluído.
- [ ] Backup manual e timer; restore testado.
- [ ] Rollback documentado.
- [ ] VAPID configurado; push de teste recebido; SW não cacheia HTML/auth.
- [ ] Nenhum serviço de aplicação externo no host (push usa endpoints do navegador).

## Riscos

- **Migração sem backup**: sempre backup antes.
- **SSE bufferizado**: sem `flush_interval -1`, chat “não chega”.
- **`APP_URL` errado**: CSRF e links quebram; confira.
- **Disco cheio**: anexos/backup; monitore e aplique quota.
- **Sem allowlist**: rate limit e senha forte são a defesa; não exponha admin sem TLS.
- **Push de saída**: o servidor precisa de HTTPS de saída para FCM/APNs/Mozilla; teste egress e timeout.
- **Service worker**: `sw.js` com cache longo prende versão antiga; use `no-cache`.
