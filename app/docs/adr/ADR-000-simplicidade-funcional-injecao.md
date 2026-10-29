# ADR-000 — Simplicidade acima de tudo: funcional, injetável e testável

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-001, ADR-003, ADR-005, ADR-012 |

## Contexto

O projeto é de longo prazo e vai passar por muitas mãos e agentes. O risco dominante não é falta de
capacidade: é **complexidade acidental** — camadas que não pagam por si, fábricas de fábricas,
abstrações genéricas criadas antes do segundo caso de uso, estado global escondido e testes que só
existem para cobrir wiring. O legado mostra o custo: centenas de arquivos, convenções que erodem e
dificuldade de remover código.

A stack escolhida (Deno, Hono, Kysely, JSX, HTMX, SQLite) já é pequena. O código deve continuar
pequeno: uma função faz uma coisa, um módulo tem uma razão para mudar, uma dependência entra pela
porta da frente.

## Decisão

1. **Simplicidade é requisito funcional.** A solução mais simples que satisfaz o caso real vence.
   Nativo > biblioteca > abstração própria, nessa ordem.
2. **Núcleo funcional.** Funções puras para regra/cálculo/hash/ETag; **fábricas que retornam objetos
   simples** para estado com ciclo de vida (`createEventBus`, `createValkeyCache`,
   `createObjectStorage`, `createTenantRegistry`, `createApp`). Sem hierarquia de classes, sem
   `BaseService`, sem herança.
3. **Injeção de dependência explícita, sem container.** O composition root (`src/main.ts`) cria banco e descobre services/módulos por convenção;
   `createApp` monta rotas. Módulos recebem `db`, `services` e `ports` pelo contexto. Nenhum módulo
   importa singleton mutável.
4. **Portas pequenas.** Interface só quando existe mais de uma implementação real ou quando o
   consumidor precisa ser testado isolado (`CachePort`, `StoragePort`, `Port<Input, Output, DB>`). Sem
   “repository genérico”.
5. **Sem abstração antecipada.** Uma abstração nasce com o segundo uso real, não com o primeiro.
   Não há event sourcing, CQRS, DI container, ORM, camada anticorrupção genérica nem plugin system.
6. **Acoplamento mínimo e direção única:** `modules → kernel/services`; `services → kernel`; `web → kernel/services`; módulos nunca se
   importam; kernel nunca importa módulos/services/web/schema da raiz. Verificado por gate, não por disciplina.
7. **Testável de verdade.** Regra pura testada sem I/O; integração com SQLite real; portas permitem
   fake óbvio (sem mock de framework). Um teste que só copia wiring é removido.

## Justificativa (alternativas descartadas)

- **Container de DI (tsyringe/Awlix/etc.)** — descartada: esconde o grafo, não remove acoplamento e
  adiciona decorators/reflexão. O grafo tem 5 nós e cabe em `main.ts`.
- **DDD tático completo (agregados, value objects para tudo)** — descartada: cerimônia sem segundo
  caso de uso; o schema ainda é pequeno.
- **Repository genérico `<T>`** — descartada: esconde SQL e dificulta consultas específicas; Kysely
  já é a abstração fina.
- **Classes de serviço com herança** — descartada: estado e dependência escondidos; fábricas
  explícitas tornam o contrato visível e o teste trivial.
- **Otimizar para “escala futura” agora** — descartada: adiciona fila externa, cache distribuído e
  multi-tenant completos sem medição.

## Consequências

**Positivas**
- Código legível em uma passada; onboarding curto; diff pequeno.
- Grafo de dependências visível no composition root; testes de unidade sem ambiente.
- Refatorar/remover módulo continua barato.

**Custos / negativas**
- Exige disciplina para não “generalizar” no primeiro uso.
- Alguns fluxos são explícitos e repetitivos (ex.: passar deps), em vez de mágicos.
- Se o domínio crescer muito, algumas decisões (ex.: bus in-process) precisarão de ADR nova.

## Exemplo mínimo (comparativo)

```ts
// ❌ serviço global, dependência escondida, impossível testar sem banco
import { db } from "./db.ts";
export class UserService {
  async login(email: string) { return db.selectFrom("users").where("email", "=", email).execute(); }
}

// ✅ função/fábrica com dependências explícitas; testável com qualquer Kysely
export function createLogin(db: Kysely<AppDatabase>, bus: EventBus) {
  return async function login(input: LoginInput, tenantId: string) {
    const user = await findUser(db, tenantId, input.email);
    // ...
    await bus.publish(db, { name: "identity.session_started", tenantId });
  };
}
```

## Verificação

- `scripts/gates.ts` falha em import cruzado e em kernel→módulos/web.
- `deno task test`: funções puras + integração SQLite; sem mock de Hono/Kysely.
- Revisão: “qual o segundo caso de uso que justifica esta abstração?” sem resposta → não entra.

## Referências

- `public-v7/wiki/adr/ADR-001-nativo-funcional-di-simplicidade.md`
- `public-v7/wiki/adr/ADR-013-ddd-lite-fronteira-fisica.md`
- `AGENTS.md` §2 e §6
