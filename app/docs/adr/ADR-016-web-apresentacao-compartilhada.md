# ADR-016 — `layout` como camada de apresentação dos módulos

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Relacionadas** | ADR-000, ADR-001, ADR-011 |

## Contexto

A ADR-000 fixou `modules → kernel` e `layout → kernel`. Na prática, o HTTP de cada módulo renderiza
JSX: `createIdentityModule` e `createSystemModule` importam `@layout/render.ts`, e as views de módulo
importam `@layout/views`. Injetar uma função de render em cada módulo adicionaria um parâmetro
cerimonial a todos os módulos e não criaria uma implementação alternativa real.

## Decisão

1. `layout` é uma camada compartilhada de apresentação; `modules/http` e `modules/views` podem importá-la.
2. `modules/domain`, `modules/application` e `modules/infrastructure` **não** podem importar `layout`.
3. A direção permitida fica: `modules/http → layout → kernel`, `modules/views → layout` e `modules/* → kernel`.
4. O gate de arquitetura verifica essa regra, além de imports cruzados e kernel → modules/layout.

## Consequências

**Positivas**
- HTTP de módulo renderiza sem injeção cerimonial.
- Regra explícita e verificada; nenhum módulo importa outro.

**Negativas**
- Mais uma aresta no grafo; `web` precisa continuar sem importar módulos.

## Verificação

- `deno task check` falha se um arquivo fora de `modules/*/http` ou `modules/*/views` importar `layout`.
- `src/modules/*/http/*` e `src/modules/*/views/*` importam `@layout` sem violação.
