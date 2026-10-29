# ADR-041 — Busca compartilhada entre páginas e notícias

**Status:** aceito em 2026-10-27.
**Contexto:** Fase 11.2 do roadmap de serviços, após `pages` e `noticias` serem consumidores reais.
**Substitui parcialmente:** ADR-039 (a fase local do primeiro consumidor continua válida como histórico).

## Contexto

A ADR-039 implementou FTS5 local em `pages` e adiou o service compartilhado até existir um segundo
módulo de conteúdo. O módulo `noticias` foi entregue com `articles`, CMS/portal e sitemap, cumprindo
o gatilho. Manter `pages_search` e criar outra busca em `noticias` produziria duas implementações
permanentes, joins específicos e resultados separados numa rota `/busca` que já é global.

## Decisão

1. **Service headless único.**
   - `src/services/search/` expõe `SearchService`, `SearchDocument`, `SearchResult` e `SearchScope`.
   - O tenant vem da porta `tenancy` no boot; o executor é explícito em todas as operações para que
     indexação e remoção participem da transação do módulo.
   - Os módulos entregam documentos; o service não importa `pages` nem `noticias`, nem conhece AST,
     banco de módulo ou RBAC.
2. **Um índice FTS5, dois escopos.**
   - Migration `0015_search` cria `search_documents` com `unicode61 remove_diacritics 2`.
   - Metadados (`tenant_id`, `module`, `entity_type`, `entity_id`, `scope`, `locale`, `url`,
     `published_at`, `permission`) são `UNINDEXED`; só `title`, `summary` e `body` entram no ranking
     BM25.
   - `scope=portal` contém apenas versões publicadas; `scope=cms` contém rascunhos.
   - O portal não consulta permissão; o CMS recebe o conjunto fechado de permissões do ator pela rota
     e o service filtra no SQL. Sem permissões, o CMS retorna vazio.
3. **Consumidores.**
   - `pages` indexa rascunho no CMS e snapshot publicado no portal; `published_title` preserva o
     título congelado para reindexação. Publicar grava, despublicar remove e renomear slug atualiza a
     URL do documento portal sem trocar o título público.
   - `noticias` indexa `body`/`articles` e a versão `published_*`; a edição de rascunho não altera o
     portal.
   - A rota pública `GET /busca` permanece no módulo `pages` nesta fase, mas passa a consultar o
     service e exibir resultados dos dois módulos. Ela não importa `noticias`. O context entrega a
     lista de módulos carregados; o service filtra por ela para não expor índice órfão de módulo
     desabilitado na allowlist.
   - O CMS mantém busca por módulo: `GET /cms/pages?q=` e `GET /cms/noticias?q=`, cada uma com sua
     permissão.
4. **Texto e consulta.**
   - Título, resumo e corpo derivam de AST validado (`pageSearchText`/`articleSummary`/
     `richTextToText`); nenhum HTML é indexado.
   - A entrada vira frases literais FTS5 unidas por `AND`; operadores não alcançam o `MATCH`. Limite
     de 200 caracteres, oito termos, 20 resultados públicos e 50 no CMS.
   - `snippet()` é texto escapado pelo JSX; URL é caminho interno gerado pelo módulo.
5. **Cutover.**
   - `0016_pages_published_title` (módulo `pages`) preserva o título publicado em
     `pages.published_title`; `0017_drop_pages_search` remove o índice legado com
     `-- gate:allow-drop`, depois que o novo índice e os dois consumidores existem.
   - `deno task search:reindex` reconstrói o índice a partir de `pages`/`articles` de forma
     idempotente; a migration não reimplementa parser de AST em SQL.

## Consequências

- Uma única verdade de índice; `pages_search` e seu repositório deixam de existir.
- Resultados públicos podem misturar páginas e notícias; o link vem do documento indexado.
- Renomear slug exige atualizar o índice; páginas publicadas usam `updateUrl` para não reindexar o
  título congelado, e notícias reindexam o portal com `published_title`/`published_body`.
- O índice é derivado: em bases existentes, rodar `search:reindex` após a migration.
- O service não valida se um documento ainda existe; os módulos removem no despublicar e testes
  cobrem rascunho, tenant, despublicação e concorrência.
- Locale é metadado e filtro opcional; o conteúdo editorial atual não é traduzido por locale.
- Sem engine externa, vetor, OCR, ranking personalizado ou busca global de CMS.

## Verificação

- Unitários: escape de operadores e derivação de texto.
- Integração: página e notícia no mesmo resultado; rascunho fora do portal; despublicação; tenant;
  renomeação de slug; permissão no CMS.
- E2E: busca pública e do CMS de notícias; página/notícia; axe/reflow.
- `deno task check`, `deno task test`, `deno task build:bin` e E2E Playwright.
