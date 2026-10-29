# ADR-009 — RustFS (S3) como storage único desde o dia zero

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-003, ADR-010 |

## Contexto

Arquivos (mídia, anexos, exports) não devem ser gravados em coluna nem em caminho local improvisado.
O backend precisa ser trocável sem mudar o domínio. RustFS é S3-compatível, Apache-2.0 e roda em um
container; AWS S3 é a saída de produção sem reescrita. MinIO foi descartado por AGPL.

## Decisão

1. **S3 é a interface única** (`StoragePort`): `put`, `get`, `getStream`, `putStream`, `head`,
   `list`, `copy`, `delete`, `presignGet`, `ping`, `ensureBucket`.
2. **RustFS** local no Compose (`rustfs/rustfs:1.0.1-glibc`), porta 9000, console desligado,
   path-style (`STORAGE_FORCE_PATH_STYLE=true`).
3. Dados em `${DATA_PATH}/rustfs/data`; volume com relabel SELinux `:Z` — sem isso o container não
   escreve em Fedora.
4. Bucket `STORAGE_BUCKET` é garantido de forma idempotente no boot (`PUT /bucket`; 409 = existe).
5. Falha de storage no boot **não derruba** a aplicação; operações falham explicitamente e `readyz`
   reporta o estado.
6. Trocar para AWS S3 = endpoint, credenciais, região e path-style `false`.

## Justificativa (alternativas descartadas)

- **Disco local direto** — descartada: acopla ao host, não escala e muda o fluxo ao migrar.
- **MinIO** — descartada: AGPL-3.0, incompatível com a política de licenças permissivas.
- **Coluna BLOB no SQLite** — descartada: incha o banco, backup e cache; objetos não são linha.
- **SDK AWS completo** — descartada: `aws4fetch` cobre SigV4 com fração do peso.

## Consequências

**Positivas**
- Mesmo código local e nuvem; sem disco compartilhado entre containers.
- Domínio não conhece backend; só a porta S3.

**Custos / negativas**
- Assinatura SigV4 manual via `aws4fetch`; ausência de Object Lock/WORM (backlog).
- Bucket precisa de permissão correta; bind mount com SELinux exige `:Z`.
- Backlog: lifecycle, antivírus e backup do bucket; variantes de imagem ficam na ADR-031.

## Exemplo mínimo (comparativo)

```ts
// ❌ caminho local acoplado ao container
await Deno.writeFile(`/app/uploads/${key}`, bytes);

// ✅ porta S3; troca de backend é configuração
const storage = createObjectStorage(config);
await storage.put(key, bytes, "image/png");
const signed = await storage.presignGet(key, 300);
```

## Verificação

`GET /readyz` inclui `RustFS (S3)`; o boot cria o bucket; `make up` sobe o storage com healthcheck;
smoke de upload/download em teste futuro usa a mesma porta.

## Emenda (2026-10-23) — streaming e catálogo

Mídia (imagens, PDFs, lotes) não pode ser carregada inteira na memória. A porta ganhou:

- `getStream(key)` — GET com `response.body` (streaming, sem buffer).
- `putStream(key, body, size, contentType)` — até 8 MiB bufferiza e faz um PUT com
  `Content-Length`; acima disso usa multipart de 8 MiB (cada parte bufferizada e assinada). O
  RustFS rejeita PUT com stream sem `Content-Length` (HTTP 411). `x-amz-content-sha256:
  UNSIGNED-PAYLOAD`; requer HTTPS (ou RustFS local) para não expor payload sem hash de assinatura.
- `head(key)` — tamanho/ETag/content-type sem baixar o objeto.
- `list(prefix)` — ListObjectsV2 (`list-type=2`), XML mínimo (`Contents/Key/Size/ETag`).
- `copy(from, to)` — `x-amz-copy-source` no destino.

`get`/`put` continuam para objetos pequenos (configuração, JSON, ícones). Nenhuma dependência nova.

## Referências

- `src/services/storage/storage.ts`
- `public-v7/wiki/adr/ADR-030-object-storage-s3-rustfs.md`
