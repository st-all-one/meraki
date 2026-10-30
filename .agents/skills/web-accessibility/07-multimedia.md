# Imagens, Vídeo e Áudio

## Imagens

### Texto Alternativo (alt)

| Tipo de Imagem | Atributo `alt` | Exemplo |
|---|---|---|
| Informativa | Descrição concisa do conteúdo visual | `alt="Gráfico de barras mostrando vendas de 2024"` |
| Decorativa | `alt=""` (vazio) | `alt=""` — leitor de tela ignora |
| Funcional (link/botão) | Ação/destino | `alt="Página inicial"` (logo que linka para home) |
| Complexa (gráfico, diagrama) | Descrição curta + link para descrição longa | `alt="Diagrama de arquitetura. Descrição completa abaixo."` |
| Foto de pessoa | Nome + contexto | `alt="João Silva, CEO da Empresa X"` |
| Texto em imagem | **EVITAR** — o texto deve estar no HTML | Se inevitável, `alt` deve conter o texto |

### Artefatos Decorativos Complexos

```html
<!-- Imagem decorativa -->
<img src="divisor.png" alt="" role="presentation">

<!-- CSS background-image para decoração -->
<div aria-hidden="true" class="background-decorativo"></div>

<!-- SVG inline decorativo -->
<svg aria-hidden="true" focusable="false">...</svg>
```

### Figure + Figcaption

```html
<figure>
  <img src="arquitetura.png" alt="Diagrama da arquitetura do sistema">
  <figcaption>Figura 1: Diagrama de arquitetura em camadas</figcaption>
</figure>
```

## Vídeo

### Requisitos Mínimos

1. **Legendas** (cápsulas/surtos) — para surdos e ambientes silenciosos
2. **Transcrição** — para cegos e motores de busca
3. **Áudio-descrição** — para cegos (narração do que acontece visualmente)
4. **Controles de player acessíveis** — teclado, labels, focus visível

### Formatos de Legendas

```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="legendas.vtt" srclang="pt" label="Português">
  <track kind="subtitles" src="legendas-en.vtt" srclang="en" label="English">
  <track kind="descriptions" src="audiodescricao.vtt" srclang="pt" label="Audio descrição">
</video>
```

### Evitar Autoplay

```html
<!-- ERRADO -->
<video autoplay>

<!-- CERTO -->
<video controls preload="metadata">
```

Autoplay com som pode desorientar usuários de leitores de tela e é bloqueado por navegadores.

## Áudio

```html
<audio controls>
  <source src="podcast.mp3" type="audio/mpeg">
  <p>Seu navegador não suporta áudio. <a href="podcast.mp3">Baixar podcast</a></p>
</audio>
```

- Sempre forneça **transcrição** completa
- Player acessível: teclado, labels, focus visível

## Animações e GIFs

| Tipo | Requisito |
|---|---|
| GIF animado > 5s | Deve ter controle de pausa ou link para versão estática |
| Animação CSS contínua | Respeitar `prefers-reduced-motion: reduce` |
| Vídeo em loop | Controles visíveis para pausar |

## O Que EVITAR

- Texto dentro de imagem em vez de HTML
- `alt` redundante ("imagem de...", "foto de...")
- `alt` em imagem decorativa (use `alt=""`)
- Ausência de `alt` em img informativa
- Autoplay de vídeo/áudio sem consentimento
- Legendas ausentes em vídeos com fala
- Player customizado sem acessibilidade (teclado, ARIA, focus)

## Checklist

- [ ] Imagens informativas têm `alt` descritivo
- [ ] Imagens decorativas têm `alt=""` ou `role="presentation"`
- [ ] Imagens funcionais (link/botão) têm `alt` descrevendo ação
- [ ] SVG inline tem `aria-hidden="true"` + `focusable="false"` se decorativo
- [ ] Figure/figcaption usados para imagens com legenda
- [ ] Vídeos têm legendas (captions)
- [ ] Vídeos têm transcrição completa
- [ ] Áudio-descrição disponível para vídeos com conteúdo visual importante
- [ ] Players têm controles acessíveis por teclado
- [ ] Animações podem ser pausadas
- [ ] `prefers-reduced-motion` implementado
