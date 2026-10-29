# ADR-026 — UI: JSX do Hono no lugar do Eta + daisyUI como base

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-25) |
| **Data** | 2026-10-25 |
| **Plano de origem** | Revisão tecnológica |
| **Relacionadas** | ADR-008, ADR-011, ADR-022 |

## Contexto

O ADR-011 adotou Eta por ser um template engine pequeno e HTML-first. Com 14 views, porém, surgiram
custos que não existiam na fundação:

- `it` não é tipado; erro de dado só aparece no render;
- include/namespace/cache exigem resolução de arquivos em runtime e `--include src/layout` no
  `deno compile`;
- a composição de páginas usa uma segunda gramática, sem LSP/rename/refactor completos;
- componentes reutilizáveis (Button, Field, Alert, Card) ficam presos ao formato de template.

JSX do Hono já vem no framework, renderiza no servidor e permite componentes tipados sem runtime de
cliente. O projeto não precisa de `useRequestContext`: o contexto de apresentação é passado
explicitamente. A configuração Deno usa `"jsx": "precompile"` e `"jsxImportSource": "hono/jsx"`.

## Decisão

1. **JSX do Hono é o único motor de views.** Não há `.eta`, `eta.render` nem cache de template.
   Componentes são funções `FC` em `.tsx`; o `render()` acrescenta DOCTYPE, status e contexto.
2. **Contexto explícito.** `ViewContext` carrega `locale`, tradução, ícones, nome do app e ano;
   `LayoutProps` adiciona título, descrição, ator e robots. Nada de dados mágicos em `it`.
3. **Componentes compartilhados em `src/layout/views`:**
   - `Layout` — documento, skip link, header, main e footer;
   - `Card`, `Button`, `Field`, `Alert` — componentes tipados;
   - `Icon` — injeta o SVG Lucide já sanitizado;
   - fragmentos HTMX em `fragments/`.
4. **daisyUI é a base do design system** (ADR-022). `card`, `btn`, `alert`, `input`, `badge` e os
   temas `somlos`/`somlos-dark` são usados diretamente. Componentes próprios só existem como
   composição (ex.: `Card` adiciona padding/padrão visual), nunca como um segundo conjunto de
   classes concorrente.
5. **CSP preservada.** JSX não emite `on*=`; scripts continuam apenas os arquivos locais com `src`.
   O gate varre `.tsx` e proíbe script/style/handler inline e URL externa.
6. **Build do binário** não inclui mais views como arquivos; `src/layout` só precisa ser incluído se
   houver assets. O CSS continua gerado no build por Tailwind + daisyUI.

## Justificativa (alternativas descartadas)

- **Eta + tipagem externa** — descartado: o template continua não tipado e mantém resolução de FS.
- **Template literals `html` para tudo** — descartado: perde composição/tipos de props.
- **React/Vue/SSR** — descartado: runtime de cliente e toolchain desproporcionais.
- **JSX no cliente** — descartado: a interatividade continua HTMX; JSX é apenas server-side.

## Consequências

**Positivas**
- Dados de view checados no `deno check`; refactor e navegação funcionam no editor.
- Uma linguagem/formatador/linter para routes e views.
- Sem resolução de template em runtime; binário e testes mais previsíveis.
- daisyUI deixa de ser um plugin “opcional” e passa a ser a base visual efetiva.

**Custos / negativas**
- JSX é mais verboso que HTML para páginas estáticas.
- O contexto de tradução/ícones precisa ser passado explicitamente.
- Exige `jsx`/`jsxImportSource` no `deno.json` e arquivos `.tsx`.

## Verificação

- `deno check src scripts tests` cobre props e templates.
- `deno task test` cobre render, i18n, status, CMS e HTMX.
- `deno task check` (gates `.tsx`) proíbe inline/CDN.
- Playwright + axe cobrem as páginas e o fragmento HTMX.
- `deno task css:build` gera as classes daisyUI usadas.

## Referências

- `src/layout/render.ts`, `src/layout/views/**/*.tsx`
- `src/layout/views/types.ts`, `src/layout/views/components/*`
- `scripts/gates.ts`
