# Imagens em CSS

## object-fit — Ajuste de Imagens em Contêiner

Controla como uma imagem (ou vídeo) se ajusta dentro de sua caixa:

```css
img {
  width: 300px;
  height: 200px;
  object-fit: fill;          /* estica para preencher (padrão) */
  object-fit: cover;         /* cobre a área (pode cortar) */
  object-fit: contain;       /* cabe inteira (pode sobrar espaço) */
  object-fit: none;          /* tamanho original, sem redimensionar */
  object-fit: scale-down;    /* menor entre none e contain */
}
```

| Valor | Comportamento | Uso |
|---|---|---|
| `fill` | Estica para preencher (padrão) | Raramente ideal |
| `cover` | Cobre sem distorcer (corta bordas) | Thumbnails, hero images |
| `contain` | Cabe inteira (letterbox) | Logos, ícones grandes |
| `none` | Tamanho original | Imagens com resolução exata |
| `scale-down` | Menor entre `none` e `contain` | Imagens responsivas |

```css
/* Padrão para thumbnails responsivos */
.card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  aspect-ratio: 16 / 9;
}

/* Hero image */
.hero {
  width: 100%;
  height: 60vh;
  object-fit: cover;
  object-position: center 30%; /* foco no topo (rosto) */
}
```

## object-position — Posição da Imagem no Contêiner

```css
img {
  object-position: center;        /* centralizado (padrão) */
  object-position: top left;      /* canto superior esquerdo */
  object-position: 50% 50%;       /* centro (padrão) */
  object-position: right 20px bottom 10px; /* offset das bordas */
  object-position: 20% 80%;       /* foco no canto inferior esquerdo */
}

/* Foco inteligente: ajustar posição para rostos */
.profile-pic {
  width: 200px;
  height: 200px;
  object-fit: cover;
  object-position: 50% 30%;   /* assume rosto no terço superior */
}
```

## aspect-ratio — Proporção Intrínseca

```css
/* Proporção fixa */
img {
  aspect-ratio: 16 / 9;       /* widescreen */
  aspect-ratio: 1 / 1;        /* quadrado */
  aspect-ratio: 4 / 3;        /* formato clássico */
  aspect-ratio: 3 / 2;        /* fotografia */
  aspect-ratio: 2 / 3;        /* retrato */
}

/* Usando atributos HTML */
img {
  aspect-ratio: attr(width) / attr(height);
  max-width: 100%;
  height: auto;
}

/* Vídeo responsivo */
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.video-wrapper iframe {
  width: 100%;
  height: 100%;
}
```

## image-set() — Imagens Responsivas por Resolução

```css
.hero {
  background-image: image-set(
    url("hero.avif") type("image/avif") 1x,
    url("hero.webp") type("image/webp") 1x,
    url("hero.jpg") type("image/jpeg") 1x,
    url("hero@2x.avif") type("image/avif") 2x
  );
  background-size: cover;
}
```

## image() — Função com Fallbacks

```css
/* Fallback de imagem */
.elemento {
  background-image: image("icon.svg" "icon.png" "fallback.jpg");
  /* tenta SVG, depois PNG, depois JPG */
}

/* Com cor de fundo */
.elemento {
  background-image: image("icon.svg", #fff);
}
```

## Imagens como Background vs. <img>

| Situação | HTML `<img>` | CSS `background-image` |
|---|---|---|
| Conteúdo semântico | ✅ | ❌ |
| SEO / acessibilidade | ✅ (alt text) | ❌ |
| Imagem decorativa | ❌ | ✅ |
| Controle de posição | Limitado | `background-position` |
| Responsivo | `srcset`/`sizes` | `image-set()` |
| Performance | Lazy loading nativo | `background-size` |

```css
/* Decorativa: background */
.hero-section {
  background: url("hero-bg.jpg") center / cover no-repeat;
}

/* Conteúdo: <img> com alt */
/* <img src="chart.png" alt="Gráfico de vendas 2024"> */
```

## Imagens Responsivas no HTML

```html
<!-- srcset + sizes: o navegador escolhe o melhor tamanho -->
<img
  src="photo-800.jpg"
  srcset="
    photo-400.jpg 400w,
    photo-800.jpg 800w,
    photo-1200.jpg 1200w"
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    800px"
  alt="Descrição da foto"
  loading="lazy"
  decoding="async"
>

<!-- <picture> para formatos modernos com fallback -->
<picture>
  <source srcset="photo.avif" type="image/avif">
  <source srcset="photo.webp" type="image/webp">
  <img src="photo.jpg" alt="Descrição" loading="lazy">
</picture>
```

## Imagens SVG em CSS

```css
/* Como background */
.icon {
  background: url("icon.svg") center / contain no-repeat;
}

/* Como mask */
.icon {
  mask: url("icon.svg") center / contain no-repeat;
  background: currentColor; /* cor controlada pelo CSS */
}

/* Inline via data URI */
.icon-check {
  background: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M13.5 4.5L6 12l-3.5-3.5' fill='none' stroke='green' stroke-width='2'/></svg>") center / contain no-repeat;
}

/* SVG inline no HTML (mais flexível) */
/* <svg class="icon" aria-hidden="true">...<use href="#icon-check"/></svg> */
```

## Image Sprites

Agrupar múltiplos ícones em uma única imagem para reduzir requests HTTP:

```css
.sprite {
  background: url("sprites.png") no-repeat;
  display: inline-block;
}

.sprite-home { width: 24px; height: 24px; background-position: 0 0; }
.sprite-user { width: 24px; height: 24px; background-position: -24px 0; }
.sprite-settings { width: 24px; height: 24px; background-position: -48px 0; }
.sprite-logout { width: 24px; height: 24px; background-position: -72px 0; }
```

### SVG Sprites (Moderno)

```html
<!-- Definição no HTML -->
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <defs>
    <symbol id="icon-home" viewBox="0 0 24 24">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </symbol>
    <symbol id="icon-user" viewBox="0 0 24 24">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </symbol>
  </defs>
</svg>

<!-- Uso -->
<svg class="icon" aria-hidden="true"><use href="#icon-home"/></svg>
<svg class="icon" aria-hidden="true"><use href="#icon-user"/></svg>

<style>
.icon {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
```

## Performance de Imagens

### Lazy Loading

```css
/* CSS não controla lazy loading, mas pode preparar o layout */
img {
  aspect-ratio: attr(width) / attr(height);
  max-width: 100%;
  height: auto;
}

/* Placeholder enquanto carrega */
.img-container {
  background: #f0f0f0;           /* cor placeholder */
  aspect-ratio: 16 / 9;
}

.img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### content-visibility + Imagens

```css
/* Imagens fora da viewport não são carregadas */
.gallery-item {
  content-visibility: auto;
  contain-intrinsic-size: 1px 300px;
}
```

### Tabela de Formatos

| Formato | Compressão | Transparência | Animação | Uso |
|---|---|---|---|---|
| AVIF | Excelente | Sim | Sim | Fotos, next-gen |
| WebP | Muito boa | Sim | Sim | Fotos, alternativa moderna |
| JPEG | Boa | Não | Não | Fotos |
| PNG | Sem perda | Sim | Não | Ícones, capturas de tela |
| GIF | Baixa | Sim | Sim | Animações simples |
| SVG | Vetorial | Sim | Sim | Ícones, ilustrações |

## CSS e Alt Text

```css
/* Imagens decorativas (background): sem alt */
.decorative {
  background: url("bg.jpg") center / cover no-repeat;
}

/* Imagens de conteúdo: sempre com alt no HTML */
/* ✅ <img src="photo.jpg" alt="Pôr do sol na praia"> */
/* ❌ <img src="photo.jpg"> */

/* Se a imagem falha ao carregar */
img::after {
  content: attr(alt);
  /* infelizmente não funciona cross-browser */
}
```

## Checklist

- [ ] `object-fit: cover` para thumbnails com proporção fixa
- [ ] `aspect-ratio` definido para evitar CLS
- [ ] Imagens de conteúdo usam `<img>` com `alt` semântico
- [ ] Imagens decorativas usam `background-image`
- [ ] `loading="lazy"` em imagens abaixo da dobra
- [ ] Formatos modernos com `<picture>` ou `image-set()`
- [ ] SVG inline para ícones (sem request extra)
- [ ] `content-visibility: auto` em galerias grandes
- [ ] Placeholder background enquanto imagem carrega
