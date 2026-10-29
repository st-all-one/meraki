# Avaliação — Somlos como base do meraki

> **Veredito curto:** com o Somlos sendo projeto do próprio titular, o bloqueio de licença não existe mais. Para o alvo **um binário + SQLite + chat + anexos locais + segurança**, o **fork cirúrgico** passa a ser o caminho de menor risco: ele já entrega binário, SQLite, auth, CSRF, CSP, migrations, backup e operação; o trabalho restante é cortar 60–70% e adicionar tasks, chat e anexos. Se Deno/TypeScript não for aceitável, use o Somlos como referência e construa em Rust/Axum.
>
> Base avaliada: `_REF/somlos` @ `96ade82` (commit único, 2026-10-27). Nenhum arquivo foi alterado.

## 1. O que foi verificado

| Evidência | Resultado |
|---|---|
| `deno task check` (fmt, lint, types, 9 gates) | **passou**; gates de fronteira, CSP, migrations, env e segredos OK |
| Testes unitários do núcleo (`auth`, `policy`, `clock`, `modules`, `http`) | **14 passed / 37 steps**, 0 failed |
| Suíte completa | docs afirmam 31 passed / 118 steps + E2E 10/10; **não reexecutei** (exige `.env` e serviços) |
| Código | 274 arquivos em `src`, ~32 mil linhas TS/TSX; 12 módulos, 20 services, 18 migrations, 19 tabelas |
| UI | JSX server-side + HTMX 4 + Tailwind 4/daisyUI 5; 45 arquivos TSX |
| Operação | Docker Compose com app, worker, Caddy, Valkey, RustFS, OTel; binário `deno compile`; backup/restore/doctor |
| Documentação | 43 ADRs, wiki, `implementaion/`; o repo se declara “template/fork versionado” |
| Licença | **projeto do próprio titular**; falta apenas declarar a licença no derivado |

O Somlos não é um esqueleto vazio: é uma **fundação de produto** com CMS, páginas, notícias, mídia, mapas, assinatura digital, e-mail, busca e importador já implementados. Isso muda a natureza do fork: o valor está na fundação, não no produto existente.

## 2. Aderência ao meraki

| Necessidade do meraki | Somlos tem? | Veredito |
|---|---|---|
| Sessão opaca, cookie, CSRF, Argon2id, rate limit | Sim, bem implementado | **Ganho real** |
| RBAC | Sim, catálogo de papéis/permissões; `users.role` também existe | **Exagero**; para admin/member, `users.role` basta |
| Auditoria | Sim, append-only com cadeia Blake3 | Melhor que o necessário; útil para login/segurança |
| SQLite WAL, migrations com checksum, backup/restore/doctor | Sim | **Ganho real** |
| Layout server-side + HTMX + formulários progressivos | Sim | **Alinhado ao MVP** |
| Deploy binário + Caddy + systemd | Sim | **Ganho real**, mas com 4 serviços a mais |
| Tarefas, status, responsável, prazo, lista/quadro/calendário | **Não** | Todo o domínio precisa ser construído |
| Chat | **Não** | Construir com SSE + POST; sem WebSocket |
| Anexos locais | Parcial: porta S3/RustFS | Adaptar para disco local; validar/re-encodar |
| 6 tabelas de núcleo / 1 processo / 0 serviços extras | Não: 19 tabelas / web+worker+Valkey+RustFS | **Desalinhado**; o corte resolve |
| Rust/Askama | Não: Deno/TS/Hono/Kysely | **Decisão de stack**, não detalhe |

**Conclusão de aderência:** o Somlos acelera a “casca de plataforma” (auth, CSRF, CSP, layout, migrations, backup, binário) e não acelera o produto. Para o alvo atual, o valor está em ~30–35% do código; os outros ~65% são produto de CMS/mídia que será removido. A diferença para a avaliação anterior é que chat/anexos aumentam o valor do que fica (`storage`/`media`/`auth`).

## 3. Licença

O projeto é do próprio titular; não há mais bloqueio jurídico. Ainda assim, antes de publicar o derivado:

1. adicionar um `LICENSE` ao repositório do meraki (MIT/Apache-2.0 ou licença interna, conforme a política);
2. manter `NOTICE`/licenças de terceiros que já vêm no Somlos (HTMX, Lucide, MapLibre, PMTiles, TipTap etc.);
3. remover `v7_example/` (145 MB, 2.166 arquivos) para não arrastar conteúdo de terceiros sem inventário;
4. registrar no README que o meraki é derivado do Somlos e qual commit foi congelado.

Licença resolvida não significa “fork integral”: o custo de escopo continua.

## 4. Inventário: o que remover e o que manter

Linhas aproximadas por dono, medidas no repo:

| Caminho | Linhas | Ação no fork | Motivo |
|---|---:|---|---|
| `src/kernel` | 4.197 | **manter**, enxugar i18n/OTel | config, HTTP, logs, DB, discovery, portas, clock |
| `src/services/auth` | 293 | **manter** | Argon2, sessão, senha |
| `src/services/audit` | 208 | **manter** (opcional) | evidência de login/admin; pode virar só log |
| `src/services/settings` | 160 | **remover/simplificar** | marca fixa; sem tema por tenant |
| `src/services/tenancy` | 65 | **manter** | `tenant_id` já está em tudo; remover custa mais |
| `src/services/access` | 339 | **remover** | 2 papéis cabem em `users.role` |
| `src/services/cache` | 158 | **remover** | Valkey só para rate limit/status; trocar por memória |
| `src/services/events` | 292 | **remover** | outbox não é necessário para tasks/chat |
| `src/services/jobs` | 357 | **remover** | sem e-mail/reset/mídia, não há job |
| `src/services/mail` | 562 | **remover** | sem e-mail no MVP |
| `src/services/media` | 1.679 | **remover** | anexos simples não precisam de FFmpeg/variantes |
| `src/services/storage` | 388 | **manter e adaptar** | porta útil; implementar disco local |
| `src/services/signature` | 2.886 | **remover** | domínio inexistente no meraki |
| `src/services/pdf` | 682 | **remover** | idem |
| `src/services/maps` | 522 | **remover** | idem |
| `src/services/search` | 354 | **remover** | `LIKE` basta para 10 pessoas |
| `src/services/seo` | 616 | **remover** | app interno não precisa de sitemap/OG |
| `src/services/feed` | 386 | **remover** | sem conteúdo público |
| `src/services/importer` | 506 | **remover** | sem CSV |
| `src/services/richtext` + `blocks` | 1.504 | **remover** | editor rico não é necessário |
| `src/modules/identity` | 1.423 | **manter e enxugar** | login/sessão/usuários; remover reset/JWT de API |
| `src/modules/system` | 261 | **manter e enxugar** | só health/readiness |
| `src/modules/admin` | 283 | **remover** | API de papéis; trocar por admin simples de usuários |
| `src/modules/cms` | 1.277 | **remover** | sem CMS |
| `src/modules/pages` | 3.689 | **remover** | sem páginas |
| `src/modules/noticias` | 2.005 | **remover** | sem notícias |
| `src/modules/contacts` | 1.125 | **remover** | sem contatos |
| `src/modules/gallery` | 1.040 | **remover** | sem galeria |
| `src/modules/media` | 170 | **remover** | anexos usam storage direto |
| `src/modules/maps` | 444 | **remover** | sem mapas |
| `src/modules/signature` | 1.754 | **remover** | sem assinatura |
| `src/modules/demo` | 300 | **remover** | dashboard de demonstração |
| `src/layout` | 1.658 | **manter e simplificar** | shell, componentes, formulários |
| `v7_example` | 145 MB | **remover** | referência externa, não é base |
| `docs/adr` + wiki | 43 ADRs | **podar** | manter ~10 decisões de núcleo |
| `implementaion` | 236 KB | **remover/reescrever** | plano do produto original |
| `static/js/vendor/maps`, editor | — | **remover** | assets das features removidas |
| `docker-compose.yml` | 7 serviços (5 no padrão) | **remover**; binário + Caddy | sem Valkey/RustFS/OTel/worker/mailpit |

Adicionar:

- `src/modules/tasks` com `projects`, `items`, `comments`, `activities`;
- `src/modules/chat` com canais/mensagens/leituras e SSE;
- `src/modules/attachments` com upload local, validação e download;
- `LICENSE`, `NOTICE`, testes HTTP de auth/CSRF/chat/upload.

**Saldo estimado:** ~20 mil linhas e ~145 MB removidos; sobram ~8–10 mil linhas de plataforma + ~3 mil de tasks/chat/anexos. Não é “6 tabelas e um binário”: é “uma plataforma enxuta com quatro domínios” e ~11–13 tabelas ativas.

## 5. Acoplamentos que fazem a remoção doer

A remoção é possível, mas não é “apagar pastas”:

1. `src/db/schema.ts` importa **todos** os módulos/services; cada remoção exige editar o tipo `AppDatabase`.
2. `identity` depende de `cache` (rate limit), `jobs` (reset), `events` (login) e `audit`; remover os três primeiros exige mexer no login e nas rotas.
3. `system` depende de `cache`, `storage`, `seo` e `media`; precisa ser reescrito para health/readyz.
4. `src/layout/views/app-shell.tsx` importa `seo`; o shell precisa perder canonical/OG/sitemap.
5. `scripts/seed.ts` cria tenant, usuário, papéis, home, páginas, busca e mídia; precisa ser reescrito do zero.
6. `tests/integration/app_test.ts` afirma a lista completa de 20 services e 12 módulos; a suíte quebra até ser atualizada.
7. `docker-compose.yml`, `Dockerfile`, `Dockerfile.binary`, `.env.example`, `deploy/` e `.gitlab-ci.yml` carregam Valkey, RustFS, OTel, ffmpeg, editor e worker.
8. `scripts/gates.ts` valida env documentado e migrations; remover tabelas exige rebasear migrations (up-only) ou usar `gate:allow-drop`.
9. `src/kernel/http/security.ts` tem `/cms`, `/app` e `/maps` hardcoded; o fork precisa ajustar as áreas privadas.
10. `access` cria `admin`/`member`, mas **member tem permissões vazias**; para 2 papéis, `users.role` é menos código.
11. Não há CRUD de usuários: o seed cria o admin; para 10 pessoas, é preciso uma tela/rota de admin.
12. `MODULES=identity,system` **não remove** migrations, seed nem schema; ele só filtra o boot. Para o MVP, é preciso deletar de verdade.

Nada disso é um defeito do Somlos; é o custo de uma base que foi crescida para múltiplos produtos.

## 6. Qualidade e maturidade

**Pontos fortes observados:**

- TypeScript estrito (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), sem `any`, `console.log` em runtime ou `unwrap` casual.
- Fronteiras de módulo verificadas por gate; services e módulos descobertos por convenção, sem registro manual.
- SQLite com WAL, `BEGIN IMMEDIATE`, migrations checksum, backup/restore/doctor; `deno compile` e systemd.
- Auth defensivo: Argon2id, decoy hash contra enumeração, token opaco Blake3, CSRF, CSP sem inline, auditoria encadeada.
- Testes reais de unidade e integração; gates de migration/CSP/env.
- Documentação de decisões e um gerador de módulo (`deno task create:module`).

**Riscos e limites:**

- **Commit único e sem tags** — não há upstream estável para merge; um fork é um snapshot, não uma linha de atualização.
- **Deno 2.9 + TypeScript 6** — stack nova e veloz; a base depende do runtime e do `deno.lock`.
- **Rate limit fail-open** quando o Valkey cai (`cache.ts` devolve `allowed: true`); no fork sem Valkey, troque por limitador em memória.
- **Teste de integração compartilha `data/somlos_test.sqlite3`** e reseta o schema; não é isolamento por teste.
- **Sete serviços no Compose e 19 tabelas** para um produto de 10 pessoas; a operação é boa, mas desproporcional.
- **Domínio de produto já implementado** (CMS, mídia, assinatura) — 65% do código é ruído para o meraki.
- **Sem UI de usuários**; o admin é API JWT de papéis, não uma tela de equipe.
- **Sem chat/SSE** — módulo novo; sem WebSocket hoje.
- **Storage é S3/RustFS** — o adaptador local e a validação/re-encode de anexos são trabalho novo.

## 7. Matriz de decisão

Notas de 1 a 5, sem a licença como portão:

| Critério | Nota | Leitura |
|---|---:|---|
| Licença | **5** | projeto do próprio titular; basta declarar a licença do derivado |
| Stack fit (se TS/Deno) | 4 | Hono/JSX/HTMX/SQLite + `deno compile` é coerente com o alvo |
| Stack fit (se Rust) | 1 | não atende |
| Segurança | 5 | sessão com hash, CSRF, CSP, Argon2, auditoria |
| Operação | 4 | binário/backup/doctor; sobra stack a remover |
| Adequação ao escopo | 3 | 19 tabelas/20 services; chat/anexos exigem módulos novos |
| Remoção | 3 | mecânica, mas toca schema, seed, testes, deploy |
| Testes/CI | 4 | gates reais; suíte completa cara |
| Manutenção futura | 3 | snapshot próprio; sem upstream, mas sob controle |
| Simplicidade final | 3 | boa após corte; pesada antes |

**Síntese:** como *plataforma*, é acima da média. Como *MVP de 10 pessoas*, é grande demais; o fork só vence porque o alvo exige binário/segurança e o corte é mais barato do que reconstruir auth/CSRF/CSP/backup.

## 8. Três caminhos

### A. Fork cirúrgico — recomendado

Manter:

- `src/kernel` (enxuto: sem OTel obrigatório);
- `src/services/auth`, `audit`, `tenancy` (fixo), `storage` (adaptador local);
- `src/modules/identity` (login/sessão/usuários; sem reset/JWT de API);
- `src/modules/system` (health/readyz);
- `src/layout` (shell, formulários, componentes);
- `scripts/migrate.ts`, `backup.ts`, `restore.ts`, `doctor.ts`, `gates.ts`;
- `deploy/`, `Dockerfile.binary`, Caddy.

Remover:

- todos os módulos de produto (`cms`, `pages`, `noticias`, `contacts`, `gallery`, `media`, `maps`, `signature`, `demo`, `admin`);
- todos os services de produto (`media`, `mail`, `pdf`, `signature`, `maps`, `search`, `seo`, `feed`, `importer`, `richtext`, `blocks`);
- `cache`, `jobs`, `events` e `access`, substituindo por: rate limit em memória, `users.role` e `activities` no módulo de tarefas;
- `v7_example`, docs/ADRs de produto, assets de mapa/editor;
- Valkey, RustFS, OTel, worker e mailpit do Compose.

Adicionar:

- módulo `tasks` com `projects`, `items`, `comments`, `activities`;
- módulo `chat` com canais, mensagens, leituras e SSE;
- módulo `attachments` com storage local, validação/re-encode e download auth;
- admin de usuários no `identity` (criar, desativar, redefinir senha);
- as três views (lista, quadro, calendário) + `Minhas tarefas` + chat;
- migrations baseline novas (sem dados de produção): `0001_core`, `0002_tasks`, `0003_chat`, `0004_attachments`;
- seed mínimo (tenant, admin, projeto exemplo, canal Geral).

**Resultado:** ~8–10 mil linhas de plataforma + ~3 mil do domínio; um processo + Caddy; SQLite + disco local. Ainda maior que um MVP Rust do zero, mas com auth/CSRF/auditoria/migrations/backup/CI/binário prontos.

### B. Extração de padrões — fallback se Rust for requisito

Não faça fork. Use o Somlos como **referência de engenharia**:

- copie o desenho de sessão opaca + CSRF + Argon2 + decoy hash;
- copie o padrão de migrations up-only com checksum e backup antes de migrar;
- copie o `doctor`/`restore`/healthcheck e o shell JSX/HTMX;
- mantenha as ADRs de simplicidade, schema na raiz e portas transacionais como inspiração;
- construa o domínio em Rust/Askama/SQLite conforme o panorama;
- implemente chat com SSE e anexos locais com `image`/`sha2`.

Custo: reimplementar auth/ops; benefício: stack e escopo sob controle, sem 20 mil linhas para remover.

### C. Fork integral + `MODULES=identity,system` — só para protótipo

Sobe rápido com a base inteira e filtra o boot. **Não serve para produção do meraki**:

- as 19 tabelas e 18 migrations continuam;
- seed e schema continuam importando páginas/mídia;
- Compose continua exigindo Valkey/RustFS/worker;
- o binário continua com todo o produto;
- a superfície de segurança/operacional permanece.

Útil para explorar o shell/HTMX em uma tarde; não é a base final.

## 9. Sequência de corte, se optar pelo fork

1. **Congele** o commit `96ade82` em um branch/repositório próprio; adicione `LICENSE` e `NOTICE`.
2. Delete `v7_example`, `implementaion`, ADRs de produto, assets de mapa/editor.
3. Delete os módulos/services da §4 e reescreva `src/db/schema.ts`, `src/runtime.ts`, `src/main.ts`, `src/app.tsx`, `scripts/seed.ts`.
4. Rebase as migrations em uma baseline limpa (não há dados de produção): `core`, `tasks`, `chat`, `attachments`.
5. Reduza `docker-compose.yml`/`Dockerfile.binary` a binário + Caddy; remova worker, Valkey, RustFS, OTel, ffmpeg.
6. Reduza `.env.example`, `deno.json`, `.gitlab-ci.yml`; regenere `deno.lock`.
7. Adapte `storage` para disco local e crie `attachments`; implemente validação/re-encode e download auth.
8. Gere `tasks` com `deno task create:module tasks`; implemente domínio e views.
9. Gere `chat`; implemente SSE + POST, canais, não lidos, rate limit.
10. Reescreva os testes de integração; mantenha gates de fronteira/CSP/migrations.
11. Rode `deno task check`, testes, `build:bin`, smoke real de duas sessões, backup/restore.

## 10. Veredito final

- **É viável fazer fork?** Sim; a base é bem construída, modular, testada e agora é do titular.
- **É viável usar como está?** Não: 19 tabelas, 20 services e Compose com Valkey/RustFS/OTel contrariam o alvo.
- **É o caminho mais simples?** Para **um binário seguro com chat/anexos** e time que aceita Deno/TS, sim: evita reconstruir auth/CSRF/CSP/migrations/backup. Para um time Rust-first, não.
- **Qual o maior risco?** O corte tocar schema/seed/testes/deploy e o novo módulo de chat — não a licença.
- **Recomendação:** **(A) fork cirúrgico** com Deno/TS; **(B) extração de padrões** em Rust se Deno/TS não for aceitável; **(C) fork integral** apenas como protótipo.
