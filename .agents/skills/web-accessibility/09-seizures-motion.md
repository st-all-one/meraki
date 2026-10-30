# Convulsões, Movimento e Reações Físicas

## Epilepsia Fotossensível (WCAG 2.3)

### Três Piscadas ou Abaixo do Limite (2.3.1, Nível A)

> Páginas não devem conter conteúdo que pisque **mais de 3 vezes por segundo**, ou o flash deve estar abaixo do limiar geral de flash e flash vermelho.

### Regra Prática

```
1. Único, duplo ou triplo flash em 1 segundo → aceitável
2. Mais de 3 flashes em 1 segundo → NÃO aceitável
3. Mais de 5 pares claro-escuro de listras → NÃO aceitável (se piscando/oscilando)
4. Mais de 8 pares (se padrão estático ou deriva contínua) → NÃO aceitável
```

### O Caso Especial do Vermelho

Flash vermelho é particularmente perigoso (frequência mais baixa já pode desencadear crise).

## Medição de Risco

Ferramentas especializadas:
- **[PEAT](https://trace.umd.edu/peat/) (Photosensitive Epilepsy Analysis Tool)** — analisa vídeos
- **Harding Test** — padrão para certificação de conteúdo de TV/vídeo

## Prevenção para Desenvolvedores

### Animações e Transições

```css
/* Implementar prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Controles de Animação

```html
<button id="pause-animations">Pausar animações</button>
```

```js
let animationsPaused = false;

document.getElementById('pause-animations').addEventListener('click', () => {
  animationsPaused = !animationsPaused;
  document.querySelectorAll('*').forEach(el => {
    el.style.animationPlayState = animationsPaused ? 'paused' : 'running';
  });
});
```

### GIFs Animados

Navegadores permitem desabilitar GIFs animados:
- Firefox: `image.animation_mode = "none"` no about:config
- Extensões: GIF Blocker, GIF Scrubber

Como desenvolvedor:
- Links para GIFs devem alertar sobre animação
- Oferecer versão estática do GIF

```html
<details>
  <summary>Ver GIF animado (⚠ pode causar desconforto)</summary>
  <img src="animacao.gif" alt="Descrição do GIF">
</details>
```

### Vídeos em Loop

- Nunca autoplay com loop
- Sempre oferecer controles de pausa
- Alertar sobre conteúdo piscante

## Distúrbios Vestibulares

### Movimento e Rolagem

Efeitos que podem causar náusea e desorientação:
- Parallax scrolling
- Zoom automático
- Movimento constante de fundo
- Transições de tela com deslize rápido
- Scroll horizontal forçado

### prefers-reduced-motion

```css
/* Desabilitar parallax */
@media (prefers-reduced-motion: reduce) {
  .parallax {
    transform: none !important;
  }

  .scroll-animation {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

### prefers-reduced-transparency
```css
@media (prefers-reduced-transparency: reduce) {
  .glassmorphism {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: none;
  }
}
```

## Padrões Espaciais e Risco de Crises

### Listras e Padrões

> **Mais de 5 pares claro-escuro de listras em qualquer orientação** podem causar crises fotossensíveis.

Isso inclui:
- Listras paralelas, radiais, curvas ou retas
- Padrões formados por linhas de elementos repetidos
- Padrões estáticos (não só animados)

### Teste Rápido
```
1. Há mais de 5 listras?
2. Se sim, duram mais de 0,5s?
3. Se sim, o brilho excede o limite?
4. Se sim, qual o movimento do padrão?
5. Se as diretrizes são violadas → reduzir brilho.
```

## Configurações de Acessibilidade do Sistema

Aplicações devem respeitar configurações do SO:

| Configuração | Efeito | CSS Media Query |
|---|---|---|
| Reduzir movimento | Desabilita/pára animações | `prefers-reduced-motion: reduce` |
| Reduzir transparência | Remove blur/transparência | `prefers-reduced-transparency: reduce` |
| Modo escuro | Tema escuro | `prefers-color-scheme: dark` |
| Alto contraste | Aumenta contraste | `prefers-contrast: more` |
| Modo monocromático | Remove cor | `prefers-color-scheme: ...` + grayscale |

## Boas Práticas

1. **Nunca use flashes vermelhos** em conteúdo animado
2. **Mantenha animações curtas** (< 5s) ou dê controle de pausa
3. **Use `prefers-reduced-motion`** para desabilitar animações
4. **Evite parallax**, zoom automático, rolagem infinita com movimento
5. **Ofereça alternativa estática** para GIFs animados e vídeos em loop
6. **Teste com PEAT** para conteúdo com flash
7. **Evite padrões de listras** com mais de 5 pares claro-escuro
8. **Botão de pausa** global para animações da página

## Referência

- [WCAG 2.3: Seizures and Physical Reactions](https://www.w3.org/WAI/WCAG21/Understanding/seizures-and-physical-reactions)
- [MDN: Seizure disorders](/en-US/docs/Web/Accessibility/Guides/Seizure_disorders)
- [MDN: Spatial Patterns](/en-US/docs/Web/Accessibility/Guides/Accessibility_and_Spatial_Patterns)
- [MDN: Browsing more safely](/en-US/docs/Web/Accessibility/Guides/Browsing_safely)
- [Harding Test / PEAT](https://trace.umd.edu/peat/)

## Checklist

- [ ] Nenhum conteúdo com mais de 3 flashes por segundo
- [ ] Nenhum flash vermelho em conteúdo animado
- [ ] Animações > 5s têm mecanismo de pausa
- [ ] `prefers-reduced-motion` implementado
- [ ] `prefers-reduced-transparency` implementado
- [ ] Parallax desabilitado com prefers-reduced-motion
- [ ] Botão global de pausa de animações (quando aplicável)
- [ ] GIFs animados oferecem versão estática
- [ ] Padrões de listras evitados (> 5 pares)
- [ ] Autoplay de vídeo evitado
- [ ] Conteúdo testado com PEAT se aplicável
