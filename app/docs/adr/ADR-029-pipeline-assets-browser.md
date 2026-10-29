# ADR-029 — Pipeline determinístico de assets de browser

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-26) |
| **Data** | 2026-10-26 |
| **Relacionadas** | ADR-008, ADR-011, ADR-014, ADR-026 |

## Contexto

O `deno.json` declarava `vendor` apontando para `scripts/vendor-assets.ts`, que não existia. Não havia
`js:build`, e `ci`/`build:bin` só executavam o build de CSS. O único JS de browser era o HTMX já
vendorizado em `static/js/vendor/htmx.min.js`, sem uma verificação reproduzível de presença,
licença ou ausência de URL externa.

Editor rico (02) e mapas (09) vão exigir bundles próprios. Se o pipeline não for fixado antes, cada
fase inventa um caminho e o binário pode sair sem o asset.

## Decisão

1. **Fontes próprias** ficam em `src/layout/assets/js/` e são copiadas para `static/js/` por
   `scripts/build-js.ts`.
2. **Vendor de terceiros** fica em `static/js/vendor/` com licença ao lado. O build valida:
   arquivo presente e não vazio, licença obrigatória e ausência de URL `http(s)` no artefato.
3. O build **não baixa nada em tempo de execução**. Atualização de vendor é uma mudança de código
   com licença e diff revisados.
4. `deno task js:build` é o único caminho de montagem de JS. `ci`, `build:bin`, `build:bin:linux`,
   Dockerfile e Dockerfile.binary dependem dele.
5. A task morta `vendor` foi removida. Um bundler só entra na fase que tiver bundle real (02/09),
   com versão pinada e ADR da dependência.
6. CSS continua em `css:build`; os dois builds são independentes e determinísticos.

## Consequências

**Positivas**
- CI e binário produzem o mesmo conjunto de assets.
- Asset ausente, licença removida ou URL externa falham antes do deploy.
- Nenhum download surpresa no boot.

**Custos / negativas**
- `js:build` ainda não minifica JS próprio; a fase 02 introduz o bundler com versão pinada.
- O vendor precisa ser atualizado manualmente, com licença e diff.

## Verificação

- `deno task js:build` verifica HTMX e imprime o BLAKE3 dos arquivos.
- `deno task ci` e `deno task build:bin` executam `js:build` antes do CSS/compile.
- `git grep "vendor-assets"` não encontra mais a task morta.
