# Quirks Mode, Limited-Quirks Mode e No-Quirks Mode

Modos de renderização que browsers usam para compatibilidade com sites legados.

## Os Três Modos

| Modo | Nome antigo | Comportamento |
|------|-------------|---------------|
| **no-quirks mode** | "full standards mode" | Comportamento conforme especificações HTML+CSS modernas |
| **limited-quirks mode** | "almost standards mode" | Apenas alguns poucos quirks implementados |
| **quirks mode** | — | Emula Navigator 4 e IE 5 |

## Como o Browser Determina o Modo

O `<!DOCTYPE html>` no início do documento ativa **no-quirks mode**:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello World!</title>
</head>
<body>
</body>
</html>
```

- Qualquer DOCTYPE válido e moderno → **no-quirks mode**
- DOCTYPE incompleto ou ausente → **quirks mode**
- DOCTYPE com URL parcial → pode ativar **limited-quirks mode**

> [!IMPORTANT]
> A única função do `<!DOCTYPE html>` é ativar no-quirks mode. Versões anteriores do HTML usavam DOCTYPEs complexos, mas browsers modernos ignoram tudo exceto a escolha do modo.

### XHTML

- Servido como `application/xhtml+xml` → sempre no-quirks mode (com ou sem DOCTYPE)
- Servido como `text/html` → lido como HTML, DOCTYPE necessário

## Como Identificar o Modo Atual

### JavaScript

```js
document.compatMode
// "CSS1Compat" → no-quirks (ou limited-quirks)
// "BackCompat" → quirks mode
```

### Firefox DevTools

O console exibe um aviso se a página estiver em quirks ou limited-quirks mode.

## Impacto Prático

- **Quirks mode**: box model diferente (IE5), altura de linha, cores, etc.
- **Limited-quirks mode**: diferença sutil em altura de linha de imagens em tabelas
- **No-quirks mode**: comportamento previsível conforme especificação

Sempre usar `<!DOCTYPE html>` para garantir no-quirks mode.
