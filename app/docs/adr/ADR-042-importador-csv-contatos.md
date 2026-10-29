# ADR-042 — Importador CSV fechado, com contatos como primeiro consumidor

**Status:** Aceito em 2026-10-27.
**Contexto:** Fase 12 do roadmap de serviços (`11-excel-importer`). Não existe ETL do legado nem
carga editorial por planilha. O produto escolheu criar o módulo `contacts` como consumidor real de
uma carga operacional, em vez de manter o importador bloqueado ou criar um serviço sem uso.

## Decisão

1. **CSV é o único formato desta fase.** XLSX/macro/fórmula fica fora até um consumidor concreto
   exigir e uma ADR própria definir limites de zip bomb, macros e fórmulas. O importador rejeita
   magic bytes binários (`PK`, `%PDF`, imagens) e exige UTF-8.
2. **`src/services/importer` é o serviço headless** de parse/validação/dry-run. Ele não conhece
   tabelas, módulos ou regras de negócio. Cada módulo fornece uma `ImportDefinition` fechada em
   código: colunas, normalização, validação, chave e `apply`.
3. **`contacts` é o primeiro consumidor.** A tabela `contacts` é do módulo; a UI é
   `/cms/contacts` e `/cms/contacts/import`. Não há módulo `imports` genérico nesta fase: uma UI
   compartilhada só se justifica com o segundo consumidor.
4. **Dry-run não grava.** O preview mostra contagens e erros por linha. A confirmação reenvia o CSV
   em um campo oculto base64, que é **reparseado e revalidado** no servidor. Assim não há tabela de
   lote, arquivo temporário ou PII persistida entre as duas requisições.
5. **Aplicação atômica e idempotente.** O módulo abre a transação, chama `Importer.apply` e grava a
   auditoria na mesma transação. A chave é `(tenant_id, email_normalized)`; reimportar o mesmo
   arquivo não duplica e atualiza somente campos alterados.
6. **Limites e segurança.** `IMPORT_MAX_BYTES`, `IMPORT_MAX_ROWS` e
   `IMPORT_RATE_LIMIT_PER_MINUTE` limitam arquivo, linhas e tentativas por ator. O CSV é texto; não
   há SQL, colunas arbitrárias, HTML/CSS, avaliação de fórmula ou log de valores/PII. Fórmulas são
   armazenadas como texto.
7. **Jobs ficam fora desta fatia.** O limite padrão de 500 linhas cabe em uma transação curta. Se o
   limite operacional crescer, a importação deve virar job com lote/relatório persistido; isso não
   é antecipado agora.

## Consequências

- Um novo importador exige uma definição fechada e uma tela/rota no módulo dono; não há upload
  arbitrário nem mapeamento visual de colunas.
- O CSV não é retido no servidor após a requisição; um operador que perde o preview precisa
  selecionar o arquivo novamente.
- XLSX, sincronização contínua, ETL de legado e importação editorial permanecem fora de escopo.

## Verificação

`tests/unit/importer_test.ts` cobre RFC 4180, limites, duplicatas, fórmulas como texto e erros
estruturais. `tests/integration/contacts_test.ts` cobre criação, atualização, idempotência e
isolamento de tenant. O E2E cobre upload, dry-run, confirmação, reimportação e axe em
`e2e/tests/contacts.spec.ts`.
