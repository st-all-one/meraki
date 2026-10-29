# ADR-032 — Editor rico TipTap/ProseMirror e bundle same-origin

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-26) |
| **Data** | 2026-10-26 |
| **Relacionadas** | ADR-008, ADR-020, ADR-029 |

## Contexto

O CMS já persiste texto como AST TipTap validado (`src/services/richtext`), mas a edição é feita em
textarea de parágrafos. A Fase 3 exige um editor visual que produza exatamente o subconjunto aceito
pelo renderer, sem HTML no banco, sem CDN, sem `unsafe-inline` e sem um segundo renderer.

O editor depende da Fase 2 (Media) apenas para imagem. O restante do subconjunto — heading 2–4,
parágrafo, listas, citação, código, régua, negrito, itálico, riscado, código, link e quebra — não
depende de mídia e pode ser entregue agora. O botão de imagem permanece bloqueado até o serviço de
mídia existir.

## Decisão

1. **TipTap 3.32.0** (`@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-link`), MIT, versões
   exatas no `deno.json`/`deno.lock`. StarterKit é configurado para:
   - `heading.levels = [2, 3, 4]`;
   - `link: false` (o Link é adicionado separadamente com validação);
   - `underline: false` (o renderer não aceita underline).
2. **Bundler:** `deno bundle --platform browser --packages bundle --minify`. O comando é
   experimental no Deno 2.9.7, mas usa o esbuild já resolvido pelo Deno e funciona offline com o
   cache lockado. A saída é `static/js/vendor/editor.js`.
3. **CSS próprio** em `static/css/editor.css`, copiado por `js:build`, carregado somente na tela do
   CMS. Nenhum estilo/script inline.
4. **Allowlist compartilhada:** `src/services/richtext/policy.ts` contém validadores puros de link e
   imagem e os tipos de marca; o editor importa o validador de link. A validação decisiva continua
   no servidor (`validateRichText`/`parseBlocksDocument`).
5. **Progressivo:** o formulário mantém o textarea de parágrafos visível e um textarea JSON
   `hidden disabled` como ponte. Sem JS, o texto simples é validado e convertido em AST pelo
   servidor. Com JS, o editor monta a toolbar, esconde o fallback e sincroniza o JSON no textarea.
6. **Acessibilidade:** toolbar com `role="toolbar"`, botões nativos `type="button"`,
   `aria-label`/`aria-pressed`, `aria-keyshortcuts`, foco visível; conteúdo com `role="textbox"` e
   `aria-multiline`; diálogo nativo `<dialog>` para link.
7. **Imagem fora desta entrega (histórico):** na primeira entrega não existia nó de imagem no
   schema do editor enquanto a Fase 2 não fornecesse `mediaId`/picker. O CMS não inventa URL.
   *(Substituído pela emenda de 2026-10-26.)*

## Emenda 2026-10-26 — imagem e picker integrados

A Fase 2 passou a oferecer mídia pública/pronta; a integração foi feita sem nova dependência e sem
HTMX:

- nó `image` próprio em `src/modules/cms/assets/editor/schema.ts` (`src`, `mediaId`, `alt`,
  `title`, `width`, `height`), com `alt` obrigatório; sem `@tiptap/extension-image`;
- botão “Imagem” abre um `<dialog>` nativo renderizado no formulário, com as imagens públicas e
  prontas que têm alt. O bundle só lê `data-media-id`/`data-media-alt`/dimensões e insere
  `{type:"image",attrs:{mediaId,src,alt,width,height}}`; não há URL externa nem endpoint novo;
- `renderRichText` recebe um mapa de mídia já resolvido e emite `<Picture>`/`<picture>` com AVIF e
  WebP; sem mapa, usa `src` same-origin/HTTPS. O serviço continua puro e não consulta banco;
- `pages` coleta `mediaId` do hero e de qualquer imagem do conteúdo rico, valida na publicação
  (pública, pronta, imagem com alt) e busca todas as mídias no render público;
- o AST guarda `mediaId`; o `src` canônico é `/media/<id>`, conferido na validação.

Verificação: unit de render/validação, integração de publicação, E2E de picker por teclado + axe,
`deno task ci` e E2E completo.

## Consequências

**Positivas**
- AST persistido e validado no servidor; nenhum HTML atravessa a fronteira.
- Bundle same-origin, sem CDN, carregado apenas no CMS.
- Fallback sem JS continua funcional.

**Custos / negativas**
- `deno bundle` é experimental; a ADR fixa a versão do Deno e o teste de CI/E2E cobre a saída.
- O bundle TipTap tem centenas de KB; fica fora do portal público.
- Imagem/picker exigem mídia pública/pronta com alt; mídia privada é recusada na publicação.

## Verificação

- `deno task js:build` gera JS/CSS e falha se o bundle/licença sumirem.
- `deno task check` (fmt/lint/types/gates), `deno task test` e E2E Playwright.
- E2E: heading, lista, link, imagem via picker por teclado, axe, zero request externa; sem JS o fallback salva.
- `deno task build:bin` contém os assets em `static/`.
