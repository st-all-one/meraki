# ADR-030 — Páginas editoriais, rota raiz e colisão de rotas

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-26) |
| **Data** | 2026-10-26 |
| **Relacionadas** | ADR-001, ADR-008, ADR-017, ADR-020, ADR-021 |

## Contexto

O módulo `demo` montava `/` e `/app`. A Fase 1 dos serviços precisa de um consumidor real de
conteúdo; um módulo editorial que também montasse `/` sobrescreveria a home silenciosamente, porque
o core apenas chama `app.route("/", module.instance.web)` em ordem.

Também era necessário decidir o formato persistido antes de mídia/editor: documento em AST, sem
HTML/CSS no banco.

## Decisão

1. O módulo **`pages`** é o dono de `/` (slug reservado `home`) e de `/p/:slug`.
2. O módulo **`demo`** deixa de montar `/`; permanece opcional, com `/app` e `/app/events`. A
   permissão de CMS continua vindo de `cms.access`.
3. O core valida colisões de método+path entre módulos no boot (`assertNoRouteCollisions`), tanto na
   raiz web quanto em `/api/v1`. Rota duplicada falha com os dois donos.
4. `pages` declara `requires: ["cms.access", "cms.shell"]`; o CMS publica `cms.shell` como dado
   estrutural, sem o módulo editorial importar `cms`.
5. Permissões: `pages.read`, `pages.write`, `pages.publish`. Toda rota `/cms/pages*` exige
   `cms.access` e a permissão específica.
6. O documento é `{ version: 1, sections: [...] }`. Nesta fase o catálogo suportado é `hero` e
   `text`; os outros seis blocos entram na Fase 6. Texto é AST validado por `@services/richtext`;
   `hero` é o único H1.
7. Rascunho (`document`) e versão pública (`published_document`) são colunas distintas. Publicar
   valida, copia e audita. A rota pública só lê `status='published'` + `published_document`.
8. Slugs são normalizados, únicos por tenant (`lower(slug)`) e não podem colidir com rotas
   reservadas. `/p/home` redireciona para `/`.
9. O seed de demonstração cria a home publicada apenas em desenvolvimento/teste; produção exige
   publicação editorial explícita.

## Consequências

**Positivas**
- Home e páginas passam a ser conteúdo do tenant, com preview/publicação reais.
- Duas rotas iguais falham no boot em vez de escolher uma em silêncio.
- O schema já é o documento final; as fases seguintes adicionam tipos sem migração destrutiva.

**Custos / negativas**
- `pages` depende do CMS; um fork que remove `cms` também remove `pages`.
- O editor inicial é um formulário progressivo de `hero`/`text`; TipTap e os 8 blocos chegam nas
  fases 02/03.
- A home de demonstração deixa de exibir a vitrine de stack/status; o painel `/app` continua.

## Verificação

- Boot com `demo` e `pages` não tem rota duplicada; teste sintético falha em colisão.
- `/` serve a home publicada com ETag/304; rascunho em `/p/:slug` retorna 404.
- CMS cria/edita/publica/despublica com auditoria e permissões.
- `deno task test` cobre normalização de slug, parser de blocos e o fluxo editorial.
