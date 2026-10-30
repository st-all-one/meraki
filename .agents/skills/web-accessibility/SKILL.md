---
name: web-accessibility
description: >
  Produce accessible HTML/CSS/JS/TS per WCAG 2.2 AA and WAI-ARIA 1.2: semantic
  HTML, ARIA, keyboard operability, contrast, live regions, forms, media,
  testing, design patterns. Load when writing, reviewing, or auditing
  accessible interfaces.
category: web
version: "WCAG 2.2 AA + ARIA 1.2"
tags: [accessibility, wcag, aria, keyboard, contrast, screen-reader, a11y]
license: MIT
---

# Web Accessibility (WCAG 2.2 AA + ARIA 1.2)

## Use When
- Building/reviewing UI that must be accessible
- Choosing native elements vs ARIA roles
- Keyboard navigation and focus management
- Forms, live regions, media, complex widgets
- Auditing against WCAG 2.2 AA

## Absolute Rules
- Native HTML first: `<button>`, `<nav>`, `<h1>`–`<h6>` before `role="…"`. "No ARIA is better than bad ARIA."
- Everything operable by keyboard: Tab/Shift+Tab, arrows, Enter, Space, Escape. Roving tabindex in composite widgets; focus trap in modals; skip link.
- Never color as the only signal; ensure contrast (4.5:1 text, 3:1 large/UI).
- Prefer `aria-labelledby` over `aria-label` when a visible label exists.
- Live regions announced before change; `aria-live="polite"` default, `assertive` only for emergencies.
- Use `inert` (not `aria-hidden`) for off-screen content in modals.
- Web Components: `delegatesFocus: true`; forward `ElementInternals` roles/names.
- Respect OS prefs: `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, `forced-colors`.
- Test with real AT (NVDA+Chrome, VoiceOver+Safari, TalkBack); automation covers ~40%.
- WCAG 2.2 focus criteria: visible focus (`:focus-visible`), focus not obscured, target size ≥24px, dragging alternatives, consistent help, accessible authentication.

## Core Patterns
```html
<a class="skip" href="#main">Skip to content</a>
<header>…</header>
<nav aria-label="Principal">…</nav>
<main id="main">
  <h1>Title</h1>
  <form>
    <label for="email">Email</label>
    <input id="email" type="email" autocomplete="email" required
           aria-describedby="email-err">
    <p id="email-err" role="alert" hidden>Email inválido</p>
    <button type="submit">Enviar</button>
  </form>
</main>
```

```css
:focus-visible { outline: 3px solid #005fcc; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
@media (forced-colors: active) { .icon { forced-color-adjust: auto; } }
```

```js
// Modal focus management
dialog.showModal();
dialog.querySelector("[autofocus]")?.focus();
// on close: restore focus to the opener
```

## File Map
| File | Content |
|---|---|
| `00-index.md` | Index and reading guide |
| `01-semantic-html.md` | Landmarks, headings, structure |
| `02-aria.md` | Roles, states, properties |
| `03-keyboard-accessibility.md` | Focus, tab order, shortcuts |
| `04-color-and-contrast.md` | Contrast ratios, non-color signals |
| `05-live-regions.md` | Polite/assertive status updates |
| `06-forms-and-labels.md` | Labels, errors, autocomplete |
| `07-multimedia.md` | Captions, transcripts, audio control |
| `08-mobile-accessibility.md` | Touch targets, gestures, zoom |
| `09-seizures-motion.md` | Flashing, motion preferences |
| `10-cognitive-accessibility.md` | Plain language, consistency |
| `11-testing-tools.md` | Axe, Lighthouse, manual checks |
| `12-wcag-quick-reference.md` | Success criteria quick ref |
| `13-aria-advanced-roles.md` | Composite/advanced roles |
| `14-structural-roles.md` | Landmark/structural roles |
| `15-aria-advanced-attributes.md` | Advanced attributes |
| `16-table-grid-attributes.md` | Tables and grids |
| `17-web-components-shadow-dom.md` | A11y in Shadow DOM |
| `18-svg-canvas.md` | SVG/Canvas accessibility |
| `19-inert-forced-colors.md` | inert, forced colors |
| `20-os-browser-settings.md` | OS/browser preferences |
| `21-keyboard-patterns.md` | WAI-ARIA keyboard patterns |
| `22-design-patterns.md` | Accessible component patterns |
| `23-advanced-testing.md` | AT testing and CI |
| `24-wcag-supplement.md` | Supplemental guidance |
| `25-tag-role-reference.md` | Element → role/name map |
| `EXEMPLO-MODERNO.md` | Reference accessible page |

## Read Order
`00`→`01`→`02`→`03`; forms `06`; testing `11`; patterns `21`+`22`; reference `12`+`25`.

## Prereqs
HTML/CSS/JS and DOM knowledge.
