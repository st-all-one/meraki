# HTML Modern Standard — Guia de Referência Rápida para IA

## Sobre este guia

Compilado otimizado para consulta por IA e desenvolvedores. Baseado no **HTML Living Standard (WHATWG)** e documentação MDN. Cada arquivo cobre um aspecto específico e pode ser usado isoladamente.

## Estrutura dos arquivos

| Arquivo | Conteúdo |
|---------|----------|
| `00_INDEX.md` | Este arquivo — visão geral e navegação |
| `01_ALL_TAGS.md` | Catálogo COMPLETO de todas as tags HTML modernas utilizáveis |
| `02_SEMANTIC_STRUCTURE.md` | Semântica, documento outline, landmarks, heading hierarchy |
| `03_MODERN_PATTERNS.md` | Padrões modernos: Web Components, Dialog, Popover, Forms, Responsive Images |
| `04_ACCESSIBILITY.md` | Acessibilidade: ARIA, landmarks, formulários, foco, screen readers |
| `05_SECURITY.md` | Segurança: CSP, SRI, CORS, Sanitization, iframe sandbox |
| `06_PERFORMANCE.md` | Performance: lazy loading, preload, fetchpriority, async/defer |
| `07_INTERDEPENDENCIES.md` | Interdependências: HTML ↔ CSS, HTML ↔ JS, HTML ↔ ARIA |
| `08_DEPRECATED.md` | Elements and attributes deprecated/obsoletos com substitutos |
| `09_BOILERPLATE.md` | Template boilerplate completo com melhores práticas |
| `10_DATE_TIME_FORMATS.md` | Formatos ISO 8601: date, time, week, month, global datetime |
| `11_CONSTRAINT_VALIDATION.md` | Constraint Validation API: atributos, ValidityState, custom validation |
| `12_QUIRKS_STANDARDS_MODE.md` | Quirks mode, limited-quirks, no-quirks mode e doctype switching |
| `13_HTML_COMMENTS.md` | Comentários HTML `<!-- -->`: sintaxe, regras, boas práticas |
| `14_IMAGE_MAPS.md` | Image maps com `<map>` e `<area>`: coordenadas, shapes, acessibilidade |
| `15_DEFINE_TERMS.md` | Definir termos: `<dfn>`, `<abbr>`, listas de descrição `<dl>` |
| `16_SPECIFIC_ATTRIBUTES.md` | Atributos: capture, dirname, form, readonly, size, step, elementtiming |
| `17_LINK_RELATIONS_EXTRA.md` | Link relations: manifest, me, alternate stylesheet, compression-dictionary |
| `18_GLOBAL_ATTRIBUTES.md` | Atributos globais (parte 2): accesskey, anchor, autocapitalize, hidden, etc. |
| `19_META_SCRIPT_TYPES.md` | Meta tags (color-scheme, referrer, robots, theme-color, http-equiv), importmap, speculationrules |

## Convenções usadas

- **`<tag>`** — elemento HTML
- **`attr`** — atributo HTML
- **`TAG`** — tag void (sem fechamento)
- ~~`<deprecated>`~~ — não usar
- `experimental` — recurso experimental, pode não ter suporte em todos browsers

## Padrão mínimo do documento

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Título da Página</title>
</head>
<body>
</body>
</html>
```

## Referências externas principais

- [HTML Living Standard](https://html.spec.whatwg.org/)
- [MDN HTML Reference](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [Schema.org](https://schema.org/) — vocabulário para microdata
- [WebAIM](https://webaim.org/) — acessibilidade
- [CSP Specification](https://www.w3.org/TR/CSP/)
- [SRI Specification](https://www.w3.org/TR/SRI/)
