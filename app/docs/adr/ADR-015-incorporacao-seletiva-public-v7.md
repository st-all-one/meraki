# ADR-015 — Incorporação seletiva do public-v7: determinismo, borda e áreas restritas

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Análise dos 45 ADRs de `public-v7/wiki/adr/` |
| **Relacionadas** | ADR-000, ADR-001, ADR-003, ADR-007, ADR-008, ADR-009, ADR-010, ADR-012 |

## Contexto

O `public-v7` e o Somlos perseguem o mesmo objetivo de longo prazo — legibilidade, previsibilidade e
baixo custo de manutenção —, mas partem de stacks diferentes (Laravel/PHP/PostgreSQL/WHM versus
Deno/TypeScript/SQLite/Docker). Copiar decisões específicas de framework seria importar complexidade
acidental, o que a ADR-000 proíbe. A análise completa está em
[`docs/wiki/Incorporacao-public-v7.md`](../wiki/Incorporacao-public-v7.md).

A pergunta objetiva era: **quais ideias e decisões do public-v7 pagam o custo no Somlos hoje?**

## Decisão

Adotamos agora apenas o que reforça a ADR-000 com pouco código novo:

1. **Determinismo com relógio injetável.** `src/kernel/time/clock.ts` centraliza tempo, UUIDv7 e ano.
   `createClock(() => instante)` fixa o tempo em teste. Nenhuma regra lê `Date.now`, `new Date`,
   `crypto.randomUUID` ou `Math.random` fora desse módulo; o gate `tempo/IDs via clock` falha o
   build caso contrário. `performance.now` continua permitido para duração de métricas.
2. **Runtime sem download em produção.** Imagens pinadas por digest (`denoland/deno`, Valkey,
   RustFS, OTEL Collector, Debian). O build pré-cacheia os exporters OTLP que o LogTape importa
   dinamicamente; a imagem roda com `--cached-only`. O binário `deno compile` inclui os mesmos
   exporters via `--include npm:...` e foi executado com `DENO_DIR` vazio, sem download.
3. **Borda e container em profundidade.** Redes `edge` (saída) e `data` (`internal: true`, sem rota
   padrão). Valkey/RustFS só na `data`; apenas a app publica porta. `no-new-privileges`, `cap_drop:
   ALL` na app/storage/collector, `pids_limit` e `ulimits`. As portas de Valkey/RustFS continuam
   em **loopback** por conveniência dos testes executados no host; produção deve removê-las (ou
   usar `docker compose exec`).
4. **Áreas restritas invisíveis.** `/login`, `/logout`, `/app`, `/api/*`, `/healthz` e `/readyz`
   respondem `X-Robots-Tag: noindex, nofollow, noarchive`. `robots.txt` é mínimo (`Allow: /`) e
   **não** cita áreas privadas; não há sitemap público nesta fundação.
5. **Menos dependências.** Removidos `pg` (herança do desenho PostgreSQL), `hono/secure-headers` e
   `hono/testing`; nenhum era importado. A regra continua: dependência nova exige justificativa e,
   se estrutural, ADR.
6. **Progressive enhancement é testado.** E2E com `javaScriptEnabled: false` prova home e login
   sem JS. HTMX continua sendo melhoria, não requisito do caminho crítico.
7. **Convenção grep-friendly para o que nascer.** Módulos, eventos e logs novos usam o token do
   módulo (`identity.session_started`, `system.demo_requested`). Não renomeamos tabelas/rotas
   existentes: o ganho não paga o churn e a migração de dados.

## Ideias analisadas e não incorporadas agora

- **WHM/Apache, bind mounts do cPanel, PostgreSQL 18, OPcache, PHPStan/Infection, TipTap, daisyUI,
  i18n, PWA, temas como dado, autodescoberta de módulos** — específicas de outra stack ou produto
  que ainda não existe aqui. Ver a matriz por ADR na wiki.
- **Trilha de auditoria imutável (public ADR-035)** — o outbox e o log estruturado não são prova
  forense; a tabela `audit_log` entra com o primeiro módulo que muta conteúdo no CMS, não antes
  (evita schema morto).
- **Cobertura ≥90% / mutation testing (public ADR-038/039)** — medir primeiro; não há ferramenta de
  mutation estável para Deno e um piso arbitrário agora incentivaria teste de wiring, contra a
  ADR-000.
- **Podman opt-in (public ADR-044/045)** — Docker já é o runtime único; um segundo caminho agora
  adiciona `userns`, SELinux e um gate sem demanda comprovada.

## Justificativa (alternativas descartadas)

- **Copiar os 45 ADRs** — descartada: importa PHP/Laravel/WHM e decisões de produto preexistentes.
- **Só documentar a análise, sem enforce** — descartada: convenção sem gate erode, como no legado.
- **Abstrair Clock/ID em uma interface com implementações** — descartada: `createClock` é uma
  fábrica simples; não há necessidade de container/registro.
- **Remover as portas de Valkey/RustFS agora** — descartada nesta rodada: quebraria `deno task test`
  no host; o loopback não é exposto à internet. A dívida está explícita.

## Consequências

**Positivas**
- Tempo/IDs determinísticos e testáveis; build falha quando alguém fura a regra.
- Runtime reproduzível e sem download surpresa; redes de dados isoladas.
- Painel/API/login não viram alvo de indexação por acidente.
- Menos dependências; caminho crítico funciona sem JS.

**Custos / negativas**
- `--cached-only` exige cache completo no build; um import dinâmico novo pode falhar só na imagem.
- O gate de determinismo exige usar o clock também em código trivial.
- Portas de dados continuam em loopback no Compose de desenvolvimento.
- Pins por digest precisam de revisão periódica (não há Renovate ainda).

## Exemplo mínimo (comparativo)

```ts
// ❌ imprevisível em teste e espalhado pelo domínio
const now = new Date();
const id = crypto.randomUUID();

// ✅ dependência explícita; teste fixa o instante
const clock = createClock(() => 1_700_000_000_000);
const now = clock.nowIso();
const id = clock.uuidv7();
```

```ts
// ❌ área privada indexável
app.get("/app", handler);

// ✅ mesma rota, sem descoberta por buscadores
// securityHeaders: X-Robots-Tag: noindex, nofollow, noarchive
// robots.txt: User-agent: * / Allow: /
```

## Verificação

- `deno task check`: gate `tempo/IDs via clock` verde.
- `deno task test`: clock determinístico, robots/noindex, ETag/304 verdes.
- `docker compose config -q`; `docker compose ps` com app/valkey/storage saudáveis.
- `docker compose logs app` sem `Download`; `/readyz` com SQLite + Valkey + RustFS.
- `dist/somlos` executado com `DENO_DIR` vazio: sobe, serve `/` e `/robots.txt`, sem download.
- E2E Playwright + axe (inclui o cenário sem JavaScript) verde.

## Emenda 2026-10-26 — estado após as ADR-017 a 027

O corpo acima registra a análise de 2026-10-23 e permanece histórico. Desde então, decisões novas
incorporaram parte do que estava listado como “não incorporado agora”:

- descoberta de módulos por manifesto — ADR-017;
- services headless de RBAC, auditoria e jobs — ADR-018;
- i18n de UI no kernel — ADR-019;
- conteúdo rico como AST TipTap validado — ADR-020;
- área CMS com permissão própria — ADR-021;
- daisyUI 5 / JSX no lugar do Eta — ADR-022 e ADR-026;
- worker de jobs separado e dormente — ADR-027;
- evento demonstrativo passou a `demo.requested` com o split `system`/`demo` — arquivo 01;
- navegação declarativa no manifesto, filtrada por área/permissão — arquivo 03.

A matriz viva, com estados e gatilhos, é
[`docs/wiki/Incorporacao-public-v7.md`](../wiki/Incorporacao-public-v7.md); o plano de evolução é
[`implementaion/00-README.md`](../../implementaion/00-README.md). Auditoria, i18n, daisyUI,
descoberta e RBAC **não** devem ser tratados como adiados ao ler esta ADR.

## Referências

- `public-v7/wiki/adr/ADR-001`, `ADR-002`, `ADR-020`, `ADR-031`, `ADR-043`, `ADR-045`
- `docs/wiki/Incorporacao-public-v7.md` (matriz dos 45 ADRs)
- `src/kernel/time/clock.ts`, `scripts/gates.ts`, `docker-compose.yml`, `Dockerfile`,
  `Dockerfile.binary`, `src/kernel/http/security.ts`
