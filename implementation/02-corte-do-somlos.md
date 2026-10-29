# 02 — Corte do Somlos

**Objetivo:** reduzir o Somlos ao menor núcleo que ainda autentica, serve o shell e abre SQLite — sem CMS, sem S3, sem Valkey, sem worker, sem OTel.

**Duração esperada:** 2–4 dias.

## Estratégia

Não use `MODULES=identity,system` como solução final: isso só filtra o boot e mantém o código, as migrations e o binário. Delete de verdade, em fatias, rodando `deno task check` a cada fatia.

```text
Fatia A: remover produto (cms, pages, noticias, contacts, gallery, maps, signature, demo)
Fatia B: remover services de produto/infra (media, search, seo, feed, importer, richtext, blocks, pdf, mail, jobs, events, cache, access, settings, storage)
Fatia C: enxugar identity/system/runtime/app/schema/seed
Fatia D: remover assets, env e Compose
```

## 2.1 Módulos e services que saem

Remova diretórios e imports:

| Remover | Motivo |
|---|---|
| `src/modules/cms`, `pages`, `noticias`, `contacts`, `gallery`, `maps`, `signature`, `demo`, `admin` | produto original |
| `src/modules/media` | anexos serão um módulo novo |
| `src/services/media` | FFmpeg/variantes não são necessários |
| `src/services/storage` | S3/RustFS; o adapter local nasce em `attachments` |
| `src/services/access` | 3 cargos cabem em `users.role` |
| `src/services/cache` | rate limit em memória |
| `src/services/events` | sem outbox |
| `src/services/jobs` | sem worker/fila |
| `src/services/mail` | sem e-mail |
| `src/services/settings` | marca fixa |
| `src/services/search` | `LIKE` |
| `src/services/seo`, `feed` | app interno |
| `src/services/importer`, `richtext`, `blocks` | sem CMS/editor rico |
| `src/services/pdf`, `signature`, `maps` | sem domínio |
| `src/modules/admin` | admin de usuários será rota simples no identity |

Mantenha:

- `src/kernel` (enxuto);
- `src/services/auth` (só senha/sessão; remova JWT se não houver API);
- `src/services/audit` (mínimo, login/admin);
- `src/services/tenancy` (tenant fixo);
- `src/modules/identity` (login/sessão/usuários);
- `src/modules/system` (health/ready);
- `src/layout` (shell e views);
- `src/db` (schema/migrations);
- `static` (HTMX, CSS, ícones que sobrarem).

## 2.2 Identity

1. Remova o fluxo de reset de senha (`password-reset*`) e o JWT de API; o app é browser-only.
2. Remova `EventBus` e `JobQueue` das dependências de login. A transação cria sessão, atualiza hash se necessário e grava auditoria direto.
3. Substitua `CachePort.rateLimit` por `src/kernel/rate-limit.ts`:

   ```ts
   // API alvo; implementação em memória, uma instância.
   rateLimit(key: string, limit: number, windowSeconds: number): {
     allowed: boolean;
     retryAfterSeconds: number;
   }
   ```

   - chave de login: hash de `email|ip` (não guardar e-mail em claro);
   - limpeza preguiçosa das janelas;
   - sem Redis, sem fail-open.

4. Mantenha:
   - Argon2id + decoy hash;
   - token de sessão opaco + hash no banco;
   - cookie `HttpOnly; SameSite=Lax; Secure` em produção;
   - erro genérico de login;
   - auditoria de login falho/sucesso.

5. Remova a API (`module.instance.api`) e o `jwtAuth` se nada o consome.

## 2.3 System, runtime e app

- `src/modules/system`: mantenha `/healthz` e `/readyz`; remova dependências de cache/storage/seo/media. `readyz` verifica SQLite + disco de anexos (quando existir).
- `src/runtime.ts`: remova `EventBus`, listener de eventos e `ignoredModules`; mantenha database, tenancy, audit, auth.
- `src/main.ts`: remova o subcomando `worker`; mantenha `migrate`, `seed`, `backup`, `restore`, `doctor` e o servidor. Remova `--unstable-otel`.
- `src/app.tsx`:
  - remova `brand`/`settings`; use `APP_NAME` e CSS fixo;
  - remova o loop de `module.instance.api`;
  - mantenha static, middlewares de sessão, CSRF, rotas web, 404/erro;
  - ajuste `securityHeaders` para não citar `/cms`, `/maps`.
- `src/layout`:
  - remova `blocks` (editor de conteúdo) e imports de `seo`;
  - reduza `app-shell` a sidebar/topbar/main;
  - mantenha `render`, `theme` e componentes que o login usa.
- `src/db/schema.ts`: remova todos os tipos de módulos/services removidos; deixe apenas tenants/users/sessions/audit e o que a fase 03 criar.
- `scripts/seed.ts`: crie apenas tenant + admin; nada de páginas/mídia.
- `scripts/gates.ts`: remova checagens de env/migrations de features mortas; mantenha fronteira, CSP, migrations e segredos.
- `src/kernel/i18n`: mantenha nesta fase se o login depende; remover depois é opcional. Não gaste tempo traduzindo.

## 2.4 Dependências e ambiente

- Remova de `deno.json` imports de: TipTap, PDF/signature, MapLibre/PMTiles, Nodemailer, iovalkey, aws4fetch, OTel, tiptap, etc.
- Remova de `.env.example`/`env.ts`: `VALKEY_URL`, `STORAGE_*`, `MAIL_*`, `SMTP_*`, `SIGNATURE_*`, `MEDIA_*`, `PAGES_*`, `IMPORT_*`, `OTEL_*`.
- Remova `docker-compose.yml` de desenvolvimento ou reduza a “nada” (SQLite local não precisa de container). O alvo é rodar `deno task dev` sem Docker.
- Remova `ffmpeg` do deploy/docs.
- Remova assets de mapas/editor em `static/js/vendor` e fontes não usadas.

## 2.5 Limpeza de rotas e strings

```bash
cd app
rg -n 'cms|maps|signature|gallery|noticias|contacts|media|Valkey|RustFS|somlos' src scripts deno.json .env.example | head -200
```

- Substitua rotas/labels de produto pelas rotas do meraki.
- Não renomeie o commit/atribuição; apenas o que o usuário vê.
- Deixe `/login`, `/logout`, `/healthz`, `/readyz` e o shell vazio.

## Aceite

- [ ] `rg` não encontra imports dos módulos/services removidos.
- [ ] `deno task check` passa.
- [ ] `deno task dev` sobe sem Docker, sem Valkey, sem RustFS, sem OTel.
- [ ] `/login` renderiza; login do seed funciona; `/healthz` e `/readyz` respondem.
- [ ] O binário não abre conexão externa no boot.
- [ ] `deno task test -- tests/unit` (ou suíte unitária equivalente) passa.
- [ ] Nenhuma rota `/cms`, `/maps`, `/noticias` etc. permanece.

## Riscos

- **Identity dependente de cache/jobs/events**: refatore antes de deletar; compile em cada fatia.
- **Schema ainda importa módulos removidos**: o `AppDatabase` quebra; ajuste junto.
- **Testes afirmam 20 services/12 módulos**: atualize ou remova os testes de produto; mantenha auth/system.
- **Deletar `storage` cedo demais**: anexos ainda não existem; a fase 07 cria o adapter local. Não deixe upload “meio implementado”.
