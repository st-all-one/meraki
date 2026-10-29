# ADR-020 — Conteúdo rico: AST TipTap validado e render determinístico

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Incorporação seletiva do public-v7 |
| **Relacionadas** | ADR-004, ADR-008, ADR-011, ADR-019 |

## Contexto

O public-v7 edita conteúdo com TipTap e guarda o documento como JSON. O esqueleto do Somlos ainda
não tem modelo de conteúdo: qualquer módulo de notícias/páginas precisaria decidir sozinho como
armazenar e renderizar rich text. As opções ingênuas são perigosas:

- guardar HTML pronto e inserir com `<%~ %>` no Eta: XSS armazenado e violação da CSP sem inline;
- guardar Markdown e renderizar no cliente: dependência/CDN e conteúdo dependente de JS;
- deixar cada módulo inventar seu renderer: divergência de sanitização e de semântica.

O requisito é determinístico (HTML público sem nonce), acessível (semântica correta) e seguro por
construção, sem adicionar dependência.

## Decisão

1. **Formato canônico: AST compatível com TipTap** (`{ type: "doc", content: [...] }`), armazenado
   como JSON em TEXT validado. O módulo dono do conteúdo decide colunas e traduções (ADR-019);
   o service não conhece banco. O renderer é biblioteca pura (`richtext.ts`), **não** um
   service carregado no boot; o CMS o importa quando precisar.
2. **Validação na escrita e no render** (`src/services/richtext`):
   - Zod valida forma, tipos e limites (10.000 nós, profundidade 32, 100.000 caracteres de texto,
     href ≤ 2048);
   - allowlist de nós: `paragraph`, `heading` (1–6), `bulletList`, `orderedList`, `listItem`,
     `blockquote`, `codeBlock`, `horizontalRule`, `hardBreak`, `image`, `text`;
   - allowlist de marcas: `bold`, `italic`, `strike`, `code`, `link`;
   - atributos desconhecidos, nós desconhecidos, marcas duplicadas e marcas em `codeBlock` são
     rejeitados.
3. **Renderer puro e determinístico** (`renderRichText`):
   - texto e atributos escapam `& < > " '`;
   - o input nunca é interpolado como HTML (sem `rawHtml`, sem `style`, sem `on*`);
   - links aceitam `https:`, `http:`, `mailto:`, `tel:`, caminho absoluto, `#` e `?`; rejeitam
     `javascript:`, `data:`, `vbscript:`, `//host` e caracteres de controle;
   - links externos recebem `rel="noopener noreferrer"`;
   - imagens aceitam mesma origem (`/...`) ou `https:`; largura/altura viram atributos para CLS;
     `loading="lazy"` e `decoding="async"` por padrão;
   - ordem de marcas fixa (link → bold → italic → strike → code) para saída estável.
4. **Validação de escrita devolve issues** (`validate`) para o módulo responder 422 com caminho do
   campo; `render` valida de novo como defesa em profundidade e lança `RichTextError`.
5. **Sem editor nesta etapa.** O primeiro módulo aceita o AST via API/seed; vendorizar TipTap é
   decisão posterior, não requisito do renderer.
6. **Sem dependência nova**: Zod e o escape manual cobrem o caso.

### Emenda 2026-10-26 — imagem por `mediaId`

O nó `image` passou a aceitar `mediaId` (UUID canônico) além de `src`. A validação exige `alt` não
vazio e, quando ambos existem, `src` deve ser exatamente `/media/<mediaId>`. O renderer aceita um
mapa opcional `mediaId → {src, alt, width, height, variants}` montado pelo módulo dono com a porta
`media.delivery`; com o mapa, emite `<picture>` com AVIF/WebP; sem o mapa, mantém o fallback
`src` same-origin/HTTPS. O serviço de richtext permanece puro, síncrono e sem acesso a banco.

## Consequências

**Positivas**

- Um único ponto de sanitização para todo conteúdo rico; CSP sem inline permanece intacta.
- Saída determinística e testável; o mesmo AST produz os mesmos bytes em qualquer locale.
- Módulos só armazenam/validam o AST; não reimplementam render nem sanitização.
- Compatível com o JSON do TipTap, o que permite importar conteúdo do public-v7 no subconjunto
  suportado.

**Custos / negativas**

- Subconjunto de nós/marcas: `underline`, `highlight`, tabelas, `textAlign` e `textStyle` são
  rejeitados até haver necessidade real e um ADR de extensão.
- Sem editor visual, a autoria inicial é via API/seed.
- Validação percorre o AST duas vezes (escrita e render); o custo é limitado pelos tetos.

## Verificação

- `tests/unit/richtext_test.ts`: render exato, escaping, `javascript:`/`data:`/`//host`, `rel` em
  link externo, imagem com atributos escapados, heading inválido, atributo desconhecido, marcas em
  `codeBlock`, profundidade e volume acima do teto, `RichTextError` com issues.
- Gate de views (`scripts/gates.ts`) continua proibindo `style=`, `on*=` e script inline.

## Referências

- `src/services/richtext/richtext.ts`, `contract.ts`
- `tests/unit/richtext_test.ts`
- public-v7: editor TipTap e renderer de AST
