# ADR-033 — Editor de seções com catálogo fechado

**Status:** Aceito — 2026-10-26
**Relaciona:** ADR-016, ADR-017, ADR-020, ADR-030, ADR-031, ADR-032

## Contexto

O documento de página já era `{ version, sections }`, mas apenas `hero` e `text` existiam e o
formulário editava um único hero/texto. A fase 03 exige composição por seções ordenadas, sem page
builder: nada de HTML/CSS/posição no banco, links e mídia validados, autoria por teclado e render
determinístico.

O gate de fronteiras impede `application/` e `domain/` de importarem `@layout`. Por isso o modelo
headless permanece em `src/services/blocks/` (tipos, schemas e parser) e a apresentação fica em
`src/layout/blocks/` (catálogo de rótulos e renderer). O módulo `pages` consome ambos: o HTTP/views
usam o catálogo/render e o serviço valida com o modelo headless.

## Decisão

### Documento

- Catálogo fechado com oito tipos: `hero`, `text`, `text-image`, `cards`, `steps`, `faq`,
  `video-link`, `banner`.
- `version: 1`; até 40 seções; `id` estável e único; `hidden` preserva a posição no array.
- Tipo desconhecido é ignorado no render leniente e rejeitado na gravação estrita. Versão
  desconhecida cai no documento vazio.
- Props têm schema fechado por tipo. Chave desconhecida é descartada; campo inválido invalida o
  bloco inteiro.
- HTML/CSS/posição livre são rejeitados no parser antes de qualquer normalização: chaves
  `html`, `template`, `iframe`, `css`, `style`, `class`, `script`, `javascript`, `position`,
  `top/left/right/bottom`, `z-index`, `px` e qualquer `on*`, além de valores HTML/`javascript:`/
  CSS/`Npx`.
- Texto rico é AST validado (ADR-020); heading 1 não entra. Imagem é `mediaId` UUID; links passam
  por `safeLinkHref`; `video-link` exige `https:`.
- `hero` é o único bloco que produz `<h1>`; no máximo um hero **visível** é aceito. Heros ocultos
  podem coexistir, mas não entram no render. Sem hero visível, o render usa o título da página como
  H1.

### Editor

- O formulário é progressivo: campos planos por seção (`s_<id>_*`), `sectionOrder` e fallback de
  parágrafos sem JS. O servidor é a autoridade e reconstrói o documento.
- O bundle do CMS adiciona controles por botão para mover, ocultar e remover, além de adicionar
  bloco e itens. Não há drag-and-drop obrigatório; teclado e foco visível são o caminho principal.
  Sem JavaScript, os controles de composição ficam ocultos e o formulário edita os blocos
  existentes; o fallback de parágrafos e o `noscript` mantêm a autoria possível.
- Cada bloco é um `article` com heading próprio; itens são `fieldset` com `legend` numerado. O
  editor rico usa o rótulo visível como nome acessível e a toolbar tem roving tabindex por setas.
- Cada seção usa o mesmo editor rico; todos compartilham um único `<dialog>` de mídia com alvo do
  editor ativo.
- Preview autenticado usa `PageSections`/`PagePublicView` do render público, com `no-store` e
  `noindex`; não há iframe nem segundo renderer.
- Salvar altera só o rascunho; publicar continua sendo ação separada com auditoria e copia do
  documento validado.

### Persistência

Nenhuma migration nova: `pages.document` e `pages.published_document` já guardam JSON validado. O
schema de oito tipos é evolução compatível do `version: 1`.

## Consequências

- Novo tipo de bloco exige ADR e atualização do schema, componentes, editor e testes.
- A duplicação inevitável entre schema headless e catálogo de apresentação é pequena e testada;
  elimina dependência invertida e mantém o gate de módulos.
- Conteúdo antigo de `hero`/`text` continua válido. Blocos inválidos não derrubam a página pública:
  são descartados pelo parser leniente.
- O editor não cria posição absoluta, grid arbitrário, HTML ou CSS; presets/temas por URL ficam
  fora.
