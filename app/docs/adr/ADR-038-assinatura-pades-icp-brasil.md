# ADR-038 — Assinatura PAdES, A1 local e verificação independente

**Status:** aceito em 2026-10-27.
**Contexto:** Fase 9 (serviço 08), inspirado no módulo `_SUCESU/V2/Services/DigitalSignature`.

## Contexto

O produto precisa assinar PDFs finalizados com certificado digital e permitir que terceiros
verifiquem o resultado sem confiar no banco. A referência PHP usava TCPDF/FPDI, assinatura
síncrona e chave privada cifrada no banco. O runtime Somlos é Deno, a assinatura é efeito externo
e a chave privada não pode morar no banco (AGENTS §5).

O consumidor é a assinatura manual de documento no CMS (`/cms/signature`), com certificado A1 em
dev/teste ou assinador remoto/HSM em produção. O PDF assinado é um novo artefato público; o
original permanece privado.

## Decisão

1. **PAdES-B-B com `pdf-lib` + `@signpdf` + `node-forge`.**
   - `pdf-lib` desenha o carimbo opcional, o widget e o placeholder.
   - `@signpdf/signpdf@4.0.0` calcula `ByteRange` e injeta o CMS detached.
   - `node-forge@1.3.3` monta o `SignedData`, adiciona `id-aa-signingCertificateV2` (RFC 5035) e
     `signingTime` autenticado, e assina os atributos com RSA/SHA-256. A data `/M` do dicionário
     PDF não é coberta pelo `ByteRange` e não é usada como fonte de verdade.
   - `SubFilter` é sempre `ETSI.CAdES.detached`; o resultado é validado com `pdfsig` e pelo
     verificador próprio.
   - Licenças: MIT (`@signpdf/*`, `pdf-lib`) e BSD-3-Clause (`node-forge`), versões pinadas em
     `deno.json`/`deno.lock`.
2. **Chave privada fora do banco.**
   - A1 é fallback **somente** em `APP_ENV != production`.
   - O PFX é lido uma vez; a chave PEM é cifrada com AES-256-GCM usando
     `SIGNATURE_LOCAL_KEY`, gravada no storage (`signature/<tenant>/<id>/key.enc`) e nunca no
     banco ou log. O banco guarda IV e ponteiro do objeto.
   - Produção exige `SIGNATURE_PROVIDER=remote`, URL HTTPS e token; o processo não recebe a
     chave. O contrato é `POST application/pdf` com metadados em `X-Signature-Metadata`
     (base64url JSON) e resposta `application/pdf`.
   - Arquivar remove o objeto de chave; a linha de certificado permanece para auditoria.
3. **Assinatura assíncrona e imutável.**
   - `POST /cms/signature` ingere o PDF original como Media privado e enfileira
     `signature.sign` (payload só `{requestId}`).
   - O worker confere o checksum BLAKE3 do original antes de assinar, **verifica o resultado antes
     de publicar**, ingere um novo Media público (`application/pdf`) e grava a referência na
     solicitação. Falha antes do commit arquiva o Media recém-criado; não sobra artefato público
     órfão.
   - Não há sobrescrita: cada solicitação gera uma nova versão; correção é nova assinatura.
4. **Verificação independente.**
   - `GET /verify/:id` lê os bytes do Media assinado, extrai o CMS, recomputa o digest do
     `ByteRange`, valida `signingCertificateV2`, verifica a assinatura RSA e recalcula a cadeia.
   - O banco serve apenas para localizar o PDF; não é fonte de verdade do resultado.
   - `SIGNATURE_TRUST_ROOTS_PATH` fornece raízes PEM; sem raízes, a assinatura pode ser
     criptograficamente válida, mas a UI mostra que a cadeia não foi validada.
   - `SIGNATURE_POLICY_OID`/`SIGNATURE_POLICY_HASH` opcionais adicionam
     `id-aa-ets-sigPolicyId`; sem eles o resultado é PAdES-B-B, não uma política ICP-Brasil
     específica.
5. **Permissões e auditoria.**
   - `signature.read` lista/histórico; `signature.write` importa/arquiva certificado;
     `signature.sign` solicita assinatura. Certificados são do usuário que os importou.
   - Auditoria registra importação, arquivamento, solicitação, sucesso e falha sem corpo,
     senha, token ou nome de arquivo. A senha do PFX e a chave nunca são logadas.
6. **Superfície.** `signature_certificates` (metadados + ponteiro de chave) e
   `signature_requests` (estado, Media, metadados públicos da assinatura) em migration
   `0012_signature.sql`. Nenhum HTML/CSS de conteúdo vai ao banco.

## Consequências

- A1 local em produção é recusado no boot (`SIGNATURE_PROVIDER=local` falha).
- O HSM/remote signer precisa implementar o contrato HTTP; a verificação continua local.
- TSA RFC 3161, OCSP/CRL e cadeia ICP-Brasil completa dependem de `SIGNATURE_TRUST_ROOTS_PATH`
  e do provedor. O verificador local relata token de tempo presente, mas **não** o valida;
  `timestamp_not_validated` aparece como observação.
- Não há PDF/A, OCR, assinatura em lote, S/MIME ou assinatura XML.
- PDFs antigos não são apagados automaticamente; retenção segue a política do tenant.
- O verificador aceita apenas RSA/SHA-256 nesta versão; ECDSA é recusado com erro claro.

## Alternativas descartadas

- **TCPDF/FPDI + chave no banco (referência):** incompatível com Deno e com a proibição de chave
  no banco.
- **Chromium/Puppeteer:** assinatura não exige renderização; aumenta superfície e binário.
- **Guardar PFX cifrado no banco:** viola a fronteira de segredo e amplia o raio de vazamento.
- **Aceitar qualquer PDF assinado como PAdES:** o verificador exige `ETSI.CAdES.detached` e
  `signingCertificateV2`; Adobe PKCS#7 legado é recusado.

## Verificação

- `tests/unit/signature_pades_test.ts`: assinatura válida, ESS, política, adulteração e ausência
  de raízes.
- `tests/unit/signature_certificate_test.ts`: PFX, senha, validade, cifra/decifra.
- `tests/unit/signature_form_test.ts`: parsing do formulário, página inteira e associação de erros.
- `tests/unit/signature_provider_test.ts`: contrato do assinador remoto e falhas de resposta.
- `tests/integration/signature_test.ts`: importação, fila, Media, checksum do original, idempotência,
  auditoria, arquivamento e verificação.
- `e2e/tests/signature.spec.ts`: importar A1 efêmero, assinar PDF, baixar/verificar, erro de
  formulário com `aria-invalid`, axe/reflow.
- `pdfsig` confirma `Signature Type: ETSI.CAdES.detached` e assinatura válida.
