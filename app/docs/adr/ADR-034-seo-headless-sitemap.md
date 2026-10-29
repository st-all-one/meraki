# ADR-034 — SEO headless: metadados no shell, microdata e sitemap por fontes

**Status:** Aceito — 2026-10-26
**Contexto:** serviço 04 de `implementaion/10-servicos/04-seo.md`; shell único (ADR-030) e CSP sem
inline (ADR-008).

## Decisão

1. `src/services/seo/` é uma biblioteca pura para metadados/XML mais um service `seo` (registry de
   fontes + cache). Nenhum módulo escreve `<head>`.
2. `AppShell` é o único emissor de `<title>`, description, canonical, hreflang, OpenGraph/Twitter,
   robots, manifest e microdata. Módulos fornecem `SeoMeta`; a área privada força
   `noindex, nofollow`, inclusive em preview `/cms/*`.
3. Canonical é caminho interno ou URL same-origin; locale usa `?lang=` apenas quando difere do
   padrão. Não há prefixo de locale na rota.
4. Dados estruturados da fase 1 usam **microdata** (`Organization`, `WebSite`, `WebPage`,
   `BreadcrumbList`). JSON-LD inline permanece proibido até ADR/CSP própria.
5. O módulo `system` serve `/robots.txt`, `/sitemap.xml`, `/sitemaps/:file`,
   `/.well-known/security.txt` e `/manifest.webmanifest`. Fontes de sitemap registram-se no service
   `seo`; só conteúdo publicado entra. Acima de 20k URLs, o raiz vira índice com chunks por fonte.
6. O plano de sitemap é cacheado em Valkey (`seo:sitemap:v1:<tenant>:<app-hash>:<geração>`);
   publicar/despublicar invalida a chave. Fonte com erro é ignorada, nunca derruba a rota.
7. `security.txt` usa `SECURITY_CONTACT` (mailto/https) e expiração de um ano; manifest usa
   `icons: []` quando não há mídia pública.

## Consequências

- Um único ponto de metadados, sem duplicação por página; testes de head e canonical convergem.
- OG image usa `/media/<id>` same-origin; sem CDN, sem URL externa no browser.
- Sitemap pode ser gerado sem páginas (urlset vazio) e sem service `pages` habilitado.
- A ordem da cadeia de auditoria e o cache continuam sem dependência do SEO.
