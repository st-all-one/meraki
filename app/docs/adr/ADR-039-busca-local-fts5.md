# ADR-039 — Busca local FTS5 no módulo de conteúdo

**Status:** aceito em 2026-10-27; fase 1 histórica. A fase 2 (service compartilhado) foi
substituída pela ADR-041 após o segundo consumidor `noticias`.
**Contexto:** Fase 11 (serviço 10) e primeiro consumidor `pages`.

## Contexto

O portal já tem páginas publicadas e o CMS edita rascunhos; ambos precisam de busca por texto. O
roadmap exige FTS5 local no primeiro módulo de conteúdo e proíbe criar o service compartilhado antes
de um segundo consumidor real. O texto editorial é AST validado, não HTML, e rascunho nunca pode
aparecer no portal.

## Decisão

1. **Índice derivado, fonte única.**
   - Migration `0013_pages_search` cria `pages_search` como tabela FTS5 com
     `tokenize = 'unicode61 remove_diacritics 2'`.
   - Colunas não indexadas `page_id`, `tenant_id` e `scope`; conteúdo indexado `title`, `summary` e
     `body`.
   - A fonte da verdade continua em `pages`/`published_document`; nenhuma coluna de texto duplicada
     em `pages` e nenhum trigger.
2. **Dois escopos.**
   - `scope = 'cms'` indexa o rascunho (`pages.document`) e é consultado somente em `/cms/pages`,
     atrás de `pages.read`.
   - `scope = 'portal'` indexa `published_document` e o título no momento da publicação; a consulta
     pública exige `status='published'` no SQL, além do escopo.
   - Criar/editar atualiza só o escopo CMS; publicar grava o portal; despublicar remove o portal. O
     índice CMS permanece para o editor.
3. **Texto e consulta.**
   - `pageSearchText`/`pageSummary` derivam de AST validado (`richTextToText`); seções ocultas ficam
     fora. Nenhum HTML entra no índice.
   - A entrada do usuário vira termos literais FTS5 unidos por `AND`; `"`, `*`, `-`, `:`, `NEAR` e
     parênteses não alcançam a sintaxe do `MATCH`. Termo máximo de 200 caracteres; até oito termos.
   - Resultados: portal com `bm25` (título > resumo > corpo), limite 20 e desempate determinístico;
     CMS com limite 50. O excerto usa `snippet()` sem marcação e é renderizado como texto.
   - A rota pública é `GET /busca`, `noindex`, com rate limit Valkey por IP; o CMS usa
     `GET /cms/pages?q=`.
4. **Sem service prematuro.**
   - O índice e a consulta moram em `src/modules/pages`; não existe `src/services/search` até o
     segundo módulo de conteúdo.

## Consequências

- O slug não é indexado; a consulta faz join com `pages` para gerar o link atual e impedir link
  quebrado após renomear.
- O título do portal é um snapshot da publicação. Alterar o título de um rascunho não muda o
  resultado público até republicar; o CMS lê o título vivo.
- A migration cria o índice vazio. O seed indexa a home; em bases já existentes, cada página entra
  ao salvar ou republicar. Um backfill SQL duplicaria o parser de AST e não foi criado.
- O `service` compartilhado, ranking personalizado, busca semântica/vetorial, OCR de PDF e engine
  externa continuam fora de escopo.

## Verificação

- `tests/unit/search_test.ts`: texto visível/oculto, operadores e limite de termos.
- `tests/integration/app_test.ts`: rascunho no CMS, ausência no portal, publicação, acento,
  operador hostil, escape de HTML, limite com erro associado, atualização/título sem vazar,
  despublicação, permanência no CMS e isolamento de tenant.
- `e2e/tests/pages.spec.ts`: busca CMS antes de publicar, ausência pública, publicação, link/form,
  axe e reflow.
