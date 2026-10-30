# Cor e Contraste

## Contraste de Cor (WCAG 1.4)

### Taxas de Contraste

| Tipo de Conteúdo | Mínimo (AA) | Aprimorado (AAA) |
|---|---|---|
| Texto normal (< 18pt ou < 14pt bold) | 4.5:1 | 7:1 |
| Texto grande (≥ 18pt ou ≥ 14pt bold) | 3:1 | 4.5:1 |
| Componentes de UI ativos e objetos gráficos | 3:1 | Não definido |
| Texto incidental (inativos, logotipos, decorativo) | Sem requisito | Sem requisito |

### Como Calcular

Use ferramentas:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- DevTools do navegador (Inspector → Contraste)
- aXe, Lighthouse, WAVE (automático)

## Uso de Cor (WCAG 1.4.1)

> **Cor não deve ser o único meio visual de transmitir informação, indicar ação, ou distinguir elemento visual.**

### Requisitos
- Links: usar **sublinhado** + cor (não apenas cor diferente)
- Validação: cor + ícone + texto (ex: borda vermelha + "!" + mensagem)
- Gráficos: cor + padrão/forma (ex: linhas pontilhadas vs contínuas)
- Evite verde/vermelho puro (daltonismo). Prefira laranja-avermelhado e azul-esverdeado

### Exemplo Correto
```css
/* ERRADO: apenas cor */
.error { color: red; }

/* CERTO: cor + ícone + texto */
.error { color: red; }
.error::before { content: "⚠ "; }
.error-text { display: inline; }
```

## Luminância e Percepção

- **Luminância**, não cor, determina acessibilidade de contraste
- Azul tem baixa luminância relativa → precisa de fundo mais claro
- Vermelho em fundo preto tem alto contraste (bom)
- Amarelo em fundo branco tem baixo contraste (ruim)
- Combinações que diferem apenas no canal azul causam "flutuação" visual (NASA)

### Padding e Contraste Local
- A adaptação local ao contraste é relevante: texto azul em cinza é mais perceptível cercado de preto do que de branco
- **Padding ao redor do texto afeta a percepção de contraste**

## Simulação de Deficiências de Cor

Use ferramentas para simular:
- DevTools Firefox: Accessibility → Simulate → Color Vision
- Chrome DevTools: Rendering → Emulate vision deficiencies
- Web Disability Simulator (extensão)

## Modo Escuro e Prefers-Color-Scheme

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121212;
    --text: #e0e0e0;
    --link: #bb86fc;
  }
}
```

Sempre teste contraste em ambos os modos.

## Minimizando Movimento (WCAG 2.3)

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## References

- [WCAG 1.4: Distinguishable](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [WCAG 1.4.1: Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color)
- [NASA: Designing With Blue](https://colorusage.arc.nasa.gov/blue_2.php)
- [Understanding Colors and Luminance (MDN)](/en-US/docs/Web/Accessibility/Guides/Colors_and_Luminance)

## Checklist

- [ ] Texto normal tem contraste ≥ 4.5:1
- [ ] Texto grande tem contraste ≥ 3:1
- [ ] UI components ativos têm contraste ≥ 3:1
- [ ] Informação não é transmitida só por cor
- [ ] Links têm sublinhado ou outro indicador além de cor
- [ ] Simulado para daltonismo (protanopia, deuteranopia, tritanopia)
- [ ] Contraste testado em modo claro e escuro
- [ ] `prefers-reduced-motion` implementado
- [ ] Mensagens de erro usam ícone + texto + cor
