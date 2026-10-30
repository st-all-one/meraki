# Configurações de Acessibilidade do SO e Navegador

## Por que Conhecer as Configurações do Usuário

Usuários com deficiências configulam seus sistemas operacionais e navegadores para melhor atender suas necessidades. Conhecer essas configurações ajuda a:
- Testar seu produto nas condições reais do usuário
- Entender por que certas preferências de mídia (`prefers-reduced-motion`, `prefers-color-scheme`) são acionadas
- Evitar conflitos com configurações do sistema

---

## Windows 10/11

### Facilidade de Acesso (Settings → Accessibility)

| Configuração | Caminho | Efeito |
|-------------|---------|--------|
| **Alto Contraste** | Accessibility → Contrast Themes | Ativa `forced-colors: active` |
| **Narrador** | Accessibility → Narrator | Leitor de tela nativo |
| **Lupa** | Accessibility → Magnifier | Zoom de tela |
| **Reduzir Animações** | Accessibility → Visual Effects → Animation Effects | Remove animações de transição |
| **Barras de Título Transparentes** | Personalization → Colors → Transparency | Ativa `prefers-reduced-transparency` |
| **Filtros de Cor** | Accessibility → Color Filters | Grayscale, deuteranopia, protanopia, tritanopia |
| **Cursor e Ponteiro** | Accessibility → Mouse Pointer | Tamanho e cor do ponteiro |
| **Teclado Virtual** | Accessibility → Keyboard → On-Screen Keyboard | Alternativa de teclado |

### Atalhos Rápidos
- **Win + Ctrl + C**: Ativa/desativa filtros de cor
- **Win + Enter**: Ativa/desativa o Narrador
- **Win + "+"**: Lupa
- **Shift + Alt + Print Screen**: Ativa/desativa alto contraste

### Configurações de Animação do Windows

```
Settings → Accessibility → Visual Effects
  → Animation Effects: [Off]  ← Remove animações da UI do Windows
```

---

## macOS

### Acessibilidade (System Settings → Accessibility)

| Configuração | Caminho | Efeito |
|-------------|---------|--------|
| **VoiceOver** | Accessibility → VoiceOver | Leitor de tela nativo (⌘ F5) |
| **Zoom** | Accessibility → Zoom | Zoom de tela com ⌘ + scroll |
| **Display** | Accessibility → Display | |
| → Reduzir Movimento | Reduce motion | `prefers-reduced-motion: reduce` |
| → Reduzir Transparência | Reduce transparency | `prefers-reduced-transparency: reduce` |
| → Diferenciar Sem Cor | Differentiate without color | Remove indicadores só por cor |
| → Inverter Cores | Invert colors | Smart Invert clássico |
| → Filtros de Cor | Color Filters | Grayscale, protanopia, deuteranopia, tritanopia |
| **Contraste Aumentado** | Accessibility → Display → Display → Increase contrast | `prefers-contrast: more` |
| **Voz** | Accessibility → Spoken Content | Leitura de texto (fala) |

### Atalhos Rápidos
- **⌘ F5**: Ativa/desativa VoiceOver
- **⌘ ⌥ F5**: Atalhos de acessibilidade
- **⌘ ⌥ 8**: Inverter cores
- **⌘ ⌥ +** ou **⌘ ⌥ -**: Zoom

### Configurações de Acessibilidade via Terminal

```bash
# Reduzir movimento
defaults write com.apple.universalaccess reduceMotion -bool true

# Reduzir transparência
defaults write com.apple.Accessibility EnhancedBackgroundContrastEnabled -bool true
```

---

## iOS/iPadOS

### Acessibilidade (Settings → Accessibility)

| Configuração | Caminho | Efeito |
|-------------|---------|--------|
| **VoiceOver** | Accessibility → VoiceOver | Leitor de tela nativo |
| **Zoom** | Accessibility → Zoom | Magnificador de tela |
| **Display & Text Size** | Accessibility → Display & Text Size | |
| → Negrito | Bold Text | Texto em negrito |
| → Texto Maior | Larger Text | Escala de texto dinâmica |
| → Botões com Contorno | Button Shapes | Forma nos botões |
| → Reduzir Transparência | Reduce Transparency | `prefers-reduced-transparency: reduce` |
| → Aumentar Contraste | Increase Contrast | `prefers-contrast: more` |
| → Diferenciar Sem Cor | Differentiate Without Color | Remove indicadores só por cor |
| → Preferir Contraste Transversal | Prefer Cross-Fade | Transições suaves |
| **Motion** | Accessibility → Motion | |
| → Reduzir Movimento | Reduce Motion | `prefers-reduced-motion: reduce` |
| → Pré-visualizar em Movimento | Auto-Play Video Previews | Controle de autoplay |
| **AssistiveTouch** | Accessibility → Touch → AssistiveTouch | Botão virtual para gestos |

### Fala
- **Settings → Accessibility → Spoken Content**
- Speak Screen: deslizar dois dedos para ler tela
- Speak Selection: botão "Falar" no menu de seleção

---

## Android

### Acessibilidade (Settings → Accessibility)

| Configuração | Caminho | Efeito |
|-------------|---------|--------|
| **TalkBack** | Accessibility → TalkBack | Leitor de tela nativo (Google) |
| **Selecionar para Falar** | Select to Speak | Lê texto selecionado |
| **Tamanho da Fonte** | Accessibility → Font Size | Escala de texto |
| **Tamanho da Tela** | Accessibility → Display Size | Escala de display |
| **Lupa** | Accessibility → Magnification | Zoom |
| **Remover Animações** | Developer Options → Animations Off | Remove animações |
| **Contraste Alto** | Accessibility → Color and motion → High contrast text | Contraste de texto |
| **Correção de Cor** | Accessibility → Color and motion → Color correction | Protanopia, deuteranopia, tritanopia |
| **Inversão de Cores** | Accessibility → Color and motion → Color inversion | Inverter cores |
| **Timing para Ação** | Accessibility → Timing controls → Touch & hold delay | Atraso para toque |
| **Simplificar Tela** | Accessibility → Installed Apps → Accessibility Menu | Menu de acesso rápido |

### Atalhos
- **Botão Volume + e -**: Atalho para TalkBack
- **Gesture de três dedos**: Navegação TalkBack
- **Swipe para cima com dois dedos**: Rolagem contínua TalkBack

---

## Navegadores

### Firefox

| Configuração | Caminho | Efeito |
|-------------|---------|--------|
| **Desativar animação de GIF** | `image.animation_mode = "none"` no `about:config` | Para GIFs animados |
| **Zoom apenas texto** | Preferences → Zoom → Zoom only text | Zoom sem redimensionar imagens |
| **Prefere páginas claras** | Reader View → Colors → Theme | Controle de cores |
| **Fonte mínima** | Preferences → Fonts → Minimum font size | Evita texto muito pequeno |
| **Navegação pelo teclado** | Preferences → General → Browsing → Use cursor keys to navigate | Navegação por cursor |
| **Reader Mode** | `about:reader` | Modo de leitura limpo |

```javascript
// Firefox: parar animações de GIF via JavaScript
// image.animation_mode pode ser "normal", "once", ou "none"
// Configuração em about:config
```

### Chrome

| Configuração | Caminho | Efeito |
|-------------|---------|--------|
| **Zoom de página** | Settings → Appearance → Page Zoom | Escala global da página |
| **Fonte personalizada** | Settings → Appearance → Customize fonts | Tamanho e estilo |
| **Leitor de tela** | ChromeOS: ChromeVox | Leitor de tela integrado |
| **Extensões para GIF** | Chrome Web Store | GIF Blocker, GIF Scrubber |
| **Live Captions** | Settings → Accessibility → Live Captions | Legendas automáticas |
| **Modo Leitura** | Chrome Dev channel: Reading mode | Modo de leitura |

### Safari

| Configuração | Caminho | Efeito |
|-------------|---------|--------|
| **Zoom de página** | View → Zoom In/Zoom Out | Escala da página |
| **Reader View** | Address bar → Reader icon | Modo de leitura limpo |
| **Leitor de Tela** | VoiceOver integrado | Leitor de tela nativo |
| **Prevenir rastreamento** | Settings → Privacy | Privacidade |

---

## Extensões de Navegador para Acessibilidade

| Extensão | Função | Navegador |
|----------|--------|-----------|
| **GIF Blocker** | Bloqueia GIFs animados, mostra frame estático | Chrome |
| **GIF Scrubber** | Controle manual de GIFs (play/pause/scrub) | Chrome |
| **Beeline Reader** | Aplica gradiente de cor no texto para guiar leitura | Chrome, Firefox |
| **Web Disability Simulator** | Simula daltonismo, visão baixa, dislexia | Chrome |
| **Axe DevTools** | Auditoria de acessibilidade | Chrome, Firefox, Edge |
| **WAVE** | Análise visual de acessibilidade | Chrome, Firefox |
| **Landmarks** | Navegação por landmarks ARIA | Chrome, Firefox |
| **Accessibility Insights** | Testes automatizados e manuais | Chrome, Edge |
| **HTML CodeSniffer** | Auditoria inline de acessibilidade | Bookmarklet |

---

## Como Usar Estas Configurações no Desenvolvimento

### Teste com Configurações Reais

```javascript
// Verifique preferências atuais do usuário
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
```

```css
/* Exemplo de design responsivo a configurações do SO */
@custom-media --motionOK (prefers-reduced-motion: no-preference);
@custom-media --motionNotOK (prefers-reduced-motion: reduce);
@custom-media --dark (prefers-color-scheme: dark);
@custom-media --light (prefers-color-scheme: light);
@custom-media --highContrast (prefers-contrast: more);
@custom-media --lowContrast (prefers-contrast: less);
@custom-media --forcedColors (forced-colors: active);
```

### Simulando Configurações no DevTools

| Navegador | Como Simular |
|-----------|--------------|
| Chrome | DevTools → Rendering → Emulate CSS media feature |
| Firefox | DevTools → Responsive Design Mode → Settings |
| Safari | Develop → Experimental Features → Media queries |
| Edge | Mesmo que Chrome (base Chromium) |

### Estratégia de Degradação

```css
/* Base: animações ativas */
.card {
  transition: transform 0.3s ease;
}
.card:hover {
  transform: scale(1.05);
}

/* Usuário com motion reduzido: sem animações */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  .card:hover {
    transform: none;
  }
}

/* WHCM: Garantir contraste e bordas */
@media (forced-colors: active) {
  .card {
    border: 2px solid ButtonText;
  }
}
```

---

## Checklist
- [ ] Testado com Windows High Contrast Mode ativo
- [ ] Testado com macOS Reduce Motion ativo
- [ ] Testado com iOS Reduce Motion ativo
- [ ] `prefers-reduced-motion` implementado para desativar animações CSS
- [ ] `prefers-reduced-transparency` implementado para desativar glassmorphism
- [ ] `prefers-contrast: more` implementado com aumento de contraste
- [ ] `prefers-color-scheme: dark` implementado
- [ ] GIFs têm alternativa estática ou controle de pause
- [ ] Animação de GIF pode ser desativada via `image.animation_mode` (Firefox)
- [ ] Fonte e zoom funcionam com escalas de SO
- [ ] Testado com zoom de 200% e 400% sem quebra de layout
- [ ] Navegação por teclado funciona com Narrador/VoiceOver ativo
