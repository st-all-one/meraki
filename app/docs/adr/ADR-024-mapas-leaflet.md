# ADR-024 — Leaflet como biblioteca padrão de mapas

| Campo | Valor |
| :--- | :--- |
| **Status** | Substituído por ADR-040 (2026-10-27) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Mapa logístico |
| **Relacionadas** | ADR-008, ADR-011, ADR-023 |

## Contexto

O produto vai precisar de mapa logístico interativo: exibir paradas, rotas e veículos, arrastar
pinos e reordenar entregas. As opções iniciais são:

- **Leaflet** — raster/DOM, sem WebGL, arraste de marker nativo, ecossistema pequeno e previsível;
- **MapLibre GL JS + PMTiles** — vector/WebGL, basemap em um arquivo, porém bundle grande, WebGL2
  obrigatório e CSP com worker/imagens `blob:`.

O projeto é server-rendered, com CSP estrita, zero CDN e sem tile server. O mapa é uma **ilha**
client-side: não pode contaminar o resto das páginas.

## Decisão

1. **Leaflet 1.9.x é a biblioteca padrão de mapas do projeto.** A dependência só é vendorizada
   quando a primeira feature de mapa entrar; até lá, esta ADR fixa a escolha.
2. Leaflet é carregado como módulo externo same-origin, com CSS e imagens de marker vendorizados e
   licença preservada. Nada de CDN, nada de inline.
3. **Tiles são servidos same-origin** (assets estáticos ou proxy da aplicação). Provedor externo de
   tiles no browser é proibido: quebra zero CDN, CSP e disponibilidade. Atribuição do provedor é
   obrigatória.
4. **MapLibre + PMTiles não é o padrão.** Só entra com ADR nova e requisito concreto de basemap
   vetorial/estilo próprio ou volume que justifique WebGL; nesse caso, o worker e `img-src`/`blob:`
   precisam ser revistos na CSP.
5. O mapa é progressivo: sem JS, a página entrega lista/tabela de paradas com coordenadas, status e
   links. A versão interativa é um enhancement.
6. **Arrastar é gesto, não regra.** O mapa emite comandos (`moverParada`, `reordenarRota`,
   `atribuirPedido`) para rotas web autenticadas; o servidor valida coordenada, permissão,
   geofence, concorrência (`version`) e grava evento no outbox.
7. **Acessibilidade:** toda ação de arrastar tem alternativa por teclado/formulário (WCAG 2.2 SC
   2.5.7), alvos ≥24 px, foco visível e anúncio do resultado em `aria-live`.
8. Geolocalização do navegador é opt-in por rota: o `Permissions-Policy` global continua negando
   `geolocation`; quando necessário, a política é relaxada apenas na resposta daquela página.
9. Cálculos geográficos (distância, bbox, ponto-em-polígono) ficam no servidor, em funções puras,
   com WGS84 e índice R*Tree; não se adiciona biblioteca GIS para o caso simples.

## Justificativa (alternativas descartadas)

- **MapLibre + PMTiles já na fundação** — peso, WebGL2, worker, CSP e complexidade sem feature que
  pague o custo.
- **Google Maps/Mapbox GL** — dependência externa, chave, CDN e termos incompatíveis com zero CDN.
- **SVG próprio para tudo** — bom para gráficos, ruim para pan/zoom/tiles e interação de mapa.
- **Arrastar sem comando de servidor** — estado divergente, sem auditoria e sem concorrência.

## Consequências

**Positivas**

- CSP simples: sem worker, sem `blob:` e sem WebGL.
- Bundle menor e comportamento previsível em desktop/mobile.
- Caminho claro de acessibilidade e fallback sem JS.

**Custos / negativas**

- Tiles raster ocupam mais armazenamento que um PMTiles.
- Leaflet não consome PMTiles nativamente; migrar para vector exige ADR nova.
- Funcionalidades avançadas (edição de geometria, milhares de features) podem precisar de plugins.

## Verificação

- Smoke Playwright: mapa carrega, arrasta um pino, persiste via rota web e atualiza a lista.
- axe sem violações `serious`/`critical`; alternativa de teclado exercitada.
- Nenhuma requisição externa no browser; console sem erro de CSP.
- Teste de integração cobre 409 (versão antiga) e 422 (coordenada inválida).

## Referências

- `docs/adr/ADR-008-cache-http-etag-csp.md`
- `src/kernel/http/security.ts` (`Permissions-Policy`)
- Leaflet 1.9.x
