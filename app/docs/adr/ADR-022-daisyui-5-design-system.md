# ADR-022 — daisyUI 5 como base do design system

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23); base confirmada pelo ADR-026 |
| **Data** | 2026-10-23 |
| **Plano de origem** | Evolução da UI |
| **Relacionadas** | ADR-008, ADR-011 |

## Contexto

O ADR-011 fixou Eta + HTMX + Tailwind 4 + Lucide e **descartou daisyUI** na fundação: havia pouco
domínio e o custo de opiniões visuais antes da hora. A UI cresceu (login, painel, CMS, alertas,
tabelas e formulários) e a manutenção de componentes próprios passou a competir com a entrega de
domínio.

daisyUI 5 é um plugin **somente CSS** do Tailwind 4: não adiciona runtime JS, não usa `eval` e não
quebra a CSP estática do ADR-008. Os temas são variáveis CSS, o que permite manter os tokens
`oklch()` do projeto.

## Decisão

1. **daisyUI 5 é o design system preferencial para UI nova.** Use classes semânticas
   (`btn`, `card`, `alert`, `modal`, `tabs`, `table`, `input`, `badge`) antes de criar CSS próprio;
   utilitários Tailwind ficam para layout, espaçamento e composição.
2. A dependência entra em `deno.json` (`daisyui@^5.7.50`) e é resolvida **no build**
   (`deno task css:build`). Nada de CDN, nada de JS daisyUI no browser.
3. Temas customizados `somlos` (claro, default) e `somlos-dark` (`prefers-color-scheme`) mapeiam as
   cores semânticas para os tokens já existentes em `src/layout/assets/css/app.css`. Toda cor
   continua em `oklch()`.
4. **Somente os temas claro/escuro** são habilitados. `themes: all` é proibido: aumenta o CSS sem
   uso real.
5. Componentes próprios só permanecem quando expressam algo que daisyUI não cobre (ex.: `.field`
   com hint/erro, `.card` como preset com padding). Ao tocar um componente legado, migre-o para a
   classe daisyUI correspondente em vez de manter duas convenções.
6. Continua proibido `<script>`/`<style>` inline, `style=` e `on*=`; troca de tema, se necessária,
   usa `data-theme` no HTML, sem JS.
7. Acessibilidade é requisito: `<button>` para ação, `label`/`for` em campos, foco visível,
   contraste AA e `dialog` nativo para modal.

## Justificativa (alternativas descartadas)

- **Manter só componentes próprios** — custo crescente de CSS e divergência entre telas.
- **UI kit com runtime JS (MUI, PrimeVue, etc.)** — duplica estado, quebra a CSP e adiciona toolchain.
- **CDN de daisyUI** — viola zero CDN e o supply chain controlado (ADR-008/011).
- **`themes: all`** — bundle de CSS desnecessário; a marca tem dois temas.

## Consequências

**Positivas**

- Componentes acessíveis e consistentes sem runtime no browser.
- Menos CSS autoral; temas trocáveis por variáveis.
- CSP, ETag e render determinístico continuam intactos.

**Custos / negativas**

- Plugin adicional no build e CSS gerado maior que a fundação minimalista.
- Migração visual incremental de `btn`/`badge`/`card`; telas antigas mudam de espaçamento.
- O tema precisa ser mantido em sincronia com os tokens de marca.

## Exemplo mínimo

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.52 0.15 265);
  /* ... */
}

@plugin "daisyui" {
  themes: false;
}

@plugin "daisyui/theme" {
  name: "somlos";
  default: true;
  prefersdark: false;
  color-scheme: light;
  --color-primary: var(--color-brand);
  --color-base-100: var(--color-canvas);
  /* ... */
}
```

```html
<button class="btn btn-primary">Salvar</button>
<div class="card bg-base-100"><div class="card-body">…</div></div>
```

## Verificação

- `deno task css:build` gera `static/css/output.css` com os dois temas e sem JS.
- `deno task check` (gates) continua sem inline/CDN.
- Playwright/axe nas telas públicas e privadas sem violações `serious`/`critical`.
- Nenhuma requisição de rede para CDN no browser.

## Referências

- `src/layout/assets/css/app.css`
- `docs/adr/ADR-008-cache-http-etag-csp.md`, `docs/adr/ADR-011-ui-eta-htmx-tailwind.md`
- daisyUI 5: plugin Tailwind 4, temas por variáveis CSS
