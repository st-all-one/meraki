# Decisão de stack — binário único, SQLite, chat e anexos

> **Revisão 2026-10-29.** O Somlos é projeto do próprio titular; o bloqueio de licença da avaliação anterior caiu. Com as restrições novas — **um binário, SQLite, chat, anexos em disco local e segurança** — a recomendação primária muda de “Django + HTMX” para **extração cirúrgica do Somlos** (Deno/TypeScript/Hono/HTMX). Django continua válido apenas se “um binário” for preferência, não requisito.
>
> O TabNews é referência de **organização** (rotas finas, domínio explícito, validação/limites, autorização com allowlist, testes HTTP), não de stack: Next.js + Postgres + Vercel não gera um binário e não tem chat/anexos.

## 1. A decisão em uma página

| Decisão | Escolha |
|---|---|
| Runtime | **Binário único Somlos/Deno** (`deno compile`) |
| Banco | **SQLite** (WAL, `busy_timeout`, transações curtas) |
| UI | JSX server-side + **HTMX** + JS pontual; sem SPA |
| Chat | **SSE** para receber + POST para enviar; sem WebSocket no MVP |
| Anexos | Disco local em `DATA_PATH/attachments`; download autenticado |
| Auth | Sessão opaca do Somlos; Argon2id; cookie `HttpOnly`/`SameSite=Lax`; CSRF por `Origin`/`Sec-Fetch-Site` |
| Permissões | `admin`/`member`; um time, todos os projetos; sem ACL por item |
| Operação | Binário + systemd + Caddy; **0 serviços externos** |
| Organização | Rotas finas + módulos de domínio + SQL explícito; sem 20 services |
| Fallback | **Rust/Axum** se Deno/TS não for aceitável |
| Não usar como base | Django/Gunicorn, Next/Vercel, Postgres/Redis/RustFS |

O detalhe de arquitetura, chat, anexos, segurança e corte está em [`05-arquitetura-single-binary.md`](05-arquitetura-single-binary.md).

## 2. O que mudou desde a avaliação anterior

| Fato novo | Efeito |
|---|---|
| Somlos é do próprio usuário; licença pode ser definida | O fork deixa de ser bloqueio jurídico; vira opção técnica legítima |
| “Idealmente um binário” + SQLite | Django/Gunicorn e Next/Node perdem a categoria de base |
| Chat e anexos entram no escopo | O Somlos pode manter `storage` (adaptado) e ganha um motivo a mais para ser reutilizado |
| TabNews como referência de organização | Copiar disciplina, não a stack; evita SPA/Postgres/Vercel |
| 10 pessoas, um processo | SSE e rate limit em memória bastam; Redis/worker/OTel são sobre-engenharia |

A avaliação antiga do Somlos concluía “só faça fork se Deno/TS for aceitável”. Essa condição continua; o que mudou é que, aceitando Deno/TS, agora ele é o **menor caminho para um binário seguro**, porque auth/CSRF/CSP/migrations/backup já existem.

## 3. Matriz

| Stack | Single binary | SQLite | Auth/CSRF prontos | Chat | Anexos locais | Esforço inicial | Leitura |
|---|---:|---:|---:|---|---|---:|---|
| **Somlos cirúrgico** (Deno/TS) | **sim** | **sim** | **sim** | construir SSE | adaptar storage | médio (corte) | **melhor equilíbrio** |
| **Rust + Axum + Askama + SQLx** | **sim** | **sim** | não | construir | construir | médio-alto | melhor se Rust for requisito |
| **Go + `html/template` + SQLite** | **sim** | **sim** | não | construir | construir | médio | mais simples de linguagem, menos pronto |
| Django + HTMX | não | sim | sim | SSE/Channels | sim | baixo | só se binário não for requisito |
| Next/TabNews | não | não (Postgres) | parcial | não | não | alto | referência de organização apenas |

“Esforço” mede chegar a um app usável e seguro, não linhas escritas. O Somlos já pagou auth, CSRF, CSP, migrations, backup e binário; o custo está em cortar 60–70% e adicionar dois módulos.

## 4. Por que o Somlos ganha

### 4.1 O que já está resolvido

- **Um binário:** `deno task build:bin` inclui runtime, código, views, assets e migrations (`deno.json:27-28`; ADR-014). O servidor não precisa de Deno/Node nem de diretórios externos.
- **SQLite de verdade:** WAL, migrations com checksum, backup/restore/doctor, subcomandos no próprio binário (ADR-003/013/014).
- **Segurança:** sessão opaca com hash no banco (`src/modules/identity/infrastructure/session-repository.ts`), Argon2id/decoy hash, CSRF por `Origin`/`Sec-Fetch-Site`, CSP sem inline (`src/app.tsx`, `src/kernel/http/security.ts`), auditoria.
- **UI:** JSX server-side + HTMX; sem SPA, sem estado duplicado. É o mesmo modelo do MVP.

### 4.2 O que falta — e é escopo novo, não reescrita

- **Chat:** módulo novo com SSE + POST; Hono tem `streamSSE` (`hono/helper/streaming`), o que evita WebSocket.
- **Anexos:** adaptador de storage local sobre a porta existente; validação/re-encode e download auth. Não precisa de S3/RustFS/FFmpeg.
- **Corte:** remover CMS/páginas/notícias/contatos/galeria/mapas/assinatura/demo e os services de produto. Rebasear migrations; sem dados de produção.
- **Organização:** reduzir 20 services a ~4; adotar rotas finas e SQL explícito do TabNews, em vez de camadas cerimoniais.

### 4.3 O que se abre mão

- Deno 2.9/TypeScript 6 e um binário de ~165 MB, específico de SO/arquitetura.
- Um snapshot próprio (sem upstream) — que agora é do titular, mas exige disciplina de versão.
- SSE em um único processo: suficiente para 10 pessoas; múltiplos processos exigiriam pub/sub.

## 5. Por que não Django/Next

### 5.1 Django + HTMX

Continua sendo o caminho mais rápido **se** o produto pudesse rodar com Python/Gunicorn + Caddy. Tem auth, admin, ORM, migrations, forms e CSRF prontos; chat via SSE ou Channels; anexos locais. Mas:

- não é um binário;
- adiciona runtime Python, processo WSGI/ASGI e dependências;
- o admin do Django vira uma segunda UI que você não desenhou;
- para 10 pessoas, o ganho de velocidade não compensa a restrição operacional que o usuário colocou.

Use Django se “um binário” for apenas um desejo e a prioridade for chegar ao produto na próxima semana.

### 5.2 TabNews/Next.js

O TabNews é uma boa **referência de organização**, mas:

- Next.js + Postgres + Vercel não é binário nem SQLite;
- não tem chat nem upload de arquivos;
- a segurança tem lacunas que não queremos copiar: CSP ausente, CORS `*`, sessão em claro no banco;
- tem over-abstração (5 workspaces/barris, SWR/ISR/NDJSON) que não paga para 10 pessoas.

Copie o contrato: rota fina, domínio explícito, `filterInput`/`filterOutput`, validação com limites, erros com `key`, testes HTTP, URL como estado. Não copie a stack.

## 6. Rust/Axum e Go

### 6.1 Rust + Axum + Askama + SQLx

- **Prós:** binário nativo pequeno, sem runtime; tipos fortes; SQLx + SQLite; SSE/WebSocket no axum; ótimo para os próximos anos.
- **Contras:** auth, CSRF, sessão, migrations, backup, formulários e testes de plataforma são manuais; o tempo até o primeiro uso é maior.
- **Quando:** Rust é requisito de time ou o corte do Somlos não for aceitável.

### 6.2 Go + `html/template` + SQLite

- **Prós:** a linguagem mais simples para CRUD/chat; `embed` de assets; `modernc.org/sqlite` puro; binário único; SSE trivial.
- **Contras:** nada pronto de auth/admin/migrations; mais código de plataforma que Somlos.
- **Quando:** simplicidade de linguagem/onboarding vence o reuso.

## 7. Arquitetura e escopo

O alvo é um **monólito modular**:

```text
meraki (binário único)
  ├─ kernel        config, DB, HTTP, segurança, logs
  ├─ identity      usuários, sessão, admin
  ├─ tasks         projetos, itens, comentários, atividades
  ├─ chat          canais, mensagens, leituras, SSE
  ├─ attachments   upload, storage local, download
  ├─ system        health/ready
  ├─ layout        shell, partials, CSS
  └─ db            schema + migrations embutidos
       ├─ SQLite (WAL)
       └─ DATA_PATH/attachments
```

- **Chat:** canal Geral + um por projeto; SSE; sem DMs/presença/threads.
- **Anexos:** imagens/PDF, 10 MiB, 3 por mensagem, download auth.
- **Tasks:** 6 tabelas do núcleo; sem tipos/épicos/campos customizados.
- **Whiteboard:** opcional, depois; WebSocket nativo e CSP isolada.

Detalhes em [`05-arquitetura-single-binary.md`](05-arquitetura-single-binary.md).

## 8. Plano de corte

1. Congelar o Somlos em um repositório próprio; adicionar `LICENSE`; remover `v7_example` e docs de produto.
2. Manter `kernel`, `identity`, `system`, `layout`, `db`; adaptar `storage` para disco local.
3. Remover `cms`, `pages`, `noticias`, `contacts`, `gallery`, `media`, `maps`, `signature`, `demo`, `access`, `cache`, `events`, `jobs`, `mail`, `pdf`, `search`, `seo`, `feed`, `importer`, `richtext`, `blocks`.
4. Rebasear migrations em `0001_core` + `0002_tasks` + `0003_chat` + `0004_attachments`; seed mínimo.
5. Implementar tasks; depois anexos; depois chat; endurecer.
6. Rodar `deno task check`, testes, `build:bin`, smoke de duas sessões, backup/restore.

O inventário antigo está em [`01-avaliacao-somlos.md`](01-avaliacao-somlos.md), com a revisão de licença e de `storage`.

## 9. Gatilhos para rever

- Deno/TS não for aceitável para o time.
- O corte não conseguir remover Valkey/RustFS/OTel/worker sem reescrever o núcleo.
- O binário não servir SSE/arquivos grandes no ambiente alvo.
- O time exigir Rust/Go por política.
- O produto precisar de multi-tenant, API pública, e-mail, notificações ou whiteboard colaborativo no MVP.

Nenhum desses gatilhos é o caso atual.

## 10. Veredito

1. **Caminho principal:** **Somlos cirúrgico**, com SQLite, chat SSE e anexos locais; TabNews como disciplina de organização.
2. **Se Deno/TS não for aceitável:** **Rust + Axum + Askama + SQLx**, mantendo o mesmo desenho.
3. **Se a prioridade for velocidade e “um binário” for negociável:** Django + HTMX.
4. **Nunca como base:** Next/TabNews — usar só como referência.
5. **O maior ganho não é a linguagem:** é **não reconstruir auth, CSRF, CSP, migrations, backup e binário** — e usar o tempo em tasks, chat, anexos e clareza de uso.
