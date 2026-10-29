# ADR-040 — Mapas com MapLibre GL JS + PMTiles

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-27) |
| **Data** | 2026-10-27 |
| **Substitui** | ADR-024 (Leaflet) |
| **Plano de origem** | Serviço 09 — mapas |
| **Relacionadas** | ADR-008, ADR-009, ADR-023, ADR-029, ADR-039 |

## Contexto

A ADR-024 fixou Leaflet como padrão, condicionado à primeira feature de mapa, e proibiu MapLibre
sem ADR nova. O requisito atual é entregar a capacidade de mapa **antes** do primeiro consumidor de
domínio: o produto ainda não tem coordenadas/GeoJSON reais, mas a infraestrutura precisa estar
pronta para que uma feature futura apenas forneça uma definição de mapa.

MapLibre + PMTiles foi escolhido por:

- basemap vetorial em um único arquivo, servido same-origin pelo `StoragePort`;
- estilo/cores/camadas controlados pelo servidor, sem depender de tile server;
- zero CDN e zero URL externa no browser;
- possibilidade de servir o arquivo PMTiles por `Range`, sem carregar o arquivo inteiro.

O custo é maior que Leaflet: bundle grande, WebGL2, worker, CSP específica e necessidade de
vendorização. Este ADR aceita esse custo de forma explícita e o isola na rota de mapa.

## Decisão

1. **MapLibre GL JS 6.16.0** (BSD-3-Clause) e **PMTiles 4.5.0** (BSD-3-Clause) são as bibliotecas
   padrão de mapa do projeto. Leaflet é removido do padrão e não é vendorizado.
2. O `StoragePort` ganha `getRange(key, start, end)`; `.pmtiles` é servido em
   `GET/HEAD /maps/:arquivo.pmtiles` com `Accept-Ranges`, `206`, `Content-Range`, `Content-Length`
   e `ETag`. Sem `Range`, a resposta é `200`. Path traversal e arquivos não registrados retornam
   `404`; range inválido retorna `416`.
3. O serviço `maps` é headless e resolve definições, centro, zoom, limites, legenda, atribuição e
   estilo. Ele não importa módulos, não acessa DOM e não carrega MapLibre.
4. O módulo `maps` publica a página de mapa e os assets. O mapa é uma ilha client-side: o bundle
   MapLibre só é carregado na rota de mapa, via `<script type="module" src=...>`, sem inline.
5. O bundle é vendorizado por `deno task js:build` em
   `static/js/vendor/maps/map.js`, com worker, CSS e licenças same-origin. O worker é carregado por
   URL same-origin (`setWorkerUrl`), sem CDN. O binário `deno compile` inclui os assets.
6. **CSP por rota:** a rota `/maps` recebe `worker-src 'self' blob:`, `child-src 'self' blob:` e
   `img-src 'self' data: blob:`. As demais rotas mantêm a CSP estrita da ADR-008. Não há
   `unsafe-inline`/`unsafe-eval`; `geolocation` continua negada.
7. O estilo é JSON gerado/validado no servidor. Fontes e sprites externos são proibidos; a primeira
   versão não usa camadas de texto (sem glyphs) e entrega a legenda/lista em HTML.
8. O fallback é obrigatório: a página entrega uma tabela/lista textual de pontos, legenda,
   atribuição e instruções de teclado mesmo sem JavaScript. O canvas nunca é a única fonte da
   informação.
9. Sem consumidor de domínio, o módulo entrega um **mapa de exemplo explicitamente rotulado**. Ele
   não representa dados do produto e serve para exercitar o serviço, o Range, o estilo, a CSP e o
   fallback. Quando a primeira feature real entrar, as definições reais substituem o exemplo, sem
   criar um segundo padrão.
10. PMTiles é gerado **fora do runtime** (CLI de operação documentada). O binário não gera tiles e
    não faz proxy de tiles externos.

## Consequências

**Positivas**

- Range real no storage, reutilizável por qualquer asset grande.
- Bundle e CSP isolados; páginas sem mapa não pagam o custo.
- Estilo e dados same-origin; atribuição e fallback são parte do contrato.
- O primeiro consumidor futuro só precisa declarar `MapDefinition` e GeoJSON/PMTiles.

**Custos / negativas**

- Bundle de mapa é grande e exige WebGL2 no cliente.
- O worker e `img-src`/`worker-src` exigem CSP específica na rota.
- Sem camadas de texto/glyphs na primeira versão; labels ficam no HTML.
- O mapa de exemplo é deliberadamente artificial e não deve ser promovido a feature de produto.

## Verificação

- Unitário: validação de definição/GeoJSON, estilo sem URL externa, chave reservada, range/ETag.
- Integração: `GET/HEAD` PMTiles sem Range (`200`) e com Range (`206`, `Content-Range`), `416`,
  path traversal e `304`; style JSON same-origin.
- E2E: mapa carrega (ou a página informa indisponibilidade), pan/zoom, console sem erro de CSP,
  zero request externa, fallback sem JS, axe e reflow em 320px.
- `deno task js:build` valida bundle/worker/CSS/licenças; `deno task build:bin` inclui os assets.

## Referências

- `docs/adr/ADR-008-cache-http-etag-csp.md`
- `docs/adr/ADR-009-rustfs-s3.md`
- `docs/adr/ADR-023-caddy-borda-portas-503xx.md`
- `docs/adr/ADR-029-pipeline-assets-browser.md`
- MapLibre GL JS 6.16.0, PMTiles 4.5.0
