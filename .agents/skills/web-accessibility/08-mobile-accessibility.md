# Acessibilidade Mobile

## Princípios Base

- WCAG 2.2 AA aplica-se tanto a mobile quanto a desktop
- Diretrizes específicas: [Mobile Accessibility Checklist](https://www.w3.org/WAI/standards-guidelines/mobile/)

## Touch Targets

- **Alvo mínimo**: 44×44px (iOS HIG) ou 48×48px (Material Design/Material You)
- **Espaçamento** entre alvos: pelo menos 8px
- Links próximos em texto corrido: padding extra

```css
.btn-close {
  min-width: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Gestos e Interação por Toque

### Pointer Cancellation (WCAG 2.5.2)

| Regra | Descrição |
|---|---|
| Down-event não deve executar ação | Use `click` (up-event) em vez de `mousedown`/`touchstart` |
| Se down-event for essencial | Permitir cancelar (arrastar para fora + soltar, ou desfazer) |
| Exceções | Simulações de experiência real (piano, jogos) |

### Gestos Complexos

- Gestos com múltiplos dedos (pinça, rotacionar) devem ter alternativa com 1 dedo
- Swipe deve ter alternativa com botão (ex: carrossel com `‹` `›`)

## Orientação (WCAG 2.5.4)

> **Conteúdo não deve ser restrito a uma única orientação** (retrato ou paisagem), a menos que essencial.

Exceções essenciais: aplicação de piano, cheques bancários.

## Visibilidade de Conteúdo Off-screen

Em SPAs com múltiplas "cards":

```html
<!-- ERRADO: usar opacity:0 ou position:absolute sem esconder -->
<div class="card" style="opacity: 0;">...</div>

<!-- CERTO: hidden, display:none, ou visibility:hidden -->
<div class="card" hidden>...</div>
<div class="card" style="display: none;">...</div>
```

> **Não use `aria-hidden`** para esconder conteúdo não-visível, a menos que absolutamente inevitável. Prefira `hidden` ou `display: none`.

## Estado do Sistema

- Checkboxes, radios: estado gerenciado pelo SO (nativo)
- Custom widgets: use ARIA states (`aria-checked`, `aria-disabled`, `aria-selected`, `aria-expanded`, `aria-pressed`)

## Leitores de Tela Mobile

| Plataforma | Leitor de Tela | Gestos Básicos |
|---|---|---|
| iOS | VoiceOver | Swipe dir./esq. para navegar, toque duplo para ativar |
| Android | TalkBack | Swipe dir./esq., toque duplo |
| TalkBack + Tela | Deslizar 3 dedos para navegar por páginas | — |

## Formulários Mobile

- **Teclado virtual correto**: `inputmode` e `type` para email, tel, url, number
- **Autocomplete** ativado: `autocomplete="name"`, `autocomplete="email"`, etc.
- **Zoom**: inputs não devem ter `font-size < 16px` (iOS amplia campos com font-size pequeno)

```html
<input type="email" inputmode="email" autocomplete="email">
<input type="tel" inputmode="tel" autocomplete="tel">
<input type="number" inputmode="numeric" pattern="[0-9]*">
```

## Considerações Específicas

| Aspecto | Diretriz |
|---|---|
| Botões | Altura ≥ 48px, padding adequado |
| Texto | Tamanho ≥ 16px para inputs |
| Contraste | Mesmos requisitos WCAG (4.5:1) |
| Movimento/parallax | Respeitar `prefers-reduced-motion` |
| Cores | Modo escuro testado |
| Notificações | Anunciadas via live region / `aria-live` |
| Foco em modais | Focus trap + scroll bloqueado atrás do modal |
| Rolagem infinita | Deve ter alternativa de paginação ou "carregar mais" |
| Navegação por tabs | Ordem tab deve fazer sentido no mobile também |

## Referência

- [MDN: Mobile accessibility checklist](/en-US/docs/Web/Accessibility/Guides/Mobile_accessibility_checklist)
- [BBC: Mobile Accessibility Guidelines](https://www.bbc.co.uk/accessibility/forproducts/guides/mobile/)
- [W3C: Mobile Accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/)

## Checklist

- [ ] Touch targets ≥ 48×48px com espaçamento adequado
- [ ] Gestos complexos têm alternativa simplificada
- [ ] `inputmode` e `type` configurados corretamente
- [ ] Conteúdo off-screen usa `hidden` ou `display: none`
- [ ] Não restrito a orientação única (retrato/paisagem)
- [ ] Pointer cancellation implementado (up-event executa ação)
- [ ] Autocomplete ativado nos campos de formulário
- [ ] Testado com VoiceOver (iOS) e TalkBack (Android)
- [ ] Ações em down-event evitadas ou com mecanismo de cancelamento
- [ ] Foco e scroll gerenciados em modais/drawers
