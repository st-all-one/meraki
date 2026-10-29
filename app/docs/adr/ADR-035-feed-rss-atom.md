# ADR-035 — Feed RSS/Atom nativo e autodiscovery no shell

**Status:** Aceito — 2026-10-26; estendido a `noticias` em 2026-10-27
**Contexto:** serviço 05 de `implementaion/10-servicos/05-feed-rss.md`; SEO headless
(ADR-034); primeiro consumidor público é `pages` (ADR-030).

## Decisão

1. `src/services/feed/` é uma biblioteca pura, sem `service.ts`/boot, com `renderRss` e
   `renderAtom`; não há ingestão de feeds externos.
2. O módulo de conteúdo monta os itens a partir do **documento publicado** e expõe as rotas. `pages`
   publica `/p/feed.xml` e `/p/feed.atom`; `noticias` publica `/noticias/feed.xml` e
   `/noticias/feed.atom`. Não há feed agregado entre módulos: um agregador exigiria uma porta/fonte
   explícita e uma decisão de produto sobre ordem e deduplicação. Cada módulo monta seu `FeedInput`
   (fonte, paths, título) e usa `renderFeed` do serviço, que centraliza formato e content-type.
3. O contrato aceita URL same-origin ou URN estável em `id`; `link` é same-origin. `javascript:`,
   `data:`, host externo e esquema inválido falham antes de gerar XML. `summary` usa
   `richTextToText` do `@services/richtext`, compartilhado com o editor; o renderizador escapa,
   nunca interpreta HTML.
4. Ordem é `publishedAt` desc com desempate por `id`; o limite padrão é 50 (máximo defensivo 200).
   `lastBuildDate`/Atom `updated` derivam dos itens, não de `now()`. Feed vazio permanece válido.
5. Os feeds usam `Cache-Control: public, max-age=300, s-maxage=300` e ETag/304 do middleware HTTP.
   Só páginas publicadas entram; rascunho, preview e CMS nunca são fonte.
6. `SeoMeta.feeds` fornece `title`/`href`/`type`; `AppShell` é o único emissor do
   `<link rel="alternate" type="application/rss+xml">`. Página `noindex` não anuncia feed.
7. Feed/API e arquivos de máquina não persistem o cookie de locale; `?lang=` continua resolvendo o
   conteúdo sem impedir o ETag/cache público da variante.
8. Autodiscovery anuncia RSS; Atom fica disponível na rota própria. Não há JSON-LD nem script no
   feed.

## Consequências

- Feed é determinístico, cacheável e não exige dependência nova, worker ou migration.
- A conversão de AST para texto fica em `@services/richtext` (`richTextToText`), sem HTML e sem
  duplicação entre editor, resumo e feed; o módulo só escolhe a seção e aplica o limite.
- O módulo cronológico `noticias` reutiliza a biblioteca e registra sua própria rota sem alterar o
  kernel; cada feed só lê os snapshots publicados do próprio módulo.
- Um feed agregado (páginas + notícias) permanece fora até existir uma porta de fontes e uma
  decisão explícita de ordenação.
- SSRF/parser de feed externo continua fora de escopo e exigirá ADR própria.
