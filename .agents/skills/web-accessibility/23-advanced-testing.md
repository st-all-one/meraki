# Testes Avançados de Acessibilidade

## Estratégia de Testes

```
Testes Automatizados (40-50% dos problemas)
├── Unitários (eslint-plugin-jsx-a11y)
├── Componentes (axe-core integrado)
├── Integração (Cypress + cypress-axe, Playwright)
├── E2E (Lighthouse CI, Pa11y CI)
└── Build-time (axe-core + CLI)

Testes Manuais (30-40%)
├── Navegação por teclado
├── Leitores de tela (NVDA, VoiceOver, TalkBack)
├── Configurações do SO (WHCM, reduce motion)
└── Zoom e redimensionamento

Testes com Usuários Reais (10-20%)
├── Pessoas com deficiências diversas
└── Testes de usabilidade com AT
```

---

## axe-core em Testes Unitários (React)

### Configuração com jest-axe

```javascript
// npm install --save-dev jest-axe @testing-library/react

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Botão não tem violações de a11y', async () => {
  const { container } = render(<button>Clique aqui</button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Modal tem foco gerenciado', async () => {
  const { container } = render(<Modal aberto={true} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Configuração com regras customizadas

```javascript
test('Verificar regras específicas', async () => {
  const { container } = render(<Componente />);
  const results = await axe(container, {
    rules: {
      'color-contrast': { enabled: true },
      'aria-allowed-attr': { enabled: true },
    },
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa'],
    },
  });
  expect(results).toHaveNoViolations();
});
```

---

## @axe-core/react em Tempo de Desenvolvimento

```javascript
// index.js ou App.jsx
if (process.env.NODE_ENV !== 'production') {
  const axe = require('@axe-core/react');
  axe(React, ReactDOM, 1000, {
    disableDeduplicate: true,
    // Opções adicionais
  });
}
```

Isso loga violações de acessibilidade diretamente no console do navegador durante o desenvolvimento.

---

## Cypress + cypress-axe

### Instalação

```bash
npm install --save-dev cypress cypress-axe
```

### Comando customizado (support/commands.js)

```javascript
import 'cypress-axe';

Cypress.Commands.add('checkA11y', (context = null, options = {}) => {
  cy.injectAxe();
  cy.checkA11y(context, {
    runOnly: ['wcag2a', 'wcag2aa'],
    includedImpacts: ['critical', 'serious'],
    ...options,
  }, (violations) => {
    cy.task('log', `⛔ ${violations.length} violações encontradas`);
    violations.forEach(v => {
      cy.task('log', `  ${v.id} - ${v.description}`);
    });
  });
});
```

### Teste

```javascript
describe('Página de login - Acessibilidade', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.injectAxe();
  });

  it('Não tem violações críticas', () => {
    cy.checkA11y(null, { includedImpacts: ['critical'] });
  });

  it('Formulário tem labels corretos', () => {
    cy.checkA11y('form', {
      rules: {
        'label': { enabled: true },
        'label-title-only': { enabled: false },
      },
    });
  });

  it('Mensagem de erro é acessível', () => {
    cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should('exist');
    cy.checkA11y();
  });
});
```

---

## Playwright + axe-core

### Configuração

```bash
npm install --save-dev @playwright/test axe-core
```

### Teste com Playwright

```javascript
// tests/a11y.spec.js
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('Homepage sem violações de acessibilidade', async ({ page }) => {
  await page.goto('https://exemplo.com');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast']) // regra específica
    .analyze();

  expect(results.violations).toEqual([]);
});

test('Modal tem foco correto', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('#abrir-modal');

  results = await new AxeBuilder({ page })
    .include('#modal-principal')
    .analyze();

  expect(results.violations.length).toBe(0);
});
```

### Snapshot de Acessibilidade

```javascript
const { test, expect } = require('@playwright/test');

test('Accessibility snapshot comparison', async ({ page }) => {
  await page.goto('/relatorio');
  const snapshot = await page.accessibility.snapshot();
  expect(snapshot).toMatchSnapshot('relatorio-a11y.json');
});
```

---

## Lighthouse CI

### Configuração (lighthouserc.js)

```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/produtos',
        'http://localhost:3000/contato',
      ],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ['accessibility'],
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'color-contrast': ['error', { minScore: 1 }],
        'aria-allowed-attr': ['error'],
        'label': ['error'],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### Comando

```bash
npx lhci autorun
```

### GitHub Action

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run build
      - name: Start server
        run: npm run start & npx wait-on http://localhost:3000
      - name: Lighthouse CI
        run: npx lhci autorun
```

---

## Pa11y CI

### Configuração (.pa11yci)

```json
{
  "defaults": {
    "timeout": 30000,
    "standard": "WCAG2AA",
    "runners": ["axe", "htmlcs"],
    "threshold": 0,
    "ignore": [
      "color-contrast"
    ],
    "viewport": {
      "width": 1280,
      "height": 1024
    }
  },
  "urls": [
    "http://localhost:3000/",
    "http://localhost:3000/login",
    "http://localhost:3000/dashboard"
  ]
}
```

### Comando

```bash
npx pa11y-ci
```

### GitHub Action

```yaml
# .github/workflows/pa11y.yml
name: Pa11y CI
on: [pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run build
      - name: Start server
        run: npm run start & npx wait-on http://localhost:3000
      - name: Run Pa11y
        run: npx pa11y-ci --config .pa11yci
```

---

## Testes de Regressão Visual com Acessibilidade

```bash
npm install --save-dev @percy/cli percy-cypress
```

```javascript
// Cypress + Percy para captura visual + a11y
cy.visit('/');
cy.injectAxe();
cy.checkA11y();
cy.percySnapshot(); // captura visual para regressão
```

---

## Acessibilidade em Storybook

### Configuração do addon a11y

```javascript
// .storybook/main.js
module.exports = {
  addons: ['@storybook/addon-a11y'],
};
```

### Stories com testes automáticos

```javascript
// Button.stories.js
import { within, userEvent } from '@storybook/testing-library';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false },
        ],
      },
    },
  },
};

export const Primary = {
  args: {
    variant: 'primary',
    children: 'Clique aqui',
  },
};

export const Disabled = {
  args: {
    disabled: true,
    children: 'Desabilitado',
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'button-name', enabled: true }],
      },
    },
  },
};
```

### Play Function + axe

```javascript
export const ComErro = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Enviar'));
    // axe roda automaticamente via addon
  },
};
```

---

## Testes de Leitor de Tela Automatizados

### NVDA + speechLogger

```python
# script python para testar anúncios NVDA
import subprocess
import time

# Iniciar NVDA com speech logger
nvda = subprocess.Popen([
    'nvda.exe', '-c', 'test-config.ini',
    '--log-file=nvda-speech.log'
])

# Navegar no navegador
subprocess.run([
    'chrome.exe', '--new-window', 'http://localhost:3000'
])

# Interagir e capturar fala
time.sleep(2)
with open('nvda-speech.log', 'r') as f:
    anuncios = f.read()

assert 'Banner' in anuncios
assert 'Navegação principal' in anuncios
```

### VoiceOver + macOS Accessibility API

```bash
# macOS: usar osascript para controlar VoiceOver
osascript -e '
tell application "System Events"
    keystroke "F5" using command down  -- ativar VoiceOver
    delay 2
    keystroke tab  -- navegar
    delay 1
    -- capturar anúncio
end tell
'
```

---

## Cobertura de Testes por Critério WCAG

| Critério | Teste Automatizado | Teste Manual |
|----------|-------------------|--------------|
| 1.1.1 Non-text Content | axe, Pa11y | Verificar alt text |
| 1.3.1 Info and Relationships | axe | NVDA headings/landmarks |
| 1.4.1 Use of Color | axe (parcial) | Inspeção visual |
| 1.4.3 Contrast Minimum | axe, Lighthouse | WebAIM Contrast Checker |
| 2.1.1 Keyboard | axe | Navegação completa por Tab |
| 2.4.1 Bypass Blocks | axe (parcial) | Verificar skip link |
| 2.4.4 Link Purpose | axe (parcial) | Ler links fora de contexto |
| 2.4.7 Focus Visible | axe | Tab + verificar focus ring |
| 3.3.2 Labels/Instructions | axe, Lighthouse | VoiceOver |
| 4.1.2 Name Role Value | axe | NVDA + elementos custom |

---

## Pipeline CI Completo

```yaml
# .github/workflows/a11y-full.yml
name: Acessibilidade Completa
on:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx eslint --plugin jsx-a11y src/

  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx jest --coverage

  e2e-a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - name: Start server
        run: npm run start & npx wait-on http://localhost:3000
      - name: Cypress a11y tests
        run: npx cypress run --spec "cypress/e2e/a11y/**"
      - name: Pa11y CI
        run: npx pa11y-ci

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - name: Lighthouse CI
        run: npx lhci autorun
```

---

## Checklist de Ferramentas

| Ferramenta | Uso | Integração |
|-----------|-----|------------|
| eslint-plugin-jsx-a11y | Lint em tempo de dev | ESLint |
| axe-core | Teste unitário de componentes | Jest, Mocha |
| @axe-core/react | Console warnings em dev | React |
| cypress-axe | Teste E2E de acessibilidade | Cypress |
| @axe-core/playwright | Teste de página completa | Playwright |
| Lighthouse CI | Auditoria em CI | GitHub Actions |
| Pa11y CI | Auditoria com múltiplos runners | CI/CD |
| Storybook addon-a11y | Teste visual de componentes | Storybook |
| WAVE | Auditoria manual | Extensão browser |
| Accessibility Insights | Teste manual + automated | Extensão browser |
| NVDA + JAWS | Teste com leitor de tela | Desktop |
| VoiceOver | Teste iOS/macOS | Nativo |
| TalkBack | Teste Android | Nativo |
| WebAIM Contrast Checker | Verificação de contraste | Online |

---

## Checklist Final
- [ ] eslint-plugin-jsx-a11y configurado e sem warnings
- [ ] Testes unitários com jest-axe em todos os componentes
- [ ] @axe-core/react rodando em ambiente de desenvolvimento
- [ ] Cypress + cypress-axe nos fluxos críticos
- [ ] Playwright + @axe-core/playwright nas páginas principais
- [ ] Lighthouse CI com threshold mínimo de 90% acessibilidade
- [ ] Pa11y CI com standard WCAG2AA
- [ ] Storybook com addon-a11y ativo
- [ ] Pipeline CI completo (lint → unit → e2e → lighthouse)
- [ ] Teste manual com NVDA + Chrome em fluxos críticos
- [ ] Teste manual com VoiceOver + Safari
- [ ] Teste manual com TalkBack + Android
- [ ] Teste com zoom 200% e 400%
- [ ] Teste com navegação apenas por teclado
- [ ] Teste com Windows High Contrast Mode
- [ ] Teste com prefers-reduced-motion ativo
