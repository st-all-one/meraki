# Segurança em HTML

## 1. Content Security Policy (CSP)

Mitiga XSS e ataques de injeção. Pode ser definido via meta tag ou (preferencialmente) HTTP header.

### Via meta tag
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://trusted.cdn.com;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:;
               font-src 'self' https://fonts.gstatic.com;
               connect-src 'self' https://api.exemplo.com;
               frame-src 'none';
               object-src 'none';
               base-uri 'self';
               form-action 'self'" />
```

### Diretivas principais
| Diretiva | Controla |
|----------|----------|
| `default-src` | Fallback para todas as diretivas não especificadas |
| `script-src` | Fontes permitidas para scripts |
| `style-src` | Fontes permitidas para CSS |
| `img-src` | Fontes permitidas para imagens |
| `connect-src` | URLs permitidas para fetch/XHR/WebSocket |
| `frame-src` | Fontes permitidas para iframes |
| `frame-ancestors` | Quem pode embutir a página em iframe |
| `object-src` | Fontes para `<object>`, `<embed>`, `<applet>` |
| `base-uri` | URLs permitidas para `<base>` |
| `form-action` | URLs permitidas para action de formulário |
| `report-uri` / `report-to` | Onde reportar violações |

### Nonce e Hash
```html
<!-- NONCE -->
<meta http-equiv="Content-Security-Policy"
      content="script-src 'nonce-abc123'" />
<script nonce="abc123">...</script>

<!-- HASH -->
<meta http-equiv="Content-Security-Policy"
      content="script-src 'sha256-..." />
```

## 2. Subresource Integrity (SRI)

Protege contra CDN compromise (ataques à cadeia de suprimentos).

```html
<script src="https://cdn.example.com/library.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>

<link rel="stylesheet"
      href="https://cdn.example.com/styles.css"
      integrity="sha384-..."
      crossorigin="anonymous" />
```

**Hash algorithms**: `sha256-`, `sha384-`, `sha512-`

**Regras**:
- Sempre usar com `crossorigin="anonymous"` para recursos cross-origin
- Browser usa o algoritmo mais forte disponível na lista
- Se o hash não corresponder, o recurso não é carregado

## 3. Cross-Origin (atributo `crossorigin`)

| Valor | Comportamento |
|-------|--------------|
| `anonymous` (ou vazio `""`) | CORS request sem credenciais |
| `use-credentials` | CORS request com cookies/certificados |
| (ausente) | Sem CORS; recurso pode taintar canvas, limitar erro info |

**Elementos**: `<audio>`, `<img>`, `<link>`, `<script>`, `<video>`

## 4. Link Security

### noopener
```html
<a href="https://example.com" target="_blank" rel="noopener">
  Abrir em nova aba (seguro)
</a>
```
**Proteção**: Impede `window.opener` (Tab-napping attack).

### noreferrer
```html
<a href="https://example.com" rel="noreferrer">
  Sem Referer header
</a>
```
**Proteção**: Remove `Referer` header + comportamento de `noopener`.

### Combinação recomendada
```html
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
```

### nofollow
```html
<a href="https://example.com" rel="nofollow">
  Não passa autoridade SEO
</a>
```

## 5. iframe Sandbox

```html
<!-- Máxima restrição -->
<iframe src="user-content.html" sandbox></iframe>

<!-- Restrições seletivas -->
<iframe src="app.html"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
</iframe>
```

**Restrições quando `sandbox` está presente (mesmo vazio)**:
| Restrição | Comportamento bloqueado |
|-----------|------------------------|
| (tudo bloqueado) | Navegação, scripts, popups, formulários, same-origin, plugins |
| `allow-scripts` | Permite JavaScript |
| `allow-same-origin` | Permite acesso ao DOM da página pai |
| `allow-forms` | Permite submissão de formulários |
| `allow-popups` | Permite popups (`window.open`) |
| `allow-top-navigation` | Permite navegação do topo (`_top`) |
| `allow-modals` | Permite `alert()`, `confirm()`, `prompt()` |
| `allow-presentation` | Permite iniciar sessão de apresentação |
| `allow-orientation-lock` | Permite travar orientação |

## 6. Sanitização de HTML Gerado por Usuário

```javascript
// NUNCA faça:
element.innerHTML = userInput; // XSS!

// Use DOMPurify:
const clean = DOMPurify.sanitize(userInput);
element.innerHTML = clean;
```

**Sempre sanitize no servidor também.**

## 7. HTTPS e Mixed Content

- Todas as páginas devem ser servidas via HTTPS
- **Mixed content passivo**: imagens, áudio, vídeo via HTTP em página HTTPS (browser avisa)
- **Mixed content ativo**: scripts, iframes, CSS via HTTP (browser bloqueia)

### Upgrade Insecure Requests
```html
<meta http-equiv="Content-Security-Policy"
      content="upgrade-insecure-requests" />
```

## 8. Prevenção de XSS

### Boas práticas
1. **Output encoding**: `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `&` → `&amp;`
2. **CSP** como defense-in-depth
3. **Nunca** usar `eval()`, `document.write()`, `innerHTML` com dados não sanitizados
4. Preferir `textContent` sobre `innerHTML`
5. Sanitizar sempre no servidor
6. Usar frameworks modernos que escapam por padrão (React, Vue, Svelte)

## 9. Form Validation (Client-Side)

```html
<input type="email" required minlength="5" maxlength="100"
       pattern="[^@\s]+@[^@\s]+\.[^@\s]+" />
```

**⚠ Client-side validation NÃO substitui server-side validation.**

### Constraint Validation API
```javascript
const input = document.getElementById('email');
if (!input.checkValidity()) {
  input.reportValidity();
}
input.setCustomValidity('Mensagem personalizada');
```

## 10. Autocomplete para Dados Sensíveis

```html
<!-- Senhas -->
<input type="password" autocomplete="current-password" />
<input type="password" autocomplete="new-password" />

<!-- Cartão de crédito -->
<input type="text" autocomplete="cc-number" />
<input type="text" autocomplete="cc-exp" />
<input type="text" autocomplete="cc-csc" />

<!-- Código de uso único -->
<input type="text" autocomplete="one-time-code" inputmode="numeric" />
```

**Nota**: `autocomplete="off"` NÃO impede password managers.

## 11. Proteção contra Clickjacking

### Via CSP (recomendado)
```http
Content-Security-Policy: frame-ancestors 'none';
```
```html
<meta http-equiv="Content-Security-Policy"
      content="frame-ancestors 'none'" />
```

### Via X-Frame-Options (legado, fallback)
```http
X-Frame-Options: DENY
```

## 12. Checklist de Segurança

- [ ] CSP definido (idealmente via HTTP header)
- [ ] SRI em todos recursos de CDN
- [ ] `crossorigin` configurado adequadamente
- [ ] `target="_blank"` com `rel="noopener noreferrer"`
- [ ] iframes com `sandbox` (mínimo privilégio)
- [ ] Todo input de usuário sanitizado (client + server)
- [ ] HTTPS habilitado
- [ ] Formulário com validação server-side
- [ ] `autocomplete` apropriado para dados sensíveis
- [ ] `frame-ancestors` para prevenir clickjacking
- [ ] Nenhum `eval()` ou `document.write()` com dados dinâmicos
- [ ] Atributo `integrity` em scripts/libraries third-party
