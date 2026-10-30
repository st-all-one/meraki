# CSS Moderno: Guia de Referência para IA

## Propósito

Este guia consolida padrões CSS modernos com ênfase em **CSS Grid**, **Subgrid**, **performance** e **interoperabilidade**. Cada arquivo é auto-contido e escrito para ser processado por modelos de linguagem (IA) como referência canônica de boas práticas.

## Filosofia

1.  **Layout nomeado sobre posicional** — `grid-template-areas` > números de linha
2.  **Subgrid como primitiva de composição** — componentes herdam trilhas do pai
3.  **@property sobre var() simples** — tipos explícitos, animável, type-safe
4.  **Cascata como vantagem** — `@layer` + `:where()` eliminam guerras de especificidade
5.  **Responsivo intrínseco** — `minmax()`, `auto-fill`, `clamp()`, container queries > media queries
6.  **Performance por construção** — `content-visibility`, `contain`, `will-change` seletivo, font-display
7.  **Interoperabilidade por fallback intrínseco** — CSS ignora o que não entende; aprimoramento progressivo

## Estrutura dos Arquivos

| Arquivo | Tema |
|---|---|
| `00-introducao.md` | Meta-guia e filosofia |
| `01-layout-grid.md` | CSS Grid moderno — áreas, linhas, auto-placement |
| `02-subgrid.md` | Subgrid em profundidade — composição de componentes |
| `03-performance.md` | Performance crítica — renderização e layout |
| `04-interoperabilidade.md` | Compatibilidade cross-browser e fallbacks |
| `05-variaveis-camadas.md` | Custom properties, @layer, escopo |
| `06-responsivo.md` | Design responsivo intrínseco |
| `07-padroes-componentes.md` | Padrões de componentes reutilizáveis |
| `08-propriedades-registradas.md` | @property, env(), attr() — propriedades type-safe |
| `09-funcoes-modernas.md` | oklch, color-mix, min/max/clamp, calc avançado |
| `10-seletores-avancados.md` | :has(), :where(), :is(), especificidade gerenciada |
| `11-tipografia-moderna.md` | @font-face, variable fonts, text-wrap, hyphens |
| `12-stacking-scroll.md` | Stacking context, scroll-snap, overscroll-behavior, sticky |
| `13-acessibilidade.md` | prefers-reduced-motion, color-scheme, :focus-visible |
| `14-animacoes-discretas.md` | @starting-style, transition-behavior: allow-discrete, view transitions |
| `15-web-component-optimization.md` | Web Components com Shadow DOM, subgrid, @property, container queries |
| `16-flexbox.md` | Flexbox completo — container, itens, alinhamento, gap, padrões |
| `17-seletores-basicos.md` | Seletores fundamentais — type, class, ID, atributo, combinadores, pseudo-classes, pseudo-elementos |
| `18-box-model.md` | Box model — content-box vs. border-box, padding, margin, colapso de margem |
| `19-cascata-heranca.md` | Cascata, herança, initial/inherit/unset/revert, processamento de valores, shorthand |
| `20-posicionamento-display.md` | Position (static/relative/absolute/fixed/sticky), display, float, BFC |
| `21-backgrounds-borders.md` | Backgrounds, borders, border-radius, box-shadow, gradientes, outline |
| `22-animacoes-keyframes.md` | @keyframes, animation-name/duration/timing/delay, fill-mode, performance |
| `23-transicoes.md` | Transition-property/duration/timing/delay, gatilhos, propriedades animáveis |
| `24-cores-fundamentos.md` | Formatos de cor — hex, rgb, hsl, named colors, currentColor, alpha |
| `25-transforms.md` | Transform 2D/3D — translate, scale, rotate, perspective, transform-origin |
| `26-sintaxe-at-rules.md` | Sintaxe CSS, @charset, @import, @namespace, @supports, @scope, ordem das regras |
| `27-print.md` | @page, @media print, page-break, quebra de página, margens, caixas de margem |
| `28-contadores.md` | counter-reset/increment, counters(), @counter-style, list-style, ::marker |
| `29-imagens.md` | object-fit/position, aspect-ratio, image-set, image sprites, SVG, <picture> |
| `30-filtros.md` | filter, backdrop-filter, drop-shadow, mix-blend-mode, background-blend-mode |
| `31-tipos-valores-unidades.md` | Tipos de dado CSS, unidades (length/angle/time/resolution), keywords, propriedades lógicas |
| `32-recommended-modern-implementation.md` | Implementação moderna recomendada — layout completo com subgrid, dashboard, containers, tema, acessibilidade, print e checklist consolidado |

## Convenções de Código

- Preferir `gap` a `margin` entre itens de layout
- Usar `box-sizing: border-box` global
- Propriedades lógicas (`margin-inline`, `padding-block`) sobre físicas
- `@property` para variáveis que precisam ser type-safe ou animáveis
- `env()` para safe areas mobile (notch, keyboard)
- `attr()` para valores dinâmicos vindos do HTML (evitar JS)
- Variáveis CSS em `:root` para tema, em componentes para escopo local
- Sempre declarar `@layer` antes de qualquer estilo: `@layer reset, base, components, utilities`
- `:where()` para resets e utilitários com especificidade zero
- Container queries (`@container`) para componentes adaptáveis ao contexto
- `text-wrap: balance` em títulos, `text-wrap: pretty` em parágrafos
- `font-display: swap` + `size-adjust` para reduzir CLS em fontes web
