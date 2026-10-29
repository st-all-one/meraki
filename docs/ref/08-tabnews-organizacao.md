# TabNews — referência de organização

> O TabNews é uma boa referência de **organização de código**, não de stack. É Next.js + React + Postgres + Vercel, com ISR/SWR, e **não** atende ao alvo do meraki (binário único, SQLite, chat, anexos locais). O valor está no contrato entre rota, domínio, validação, autorização, erros e testes.
>
> Base: `_REF/tabnews.com.br` (MIT; package `1.0.0`, Next 16, React 19, Postgres). Caminhos relativos à raiz do repo.

## 1. Estrutura que vale copiar

| Camada | Caminho | Papel |
|---|---|---|
| Rota/página | `pages/**/index.jsx` | 1 arquivo = 1 rota; busca dados, filtra saída, renderiza |
| API | `pages/api/v1/**/index.js` | 1 arquivo = 1 rota HTTP; middleware → validação → autorização → handler |
| Domínio | `models/*.js` | funções explícitas e SQL; sem ORM/repository genérico |
| Infra | `infra/*.js` | DB, logger, webserver, migrator, e-mail |
| Queries de leitura | `queries/*.js` | SQL complexo de ranking/prestígio fora dos models |
| Erros | `errors/*.js` | classes com status, `error_id`, `key` |
| UI de produto | `interface/components/**` | componente por diretório + CSS Module |
| Primitivas | `packages/ui`, `packages/forms`, `packages/helpers` | UI, campos, helpers puros |
| Testes | `tests/integration/api/v1/**`, `tests/unit/**` | fluxos HTTP e unidades, espelhando a estrutura |
| Migrations/seed | `infra/migrations/**`, `infra/scripts/seed-database.js` | SQL versionado; seed idempotente |

O ponto forte é a **rota fina**: `pages/api/v1/users/index.js` compõe middlewares, valida com `validator`, filtra entrada/saída com `authorization`, chama `user.create` e responde. A regra não fica no handler.

## 2. Domínio e dados

- `models/content.js` (1.106 linhas) concentra criação/update, árvore, ranking, firewall e regras; `models/user.js` (599), `models/session.js` (173). Não há “service”/“use case” por operação.
- SQL é explícito e legível; `infra/database.js` expõe `query`, `transaction`, `getNewClient`.
- Migrations em `infra/migrations/` com `node-pg-migrate`; tabela de controle; seed separado.
- `models/validator.js` centraliza schemas Joi, limites por campo, `stripUnknown`, mensagens em pt-BR.
- `models/authorization.js` faz `can`, `filterInput` e `filterOutput` por allowlist; é a defesa mais copiável.
- `models/controller.js` padroniza erro público `{message, action, error_id, key}`, request id, logs com redação e paginação.

**Não copiar:** Postgres-specific (`pg`, pool, stored procedures de firewall), `ssl.rejectUnauthorized:false`, CORS `*`, ausência de CSP, sessão em claro, `revalidate`/ISR. Em SQLite/binário único, o equivalente é SQL explícito + transações curtas + limite em memória.

## 3. UI e formulários

- Página fina → componente de produto (`interface/components`) → primitiva (`packages/ui`). A fronteira é imposta por lint: só `packages/ui` importa Primer.
- Formulários: config declarativa por página + `useForm` + campos como **funções puras** (`packages/forms/src/fields/*.js`); o servidor reusa validações simples.
- Erros da API têm `key`; a UI mapeia para o campo, senão para uma mensagem global (`interface/utils/error-message.js`).
- CSS Modules + tokens; 3 breakpoints (`544`, `768`, `1012`); `EmptyState` centralizado; `Pagination` degrada para texto.
- URL como estado de paginação/filtro; redirects canônicos em `next.config.js`.

**Não copiar:** `useForm`/`useConfig`/`useMergedState`/processors, SWR/ISR, `useMediaQuery` decidindo markup, `localStorage` de sessão/rascunho, markdown/editor no cliente, NDJSON, barris em cadeia. Para 10 pessoas e server-side, isso é estado duplicado e dependência.

## 4. Segurança e operação

### Copiar

- Sessão em cookie `HttpOnly; Secure; SameSite=Lax; Path=/`; renovação e logout revogam.
- CSRF: para métodos não seguros com cookie, validar `Sec-Fetch-Site`/`Origin`; exigir content-type de formulário. Teste de matriz em `tests/integration/api/v1/_use-cases/csrf-protection.test.js`.
- `Cache-Control: no-store` em respostas autenticadas; nunca `Set-Cookie` em resposta cacheável (`models/cache-control.js`).
- Erros públicos com `error_id`/request id; logs redigem `authorization`, `cookie`, `email`, `password` (`models/controller.js`, `infra/logger.js`).
- Limites de validação no schema **e** no banco; health/status com dependência real e 503.
- Teste que cruza rotas × política de cache (`tests/api-routes.js`, `cache-control.test.js`).

### Não copiar

- Token de sessão em claro no banco (`models/session.js`): no meraki/Somlos, hash (Blake3/SHA-256) no banco.
- CSP ausente (`next.config.js` tem `// TODO`), CORS `*` em `/api`, `X-XSS-Protection` obsoleto, `X-Powered-By` falso.
- Firewall/rate limit em plpgsql; em SQLite use contador em memória por processo.
- Login sem rate limit/backoff forte; `ENUMERATION_DELAY_MS` default 0.
- Testes de integração com `isolate:false` e banco compartilhado; no meraki, um SQLite temporário por suíte.
- Vercel/Axiom/MailCatcher/Umami; no meraki, binário + systemd + Caddy.

## 5. O que o TabNews não resolve

- **Chat:** não existe SSE/WebSocket nem tabela de mensagens.
- **Anexos:** não há upload em lugar nenhum; a API rejeita `multipart/form-data` (415). Não há padrão para copiar.
- **Binário único/SQLite:** a stack é Next/Postgres; não serve como base.
- **Acessibilidade:** há muitos `aria-*`, mas nenhum teste automatizado de axe; cobertura manual.

Para chat/anexos, o padrão está no [`05-arquitetura-single-binary.md`](../05-arquitetura-single-binary.md): SSE + POST, canais Geral/projeto, storage local com validação/re-encode e download auth.

## 6. Tradução para o meraki/Somlos

| TabNews | Meraki |
|---|---|
| `pages/api/v1/users/index.js` | `src/modules/identity/http/routes.tsx` (rota fina) |
| `models/user.js` | `src/modules/identity/application` + `infrastructure` |
| `infra/database.js` | `src/kernel/db` + Kysely/SQLite |
| `queries/rankingQueries.js` | queries de leitura no módulo, sem “repository” genérico |
| `errors/*.js` | um erro público único no kernel |
| `interface/components/**` | `src/layout` + views do módulo |
| `packages/forms` | validação Zod no boundary + HTML; sem estado React |
| `tests/integration/api/v1/**` | `tests/http/**` com SQLite temporário |
| `infra/migrations` | migrations embutidas no binário |
| `next.config.js` headers | CSP/headers do kernel do Somlos |

**Regra:** copie o contrato, não o código. O TabNews organiza bem porque cada rota é fina, cada erro tem um formato e cada regra tem um lugar; é isso que o meraki deve reproduzir — com um binário, SQLite e menos camadas.

## 7. Evidências principais

- `pages/api/v1/users/index.js:1-99` — rota fina + validação + autorização + criação.
- `models/authorization.js:5-111` — `can`, `filterInput`, `filterOutput`.
- `models/authentication.js:69-105` — CSRF por `Sec-Fetch-Site`/`Origin`.
- `models/session.js:11-46` — token/cookie (não copiar token em claro).
- `models/validator.js:47-112` — Joi, limites, `stripUnknown`.
- `models/controller.js` — erro público/logs/redação.
- `next.config.js:97-170` — headers, CORS, cache; CSP ausente.
- `packages/forms/src/useForm.js:15-147`; `packages/forms/src/fields/email.js` — formulário como dado.
- `interface/components/ContentList/index.module.css` — tokens/breakpoints.
- `tests/integration/api/v1/_use-cases/csrf-protection.test.js`; `tests/api-routes.js`; `tests/integration/api/v1/cache-control.test.js` — testes de segurança.
- `tests/orchestrator.js:1-143` — serviços, migrations e seed de teste.
