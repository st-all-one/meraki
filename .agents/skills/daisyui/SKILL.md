---
name: daisyui
description: >
  daisyUI 5 + Tailwind CSS 4: color system/theming, semantic components
  (btn, card, drawer, modal…), layout, and a full Task Manager in plain HTML
  and Rust/Leptos 0.8. Load when building UIs with daisyUI semantic classes.
category: libraries
version: "5"
tags: [daisyui, tailwind, css, components, themes, html, leptos]
license: MIT
---

# daisyUI 5 + Tailwind CSS 4

## Use When
- Building UIs with semantic component classes (`btn`, `card`, `badge`, `modal`)
- Theming (light/dark/custom) via CSS variables
- Combining Tailwind utilities with daisyUI components
- Layouts: navbar, sidebar, drawer, footer
- Reference Task Manager (TickTick clone) in HTML or Leptos

## Core Rules
- Use semantic classes for components; Tailwind utilities for layout/spacing.
- Theme via daisyUI CSS variables (`--color-primary`, …), not hardcoded colors.
- Prefer built-in `data-theme` for light/dark switching.
- Don't restyle component internals; compose with wrappers/utilities.
- Keep class lists on server components; avoid runtime class-string building that breaks purging.
- Accessibility: label controls, manage focus in `modal`/`drawer`, use `aria-*`.
- Responsive: combine daisyUI layout components with Tailwind breakpoints.

## Core Patterns
```html
<html data-theme="light">
<body>
  <div class="drawer lg:drawer-open">
    <input id="nav" type="checkbox" class="drawer-toggle">
    <div class="drawer-content">
      <div class="navbar bg-base-100 shadow-sm">
        <label for="nav" class="btn btn-ghost lg:hidden">☰</label>
        <a class="btn btn-ghost text-xl">App</a>
      </div>
      <main class="p-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Task</h2>
            <p>Description</p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary">Concluir</button>
            </div>
          </div>
        </article>
      </main>
    </div>
    <aside class="drawer-side"><ul class="menu p-4 w-64 bg-base-200">…</ul></aside>
  </div>
</body>
</html>
```

## File Map
| File | Content |
|---|---|
| `00-index.md` | Philosophy, compatibility, scope |
| `01-installation.md` | npm/CDN, Tailwind v4 plugin, daisyUI 5 setup |
| `02-color-system.md` | CSS variables, dark mode, custom palettes |
| `03-components.md` | btn, card, input, select, modal, dropdown, tabs, table, etc. |
| `04-layout.md` | Responsive grid, drawer+navbar, sidebar |
| `05-task-manager-html.md` | Full Task Manager in plain HTML |
| `06-task-manager-leptos.md` | Same app in Leptos 0.8 |
| `07-best-practices.md` | Accessibility, performance, theming |

## Read Order
`00`→`01`→`03`; layout `04`; then `05`/`06`; finish `07`.

## Prereqs
HTML/CSS and Tailwind basics; Tailwind CSS 4; for Leptos, Rust 1.85+.
