# ADRs — Somlos / Meraki

As ADRs do Somlos foram preservadas como histórico de decisão. O fork Meraki removeu produtos
(CMS, mídia, mapas, assinatura, e-mail, jobs) e adaptou o runtime; a decisão de fork está em
[ADR-043](ADR-043-meraki-fork-cortes.md). ADRs marcadas como “Substituído” continuam no histórico,
nunca são apagadas.

| ADR | Decisão | Status no Meraki |
|---|---|---|
| [000](ADR-000-simplicidade-funcional-injecao.md) | Simplicidade, núcleo funcional e injeção explícita | Aceito |
| [001](ADR-001-ddd-simplificado-monolito-modular.md) | DDD simplificado em monolito modular | Aceito |
| [002](ADR-002-tenancy-single-tenant-com-tenant-id.md) | Single-tenant com `tenant_id` | Aceito |
| [003](ADR-003-sqlite-3-dialeto-oficial-kysely.md) | SQLite + `SqliteDialect`/Kysely | Emenda ADR-043 |
| [004](ADR-004-json-text-validado.md) | JSON em TEXT validado | Aceito |
| [005](ADR-005-outbox-polling-controlado.md) | Outbox | Removido do escopo |
| [006](ADR-006-auth-tokens-opacos-jwt.md) | Sessão opaca + JWT | Sessão opaca; JWT removido |
| [007](ADR-007-argon2id-blake3.md) | Argon2id + Blake3 | Aceito |
| [008](ADR-008-cache-http-etag-csp.md) | Cache/ETag/CSP | Aceito |
| [009](ADR-009-rustfs-s3.md) | RustFS/S3 | Substituído por storage local |
| [010](ADR-010-observabilidade-logtape-otlp.md) | OTel | Removido |
| [011](ADR-011-ui-eta-htmx-tailwind.md) | Eta/HTMX | Substituído por ADR-026 |
| [012](ADR-012-testes-ci-docs.md) | Testes/CI/ADRs | Aceito |
| [013](ADR-013-migracoes-sqlite-up-only.md) | Migrations up-only junto ao dono | Aceito |
| [014](ADR-014-executavel-unico-deno-compile.md) | Binário único | Aceito |
| [015](ADR-015-incorporacao-seletiva-public-v7.md) | Incorporação seletiva | Aceito |
| [016](ADR-016-web-apresentacao-compartilhada.md) | Web como apresentação | Aceito |
| [017](ADR-017-manifestos-convencao-schema-raiz-portas-transacionais.md) | Manifestos/schema/portas | Aceito |
| [018](ADR-018-rbac-auditoria-jobs.md) | RBAC/auditoria/jobs | RBAC simples; jobs removidos |
| [019](ADR-019-i18n-ui-conteudo-modulo.md) | i18n | Fora do MVP |
| [020](ADR-020-conteudo-rico-ast-tiptap.md) | TipTap | Removido; Markdown |
| [021](ADR-021-area-cms-prefixo-permissao.md) | CMS | Removido |
| [022](ADR-022-daisyui-5-design-system.md) | daisyUI | Tokens próprios |
| [023](ADR-023-caddy-borda-portas-503xx.md) | Caddy/portas 503xx | Aceito |
| [024](ADR-024-mapas-leaflet.md) | Leaflet | Removido |
| [025](ADR-025-deploy-producao-binario-systemd-caddy.md) | deploy | Histórico; substituído por ADR-044 |
| [026](ADR-026-ui-jsx-daisyui.md) | JSX + daisyUI | JSX; CSS próprio |
| [027](ADR-027-jobs-worker-separado.md) | Worker | Removido |
| [028](ADR-028-endurecimento-typescript-deno.md) | TypeScript/Deno | Aceito |
| [029](ADR-029-pipeline-assets-browser.md) | Assets | Aceito (esbuild) |
| [030](ADR-030-paginas-rota-raiz-colisao.md) | Páginas | Removido |
| [031](ADR-031-ciclo-vida-midia.md) | Mídia | Removido |
| [032](ADR-032-editor-rico-tiptap.md) | TipTap | Removido |
| [033](ADR-033-editor-secoes.md) | Seções | Removido |
| [034](ADR-034-seo-headless-sitemap.md) | SEO | Removido |
| [035](ADR-035-feed-rss-atom.md) | Feed | Removido |
| [036](ADR-036-mail-transacional-smtp.md) | SMTP | Removido |
| [037](ADR-037-pdf-gerado-pesquisavel.md) | PDF | Removido |
| [038](ADR-038-assinatura-pades-icp-brasil.md) | Assinatura | Removido |
| [039](ADR-039-busca-local-fts5.md) | FTS5 | `LIKE` no MVP |
| [040](ADR-040-mapas-maplibre-pmtiles.md) | Mapas | Removido |
| [041](ADR-041-busca-compartilhada.md) | Busca compartilhada | `LIKE` |
| [042](ADR-042-importador-csv-contatos.md) | Importador | Removido |
| [043](ADR-043-meraki-fork-cortes.md) | Fork Meraki e runtime SQLite | Aceito |
| [044](ADR-044-operacao-docker.md) | Operação Docker, `.env` raiz e volume host | Aceito; substitui ADR-025 |
