# ADR-031 — Ciclo de vida e entrega de mídia

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito e implementado (2026-10-26) |
| **Data** | 2026-10-26 |
| **Relacionadas** | ADR-004, ADR-009, ADR-018, ADR-027, ADR-030 |

## Contexto

O serviço 01 (Media + Gallery) foi implementado em 2026-10-26 a partir desta decisão. O banco e o
S3 não compartilham transação; um upload pode deixar objeto órfão ou linha `ready` sem objeto. A
entrega pública também não pode morar no módulo administrativo opcional `gallery`.

## Decisão

1. **Três fronteiras físicas**: `src/services/media/` (headless, validação/catálogo/storage),
   `src/modules/media/` (entrega pública `GET/HEAD /media/:id`) e `src/modules/gallery/`
   (administração `/cms/gallery` + picker). Conteúdo declara `requires: ["media.delivery"]`;
   `gallery` é opcional e exige `cms.access`.
2. **Estado explícito**: a linha de mídia nasce `pending`, com `object_key` gerado pelo servidor.
   Após upload e verificação, muda para `ready`; falha vira `failed`. Nenhuma transação SQLite fica
   aberta durante S3.
3. **Compensação**: falha de upload não cria `ready`; objeto enviado sem linha `ready` (ou linha
   `failed`/arquivada) é removido por job de GC idempotente. O job não apaga mídia `ready` ativa.
4. **Validação no servidor**: limite de bytes por tipo, MIME por magic bytes, allowlist
   JPEG/PNG/WebP/AVIF/GIF/PDF; SVG/HTML/JS recusados. O nome do cliente não participa da chave.
5. **Hash**: BLAKE3 incremental (`@noble/hashes/blake3`) ou buffer limitado. WebCrypto não tem
   digest incremental; não prometer “SHA-256 em streaming”.
6. **Alt**: `alt_text` é obrigatório somente para imagem, via CHECK condicional. PDF/anexo usa
   `description`; não reutilizar o mesmo conceito.
7. **Tenant/visibilidade**: `tenant_id`, `owner_module` e `visibility` explícitos. Entrega filtra
   tenant, `status='ready'`, não arquivado e visibilidade. Mídia privada exige sessão/permissão.
8. **Entrega**: same-origin, `ETag`/304, `Content-Type` real, `Content-Length`,
   `X-Content-Type-Options: nosniff`; imagem `inline`, PDF `attachment`, cache imutável por versão.
   Nunca presigned URL no browser.
9. **Variantes AVIF/WebP na primeira entrega**: o serviço gera `[360, 720, 1200, 1920]` sem
   ampliar, usando ffmpeg (`libaom-av1` e `libwebp`) atrás da porta `ImageTransformer`. Fonte menor
   que 360 gera uma variante no tamanho original (imagens menores que 2 px ficam no original);
   GIF/APNG/WebP/AVIF animados e AVIF com alpha não são convertidos (o alpha permanece no WebP). O original só vira `ready` depois das variantes; se
   o engine falhar, a original continua `ready` e o erro é logado.
10. **Picture recebe dados resolvidos**; o componente não consulta banco. O AST persiste `mediaId`,
    nunca URL crua. Com variantes, emite `<source type="image/avif">` e `image/webp` com `srcset`
    em `w`; sem variantes, um único `<img>` original.

## Consequências

**Positivas**
- Nenhuma transação longa com S3; órfãos têm política de GC.
- Entrega pública não depende de um módulo administrativo opcional.
- `alt` e visibilidade são explícitos e testáveis.

**Custos / negativas**
- O fluxo tem dois passos (`pending` → `ready`) e um job de GC.
- O upload bloqueia enquanto o ffmpeg gera até 8 representações; a imagem Docker inclui ffmpeg.
- AVIF com alpha é omitido para não perder transparência; a imagem fica com WebP + original.

## Verificação (Fase 2, implementada)

- MIME spoof/SVG/limite/alt vazio falham com 415/413/422 (unitário + integração).
- Tenant A não lê mídia do tenant B; `private` sem sessão e arquivada retornam 404.
- Falha de S3 não deixa `ready`; GC remove `failed`/órfão e preserva `ready`.
- `GET/HEAD` com ETag/304, content-type/disposition/cache e stream same-origin.
- Variantes: chaves determinísticas, AVIF/WebP, `srcset` com `w`, cache imutável e GC preservando
  objetos de mídia `ready`.
- E2E: upload 400×300, archive/restore, hero `<Picture>` com AVIF/WebP, entrega de original e
  variantes, axe e reflow.
