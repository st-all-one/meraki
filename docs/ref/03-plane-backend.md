# Plane — backend Django, ciclo de request, dados e tempo real

> Camada de engenharia; complementa `plane-data-model.md` (entidades/permissões/views) e
> `plane-ui-ux.md` (front). Caminhos relativos a `_REF/plane/`. Versão do repo: 1.5.0
> (`package.json:3`). Sem evidência direta no código, o texto marca `[INFERENCE]`.

## 1. Stack exato

| Item | Valor | Evidência |
|---|---|---|
| Python | `>=3.12,<3.13` | `apps/api/pyproject.toml:5` |
| Django / DRF | 5.2.17 / 3.18.3 | `pyproject.toml:8,10` |
| Postgres driver | `psycopg==3.3.4` (psycopg-c em prod, binary em dev) | `pyproject.toml:13,87-103` |
| Celery | 5.5.3 + `django_celery_beat` 2.9 + `django-celery-results` 2.6 | `pyproject.toml:21-23` |
| Redis | `redis==5.0.4`, `django-redis==7.0.0` | `pyproject.toml:16-17` |
| ASGI | `channels==4.3.2` — só `ProtocolTypeRouter({"http": ...})` | `pyproject.toml:39`, `plane/asgi.py:18` |
| Servidor | `gunicorn==23.0.0` + `uvicorn==0.29.0` (worker) | `pyproject.toml:37,89` |
| Arquivos | `boto3==1.34.96`, `django-storages==1.14.6`, `whitenoise==6.12.0` | `pyproject.toml:25,33,57` |
| HTML | `nh3==0.2.18` (+ bs4 4.12.3, lxml 6.1.0) | `pyproject.toml:81,51,55` |
| JWT / senha | `PyJWT==2.15.1`; `zxcvbn==4.4.28` | `pyproject.toml:71,67` |
| OpenAPI / APM | `drf-spectacular==0.29.0`; `scout-apm==3.5.3`; OTel 1.28.1 | `pyproject.toml:73-79,45` |

Gerenciador: **uv** com versão travada (`required-version = "==0.12.21"`, `pyproject.toml:119`) e
`uv.lock`; grupos `production` (gunicorn+psycopg-c), `dev`, `test` (`pyproject.toml:84-114`).
Não há `requirements/*` — `Dockerfile.api:36-54` instala com `uv sync --locked ... --group production`
em `python:3.12.12-alpine`.

`docker-compose.yml` sobe: `api` (gunicorn/UvicornWorker em `plane.asgi`, `:37-50`), `worker`
(`:52-66`), `beat-worker` (`:68-82`), `migrator` (`:84-97`), `live` (Node/Hocuspocus, `:99-106`),
`postgres:15.7-alpine` com `max_connections=1000` (`:108-121`), `valkey/valkey:7.2.11` (`:123-129`),
`rabbitmq:3.13.6` (`:130-141`), MinIO (`:143-153`), `proxy` Caddy (`:155-172`), `web/admin/space`
(`:2-33`). O proxy roteia `/api/*` e `/auth/*` para `api:8000`, `/live/*` para `live:3000`
(`apps/proxy/Caddyfile.ce:16-35`) e impõe `request_body { max_size {$FILE_SIZE_LIMIT} }` no topo
(`:2-4`).

Entrypoint da API, antes de servir: `wait_for_db`, `wait_for_migrations`, `register_instance`
(hash de hostname+MAC+CPU+memória+disco), `configure_instance`, `create_bucket`, `clear_cache`,
`collectstatic` (`apps/api/bin/docker-entrypoint-api.sh:3-36`); gunicorn com
`--max-requests 1200 --max-requests-jitter 1000` (`:38`). Worker/beat: `celery -A plane
worker|beat -l info` (`bin/docker-entrypoint-worker.sh:8`, `...-beat.sh:8`).

Settings: `common.py` (base), `local.py` (`DEBUG=1`, debug toolbar anexado ao **fim** da lista,
`:11-21`), `production.py` (Scout + logging JSON console/arquivo, `:17-98`), `test.py` (locmem,
`:9-16`). Variáveis relevantes: `SECRET_KEY` (fallback aleatório + alerta para placeholders,
`common.py:31-49`), `ALLOWED_HOSTS` default `"*"` (`:95`), `DATABASE_URL`,
`ENABLE_READ_REPLICA` (`:228-245`), `REDIS_URL`, `AMQP_URL`/`RABBITMQ_*`, `AWS_*`/`MINIO_ENDPOINT_URL`,
`WEB_URL`/`APP_BASE_URL`/`ADMIN_BASE_URL`/`SPACE_BASE_URL`/`LIVE_BASE_URL`, `COOKIE_DOMAIN`,
`FILE_SIZE_LIMIT` (5 MiB), `HARD_DELETE_AFTER_DAYS` (60), `API_KEY_RATE_LIMIT`,
`AUTHENTICATION_RATE_LIMIT`, `WEBHOOK_ALLOWED_IPS|HOSTS|DISALLOWED_DOMAINS`, `NUM_PROXIES`,
`SIGNED_URL_EXPIRATION`, `ENABLE_DRF_SPECTACULAR`.

Front: Node `>=22.22`, pnpm 11.10.0, Turbo 2.10.11 (`package.json:44-49`); `web` em
react-router 8.3.0 / React 19.2.8 (`pnpm-workspace.yaml:156,146`); `live` em Hocuspocus 3.4.4 com
build `tsdown` (`apps/live/package.json:16-18`, `pnpm-workspace.yaml:22-26`).

## 2. Bootstrap e ciclo de request/resposta

`plane/urls.py:17-30` define cinco superfícies:

```python
path("api/", include("plane.app.urls"))              # app interna (cookie)
path("api/public/", include("plane.space.urls"))     # deploy boards públicos
path("api/instances/", include("plane.license.urls"))# admin de instância
path("api/v1/", include("plane.api.urls"))           # API externa (X-Api-Key)
path("auth/", include("plane.authentication.urls"))
path("", include("plane.web.urls"))                  # health + robots
```

OpenAPI só quando `ENABLE_DRF_SPECTACULAR=1` (`urls.py:33-45`, `common.py:602-607`). `plane/web/urls.py:8`
expõe `/` (`{"status":"OK"}`) e `/robots.txt`.

### 2.1 Ordem de middlewares

`common.py:122-136`, na ordem de execução:

| # | Middleware | Efeito |
|---|---|---|
| 1 | `corsheaders.CorsMiddleware` | `CORS_ALLOW_CREDENTIALS=True`, header extra `X-API-Key` (`:190-199`) |
| 2 | `django.middleware.security.SecurityMiddleware` | headers do Django (sem CSP) |
| 3 | `whitenoise.WhiteNoiseMiddleware` | estáticos servidos pelo gunicorn (`:331`) |
| 4 | `plane.authentication.middleware.session.SessionMiddleware` | **substitui** o do Django; cookie `admin-session-id` se o path contém `instances` (`session.py:22-27`) |
| 5 | `django.middleware.common.CommonMiddleware` | path/slash |
| 6 | `django.middleware.csrf.CsrfViewMiddleware` | CSRF das views de formulário em `/auth/` |
| 7 | `django.contrib.auth.middleware.AuthenticationMiddleware` | popula `request.user` |
| 8 | `django.middleware.clickjacking.XFrameOptionsMiddleware` | `X-Frame-Options` |
| 9 | `crum.CurrentRequestUserMiddleware` | thread-local lido por `BaseModel.save()` (`db/models/base.py:23-44`) |
| 10 | `django.middleware.gzip.GZipMiddleware` | gzip de resposta |
| 11 | `plane.middleware.request_body_size.RequestBodySizeLimitMiddleware` | `RequestDataTooBig` → **413** (`middleware/request_body_size.py:9-31`) |
| 12 | `plane.middleware.logger.APITokenLogMiddleware` | loga `X-Api-Key` em `APIActivityLog` via Celery, headers sensíveis redigidos (`logger.py:80-158`) |
| 13 | `plane.middleware.logger.RequestLoggerMiddleware` | log `METHOD path status duration ip` (`logger.py:26-77`) |
| +14 | `plane.middleware.db_routing.ReadReplicaRoutingMiddleware` | só com `ENABLE_READ_REPLICA=1`, anexado ao fim (`common.py:245`) |

Achados: (a) o `SessionMiddleware` caseiro referencia `SESSION_COOKIE_PATH`/`SAMESITE`
(`session.py:49-90`) que o Plane não define (`common.py:420-428`) — valem defaults do Django
(`"/"`, `"Lax"`) `[INFERENCE]`; (b) `request_body_size` (#11) precisa vir antes de `APITokenLog`
(#12), que lê `request.body` (`logger.py:89`) — e esse logger lê o corpo de **toda** requisição,
mesmo sem API key; (c) debug toolbar em `local.py` fica o mais externo.

### 2.2 Bases de view

| Base | Arquivo | Auth padrão |
|---|---|---|
| `app.views.base.BaseViewSet/BaseAPIView` | `app/views/base.py:67-367` | `BaseSessionAuthentication` + `IsAuthenticated` |
| `api.views.base.*` (v1) | `api/views/base.py:52-278` | `APIKeyAuthentication` + `ApiKeyRateThrottle` obrigatório (`:69-70`) |
| `space.views.base.*` (público) | `space/views/base.py:62-199` | `BaseSessionAuthentication`; views públicas com `AllowAny` |

`app/views/base.py` tem um guard raro: se o router mapeia um verbo para uma ação servida por mixin
do DRF e as permissões efetivas são `IsAuthenticated`/`AllowAny`, responde **405** em vez de operar
no queryset (`:103-198`). `TimezoneMixin.initial` ativa `user_timezone` antes da view (`:34-45`),
afetando lookups `__date` e agrupamentos.

### 2.3 Resolução de workspace: não existe `request.workspace`

Multi-tenancy é **escopo de query**: `workspace_slug` vem do kwarg `slug`
(`app/views/base.py:255-257`), cada queryset repete `workspace__slug` (`issue/base.py:219-225`,
`notification/base.py:37-46`) e `allow_permission` resolve membership por slug+projeto
(`permissions/base.py:59-93`). `grep -rn "request.workspace"` só encontra testes — logo, esquecer o
filtro em uma query é vazamento entre workspaces. `WorkspaceBaseModel`/`ProjectBaseModel` derivam o
workspace na **escrita** (`workspace.py:185-195`, `project.py:230-239`), não na leitura.

### 2.4 Soft delete sem middleware

Filtro implícito no manager (`db/mixins.py:48-89`):

```python
class SoftDeletionManager(models.Manager):
    def get_queryset(self):
        return SoftDeletionQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)
```

`Model.delete()` grava `deleted_at` e dispara `soft_delete_related_objects.delay(...)`
(`mixins.py:72-82`), que propaga em cascata respeitando `DO_NOTHING`/`SET_NULL`/`CASCADE`
(`bgtasks/deletion_task.py:17-105`); hard delete após 60 dias via beat
(`deletion_task.py:113-193`, `celery.py:61-64`). Entre o delete e a task, filhos permanecem
visíveis (janela de inconsistência).

### 2.5 Diagrama: leitura autenticada por cookie

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant P as Caddy
    participant G as gunicorn
    participant V as BaseViewSet
    participant PG as Postgres
    participant C as RabbitMQ
    B->>P: GET /api/workspaces/acme/projects/:pid/issues/?per_page=50
    P->>G: proxy_pass /api/* (Caddyfile.ce:22)
    G->>G: CORS → Security → WhiteNoise → SessionMiddleware(cookie session-id)
    G->>G: Common → CSRF → AuthMiddleware(user) → XFrame → crum → GZip
    G->>G: BodySizeLimit → APITokenLog(sem header: no-op) → RequestLogger
    G->>V: dispatch → initial(): autentica + IsAuthenticated
    V->>V: ativa user_timezone; guard de ação de mixin
    V->>V: allow_permission([ADMIN,MEMBER,GUEST]) em ProjectMember
    V->>PG: issues + annotate(cycle_id, counts) + filtros + group_by
    V->>C: recent_visited_task.delay(...)
    V-->>B: JSON paginado (cursor/per_page/total_count)
```

## 3. Autenticação e sessão

### 3.1 Métodos

| Método | Rotas | Implementação | Nota |
|---|---|---|---|
| E-mail+senha | `/auth/sign-in/`, `/auth/sign-up/` | `views/app/email.py:27-244`, `provider/credentials/email.py:18-96` | `django.views.View`; resposta é **302** com código de erro |
| Magic code | `/auth/magic-{generate,sign-in,sign-up}/` | `views/app/magic.py`, `provider/credentials/magic_code.py` | Redis, TTL 600 s |
| Google | `/auth/google/` + `/callback/` | `provider/oauth/google.py` | exige `verified_email is True` (`:108-112`) |
| GitHub | idem | `provider/oauth/github.py` | e-mail **primary+verified** (`:120-131`), org opcional (`:157-165`) |
| GitLab | idem | `provider/oauth/gitlab.py:22-45` | `GITLAB_HOST` configurável |
| Gitea | idem | `provider/oauth/gitea.py:22,58-59` | escopo `openid email profile read:user` |
| API token | `/api/v1/*` com `X-Api-Key` | `api/middleware/api_authentication.py:17-52` | só na API externa |
| Admin de instância | `/api/instances/*` | cookie `admin-session-id`, 1 h (`common.py:431-432`) | `InstanceAdminPermission` (`license/api/permissions/instance.py:12-18`) |
| Space público | `/api/public/anchor/<anchor>/…` | `AllowAny` + `DeployBoard` | escrita exige login (`space/views/issue.py:253-259`) |

**Não existem** MFA/TOTP, SAML, OIDC genérico, JWT de sessão, refresh token ou escopo de API key
(grep por `totp|mfa|saml|oidc` só acha `openid` do Gitea).

### 3.2 Sessão (cookie + tabela `sessions`)

`SESSION_ENGINE="plane.db.models.session"` (`common.py:424`). Tabela (`db/models/session.py:17-56`):
`session_key varchar(128)` PK gerada com `get_random_string(128)` (`:19,35-43`), `session_data`,
`expire_date`, `user_id varchar(50) db_index` copiado de `_auth_user_id` (`:20,45-51`) e
`device_info jsonb` (user_agent, IP, domínio) gravado por `user_login()`
(`authentication/utils/login.py:21-27`), que chama `auth.login()` e, no fluxo admin,
`set_expiry(ADMIN_SESSION_COOKIE_AGE)` (`:14-19`).

Cookies (`common.py:406-439`): nome `session-id`, 7 dias, `HttpOnly`; `Secure` se
`WEB_URL`/`APP_BASE_URL` for https ou se **todos** os CORS origins forem https
(`_cookies_secure`, `:406-422`); domínio opcional via `COOKIE_DOMAIN`. `CSRF_COOKIE_HTTPONLY=True`
⇒ o SPA busca o token em `GET /auth/get-csrf-token/` (`views/common.py:29-36`) e injeta em
`<input name="csrfmiddlewaretoken">` (`apps/web/components/account/auth-forms/password.tsx:120-162`).

Não há lista de revogação: `logout()` apaga a sessão corrente; trocar senha chama `set_password` +
`user_login` (`views/common.py:93-98`), mas não invalida outros dispositivos. `user.token_updated_at`
regenera `user.token` (`db/models/user.py:173-175`), que não autentica nada.

### 3.3 Fluxo de login por senha

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant A as View /auth/sign-in/
    participant T as AuthenticationThrottle (Redis)
    participant E as EmailProvider
    participant U as users
    participant S as sessions
    B->>B: GET /auth/get-csrf-token/
    B->>A: POST form (email, password, csrfmiddlewaretoken, next_path?)
    A->>T: throttle 10/min por IP, antes de qualquer query (rate_limit.py:62-95)
    A->>A: Instance.is_setup_done + validate_email
    A->>U: User.objects.filter(email=...)
    A->>E: EmailProvider(key, code, is_signup=False)
    E->>E: ENABLE_EMAIL_PASSWORD != "0" (email.py:27-38)
    E->>U: user.check_password()
    E->>U: complete_login_or_signup(): bloqueia conta desativada e bot (adapter/base.py:317-342)
    E->>U: save_user_data(): last_login_time/ip/uagent, is_active=True (:231-251)
    A->>S: user_login(): login() + device_info + save()
    A-->>B: 302 next_path validado ou get_redirection_path(user)
```

Erros nunca são 400: viram 302 com `error_code`/`error_message` na query (`views/app/email.py:92-137`),
códigos em `adapter/error.py:5-94` (`USER_DOES_NOT_EXIST=5060`, `PASSWORD_TOO_WEAK=5021`).
Redirect validado por `get_safe_redirect_url` (`utils/path_validator.py:105+`).

### 3.4 Fluxo OAuth (Google)

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant I as /auth/google/
    participant S as Sessão
    participant G as Google
    participant CB as /auth/google/callback/
    participant P as GoogleOAuthProvider
    B->>I: GET ?next_path=/acme/
    I->>S: host, next_path, state=uuid4().hex
    I-->>B: 302 auth_url (code, offline, prompt=consent, state)
    B->>G: consentimento
    G-->>CB: 302 ?code&state
    CB->>S: validate_oauth_state(): compare_digest + del state (uso único)
    CB->>P: provider(code)
    P->>G: POST /token + GET /oauth2/v2/userinfo
    P->>P: verified_email is True ou erro
    P->>P: complete_login_or_signup + Account.upsert(tokens)
    CB->>S: user_login() + device_info
    CB-->>B: 302 next_path ou redirection_path
```

Evidências: `views/app/google.py:28-99`, `utils/oauth_state.py:9-19`,
`provider/oauth/google.py:27-123`, `adapter/oauth.py:70-132`. `redirect_uri` é derivado do `Host`
(`google.py:50`), então com `ALLOWED_HOSTS="*"` (`common.py:95`) a validação efetiva depende do
proxy. Sync de perfil/avatar só com `ENABLE_*_SYNC=1` (`adapter/base.py:122-134`); o download do
avatar passa por cliente SSRF-safe com limite de bytes (`:136-229`).

### 3.5 Magic code, limites e política de senha

Dois contadores atômicos em Lua (`magic_code.py:40-46`): **4 códigos por e-mail em 600 s**, janela
fixa que não desliza (`:32-34,93-113`), e **5 tentativas por token**, após as quais o token é
invalidado (`:28,137-180`). TTL de 600 s (`:117`); o contador de tentativas herda o TTL do token com
clamp em 1 s (`:141-149`); sucesso apaga token e contadores (`:170-172`).

| Rate limit | Valor | Chave | Evidência |
|---|---|---|---|
| Auth (senha/magic/OAuth/change/reset) | `10/minute` (`AUTHENTICATION_RATE_LIMIT`) | IP | `rate_limit.py:26-34` |
| Verificação de e-mail | `3/hour` | usuário | `rate_limit.py:98-113` |
| Anônimo (DRF default) | `30/minute` | IP/ident | `common.py:141-145` |
| API key (v1) | `60/minute` (`API_KEY_RATE_LIMIT`) | valor da key | `api/rate_limit.py:12-50`, `common.py:163` |
| Asset por id | `5/minute` | `asset_id` | `throttles/asset.py:8-15` |

Senha: `zxcvbn(score) >= 3` avaliando no máximo 128 chars de cada ponta
(`authentication/utils/password.py:10-15`), além dos validators do Django (`common.py:294-299`);
reset expira em 3600 s (`:302`). `is_password_autoset=True` marca conta criada por OAuth/magic e é
pré-requisito do `SetUserPasswordEndpoint` (`views/common.py:101-139`). Convites usam JWT HS256 com
`SECRET_KEY` e payload `{email, timestamp}` (`workspace/invite.py:95-99`, `project/invite.py:96`),
**sem `exp`**.

### 3.6 API tokens

`plane_api_<uuid4hex>`, coluna `token` única e indexada, em texto puro (`db/models/api.py:19-20,31`).
Validação: `expired_at > now() OR IS NULL`, `is_active`, `user.is_active`; cada request faz
`UPDATE ... SET last_used=now()` (`api/middleware/api_authentication.py:29-43`). Só `/api/v1/`
usa `APIKeyAuthentication` (`api/views/base.py:53`); o app `/api/` usa sessão. Não há papéis por
token: o token herda o usuário inteiro.

## 4. Schema físico

### 4.1 Colunas comuns

`BaseModel` ← `AuditModel` ← (Time+User+SoftDelete) (`db/models/base.py:17-21`, `db/mixins.py:16-89`):
`id uuid PK` default `uuid4` (`base.py:18`), `created_at`/`updated_at timestamptz`
(`auto_now_add`/`auto_now`, `mixins.py:19-20`), `created_by_id`/`updated_by_id` FK→`users`
`ON DELETE SET NULL` preenchidos via `crum` (`mixins.py:29-44`, `base.py:23-44`), `deleted_at
timestamptz NULL` (`mixins.py:64`). Não há coluna de versão.

### 4.2 Tabelas centrais

| Tabela | Colunas-chave | Índices/constraints | Evidência |
|---|---|---|---|
| `workspaces` | `name(80)`, `slug(48) unique`, `owner_id`, `timezone`, `logo_asset_id` | slug único + `slug_validator` | `workspace.py:119-182` |
| `projects` | `name`, `identifier(12)`, `network smallint` (0/2), `timezone`, `archive_in/close_in`, `guest_view_all_features`, flags de feature | unique parcial `(identifier,workspace)`, `(name,workspace)`; `identifier` indexado | `project.py:68-167` |
| `states` | `name`, `color`, `slug`, `sequence float`, `group(20)`, `is_triage`, `default` | unique parcial `(name,project)` | `state.py:79-126` |
| `issues` | ver §4.4 | FKs indexadas pelo Django | `issue.py:104-178` |
| `issue_sequences` | `issue_id SET_NULL`, `sequence bigint` indexado, `deleted bool` | preserva numeração pós-delete | `issue.py:557-571` |
| `issue_assignees`/`_labels`/`_subscribers`/`_reactions`/`comment_reactions`/`_votes` | FKs + `deleted_at` | unique **parcial** `WHERE deleted_at IS NULL` (+ `unique_together` legado) | `issue.py:345-369,543-624,627-675` |
| `issue_activities` | `verb`, `field`, `old/new_value text`, `comment`, `attachments url[10]`, `actor SET_NULL`, `epoch float`, `old/new_identifier` | `issue_id` e `issue_comment_id` com **`DO_NOTHING`** | `issue.py:415-448` |
| `issue_comments` | `comment_html/json/stripped`, `attachments url[10]`, `access` (INTERNAL/EXTERNAL), `description_id` 1:1, `parent_id` | descrição 1:1 CASCADE | `issue.py:451-540` |
| `issue_links` | `url text`, `title`, `metadata jsonb` | — | `issue.py:371-385` |
| `issue_versions` | snapshot desnormalizado (`uuid[]` para assignees/labels/modules, `properties/meta jsonb`) | histórico/backfill | `issue.py:677-779` |
| `cycles`/`cycle_issues` | datas `timestamptz`, `sort_order float`, `progress_snapshot jsonb`, `version int` | unique parcial `(cycle,issue)` | `cycle.py:60-128` |
| `modules`/`module_issues`/`module_members` | `status`, `lead_id`, m2m por through | unique parcial `(name,project)`, `(issue,module)` | `module.py:67-172` |
| `labels` | `parent_id`, `name`, `color`, `sort_order`, `project_id` **nullable** | 2 parciais: `(name) WHERE project IS NULL` e `(project,name)` | `label.py:11-57` |
| `notifications` | `data jsonb`, `entity_identifier`, `entity_name`, `sender` (string), `read_at/snoozed_till/archived_at` | 9 índices, 5 começando por `receiver` | `notification.py:13-65` |
| `pages`/`page_versions`/`project_pages`/`page_logs` | `description_binary bytea`, `access` (0 público/1 privado), `is_locked`, `moved_to_*`, `sort_order` | `page_logs` com 5 índices | `page.py:23-181` |
| `issue_views` | `query jsonb` derivado, 4 campos `jsonb` de filtros/display, `access`, `owned_by` | `query` recalculado no save | `view.py:58-98` |
| `estimates`/`estimate_points` | `type` (categories/points), `key int>=0`, `value` | unique parcial `(name,project)` | `estimate.py:18-57` |
| `intakes`/`intake_issues` | `status int` (-2…2), `snoozed_till`, `duplicate_to_id`, `extra jsonb` | índice **parcial** `(snoozed_till) WHERE status=0` | `intake.py:16-110`, migration `0124` |
| `file_assets` | `asset(800)`, `attributes jsonb`, `entity_type/identifier`, `is_uploaded/is_deleted`, `storage_metadata` | 4 índices (tipo, id, par, asset) | `asset.py:32-124` |
| `api_tokens` | `token(255) unique`, `expired_at`, `last_used`, `user_type`, `workspace_id` | token em texto puro | `api.py:23-47` |
| `sessions` | ver §3.2 | `user_id` indexado | `session.py:17-27` |
| `webhooks`/`webhook_logs` | `url`, flags por evento, `secret_key`, log request/response textual | unique parcial `(workspace,url)` | `webhook.py:34-91` |
| `descriptions`/`description_versions` | `description_json/html/binary/stripped` | 1:1 com comentário | `description.py:10-56` |

### 4.3 Padrões de integridade

Unicidade condicional é o padrão, sempre no mesmo formato (`issue.py:353-364`):

```python
models.UniqueConstraint(fields=["issue", "assignee"],
    condition=Q(deleted_at__isnull=True),
    name="issue_assignee_unique_issue_assignee_when_deleted_at_null")
```

O `unique_together` com `deleted_at` continua ao lado (`:354`), mas em Postgres
`UNIQUE(a,b,deleted_at)` não impede duplicatas com `deleted_at NULL` — só a constraint parcial vale.
`Label` foge do padrão por ter `project` nullable (duas parciais mutuamente exclusivas,
`label.py:27-40`). Relações bidirecionais são mapeadas em código, não em banco (`issue.py:283-293`).
`ON DELETE`: quase tudo `CASCADE`; exceções: `IssueActivity.issue|issue_comment` = `DO_NOTHING`
(`issue.py:416,424-429`), `IssueSequence.issue` = `SET_NULL` (`:558-563`). 126 migrations, com
índices pesados em `AddIndexConcurrently` + `atomic=False` (`0103…py:5-8`, `0111…py:5-8`,
`0124…py:5-13`).

### 4.4 DDL resumido de `issues` (`issue.py:104-178`)

```sql
CREATE TABLE issues (
  id uuid PRIMARY KEY, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  state_id uuid REFERENCES states(id) ON DELETE CASCADE,
  point integer CHECK (point BETWEEN 0 AND 12),
  estimate_point_id uuid REFERENCES estimate_points(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  description_json jsonb NOT NULL DEFAULT '{}',
  description_html text NOT NULL DEFAULT '<p></p>',
  description_stripped text, description_binary bytea,
  priority varchar(30) NOT NULL DEFAULT 'none',   -- urgent|high|medium|low|none
  start_date date, target_date date,
  sequence_id integer NOT NULL DEFAULT 1, sort_order double precision NOT NULL DEFAULT 65535,
  completed_at timestamptz, archived_at date, is_draft boolean NOT NULL DEFAULT false,
  external_source varchar(255), external_id varchar(255),
  type_id uuid REFERENCES issue_types(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX issue_assignee_unique_issue_assignee_when_deleted_at_null
  ON issue_assignees (issue_id, assignee_id) WHERE deleted_at IS NULL;
```

Não existe composto `(project_id, state_id)` nem `(project_id, archived_at)`, apesar de o
`IssueManager` filtrar `state__group`, `archived_at`, `project__archived_at` e `is_draft` em toda
listagem (`issue.py:92-101`) — só os índices automáticos de FK `[INFERENCE]` sobre o custo.

### 4.5 Numeração, ordem e JSON

`sequence_id` é por projeto, com `issue_sequences` como fonte de verdade (`issue.py:196-214`) e
comando de reparo de duplicatas (`db/management/commands/fix_duplicate_sequences.py:27-57`).
`sort_order float` com passo 10000/base 65535: append em `max+10000` (`issue.py:206-210`), ciclos/
módulos/labels novos em `min-10000` (`cycle.py:88-97`, `module.py:115-124`, `label.py:46-54`), views
em `max+10000` (`view.py:83-93`); não há endpoint de reorder entre dois itens.
`JSONField` é usado como schema flexível (`filters`, `display_filters`, `display_properties`,
`rich_filters`) em `project.py:392-419`, `workspace.py:310-348`, `view.py:58-71`; `ArrayField`
aparece em `IssueActivity.attachments` e nas listas de `IssueVersion` (`issue.py:423,698-709`).

## 5. Camada de domínio

Não há service layer: lógica em views (`issue/base.py:405-491`), validação em serializers
(`api/serializers/issue.py:113-118`), utilitários em `plane/utils/**`. O `BaseSerializer` implementa
projeção `fields=` e expansão `expand=` com mapa fixo de serializers (`api/serializers/base.py:79-141`).

**`allow_permission`** (`app/permissions/base.py:19-103`) é o núcleo:

1. `creator=True` passa se `model.objects.filter(id=pk, created_by=user)` — **desde que** haja
   `WorkspaceMember` ativo e, fora de `level="WORKSPACE"`, `ProjectMember` ativo (`:24-53`);
2. `WORKSPACE`: `WorkspaceMember.role in allowed` (`:59-66`);
3. `PROJECT`: `ProjectMember.role in allowed` **ou** (`ProjectMember` ativo **e**
   `WorkspaceMember.role == ADMIN`) (`:67-93`);
4. senão `403 {"error": "You don't have the required permissions."}`.

Papéis: `ADMIN=20`, `MEMBER=15`, `GUEST=5` (`permissions/base.py:13-16`, `project.py:21-27`).
**`ProjectMember.role` default = 5 (GUEST)** (`project.py:269`): convidar sem papel cria guest.

Guest em projeto com `guest_view_all_features=False` só vê issues que criou: filtro na listagem
(`issue/base.py:311-322`), 403 no detalhe (`:601-615`) e helper único para sub-recursos
(`issue_hidden_from_guest`, `permissions/base.py:106-141`, usado em `comment.py:73-91`,
`attachment.py:37-45`).

Feature flags (`module_view`, `cycle_view`, `page_view`, `intake_view`, `is_time_tracking_enabled`,
`is_issue_type_enabled` — `project.py:95-102`) são de UI: nenhuma view nega acesso por elas
`[INFERENCE]` pela ausência de checagem.

Bootstrap: `POST /api/workspaces/` cria workspace + member admin + `workspace_seed.delay`
(`workspace/base.py:122-140`); `POST .../projects/` cria projeto, adiciona autor e `project_lead`
como admin e faz `bulk_create(DEFAULT_STATES)` com 6 estados (`project/base.py:258-296`,
`state.py:24-62`). Não há signal — qualquer outro caminho de criação precisa repetir isso.

**`Issue.save()`** é o ponto mais carregado (`issue.py:180-214`): advisory lock por projeto,
`max(sequence)+1`, `strip_tags(description_html)`, `max(sort_order)+10000`, insert + insert em
`issue_sequences`. Além disso `_ensure_default_state` (`:228-238`) e `_sync_completed_at`, que usa
`ChangeTrackerMixin` para ajustar `update_fields` (`:240-255`, `mixins.py:92-221`). Custo: 2
aggregates + 2 inserts por issue, serializados por projeto. `IssueComment.save()` mantém uma linha
em `descriptions` e a atualiza só quando `comment_html/json/stripped` mudam (`issue.py:481-530`).

Drafts ficam em `draft_issues` (+ tabelas through), fora de `issues` (`db/models/draft.py:16-…`);
`Issue.issue_objects` exclui `is_draft=True` (`issue.py:92-101`), então draft nunca aparece em
listagens.

Import/export real: export CSV/XLSX/JSON **implementado** (`ExporterHistory` + `issue_export_task`
gera zip no S3 e grava URL de 7 dias — `app/views/exporter/base.py:19-66`, `export_task.py:29-125`);
export de analytics por e-mail (`analytic_plot_export.py:349-416`); **import só framework**
(`db/models/importer.py:13`, `utils/porters/*`) — nenhuma rota registrada; `app/urls/external.py:17,22`
usa o nome `importer` para o AI assistant. Duplicação de página copia assets
(`app/urls/page.py:72-74`, `copy_s3_object.py:90-157`).

## 6. Consultas server-side

Dois sistemas de filtro convivem. **(a) Legacy `issue_filters()`** converte query params em dict de
lookups e aplica `.filter(**filters)` (`utils/issue_filters.py:428-463`), com 25 filtros e sintaxe
relativa de data `"2_weeks;after;fromnow"` (`:12,29-81`); UUIDs inválidos são descartados (`:16-25`).
**(b) `ComplexFilterBackend`** aceita `?filter=<json>` com `and/or/not` aninhados (profundidade ≤5) e
compõe `Q` (`utils/filters/filter_backend.py:20-98`), validando estrutura (`:313-409`), **allowlist
de campos** contra `filterset_class.base_filters` (`:100-127`) e tipos de valor (`:411-459`); o leaf
é reavaliado pelo `FilterSet`, que gera o `Q` em `build_combined_q()` (`filterset.py:55-110`) e
exclui relações soft-deleted (`:215-297`). Datas comparam `__date` no timezone ativo para não perder
o último dia do range (`filterset.py:171-189`).

Escopo de permissão fica na query: `workspace__slug`+`project_id` (`issue/base.py:219-225`),
`project__project_projectmember__member=user`+`is_active` (`comment.py:47-51`),
`receiver_id=user.id` (`notification/base.py:37-46`); guest é aplicado **depois** das anotações
(`issue/base.py:311-322`).

Ordenação/agrupamento usam allowlist (`order_queryset.py:18-132`). `sanitize_order_by` remove no
máximo um `-`, rejeita `--x` e cai em `-created_at` (`:135-157`). Traduções: `priority` →
`Case/When` (`:164-172`); `state__group` → `Case/When` (`:174-183`); `labels__name`,
`assignees__first_name`, `issue_module__module__name` → `Min()` (`:185-199`). `group_by`/
`sub_group_by` são validados contra `ISSUE_GROUP_BY_ALLOWLIST` antes de `F()`/`Window`
(`paginator.py:695-714`, cita `GHSA-wwgj-929g-42cm`).

Paginação: cursor `"value:offset:is_prev"` onde `value` é o page size (`paginator.py:22-59,685-693`),
`per_page ≤ 1000` e `> 0` (`:642-655`). `OffsetPaginator` fatia por `offset*limit` e faz `count()`
(`:125-189`); `GroupedOffsetPaginator` usa `Window(RowNumber(), partition_by=group)` (`:224-297`);
`SubGroupedOffsetPaginator` particiona por grupo+subgrupo (`:426-500`). Envelope único (`:739-755`):
`grouped_by`, `sub_grouped_by`, `total_count`, `next_cursor`, `prev_cursor`, `next_page_results`,
`prev_page_results`, `count`, `total_pages`, `total_results`, `extra_stats`, `results`. Custo por
página: 3–6 queries, pois o modo agrupado soma `count()`, `values(group).annotate(Count)` e
`values(group,subgroup).annotate(Count)` (`:277-289,480-491,502-518`).

N+1: `list` usa `apply_annotations` (subqueries para `cycle_id`, `link_count`,
`attachment_count`, `sub_issues_count` — `issue/base.py:227-263`) e `.values(...)` com
`label_ids/assignee_ids/module_ids` (`:176-203`); `retrieve` usa `select_related("state")` +
`prefetch_related` + `ArrayAgg`/`Coalesce` (`:497-589`). Mas `list` faz
`copy.deepcopy(queryset)` para contar sem joins (`:286-290`) e `total_count_queryset.count()` roda
separado (`paginator.py:160`).

Busca **não** é full-text (nenhum `SearchVector`/`GinIndex`/`search_vector`): `icontains` em `name`,
`project__identifier` e extração de `\b\d+\b` para `sequence_id` (`utils/issue_search.py:14-24`), e
o mesmo padrão em 8 entidades na busca global (`app/views/search/*.py:46-80`) — sem ranking e com
custo de varredura.

## 7. Escrita e concorrência

| Mecanismo | Onde | Detalhe |
|---|---|---|
| `pg_advisory_xact_lock(sha256(project_id))` | `Issue.save` (`issue.py:184-214`) | serializa criação por projeto |
| `transaction.atomic()` | `Issue.save`, `IssueComment.save`, `Project.save`, signup admin | `issue.py:185,503`, `project.py:225-227`, `admin.py:219` |
| `select_for_update()` | retiming de snoozes ao mudar timezone; primeiro admin de instância | `project.py:184-191`, `admin.py:221` |
| `bulk_create`/`bulk_update` | estados na criação de projeto, automação, atividades | `project/base.py:282-296`, `issue_automation_task.py:72`, `issue_activities_task.py:1630` |
| Lock Redis `SET NX EX` | envio de e-mail agrupado | `email_notification_task.py:34-43` |

**Sem concorrência otimista**: não há `version`, `If-Match`/`ETag` nem comparação de `updated_at`;
dois PATCH concorrentes → último vence (`partial=True`, `issue/base.py:680`). Pior: a task de
activity reescreve `updated_at` de forma assíncrona (`issue_activities_task.py:1578-1584`), gerando
`UPDATE` concorrente que pode mascarar a ordem real das edições.

Lote: `bulk-delete-issues` (ADMIN) apaga `CycleIssue`/`ModuleIssue` e delega ao soft delete
(`issue/base.py:775-799`); `bulk-archive-issues` (`archive.py:305+`), `bulk-create-labels`
(`label.py:90+`) e `issue-dates` (ADMIN/MEMBER, `issue/base.py:1108,1128`). A cascata de soft
delete vira **uma task por issue** (`mixins.py:78`). Duplicação de assets envolve Postgres+S3+live
(`copy_s3_object.py:90-157`).

Idempotência: webhooks são **at-least-once** (`autoretry_for=RequestException`, `retry_backoff=600`,
`max_retries=5`, `retry_jitter=True` — `webhook_task.py:235-241`), com
`X-Plane-Delivery: uuid4` (`:270`) mas sem dedupe no receptor; endpoints de escrita não têm
`Idempotency-Key`; o agrupador de e-mail marca `processed_at` antes do envio efetivo
(`email_notification_task.py:83-84`), perdendo notificações em falha.

## 8. Assíncrono e tempo real

**Celery** (`celery.py`): broker AMQP de `AMQP_URL` ou `amqp://user:pass@host:port/vhost`
(`common.py:354-366`), JSON (`:368-371`), timezone UTC, `CELERY_IMPORTS` com 9 módulos
(`:374-387`), `autodiscover_tasks()` e `DatabaseScheduler` (`celery.py:122-124`). Sem filas,
rotas, `acks_late` ou concorrência configuradas `[INFERENCE]`.

Tarefas (`shared_task`) por domínio: atividade/histórico (`issue_activity`,
`issue_description_version_task`, `sync_issue_version`, `track_page_version`, `page_transaction`);
notificação (`notifications`, `stack_email_notification`, `send_email_notification`); webhook
(`webhook_activity`, `webhook_send_task`, `model_activity`, `send_webhook_deactivation_email`);
arquivos (`delete_unuploaded_file_asset`, `get_asset_object_metadata`,
`copy_s3_objects_of_description_and_assets`, `crawl_work_item_link_title`); export
(`issue_export_task`, `analytic_export_task`, `export_analytics_to_csv_email`, `delete_old_s3_link`);
limpeza (`delete_api_logs|email_notification_logs|page_versions|issue_description_versions|webhook_logs`,
`soft_delete_related_objects`, `hard_delete`); automação (`archive_and_close_old_issues`,
`unsnooze_expired_intake_issues`); e-mail transacional (`forgot_password`, `magic_link`,
`workspace_invitation`, `project_invitation`, `project_add_user_email`, `user_activation_email`,
`user_deactivation_email`, `send_email_update_magic_code`, `send_email_update_confirmation`); outros
(`recent_visited_task`, `process_logs`, `create_dummy_data`, `workspace_seed`, `push_instance_metrics`).

Beat (`celery.py:46-101`): `*/5 min` → `stack_email_notification` e
`unsnooze_expired_intake_issues`; `METRICS_PUSH_INTERVAL_MINUTES` (360) → `push_instance_metrics`;
00:00 `hard_delete`; 01:00 `archive_and_close_old_issues`; 01:30 **e** 03:45 `delete_old_s3_link`
(duplicado); 02:00 `delete_unuploaded_file_asset`; 02:30 `delete_api_logs`; 02:45
`delete_email_notification_logs`; 03:00 `delete_page_versions`; 03:15
`delete_issue_description_versions`; 03:30 `delete_webhook_logs`. Retenção independente: API e
webhook logs 14 d, e-mail 7 d (`common.py:491-500`).

```mermaid
sequenceDiagram
    autonumber
    participant V as View PATCH /issues/:id
    participant Q as RabbitMQ
    participant A as issue_activity
    participant PG as Postgres
    participant N as notifications
    participant E as stack_email_notification (beat)
    participant W as model_activity → webhook_activity → webhook_send_task
    V->>V: serializer.save() (síncrono, transação)
    V->>Q: issue_activity.delay(...) + model_activity.delay(...)
    V-->>Cliente: 204 No Content
    Q->>A: bulk_create(IssueActivity) + UPDATE issues.updated_at
    A->>Q: notifications.delay(...)
    Q->>N: Notification + EmailNotificationLog
    Q->>E: agrupa por receiver, processed_at, enfileira envios
    Q->>W: diff JSON + HMAC X-Plane-Signature
```

A resposta 204 chega **antes** de existir `IssueActivity`: `GET .../history/` imediatamente após pode
não refletir a mudança (consistência eventual; o front compensa com estado otimista `[INFERENCE]`).

**Tempo real = `apps/live` (Hocuspocus+Yjs)**, nada além dele:

| Aspecto | Implementação | Evidência |
|---|---|---|
| Servidor | `Hocuspocus({onAuthenticate, onStateless, extensions, debounce: 10000})` | `live/src/hocuspocus.ts:39-52` |
| Transporte | Express+`express-ws` em `/live/collaboration/` | `live/src/server.ts:37-60`, `controllers/collaboration.controller.ts:19-31` |
| Middlewares | `helmet()`, `compression`, logger, `express.json`, CORS com lista explícita | `server.ts:61-84` |
| Auth | token `{id, cookie}` ou cookie do header → `GET /api/users/me/`; compara ids | `lib/auth.ts:29-88`, `services/user.service.ts:20-41` |
| Escopo | `documentType` (só `project_page`), `projectId`, `workspaceSlug` | `lib/auth.ts:76-82`, `services/page/handler.ts:11-21` |
| Persistência | store converte Yjs→`{binary,html,json}` e faz `PATCH /pages/<id>/description/`; load converte HTML→binário e salva | `extensions/database.ts:31-140`, `services/page/core.service.ts:28-140` |
| Multi-instância | `@hocuspocus/extension-redis` + Redlock; canal `hocuspocus:admin` | `extensions/redis.ts:22-63,93-175` |
| Título | observa `XmlFragment("title")` e sincroniza `name` com debounce | `extensions/title-sync.ts:70-130` |
| Outros | `POST /live/convert-document/` (Zod `rich`/`document`), `GET /live/health/` | `controllers/document.controller.ts:14-58`, `health.controller.ts:12-20` |
| Shutdown | fecha HTTP, `closeConnections()`, drena persistência (25 s), desconecta Redis | `server.ts:33,138-172` |
| Autorização | herdada do Django via cookie (`ProjectPagePermission`) | `services/page/project-page.service.ts:17-35` |

Não há SSE/WS para notificações ou issues — `asgi.py:18` só monta HTTP.

## 9. Busca, arquivos, cache, i18n, e-mail

Upload padrão é **presigned POST** com `content-length-range` e `Content-Type` fixos
(`settings/storage.py:68-102`), seguido de `PATCH` que marca `is_uploaded` e vincula à entidade
(`app/views/asset/v2.py:212-231`). Bucket com `AWS_DEFAULT_ACL="public-read"` e
`AWS_QUERYSTRING_AUTH=False` (`common.py:345-346`). Anexos v1 usam multipart + validator
`file_size` (`issue/attachment.py:35-69`, `issue.py:392-400`). Chaves:
`{workspace_id}/{uuid4().hex}-{nome_sanitizado}` (`db/models/asset.py:20-24`) com `sanitize_filename`
removendo control chars, `..`, barras e dotfiles (`path_validator.py:14-51`). Download:
`GET` valida upload e redireciona para URL assinada com `attachment` (`asset/v2.py:487-514`);
**inline** só para `image/jpeg|jpg|png|gif|webp`, com Content-Type fixado
(`storage.py:114-151`, `common.py:597`). O presigned do app aceita apenas 5 tipos de imagem
(`asset/v2.py:382-397`), embora `ATTACHMENT_MIME_TYPES` liste ~70 (`common.py:505-593`).
`/api/assets/v2/static/<id>/` é `AllowAny` e só serve avatar/cover/logo (`asset/v2.py:517-556`) —
o UUID é a única barreira.

Cache: Redis/django-redis (`common.py:273-291`, TLS verificado em `:253-271`). Usos: `@cache_response`
(2 h) em labels/estimates de workspace (`app/views/workspace/label.py:21`, `app/views/workspace/estimate.py:21`);
`Cache-Control: private, max-age=12` + `Vary: Cookie` em `/api/users/me/` (`user/base.py:82-92`);
invalidação explícita ao trocar avatar/logo/cover (`asset/v2.py:94-134,302-343`). Chave =
`"{path}:{user_id}"` (`utils/cache.py:16-22`) — com `user=False` o cache é **compartilhado entre
usuários**, só válido para dados públicos. Não há cache de listagens de issues nem de permissões.

i18n: backend `LANGUAGE_CODE="en-us"`, `USE_I18N=True` (`common.py:314-315`) e **zero chamadas
`gettext`**; tradução vive em `@plane/i18n`. Datas são convertidas por request com o timezone do
usuário (`user_timezone_converter`, `issue/base.py:204-205`).

E-mail: SMTP do Django (`common.py:325`; console em local, locmem em test). Credenciais vêm de
`instance_configurations` quando `SKIP_ENV_VAR=1`, com Fernet derivado de `SECRET_KEY`
(PBKDF2-SHA256/100k) — `license/utils/instance_value.py:17-39`, `encryption.py:13-43`. 15 templates
HTML em `apps/api/templates/emails/{auth,exports,invitations,notifications,user}`; envio por task
com `EmailMultiAlternatives` + versão texto (`webhook_task.py:206-228`); assunto sem caracteres de
controle (`email_notification_task.py:27-30`).

## 10. Contrato de API

| Prefixo | Auth | Versionamento |
|---|---|---|
| `/api/` | sessão | sem versão (evolui in-place; `v2` pontual em issues e assets) |
| `/api/public/` | `AllowAny`/sessão | `anchor` como capability |
| `/api/instances/` | sessão admin | sem versão |
| `/api/v1/` | `X-Api-Key` | versionado por prefixo |
| `/auth/` | anônimo + CSRF | sem versão |

Sucesso é JSON cru, sem envelope (`issue/base.py:206`); escritas geralmente `204` (`:715,742`).
Erros de negócio `{"error": "..."}` com 400/403/404/409 (`app/views/base.py:210-239`); validação
retorna mapa de campos (`issue/base.py:491`); auth em `/auth/` retorna 302 com código
(`views/app/email.py:130-137`); DRF usa `{"error_code","error_message"}` em 401/429
(`adapter/exception.py:17-33`); inesperado vira 500 genérico + log (`base.py:235-239`).
Listagens seguem o envelope de §6. Não há política de depreciação documentada.

`drf-spectacular` é opcional e documenta só `/api/v1/` (`settings/openapi.py:35`), com
`SCHEMA_COERCE_PATH_PK=False` para preservar `pk` (`common.py:150-151`) e decorators
`@extend_schema`/`@work_item_docs` nas views v1 (`api/views/issue.py:36-42,361-384`).

| Endpoint | Verbo | Auth | Autorização | Evidência |
|---|---|---|---|---|
| `/auth/sign-in/` | POST | anônimo+CSRF | throttle 10/min/IP | `views/app/email.py:31` |
| `/auth/google/`+`callback` | GET | anônimo | `state` de uso único | `google.py:48-52`, `oauth_state.py:9-19` |
| `/api/workspaces/` | POST | sessão | autenticado; `DISABLE_WORKSPACE_CREATION` | `workspace/base.py:82-123` |
| `/api/workspaces/<slug>/` | PATCH | sessão | `allow_permission([ADMIN], WORKSPACE)` | `workspace/base.py:157-159` |
| `/api/workspaces/<slug>/projects/` | GET | sessão | membro ativo (safe method) | `permissions/project.py:18-22` |
| `/api/workspaces/<slug>/projects/` | POST | sessão | `[ADMIN,MEMBER]` WORKSPACE | `project/base.py:258` |
| `.../projects/<pid>/issues/` | GET | sessão | ADMIN/MEMBER/GUEST + filtro guest | `issue/base.py:266,311-322` |
| `.../projects/<pid>/issues/` | POST | sessão | ADMIN/MEMBER | `issue/base.py:405` |
| `.../issues/<pk>/` | GET | sessão | ADMIN/MEMBER/GUEST + creator + regra guest | `issue/base.py:493,601-615` |
| `.../issues/<pk>/` | PATCH | sessão | ADMIN/MEMBER + creator | `issue/base.py:628` |
| `.../issues/<pk>/` | DELETE | sessão | **ADMIN** + creator | `issue/base.py:718` |
| `.../bulk-delete-issues/` | DELETE | sessão | ADMIN | `issue/base.py:776` |
| `.../issues/<id>/comments/` | GET/POST | sessão | ADMIN/MEMBER/GUEST + `issue_hidden_from_guest` | `issue/comment.py:68-94` |
| `.../issues/<id>/issue-attachments/` | POST | sessão | ADMIN/MEMBER/GUEST; valida issue↔projeto | `issue/attachment.py:37-69` |
| `/api/assets/v2/static/<id>/` | GET | **AllowAny** | 4 `entity_type` públicos | `asset/v2.py:517-543` |
| `/api/public/anchor/<anchor>/issues/<id>/` | GET | AllowAny | board ativo do projeto | `space/views/issue.py:107` |
| `/api/v1/.../projects/<pid>/issues/` | GET | `X-Api-Key` | `ProjectEntityPermission` | `api/views/issue.py:331-341` |
| `/api/users/me/` | GET | sessão | `request.user`; read replica | `app/views/user/base.py:64-86` |
| `/api/instances/configurations/` | GET/PATCH | sessão admin | `role>=15` | `license/api/permissions/instance.py:12-18` |

## 11. Segurança

**Origin check no lugar de CSRF nas APIs de cookie** (`authentication/session.py:56-63`):

```python
def enforce_csrf(self, request):
    if request.method in SAFE_METHODS: return
    if not is_allowed_origin(request):
        raise PermissionDenied("CSRF Failed: origin not allowed")
```

`is_allowed_origin` (`:38-53`): sem `Origin` ⇒ permitido (clientes não-browser, live server);
`null`/opaca ⇒ negado; mesmo host (compara só `host[:port]`, ignora esquema) ⇒ permitido; senão
precisa estar em `allowed_origins()` = `WEB_URL`, `APP_BASE_URL`, `ADMIN_BASE_URL`, `SPACE_BASE_URL`,
`LIVE_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` (`:26-35`). Achados: (a)
`@lru_cache(maxsize=None)` (`:26`) exige restart para mudar origens; (b) ignorar o esquema aceita
`http://` num site `https://` (mitigado por `Secure`+`SameSite` `[INFERENCE]`); (c) `Origin` ausente
ser aceito é o que viabiliza integrações server-side; (d) `CORS_ALLOW_ALL_ORIGINS=True` quando a
lista está vazia, com `CORS_ALLOW_CREDENTIALS=True` (`common.py:190-197`) — o check limita escritas,
mas `GET` cross-origin fica sujeito ao SameSite `[INFERENCE]`. As views de formulário em `/auth/`
continuam sob `CsrfViewMiddleware` (#6), com token de `/auth/get-csrf-token/` e cookie HttpOnly
(`common.py:436`).

**XSS**: sanitização na escrita com `nh3.clean(tags=ALLOWED_TAGS, attributes=ATTRIBUTES,
url_schemes={"http","https","mailto","tel"})` (`utils/content_validator.py:211-243`; allowlist em
`:72-157`, incluindo `mention-component`/`image-component` e `data-*` enumerados porque nh3 não
suporta wildcard `:94-96`), limite de 10 MB (`:16,219-221`) e log do diff removido (`:162-208,230-239`).
Aplicado em issue/comentário (`api/serializers/issue.py:113-118,782-786`), projeto
(`api/serializers/project.py:274-277`), sticky (`api/serializers/sticky.py:22-27`), draft (`app/serializers/draft.py:85-89`) e
intake (`api/views/intake.py:199-200`). `strip_tags` (`utils/html_processor.py:9-31`) gera apenas
texto de busca/preview. Gap: `Project.description_html` só é validado na API v1.

**SSRF**: `pinned_fetch`/`pinned_fetch_following_redirects` (`utils/url_security.py:1-272`) resolve
uma vez e conecta ao IP validado (fecha DNS rebinding), ignora proxy ambiente (`trust_env=False`,
`proxies={"http": None, "https": None}` — `:41-43,122-134`), mantém `Host`/SNI/cert no hostname original (`:114-124`),
não segue redirect automático e revalida cada hop (`:21-24`), e injeta `server_hostname` no adapter
para não desligar verificação TLS (`:46-76`). Bloqueio em `utils/ip_address.py:16-95`: privados,
loopback, reservados, link-local (inclui `169.254.169.254`), multicast, deny-list explícita
(`100.64/10`, `64:ff9b::/96`, `2002::/16`, Teredo, IPv4-mapped) e recursão nos IPv4 embutidos —
falha fechada. Usado por webhooks (`webhook_task.py:317-325`), avatar OAuth (`adapter/base.py:136-229`)
e unfurl de links (`work_item_link_task.py:226-250`), com allowlists `WEBHOOK_ALLOWED_IPS|HOSTS` e
`WEBHOOK_DISALLOWED_DOMAINS` (`common.py:57-92`).

**Uploads**: MIME allowlist (5 imagens no app, `asset/v2.py:382-397`; ~70 no multipart,
`common.py:505-593`), tamanho `min(pedido, FILE_SIZE_LIMIT)` + `content-length-range`
(`asset/v2.py:399-400`, `storage.py:74-78`), nome sanitizado, inline restrito a tipos seguros,
confirmação por `PATCH`, e task diária que apaga órfãos (`file_asset_task.py:20-21`); corpo > limite
→ 413 (`request_body_size.py:18-31`).

**Segredos/headers/auditoria**: `SECRET_KEY` com fallback e alerta (`common.py:31-49`); aviso para
`AWS_SECRET_ACCESS_KEY=="secret-key"` com MinIO (`:336-342`); config de instância cifrada com chave
derivada do `SECRET_KEY` (rotacionar inviabiliza decifragem — `encryption.py:13-43`); API key só em
HMAC-SHA256 nos logs (`logger.py:140-146`) e headers `x-api-key`/`authorization`/`cookie` redigidos
(`:116-128`); `APIActivityLog` com retenção de 14 dias (`api.py:49-74`, `common.py:491-493`).
Gaps: **sem CSP/HSTS/Referrer-Policy/Permissions-Policy** no Django, no Caddy
(`Caddyfile.ce:1-40`) nem nos apps front; `helmet()` existe só no serviço live (`server.ts:63`); `ALLOWED_HOSTS` default
`"*"` (`common.py:95`); token de API em texto puro no banco.

## 12. Performance e observabilidade

Bem indexado: notificações (5 compostos cobrindo os filtros reais — `notification.py:40-65`),
`file_assets` (4 — `asset.py:73-78`), `page_logs` (5 — `page.py:108-114`), `intake_issues` parcial
(`intake.py:87-94`), `workspaces.slug`, `api_tokens.token`, `issue_sequences.sequence`. Faltam
compostos em `issues` (predicado do manager), `issue_activities` (`workspace_id, created_at` — usado
em export com `created_at__date` e `LIMIT 10000`, `workspace/base.py:355-361`) e busca por
`sender__icontains` (`notification/base.py:215-225`).

Consultas pesadas: lista agrupada (`Window`+3 counts), `count()` por página, export de atividade,
analytics (agrega workspace com joins de membership — `app/views/analytic/base.py:60-80`), criação de issue
(2 aggregates + lock) e delete em lote (1 task/issue). Contramedidas: read replica opt-in por view
(`use_read_replica` + router + middleware com `finally: clear_read_replica_context()` —
`middleware/db_routing.py:48-96`, `utils/core/request_scope.py:25-70`), cache de 2 h,
projeção `fields=`/`expand=` (`api/serializers/base.py:26-77`).

Observabilidade: logs JSON com console + arquivo rotativo (1 MB, 5 backups) e loggers nomeados
(`plane.api.request`, `plane.api`, `plane.worker`, `plane.exception`, `plane.external`,
`plane.authentication`, `plane.migrations` — `production.py:31-98`); request log com duração/IP/UA/
user (`logger.py:63-74`); Scout em produção (`production.py:17-23`); OTel com endpoint derivado de
`OTLP_ENDPOINT` (`utils/otlp_endpoints.py:22-59`) e push de métricas quando
`is_telemetry_enabled` (`license/bgtasks/telemetry_metrics.py:66-80`); **sem Sentry**
(`utils/exception_logger.py` é o ponto de captura); health em `/` e `/live/health/`.

## 13. Testes e qualidade

`pytest`+`pytest-django` com `DJANGO_SETTINGS_MODULE=plane.settings.test`, marcadores
`unit|contract|smoke|slow` e `--strict-markers --reuse-db --nomigrations -vs` (`pytest.ini:1-17`);
xdist/coverage em `pyproject.toml:105-113`. 130 arquivos `test_*.py` em
`plane/tests/{unit,contract/{api,app},smoke}`. `conftest.py` oferece `api_client`, `api_key_client`
(`HTTP_X_API_KEY`), `session_client` (`force_authenticate`), `create_bot_user` (`plane/tests/conftest.py:19-89`);
`factories.py:12-60` cobre User/Workspace/WorkspaceMember/Project.

O foco dos contract tests é escopo/autorização, com nomes que documentam bugs históricos:
`test_api_permission_parity.py`, `test_external_api_guest_issue_visibility.py`,
`test_issue_id_project_scope_app.py`, `test_guest_issue_subresource_scope_app.py`,
`test_oauth_callback_state_app.py`, `test_deploy_board_cross_workspace_scope_app.py`,
`test_password_strength_input_bound_app.py`, `test_non_object_json_body.py`,
`test_issue_read_only_fields.py`, `test_issue_audit_fields.py`, `test_asset_role_scope_app.py`,
`test_generic_asset_project_scope.py`, `test_export_order_by_allowlist_app.py`,
`test_page_order_by_allowlist_app.py`. Os advisories `GHSA-*` citados no código indicam correções
acompanhadas de teste. Front: `oxlint`/`oxfmt`/`tsc` em `web`; `vitest` na `live`.

## 14. Lições objetivas para o meraki

1. **Escolha um mecanismo de unicidade com soft delete.** Plane mantém `unique_together` legado ao
   lado da constraint parcial (`issue.py:353-364`), que é a única que funciona com `deleted_at NULL`.
2. **Numeração por projeto pede contador, não `max()+1`.** O advisory lock é correto, mas custa 2
   aggregates + lock por issue (`issue.py:189-214`); um `UPDATE ... RETURNING` em tabela de
   contadores preserva atomicidade com menos trabalho.
3. **Tenant em um ponto só.** Sem `request.workspace` e sem RLS, cada queryset repete o filtro — e a
   suíte `*_scope_*` mostra o custo. Exponha `for_workspace()` ou use RLS.
4. **Um sistema de filtros.** `issue_filters()` + `ComplexFilterBackend` duplicam semântica; o
   segundo (allowlist + profundidade + `Q`) é o desenho a manter (`filter_backend.py:80-127`).
5. **Allowlist obrigatória** para `order_by`/`group_by` (`order_queryset.py:18-157`): sem ela, nome
   de campo do usuário chega em `F()`/`Window`.
6. **Atividade/notificação/webhook com outbox e idempotência.** Hoje a resposta 204 precede o
   `IssueActivity`, e webhooks são at-least-once sem dedupe (`webhook_task.py:235-241`).
7. **Origin check para SPA é viável**, mas trate `Origin` ausente como exceção explícita e configure
   `SameSite=Strict`/`Secure` no cookie de sessão (`session.py:38-43,56-63`).
8. **Upload presigned com `content-length-range` + Content-Type** e inline só para tipos seguros
   (`storage.py:68-151`) evita XSS por SVG/HTML e dispensa proxy de arquivos.
9. **Editor colaborativo como serviço separado**, com `description_binary` (Yjs) como fonte de
   verdade e HTML/JSON derivados (`extensions/database.ts:31-140`) — mantém o Django fora do
   caminho crítico do editor.
10. **Offset pagination com `count()` por página não escala** (`paginator.py:251-289`); use keyset
    por `(sort_order, id)` com cursor opaco e `total_count` opcional.
