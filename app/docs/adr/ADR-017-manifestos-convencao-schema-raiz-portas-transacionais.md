# ADR-017 — Manifestos por convenção, schema na raiz e portas transacionais

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-000, ADR-001, ADR-002, ADR-005, ADR-014 |

## Contexto

A fundação começou com um único `src/kernel/db/types.ts` contendo todas as tabelas. Com ~60 tabelas,
o kernel viraria o ponto de conflito de todos os domínios e passaria a conhecer módulos. As portas
também eram somente de leitura (`counts(tenantId)`), o que não serve para comandos síncronos entre
módulos: sem executor explícito, a única saída seria uma saga por outbox com estados intermediários.

O `public-v7` já provou o padrão de manifesto único por módulo/service: o core descobre por pasta,
injeta dependências e monta rotas; módulos não se importam.

## Decisão

### 1. Kernel é core, não schema

- `src/kernel` contém apenas pontos universais: config, HTTP, logging, primitivas de DB, contratos,
  descoberta e lifecycle.
- `src/kernel/db/types.ts` exporta somente `Schema`, `Timestamp`, `JsonText` e derivados.
- O kernel **não** importa `@modules/*`, `@services/*`, `@web/*` nem `src/db/schema.ts`.

### 2. Schema composto na raiz

- Cada módulo/service declara as tabelas que possui (`infrastructure/schema.ts` ou `schema.ts`).
- `src/db/schema.ts` é o **composition root** do schema e importa os tipos dos donos.
- `createDatabase<DB extends Schema>()` e `pingDatabase<DB>()` são genéricos; não conhecem tabelas.

### 3. Services headless por convenção

- Convenção: `src/services/<nome>/service.ts` exporta `default` um `ServiceDefinition`.
- Pastas de `src/services` sem `service.ts` são bibliotecas puras (ex.: `richtext/`) e não entram
  no boot; a descoberta ignora essas pastas em vez de falhar.
- O core descobre, resolve `dependencies` em ordem topológica e mantém o registry.
- Services são sempre disponíveis aos módulos via `context.services.get<Contract>(name)`.
- O banco é criado pelo core e injetado como service inicial; auth, cache, storage, events e tenancy
  vivem em `src/services/*`.
- Contratos ficam no próprio service (`src/services/<nome>/contract.ts`); módulos dependem do
  contrato, nunca da implementação.

### 4. Módulos por convenção

- Convenção: `src/modules/<nome>/module.ts` exporta `default` um `ModuleDefinition`.
- O manifesto tem `config` (`name`, `title`, `description`, `order`, `provides`, `requires`) e
  `create(context)`, que devolve rotas HTTP, middlewares globais e portas publicadas.
- O core descobre por filesystem, valida nomes e dependências, monta API/web e aplica middlewares.
- `module.ts` é o único arquivo de declaração do módulo; tabelas, rotas, schemas e casos de uso
  continuam dentro do módulo.
- Módulos nunca importam outro módulo. Portas trafegam pelo `context.ports` do core.

### 5. Portas transacionais

```ts
type Executor<DB> = Kysely<DB> | Transaction<DB>;

interface Port<Input, Output, DB> {
  execute(executor: Executor<DB>, input: Input): Promise<Output>;
}
```

- O **consumidor** declara a porta (ex.: `demo/application/ports.ts`).
- O **dono** implementa uma forma estruturalmente compatível (ex.: identity).
- Comandos entre módulos recebem `db` ou a transação do consumidor, na mesma unidade atômica.
- O outbox continua sendo para efeitos eventuais/idempotentes; não é usado para mascarar chamadas
  síncronas entre módulos.

## Justificativa das alternativas

- **Schema único no kernel** — descartada: acopla todos os domínios, conflito em cada tabela.
- **Só composição estática em `app.ts`** — descartada: todo módulo novo edita o core; o public-v7 já
  demonstrou o custo.
- **Descoberta em runtime sem manifesto** — descartada: sem `provides/requires`, o core não consegue
  validar dependências nem ordem; o manifesto é o contrato.
- **Porta só de leitura** — descartada: comandos cruzados virariam sagas com estados que o legado
  não possui.
- **Saga por outbox para tudo** — descartada: latência e estados intermediários sem necessidade.

## Consequências

**Positivas**
- Adicionar módulo/service = criar pasta + manifesto; zero registro no core.
- Kernel permanece pequeno; schema cresce na raiz, que é o único ponto que conhece todos por design.
- Comandos entre módulos podem compartilhar a transação do consumidor.

**Custos / negativas**
- Descoberta usa `Deno.readDir` + `import()`; `deno compile` precisa de
  `--include src/modules --include src/services` (já nos tasks/Dockerfiles).
- O registry é dinâmico; o contrato é verificado no ponto de uso (`get<Contract>`), não pelo loader.
- Ordem de boot e dependências precisam ser declaradas no manifesto.

## Verificação

- `scripts/gates.ts` prova que kernel não importa módulos/services/web/schema da raiz, que
  `kernel/db/types.ts` não declara tabelas e que cada pasta de módulo/service tem manifesto.
- `tests/integration` descobre services/módulos e prova que uma porta vê a escrita da transação do
  consumidor e que o rollback desfaz a escrita.
- `deno task build:bin` inclui os diretórios descobertos e executa offline.

## Referências

- `src/kernel/service.ts`, `src/kernel/modules.ts`, `src/kernel/discovery.ts`
- `src/db/schema.ts`, `src/services/*/service.ts`, `src/modules/*/module.ts`
- `src/kernel/ports.ts`, `src/modules/demo/application/ports.ts`
- `docs/wiki/Arquitetura.md`
