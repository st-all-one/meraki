# ADR-023 — Caddy como borda única e portas na faixa 503xx

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Operação e rede |
| **Relacionadas** | ADR-008, ADR-009, ADR-014, ADR-015 |

## Contexto

A aplicação publicava a porta `8000` diretamente no host. Isso expõe o runtime Deno sem uma borda
comum, dificulta TLS/compressão/roteamento futuro e deixa portas de serviços espalhadas por faixas
arbitrárias (`8000`, `9000`, `6379`, `4317`, `4318`). O projeto também vai precisar de um ponto único
para servir assets e, no futuro, tiles PMTiles com `Range`.

## Decisão

1. **Caddy 2 é o único entrypoint publicado no host.** App, Valkey, RustFS e coletor OTel não
   publicam portas; quando precisam ser inspecionados, use `docker compose exec` ou bind em
   `127.0.0.1`.
2. **Toda porta do projeto vive na faixa `503xx`** (`50300`–`50399`):

   | Serviço | Porta | Exposição |
   | :--- | ---: | :--- |
   | app (Deno/Hono) | `50300` | interna (`expose`) |
   | Caddy HTTP | `50380` | host (`${CADDY_HTTP_PORT}`) |
   | Caddy HTTPS (reservado) | `50343` | host, quando houver certificado |
   | Valkey | `50379` | interna (`data`) |
   | RustFS/S3 | `50390` | interna (`data`) |
   | OTel gRPC | `50317` | loopback (perfil observability) |
   | OTel HTTP | `50318` | loopback (perfil observability) |
   | OTel health | `50333` | interna ao coletor |

   Novas portas escolhem um número livre dentro da faixa e são registradas nesta tabela.
3. **Fluxo:** `navegador → Caddy :50380 → app :50300`. O app confia em **um** proxy
   (`TRUST_PROXY_HOPS=1`) e usa `APP_URL` público (`http://localhost:50380` em dev).
4. O `Caddyfile` desliga o admin, aplica compressão e faz `reverse_proxy` para `app:50300`.
   TLS fica na borda externa ou em um bloco Caddy com certificado; a porta HTTPS reservada é
   `50343`, nunca `443`.
5. As redes não mudam: `edge` tem saída; `data` é `internal: true` e contém app, Valkey e RustFS
   (ADR-015). Caddy fica só em `edge`.
6. O healthcheck do Compose consulta `http://127.0.0.1:50380/healthz` na borda; o da app continua
   em `50300`.

## Justificativa (alternativas descartadas)

- **Publicar a app direto** — sem borda única, sem TLS/compressão central e sem ponto para tiles.
- **Nginx/Traefik** — Caddy entrega HTTPS automático, configuração curta e imagem pequena; o projeto
  não precisa de mais um DSL.
- **Faixas aleatórias/portas padrão** — colidem com outros projetos do host e dificultam firewall.
- **Publicar Valkey/RustFS** — viola o isolamento do ADR-015.

## Consequências

**Positivas**

- Um único ponto publicável e firewall previsível.
- `X-Forwarded-*` com confiança explícita; logs/rate limit corretos.
- Espaço para TLS, cache de assets e tiles no futuro.

**Custos / negativas**

- Mais um container e um arquivo de configuração.
- URLs locais mudam de `:8000` para `:50380`; documentação, CI e e2e precisam acompanhar.
- Caddy vira dependência de disponibilidade da borda.

## Verificação

- `docker compose config` mostra apenas `50380` publicada.
- `docker compose ps` confirma app/Valkey/RustFS sem `0.0.0.0`.
- `curl -I http://localhost:50380/healthz` responde `200`.
- `make up` sobe com `depends_on: service_healthy` e o login funciona via `50380`.

## Referências

- `docker-compose.yml`, `docker/caddy/Caddyfile`
- `src/kernel/config/env.ts` (`PORT`, `TRUST_PROXY_HOPS`)
- `docs/wiki/Operacao.md`, `docs/wiki/Seguranca.md`
