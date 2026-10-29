# 01 — Tooling, configuração e CI

**Objetivo:** transformar o baseline em um projeto `meraki` reproduzível, com comandos únicos, configuração mínima e CI que falha cedo.

**Duração esperada:** 0,5–1 dia.

## Passos

### 1. Identidade do projeto

Em `app/deno.json`:

- `name`: `meraki`;
- `version`: `0.1.0`;
- `exports`: `./src/main.ts`;
- tarefas `build:bin`/`build:bin:linux` com `--output dist/meraki` e `dist/meraki-linux-x64`;
- mantenha `--allow-net --allow-env --allow-read --allow-write --allow-sys=hostname,networkInterfaces`; remova `--allow-run` e `--unstable-otel` quando as fases 02/11 retirarem OTel/ffmpeg.

Renomeie o que é visível ao usuário:

```bash
cd app
rg -l 'Somlos|somlos' src static deploy README.md deno.json | sort
```

- `APP_NAME=Meraki`; `SESSION_COOKIE=meraki_session`.
- Título, marca e textos do shell: `Meraki`.
- Serviços systemd/Caddy: `meraki.service`, `meraki-backup.*`.
- Não renomeie nomes internos de ADRs/commit; mantenha a atribuição no `README`.

### 2. Configuração mínima

Crie `app/.env.example` com apenas o que o alvo usa:

```dotenv
APP_ENV=development
APP_NAME=Meraki
APP_URL=http://localhost:50300
PORT=50300
TRUST_PROXY_HOPS=1
LOG_LEVEL=info

DATA_PATH=./data
DB_PATH=./data/meraki.sqlite3
DB_BUSY_TIMEOUT_MS=5000

SESSION_COOKIE=meraki_session
SESSION_TTL_SECONDS=604800

SEED_EMAIL=admin@meraki.local
SEED_PASSWORD=troque-esta-senha

RATE_LIMIT_LOGIN_PER_MINUTE=5
RATE_LIMIT_CHAT_PER_MINUTE=30
RATE_LIMIT_UPLOAD_PER_MINUTE=10

MAX_UPLOAD_BYTES=10485760
MAX_UPLOAD_FILES=3
MAX_CHAT_BODY=10000

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@meraki.local
```

Regras:

- `.env` nunca entra no Git; `.env.example` não contém segredo real.
- `DATA_PATH` e `DB_PATH` são absolutos em produção (`/var/lib/meraki`).
- `APP_URL` é a origem exata (CSRF/links); em produção, `https://...`.
- `SEED_*` só valem em desenvolvimento; produção usa `meraki create-admin` ou variável de bootstrap única. `VAPID_*` só são necessários na fase 11; a privada nunca vai ao Git.

### 3. Tarefas Deno

Ajuste `deno.json` para:

```json
{
  "tasks": {
    "dev": "deno run --env-file=.env --watch --allow-net --allow-env --allow-read --allow-write --allow-sys=hostname,networkInterfaces src/main.ts",
    "start": "deno run --env-file=.env --allow-net --allow-env --allow-read --allow-write --allow-sys=hostname,networkInterfaces src/main.ts",
    "migrate": "deno run --env-file=.env --allow-net --allow-env --allow-read --allow-write scripts/migrate.ts",
    "seed": "deno run --env-file=.env --allow-net --allow-env --allow-read --allow-write scripts/seed.ts",
    "backup": "deno run --env-file=.env --allow-net --allow-read --allow-write --allow-env scripts/backup.ts",
    "restore": "deno run --env-file=.env --allow-read --allow-write --allow-env scripts/restore.ts",
    "doctor": "deno run --env-file=.env --allow-read --allow-env scripts/doctor.ts",
    "test": "DB_PATH=./data/meraki_test.sqlite3 deno test --env-file=.env --allow-net --allow-env --allow-read --allow-write --allow-sys=hostname,networkInterfaces tests/",
    "check": "deno fmt --check && deno lint && deno check src scripts tests && deno run --allow-read --allow-env scripts/gates.ts",
    "fmt": "deno fmt",
    "lint": "deno lint",
    "js:build": "deno run --allow-read --allow-write --allow-run scripts/build-js.ts",
    "css:build": "mkdir -p static/css && deno run -A npm:@tailwindcss/cli@^4 -i ./src/layout/assets/css/app.css -o ./static/css/output.css --minify",
    "whiteboard:build": "deno run --allow-read --allow-write --allow-run scripts/build-whiteboard.ts",
    "e2e": "cd e2e && npm test",
    "ci": "deno task check && deno task test",
    "build:bin": "deno task js:build && deno task css:build && deno task whiteboard:build && deno compile --allow-net --allow-env --allow-read --allow-write --include src/layout --include src/modules --include src/db --include static --output dist/meraki src/main.ts",
    "build:bin:linux": "deno task js:build && deno task css:build && deno task whiteboard:build && deno compile --allow-net --allow-env --allow-read --allow-write --include src/layout --include src/modules --include src/db --include static --target x86_64-unknown-linux-gnu --output dist/meraki-linux-x64 src/main.ts"
  }
}
```

`whiteboard:build` só passa a existir na fase 10; até lá, remova a chamada ou deixe o script falhar de forma explícita. Não deixe comando “vazio” que finge sucesso.

### 4. Higiene

`app/.gitignore` deve conter, no mínimo:

```gitignore
.env
data/
dist/
node_modules/
static/css/output.css
static/whiteboard/
```

Não ignore `deno.lock`, migrations, assets fonte ou testes.

### 5. CI

Crie `.github/workflows/ci.yml` (ou equivalente GitLab):

```yaml
name: ci
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: app } }
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with: { deno-version: "2.9.x" }
      - run: deno task check
      - run: deno task test
  build:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: app } }
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with: { deno-version: "2.9.x" }
      - run: deno task build:bin:linux
      - uses: actions/upload-artifact@v4
        with: { name: meraki-linux-x64, path: app/dist/meraki-linux-x64 }
```

Se o repositório não for GitHub, adapte os mesmos passos para o CI interno. O importante é: **check + test + build**.

### 6. Scripts auxiliares

- `app/Makefile` opcional com `make dev`, `make check`, `make test`, `make build`.
- `app/README.md` com:
  - origem/licença;
  - como rodar dev;
  - como migrar/seed;
  - como testar;
  - como gerar binário;
  - aviso de que não há serviços externos.

## Aceite

- [ ] `deno task dev` sobe o app com `.env` local (ainda com login do Somlos).
- [ ] `deno task check` passa.
- [ ] `deno task build:bin:linux` gera `dist/meraki-linux-x64`.
- [ ] CI executa check/test/build.
- [ ] `.env` e `data/` ignorados.
- [ ] Nenhum segredo real em `.env.example` ou no Git.

## Riscos

- **Renomear demais**: não gaste tempo renomeando símbolos internos/ADRs; foque em binário, env, UI e deploy.
- **CI com serviços externos**: o alvo não tem Valkey/RustFS; os testes precisam rodar com SQLite temporário. A fase 13 fecha isso.
- **Script de whiteboard inexistente**: não deixe `build:bin` chamando script ausente; adicione na fase 10.
