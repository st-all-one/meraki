# 07 — Anexos locais

**Objetivo:** permitir anexos em demandas (e preparar o mesmo modelo para chat), com armazenamento em disco, download autenticado e validação forte.

**Duração esperada:** 3–4 dias.

## 7.1 Storage local

Crie `src/modules/attachments/infrastructure/local-storage.ts` com uma porta pequena:

```ts
interface LocalStorage {
  put(key: string, bytes: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  getStream(key: string): Promise<ReadableStream<Uint8Array> | null>;
  head(key: string): Promise<{ bytes: number; mime?: string } | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

Regras:

- Raiz: `DATA_PATH/attachments`.
- `key` sempre gerada pelo servidor (`attachments/<aa>/<bb>/<sha256>`); nunca concatenar nome do usuário.
- Normalizar e validar o caminho; rejeitar `..`, `/` absoluto, symlink.
- Diretórios `0700`; arquivos `0600`; gravar em `.tmp` e renomear atômico.
- `getStream` para PDFs/imagens grandes; não carregar tudo em memória no download.
- Sem S3, sem RustFS, sem FFmpeg.

## 7.2 Modelo

Use as tabelas da fase 03:

- `attachments` (metadados + `storage_key` + `sha256`);
- `demand_attachments` (demanda ↔ anexo; `kind=file|canvas_export`);
- `chat_message_attachments` (fase 09).

Campos de exibição: `original_name` escapado; `mime`/`bytes`/dimensões server-side.

## 7.3 Upload

Rotas:

```text
POST /items/:id/attachments              multipart; anexa à demanda
POST /items/:id/attachments/:aid/archive arquiva vínculo (soft)
GET  /items/:id/attachments              partial da lista
GET  /attachments/:id                    serve (inline só imagem)
GET  /attachments/:id/download           força attachment
```

Fluxo:

1. Sessão + CSRF + permissão `create`/`edit` na demanda.
2. Limite de corpo no Caddy (32 MB) e no app; máximo **10 MiB** por arquivo; **3** por mensagem; **10** por tarefa no MVP.
3. Ler magic bytes, não confiar no `Content-Type`:
   - PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), PDF (`%PDF-`);
   - rejeitar SVG, HTML, JS, ZIP, executáveis, desconhecido.
4. Imagem: decodificar/re-encodar (PNG/JPEG) para remover EXIF/metadados e polyglots; limite de pixels (40 MP). Se o decoder não suportar, aceitar como download? **Não**: rejeitar formato não suportado.
5. PDF: validar assinatura e tamanho; não renderizar inline; servir como `attachment`.
6. Calcular `sha256`; se já existe `(tenant_id, sha256)`, reutilizar blob e criar novo vínculo.
7. Gravar blob; inserir `attachments` + `demand_attachments` na mesma transação; se a transação falhar, apagar o blob recém-criado.
8. Retornar partial com o item, progresso e erro por arquivo.

Não aceitar upload por JSON/base64; multipart apenas.

## 7.4 Download

- `GET /attachments/:id`:
  - sessão;
  - carregar anexo + vínculo (`demand_attachments`/`chat_message_attachments`) com `tenant_id`;
  - autorizar acesso à demanda/canal;
  - `Content-Type` derivado do conteúdo armazenado;
  - imagens re-encodadas: `Content-Disposition: inline`; PDF/outros: `attachment`;
  - `X-Content-Type-Options: nosniff`; `ETag` (`sha256`); `Cache-Control: private, max-age=…`;
  - nunca expor `storage_key`/caminho.
- `HEAD` para tamanho/tipo.
- Sem `Range` no MVP, exceto se PDF grande doer; se adicionar, testar.

## 7.5 Limites e quotas

- 10 MiB/arquivo; 3/mensagem; 10/demanda; 5 GB total; 500 MB/usuário.
- Upload 10/min por usuário; 429 com `Retry-After`.
- Ao arquivar vínculo, o blob fica até o doctor/prune.
- `meraki doctor --prune` remove blobs sem vínculo há >24 h; verifica metadados órfãos e arquivos sem linha.
- Backup: SQLite + `DATA_PATH/attachments` juntos; restore testado.

## 7.6 UI

- Aba **Anexos** da demanda:
  - dropzone/“Escolher arquivo”; câmera no mobile;
  - lista com ícone, nome, tamanho, autor/data;
  - preview de imagem em dialog; PDF abre download;
  - “Arquivar” com confirmação; sem delete duro.
- Composer de chat (fase 09) reutiliza o mesmo componente, com chips de arquivos antes de enviar.
- Progresso por arquivo; erros claros (“PDF até 10 MB”, “SVG não é permitido”).
- Mobile: botão de anexo no composer; lista compacta; sem hover.

## 7.7 Segurança

- Path traversal: chave gerada; validar `filepath.IsLocal`/equivalente; proibir symlink.
- XSS: nunca servir HTML/SVG; `nosniff`; `Content-Disposition`.
- IDOR: download sempre passa pelo vínculo e pela demanda/canal.
- Decompression bomb: limite de pixels e bytes; decodificar com limite.
- Nome original: escapar no HTML; não usar no filesystem.
- Disco cheio: erro 507; não deixar metadados sem blob.
- Logs: não logar conteúdo, caminho absoluto ou nome do usuário.

## 7.8 Testes

- Upload PNG/JPEG/PDF válidos; SVG/HTML/ZIP rejeitados.
- MIME falso (`image/png` com HTML) rejeitado por magic bytes.
- Imagem com EXIF: metadados removidos.
- Download sem sessão/permissão → 403/404.
- Path traversal no nome original não afeta o storage.
- Deduplicação de hash; dois vínculos, um blob.
- Quota/limite/rate limit.
- Órfão removido pelo doctor; arquivo ausente detectado.
- Backup/restore inclui anexo e metadados.

## Aceite

- [ ] Anexar imagem/PDF a uma demanda; recarregar e baixar.
- [ ] Download exige login e acesso à demanda.
- [ ] SVG/HTML/JS e MIME falso são rejeitados.
- [ ] Limites/quotas/rate limit aplicados.
- [ ] Deduplicação e limpeza de órfãos funcionam.
- [ ] Backup/restore preserva anexos.
- [ ] UI mobile/desktop sem hover.

## Riscos

- **Decoder de imagem**: escolha uma biblioteca pura que rode no `deno compile`; se não houver, reduza a allowlist e não gere preview.
- **PDF**: não renderizar no servidor; download apenas.
- **Disco**: monitorar espaço; backup separado do binário.
- **Apagar cedo**: soft archive + prune; não delete durante a request.
