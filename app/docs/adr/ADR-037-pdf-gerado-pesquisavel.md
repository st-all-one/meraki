# ADR-037 — PDF gerado do dado estruturado, imutável e servido pelo Media

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito e implementado (2026-10-27) |
| **Data** | 2026-10-27 |
| **Relacionadas** | ADR-009, ADR-013, ADR-020, ADR-030, ADR-031, ADR-035 |

## Contexto

O serviço 07 de `implementaion/10-servicos/07-pdf.md` precisa entregar documentos oficiais e
relatórios a partir do conteúdo publicado, com texto selecionável, sem navegador headless e sem
OCR. O primeiro consumidor é o módulo `pages`, que já tem documento AST, publicação imutável e
entrega de mídia same-origin.

Requisitos rígidos:

- PDF nasce do AST/JSON, nunca do HTML renderizado;
- fonte com licença permissiva e acentos;
- geração determinística para a mesma entrada, fonte e relógio;
- limite de páginas/bytes e erro claro;
- o bruto continua sendo a fonte; PDF é apresentação;
- PDF externo não é prometido como pesquisável (`pdf_searchable`).

## Decisão

1. **Biblioteca pura** em `src/services/pdf/` (`contract.ts`, `pdf.ts`), sem `service.ts`, boot ou
   acesso a banco/storage. O módulo de conteúdo monta a entrada e é dono da rota.
2. **`pdf-lib@1.17.1` (MIT)** e **`@pdf-lib/fontkit@1.1.1` (MIT)**. O layout é próprio: A4,
   margens fixas, quebra de linha/página, headings, parágrafos, listas, citação, código, tabela,
   régua e rodapé com número de páginas. Nada de Chromium/Puppeteer/Ghostscript/OCR.
3. **Fonte vendorizada**: `LiberationSans-Regular.ttf` 2.1.5 sob SIL OFL 1.1, com `OFL.txt` no
   mesmo diretório. O PDF embute somente o subset usado. Caracteres sem glifo são substituídos por
   `?`, em vez de deixar o layout falhar.
4. **Determinismo**: `title`, `author`, `subject`, `keywords`, `language`, `creationDate` e
   `modificationDate` vêm de `Clock` injetado; a mesma entrada/fonte/instante produz bytes iguais.
   Limites: 300 seções, 250 mil caracteres, 250 páginas, 50 itens por lista, 12 colunas, 200 linhas,
   300 caracteres por célula e 20 MiB.
5. **Cache por versão**: `pages.pdf_media_id`, `pages.pdf_source_hash` e `pages.pdf_generated_at`
   (migration `0011_page_pdf`). O hash BLAKE3 cobre a versão do layout e a entrada renderizada
   (título, seções, metadados, locale, links absolutos). Publicar limpa as três colunas. Uma nova
   publicação gera outro PDF; o anterior permanece imutável no Media. A geração concorrente no mesmo
   processo é single-flight.
6. **Entrega**: `GET /p/:slug/pdf` exige página publicada, gera/recupera o PDF e responde `302` para
   `GET /media/:id`. O módulo `media` já entrega `application/pdf` como `attachment`, com ETag/304,
   `Cache-Control` imutável, `nosniff` e sem URL assinada. O link “Baixar PDF” só aparece na página
   pública; preview/CMS não o exibem.
7. **PDF externo**: upload comum no Media. `metadata.pdf_searchable` aceita `true`, `false` ou
   `unknown`; upload externo nasce `unknown`, a galeria mostra “PDF não verificado” e permite o
   atestado na edição. PDF gerado grava `true`. O atestado não executa OCR nem garante indexação.
8. **Conteúdo**: o conversor usa o AST validado. Imagens entram como texto alternativo (não há
   embed de bytes nesta versão); links viram texto absoluto; nenhum HTML/CSS/script é aceito. O
   módulo `pages` não importa `@layout` na aplicação do PDF.

## Consequências

- O PDF é reproduzível e auditável por hash; não depende do render HTML nem de rede.
- O binário/contêiner inclui a fonte e o subset é gerado em memória; não há download em runtime.
- PDFs antigos de versões anteriores continuam no Media e não são apagados; retenção/limpeza é
  operacional, como nas demais mídias.
- PDFs gerados aparecem na galeria com owner `pages`; arquivar o artefato faz a próxima requisição
  gerar outro, sem quebrar a página.
- Imagens não são incorporadas nesta versão; quando isso for requisito, o Media precisa expor uma
  leitura de bytes autorizada, sem abrir `objectKey` ao módulo.
- Assinatura PAdES, PDF/A, linearização, OCR e tabelas gigantes continuam fora de escopo.

## Verificação

- Unitários: `%PDF-`, metadados, determinismo, documento vazio, limites e extração de texto com
  `pdftotext` (teste ignorado quando o utilitário não existe).
- Integração: geração → Media `ready/public/pdf_searchable=true`, cache reutilizado, nova publicação
  invalida o cache e preserva o PDF anterior, página despublicada não gera.
- E2E: home baixa PDF pelo Media, `application/pdf` + `attachment` + ETag/304; upload externo nasce
  “não verificado” e pode ser atestado; link same-origin; axe/reflow.
- `deno task check`, `deno task test`, `deno task build:bin` e E2E Docker/Caddy verdes.

## Referências

- `src/services/pdf/`, `src/modules/pages/application/page-pdf*.ts`
- `src/modules/pages/migrations/0011_page_pdf.sql`
- `src/services/media/`, ADR-031
- [pdf-lib](https://pdf-lib.js.org/) 1.17.1 (MIT), `@pdf-lib/fontkit` 1.1.1 (MIT)
- Liberation Sans 2.1.5 (SIL OFL 1.1)
