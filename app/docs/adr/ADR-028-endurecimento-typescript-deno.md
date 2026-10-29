# ADR-028 — Endurecimento de TypeScript, Deno e lint

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-25) |
| **Data** | 2026-10-25 |
| **Plano de origem** | Revisão tecnológica |
| **Relacionadas** | ADR-000, ADR-012 |

## Contexto

TypeScript não garante memory safety como Rust (Deno/JS já é memory-safe), mas pode tornar estados
ilegais irrepresentáveis e impedir que erros comuns cheguem ao runtime. O projeto tinha `strict` e
`noUncheckedIndexedAccess`, porém ainda aceitava `exactOptionalPropertyTypes: false`, não cobria
`noImplicitReturns`/`noPropertyAccessFromIndexSignature` e o lint não barrava `!`/assertions
perigosas.

## Decisão

1. `deno.json` ativa:
   - `exactOptionalPropertyTypes`;
   - `noUncheckedIndexedAccess`;
   - `noImplicitReturns`;
   - `noFallthroughCasesInSwitch`;
   - `noPropertyAccessFromIndexSignature`;
   - `noImplicitOverride`;
   - `allowUnreachableCode`/`allowUnusedLabels` desligados;
   - `useUnknownInCatchVariables`, `noUnusedLocals`, `noUnusedParameters`.
2. JSX usa `"jsx": "precompile"`, `"jsxImportSource": "hono/jsx"` e
   `jsxPrecompileSkipElements: ["script", "style"]`.
3. O lint inclui, além do recomendado: `explicit-function-return-type`, `no-explicit-any`,
   `no-non-null-assertion`, `no-non-null-asserted-optional-chain`, `no-throw-literal`,
   `no-constant-condition`, `no-inferrable-types`, `no-sparse-arrays`,
   `no-sync-fn-in-async-fn`, `no-useless-rename`, `single-var-declarator` e
   `triple-slash-reference`.
4. Gates continuam cobrindo arquitetura, CSP, migrations, env e segredos; agora incluem `.tsx`.
5. Fronteiras externas continuam parseadas com Zod; Kysely é tipagem de query, não validação do
   conteúdo já persistido. SQLite `STRICT`/constraints continuam recomendados para dados novos.

## Limites explícitos

- Tipos são apagados no runtime; entrada HTTP/JSON/env/DB ainda precisa de parse.
- TypeScript é insound em `as`, `any`, declarações externas e alguns casos de variância; o gate
  proíbe o uso novo de `any`/`!` e revisa casts nos adaptadores.
- Isso **não** é uma garantia estilo Rust; é redução de classes de erro em tempo de
  desenvolvimento.

## Verificação

- `deno task check` com fmt, lint, types e gates verdes.
- `deno task test` cobre os fluxos de render, auth, jobs, cache e storage.
- Scripts e adaptadores que precisam de cast (`node:sqlite`, JWT) ficam explícitos e testados.

## Referências

- `deno.json`
- `scripts/gates.ts`
- ADR-000, ADR-012
