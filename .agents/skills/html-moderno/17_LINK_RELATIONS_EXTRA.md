# Link Relations: manifest, me, alternate_stylesheet, compression-dictionary

Complemento ao guia principal de resource hints, cobrindo relações `rel` não abordadas.

---

## `rel="manifest"`

Aponta para o [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest) de um PWA.

```html
<link rel="manifest" href="/manifest.json" />
```

O manifesto JSON define: `name`, `short_name`, `start_url`, `display`, `icons`, `theme_color`, `background_color`, etc.

---

## `rel="me""

Indica que o recurso atual é representado pelo linked party. Definido no [XHTML Friends Network (XFN)](https://gmpg.org/xfn/) e usado em [RelMeAuth](https://microformats.org/wiki/RelMeAuth) e [Web sign-in](https://microformats.org/wiki/web-sign-in).

```html
<link rel="me" href="https://twitter.com/meu perfil" />
<a rel="me" href="https://github.com/meu perfil">Meu GitHub</a>
```

Usado para verificação de identidade entre domínios.

---

## `rel="alternate stylesheet"`

Define folhas de estilo alternativas que o usuário pode escolher (ex: no Firefox: View > Page Style).

```html
<link href="reset.css" rel="stylesheet" />

<link href="default.css" rel="stylesheet" title="Padrão" />
<link href="fancy.css" rel="alternate stylesheet" title="Fancy" />
<link href="basic.css" rel="alternate stylesheet" title="Básico" />
```

### Categorias de Stylesheet

| Tipo | `rel` | `title` | Comportamento |
|------|-------|---------|---------------|
| **Persistent** | `stylesheet` | ausente | Sempre aplicado |
| **Preferred** | `stylesheet` | presente | Aplicado por padrão; desabilitado se alternate selecionado |
| **Alternate** | `alternate stylesheet` | presente | Desabilitado por padrão; selecionável pelo usuário |

Style sheets com o mesmo `title` fazem parte da mesma escolha.

> [!NOTE]
> Suporte limitado em browsers sem extensão. Prefira `prefers-color-scheme` e `prefers-contrast` para temas alternativos.

---

## `rel="compression-dictionary"` (experimental)

Link para baixar um [dicionário de compressão](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression_dictionary_transport) que reduz o tamanho de recursos futuros do mesmo site.

```html
<link rel="compression-dictionary" href="/dictionary.dat" />
```

- A política `connect-src` do CSP deve permitir a localização do dicionário
- Experimental: ver compatibilidade antes de usar
