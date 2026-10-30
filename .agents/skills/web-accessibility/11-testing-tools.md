# Ferramentas de Teste e Validação

## Estratégia de Testes

```
1. Testes automatizados (CI) → 30-50% dos problemas
2. Testes manuais com ferramentas → mais 30%
3. Testes com usuários reais → problemas restantes
```

## Ferramentas Automatizadas (CI/Build)

| Ferramenta | Tipo | Integração |
|---|---|---|
| [axe-core](https://github.com/dequelabs/axe-core) | Motor de regras | Jest, Cypress, Playwright |
| [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) | Linter JSX | ESLint |
| [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Auditoria | GitHub Actions, CI geral |
| [Pa11y CI](https://github.com/pa11y/pa11y-ci) | Runner de acessibilidade | CI |
| [AccessLint](https://www.accesslint.com/) | GitHub PR checker | GitHub |
| [AccessLint.js](https://github.com/accesslint/accesslint.js) | Node.js library | CI |

## Ferramentas de Navegador (Extensões)

| Ferramenta | Navegador | Função |
|---|---|---|
| [axe DevTools](https://www.deque.com/axe/devtools/) | Chrome, Firefox, Edge | Auditoria completa |
| [WAVE](https://wave.webaim.org/extension/) | Chrome, Firefox | Visualização de problemas na página |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) | Chrome (nativo) | Auditoria geral + acessibilidade |
| [Accessibility Insights](https://accessibilityinsights.io/) | Chrome, Edge | Testes guiados + automated checks |
| [HTML CodeSniffer](https://squizlabs.github.io/HTML_CodeSniffer/) | Bookmarklet | Validação WCAG inline |
| [Web Disability Simulator](https://chromewebstore.google.com/detail/web-disability-simulator/olioanlbgbpmdlgjnnampnnlohigkjla) | Chrome | Simulação deficiências visuais |

## Teste Manual

### Checklist de Navegação por Teclado
1. Tab pela página inteira — todos os elementos interativos são alcançáveis?
2. Shift+Tab — navegação reversa funciona?
3. Enter/Space — ativam botões, links, checkboxes?
4. Setas — navegam em widgets compostos (select, listbox, tabs)?
5. Escape — fecha diálogos, menus, popups?
6. Foco visível sempre?
7. Skip link presente e funcional?

### Teste com Leitores de Tela

| Leitor | OS | Navegadores |
|---|---|---|
| **NVDA** (gratuito) | Windows | Firefox (melhor), Chrome |
| **JAWS** (pago) | Windows | Chrome, Edge, Firefox |
| **VoiceOver** (nativo) | macOS, iOS | Safari |
| **TalkBack** (nativo) | Android | Chrome |
| **Orca** (nativo) | Linux | Firefox |

### Roteiro Básico
1. Navegar por elementos (Tab, setas)
2. Navegar por headings (H)
3. Navegar por landmarks (D)
4. Navegar por links (K no NVDA)
5. Navegar por form controls (F)
6. Interagir com botões, links, formulários
7. Verificar anúncios de live regions e alerts
8. Testar diálogos e modais

### Simulação de Deficiências

| Deficiência | Como simular |
|---|---|
| Baixa visão | Zoom 200%, 400%, 800% |
| Daltonismo | DevTools → Simular deficiência de cor |
| Cegueira | Tela desligada, navegar só com AT |
| Deficiência motora | Navegar só com teclado (sem mouse) |
| Daltonismo | Web Disability Simulator |

## Testes de Contraste

| Ferramenta | Tipo |
|---|---|
| [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | Online |
| Chrome DevTools → Inspect → Color Picker | Embutido |
| Firefox Accessibility Inspector | Embutido |
| axe DevTools → Color Contrast | Automatizado |

## Teste de Conteúdo Responsivo

- Zoom até 400% sem perda de conteúdo
- Layout em 320px de largura
- Orientação retrato e paisagem
- Redimensionamento de fonte no navegador

## Integração Contínua (CI) — Exemplo

```yaml
# .github/workflows/a11y.yml
name: Accessibility Check
on: [pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - name: Run Lighthouse CI
        run: npx lhci autorun
      - name: Run axe checks
        run: npm test -- --coverage
```

## Limitações

Ferramentas automatizadas encontram ~30-50% dos problemas de acessibilidade.

**Não detectam automaticamente:**
- Se `alt` é semanticamente correto
- Se a ordem de tabulação faz sentido
- Se o conteúdo é compreensível
- Se live regions são audíveis no contexto
- Se a experiência de navegação por AT é fluida

Teste com **usuários reais** é insubstituível.

## Checklist de Testes

- [ ] Ferramenta automatizada na CI (axe-core, Lighthouse)
- [ ] Linter JSX (eslint-plugin-jsx-a11y) no pipeline
- [ ] Extensão WAVE/aXe usada para auditoria manual
- [ ] Contraste verificado com ferramenta
- [ ] Navegação exclusiva por teclado testada
- [ ] Testado com pelo menos 1 leitor de tela (NVDA ou VoiceOver)
- [ ] Zoom 400% testado sem perda de conteúdo
- [ ] Simulação de daltonismo realizada
- [ ] Teste em mobile (TalkBack ou VoiceOver iOS)
- [ ] Conteúdo responsivo verificado em 320px
- [ ] `prefers-reduced-motion` testado
