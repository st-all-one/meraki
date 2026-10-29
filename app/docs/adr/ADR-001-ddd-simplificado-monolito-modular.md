# ADR-001 — DDD simplificado em monolito modular com fronteira física

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-000, ADR-002, ADR-012 |

## Contexto

O projeto é de longo prazo e vai acumular domínios distintos. Um `src/` único com convenções sociais
erode. Microsserviços cedo demais adicionam operação sem necessidade: um servidor, um arquivo SQLite.
O legado `sucesu-cms` acumulou 828 arquivos sem fronteira rígida e código órfão.

## Decisão

Monolito modular com DDD simplificado. Cada módulo em `src/modules/<nome>/` tem quatro camadas:

- `domain/`: tipos, invariantes e regras sem I/O;
- `application/`: casos de uso (orquestram domínio, repositórios e eventos);
- `infrastructure/`: Kysely, storage, cache — implementações concretas;
- `http/`: rotas Hono, validação Zod e tradução HTTP.

`src/kernel/` é o core compartilhado e não conhece módulos. Capacidades headless vivem em
`src/services/<nome>/service.ts` e são descobertas por convenção; módulos vivem em
`src/modules/<nome>/module.ts`. `src/layout/` renderiza e pode importar kernel. Módulos conversam por
**portas** (`src/kernel/ports.ts`, com executor transacional) e **eventos**; nunca por import
direto. O gate `scripts/gates.ts` falha em violação. Schema da aplicação é composto em
`src/db/schema.ts` (ADR-017).

## Justificativa (alternativas descartadas)

- **`app/` único com convenções** — descartada: foi o que erodiu no legado.
- **Somente eventos, sem portas** — descartada: há leitura síncrona (dashboard) que precisa de
  contrato direto.
- **Acoplamento direto entre módulos** — descartada: impede remover/evoluir um módulo.
- **Microsserviços desde o início** — descartada: operação e latência sem ganho comprovado.

## Consequências

**Positivas**
- Fronteira testável por comando, não por disciplina.
- Módulo pode ser extraído/removido sem tocar nos demais; transações locais continuam simples.

**Custos / negativas**
- Um pouco de cerimônia (porta + implementação) em leituras cruzadas.
- DDD tático completo não é adotado; complexidade só entra com necessidade comprovada.

## Exemplo mínimo (comparativo)

```ts
// ❌ módulo importando outro módulo
import { listUsers } from "@modules/identity/infrastructure/user-repository.ts";

// ✅ porta definida pelo consumidor, implementada pelo dono e executada no core
export type IdentityCountsPort<DB> = Port<
  { tenantId: string },
  { users: number; sessions: number },
  DB
>;
// demo recebe a porta via `context.ports`; nunca importa identity
```

## Verificação

`deno run --allow-read --allow-env scripts/gates.ts` → zero violações de fronteira; `deno check`
valida os contratos.

## Referências

- `public-v7/wiki/adr/ADR-013-ddd-lite-fronteira-fisica.md`
- `src/kernel/ports.ts`, `src/kernel/modules.ts`, `src/app.tsx`, `scripts/gates.ts`
- ADR-017
