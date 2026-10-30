---
name: html-moderno
description: >
  HTML Living Standard (2025): all tags, semantic structure, modern patterns,
  accessibility, security, performance, forms/validation, quirks/standards
  modes, global attributes, interdependencies. Load when writing, reviewing, or
  debugging semantic, accessible HTML.
category: languages
version: "Living Standard (2025)"
tags: [html, semantic, forms, web-components, accessibility, performance, security]
license: MIT
---

# Modern HTML (Living Standard 2025)

## Use When
- Authoring/reviewing page structure, forms, metadata, or embedded content
- Choosing semantic elements or correct attributes
- Auditing HTML for a11y, security, or performance
- Debugging quirks vs standards mode or validation

## Core Rules
- Always start with `<!DOCTYPE html>`; never trigger quirks mode.
- Semantic first: `header/nav/main/article/section/aside/footer/button/…` before generic `div`.
- One `<h1>` per page; do not skip heading levels.
- Every image has `alt` (empty only if decorative). Every control has an associated `<label>`.
- Interactive = native element (`<button>`, `<details>`, `<dialog>`); avoid ARIA when native exists.
- `lang` on `<html>`; `charset`/viewport in `<head>` first.
- Forms: use native validation (`required`, `type`, `pattern`, `minlength`); never rely on JS alone.
- Security: `rel="noopener"` on `target="_blank"`; validate/sanitize any `innerHTML`; avoid inline event handlers.
- Performance: `loading="lazy"` + `decoding="async"` on below-fold images; `width`/`height` to prevent CLS; `preload` critical assets.
- Deprecated/impaired elements (`<marquee>`, `<font>`, `<center>`) are forbidden.

## Core Patterns
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page</title>
  <meta name="description" content="…">
</head>
<body>
  <header>…</header>
  <main>
    <article>
      <h1>Title</h1>
      <img src="x.webp" alt="descrição" width="800" height="450" loading="lazy" decoding="async">
      <form>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required>
        <button type="submit">Enviar</button>
      </form>
    </article>
  </main>
  <footer>…</footer>
</body>
</html>
```

## File Map
| File | Content |
|---|---|
| `00_INDEX.md` | Index and reading guide |
| `01_ALL_TAGS.md` | Complete element reference |
| `02_SEMANTIC_STRUCTURE.md` | Landmarks, document outline |
| `03_MODERN_PATTERNS.md` | Dialog, popover, template, slots |
| `04_ACCESSIBILITY.md` | Roles, labels, focus, ARIA rules |
| `05_SECURITY.md` | CSP, iframe sandbox, link rel, SRI |
| `06_PERFORMANCE.md` | Loading, priority, CLS, resource hints |
| `07_INTERDEPENDENCIES.md` | Element/attribute interactions |
| `08_DEPRECATED.md` | Removed/obsolete elements |
| `09_BOILERPLATE.md` | Canonical document boilerplate |
| `10_DATE_TIME_FORMATS.md` | `datetime`, time formats |
| `11_CONSTRAINT_VALIDATION.md` | Native form validation |
| `12_QUIRKS_STANDARDS_MODE.md` | Doctype and rendering modes |
| `13_HTML_COMMENTS.md` | Comment syntax/rules |
| `14_IMAGE_MAPS.md` | `<map>`/`<area>` |
| `15_DEFINE_TERMS.md` | `<dfn>`, `<dl>` semantics |
| `16_SPECIFIC_ATTRIBUTES.md` | Per-element attributes |
| `17_LINK_RELATIONS_EXTRA.md` | `rel` values |
| `18_GLOBAL_ATTRIBUTES.md` | `id`, `class`, `data-*`, `hidden`, `inert` |
| `19_META_SCRIPT_TYPES.md` | `<meta>`, script types, `type=module` |
| `modern_html_example.md` | Full reference page |

## Read Order
1. `00_INDEX.md` → `02_SEMANTIC_STRUCTURE.md`
2. Forms: `11_CONSTRAINT_VALIDATION.md`
3. A11y/security/perf: `04`, `05`, `06`
4. Reference: `01_ALL_TAGS.md`, `16`–`19`
5. `modern_html_example.md`

## Prereqs
Basic markup; a modern browser.
