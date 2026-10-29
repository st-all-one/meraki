# ADR-011 — UI: Eta + HTMX 4 + Tailwind 4 + Lucide, cores em oklch()

| Campo | Valor |
| :--- | :--- |
| **Status** | Substituído pelo ADR-026 (Eta → JSX); ADR-022 permanece para daisyUI |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-008 |

## Contexto

O produto é server-rendered, acessível e sem CDN. Precisa de interatividade pontual, CSS utilitário,
ícones e um design system que não dependa de runtime JS de terceiros. Componentes, tipografia, cores
de marca e bases pública/privada são “[conforme o projeto]”; a fundação fixa a mecânica.

## Decisão

1. ~~**EtaJS** renderiza no servidor (`src/layout/views/`), com autoescape e cache somente em produção.~~ **Substituído pelo ADR-026:** JSX do Hono (`hono/jsx`, `precompile`).
2. **HTMX 4.0.0** vendorizado (`static/js/vendor/htmx.min.js`) para fragmentos e formulários.
3. **Tailwind 4** (CLI) gera `static/css/output.css`; tokens de cor em **`oklch()`** no `@theme`, com
   variante dark via `prefers-color-scheme` e contraste AA verificado por axe.
4. **Lucide** vendorizado em `static/icons/*.svg`, exposto pelo helper `icon(name)`; nenhum ícone
   remoto.
5. Tipografia: stack de sistema (`--font-sans`); o projeto pode substituir por fonte vendorizada sem
   mudar componentes.
6. ~~Componentes base (`card`, `btn`, `field`, `badge`) são classes em `@layer components`; sem
   biblioteca de componentes nesta fundação.~~ **Substituído pelo ADR-022:** daisyUI 5 é o design
   system preferencial; classes próprias só permanecem onde expressam algo que ele não cobre.
7. Sem `<script>`/`<style>` inline; o gate de views impede CDN e handlers inline.

## Justificativa (alternativas descartadas)

- **SPA/React/Vue** — descartada: duplica estado, piora TTFB e adiciona toolchain.
- **CDN de HTMX/Lucide/fontes** — descartada: CSP, disponibilidade e supply chain.
- **daisyUI/UI kit** — descartada nesta fase: mais dependência e opiniões visuais antes do domínio.
  Reavaliada e adotada no ADR-022 quando a UI cresceu; o restante desta ADR permanece válido.
- **Cores hex hardcoded** — descartada: oklch dá percepção uniforme e tema coerente.

## Consequências

**Positivas**
- TTFB baixo, CSP estrita, acessibilidade testável, zero supply chain no browser.
- Design tokens permitem trocar marca sem tocar nas páginas.

**Custos / negativas**
- Cada interação nova exige rota/fragmento; sem reatividade client-side complexa.
- Atualização de HTMX/Lucide/Tailwind é manual e vendorizada/licença preservada.
- O build de CSS é um passo obrigatório (`deno task css:build`).

## Exemplo mínimo (comparativo)

```html
<!-- ❌ inline + CDN -->
<script src="https://unpkg.com/htmx.org"></script>
<button style="color:#0a0" onclick="save()">Salvar</button>

<!-- ✅ local, sem inline, fragmento cacheável -->
<script src="/static/js/vendor/htmx.min.js" defer></script>
<button class="btn btn-primary" hx-post="/app/events" hx-target="#event-result">Publicar</button>
```

## Verificação

Playwright carrega a home, o fragmento de saúde via HTMX e publica um evento; axe não encontra
violações `serious`/`critical`; gates proíbem inline/CDN.

## Referências

- `static/css/app.css`, `src/layout/views/`, `src/layout/icons.ts`
- `public-v7/wiki/adr/ADR-009-ui-cms-proprio-tailwind-daisyui.md`
