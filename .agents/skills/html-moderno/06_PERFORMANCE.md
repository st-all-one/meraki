# Performance em HTML

## 1. Script Loading

| Estratégia | Ordem | Quando Executa | Uso |
|------------|-------|----------------|-----|
| (sync) | — | Bloqueia parse imediatamente | Evitar |
| `async` | Não garantida | Assim que baixar | Analytics, widgets independentes |
| `defer` | Preservada | Após parse HTML, antes de DOMContentLoaded | Scripts que manipulam DOM |
| `type="module"` | Preservada | Defer por padrão | ES Modules, código moderno |

```html
<script defer src="app.js"></script>
<script async src="analytics.js"></script>
<script type="module" src="main.mjs"></script>
```

## 2. Lazy Loading

```html
<!-- Imagens -->
<img src="imagem.jpg" loading="lazy" alt="..." />
<img src="hero.jpg" loading="eager" alt="Hero image" />

<!-- Iframes -->
<iframe src="widget.html" loading="lazy"></iframe>
```

- `lazy`: Carrega quando próximo do viewport
- `eager`: Carrega imediatamente (default)

**Impacto**: Reduz dados transferidos e requests em páginas com muitas imagens.

## 3. Fetch Priority

Sinaliza ao browser a importância relativa dos recursos:

```html
<img src="hero.jpg" fetchpriority="high" alt="Hero" />
<img src="decorative.jpg" fetchpriority="low" alt="" />
<script src="critical.js" fetchpriority="high"></script>
<link rel="preload" href="font.woff2" as="font" fetchpriority="high" crossorigin />
```

**Valores**: `high`, `low`, `auto` (default). Usar com moderação.

## 4. Resource Hints

### Preload (recurso crítico desta página — alta prioridade)
```html
<link rel="preload" href="hero.webp" as="image" />
<link rel="preload" href="font.woff2" as="font" crossorigin />
<link rel="preload" href="style.css" as="style" />
<link rel="preload" href="script.js" as="script" />
<link rel="preload" href="video.mp4" as="video" />
<link rel="preload" href="data.json" as="fetch" crossorigin />
```

**Sempre especificar `as`**: `image`, `font`, `style`, `script`, `video`, `audio`, `fetch`, `document`, `worker`

### Prefetch (recurso de próxima navegação — baixa prioridade)
```html
<link rel="prefetch" href="/next-page.html" />
<link rel="prefetch" href="/images/next-hero.jpg" />
```

### Preconnect (estabelece conexão antecipada)
```html
<link rel="preconnect" href="https://api.example.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
```

### DNS-Prefetch (resolve DNS antecipadamente)
```html
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

### Modulepreload (pré-carrega ES Module)
```html
<link rel="modulepreload" href="app.mjs" />
```

## 5. Responsive Images (Economia de Banda)

```html
<img srcset="small.jpg 480w,
             medium.jpg 800w,
             large.jpg 1200w"
     sizes="(max-width: 600px) 100vw,
            (max-width: 1200px) 50vw,
            1200px"
     src="fallback.jpg"
     alt="Descrição"
     decoding="async"
     loading="lazy" />
```

**Benefício**: Dispositivos móveis baixam versões menores (economia de 50-80% de banda).

## 6. Dimensionamento de Imagens (Prevenir CLS)

```html
<!-- SEMPRE especificar width e height -->
<img src="foto.jpg" width="800" height="600" alt="..." />

<!-- Ou com aspect-ratio via CSS -->
<img src="foto.jpg" style="aspect-ratio: 4/3" alt="..." />
```

**Impacto**: Previne Cumulative Layout Shift (CLS), métrica do Core Web Vitals.

## 7. Atributo `decoding`

```html
<img src="hero.jpg" decoding="async" alt="Hero" />
```

**Valores**: `sync` (decodifica imediatamente), `async` (decodifica em segundo plano), `auto` (default)

## 8. Otimização de Fontes

```html
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin />

<style>
  @font-face {
    font-family: 'Custom';
    src: url('font.woff2') format('woff2');
    font-display: swap; /* Evita FOIT (Flash of Invisible Text) */
  }
</style>
```

## 9. Estrutura HTML Otimizada

```html
<!-- Meta tags essenciais no topo do <head> -->
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Página Rápida</title>

  <!-- Preload fonts early -->
  <link rel="preload" href="font.woff2" as="font" crossorigin />

  <!-- CSS crítico inline, não-crítico async -->
  <style>/* CSS crítico aqui */</style>
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="styles.css" /></noscript>

  <!-- Preconnect para origins third-party -->
  <link rel="preconnect" href="https://analytics.example.com" />
</head>
<body>
  <!-- Conteúdo here -->

  <!-- Scripts no fim do body com defer -->
  <script defer src="app.js"></script>
</body>
```

## 10. Core Web Vitals

| Métrica | O que mede | Alvo | Impacto HTML |
|---------|-----------|------|--------------|
| **LCP** (Largest Contentful Paint) | Tempo de carregamento do maior elemento | ≤ 2.5s | Preload hero images/fonts, dimensionar img |
| **INP** (Interaction to Next Paint) | Responsividade a interações | ≤ 200ms | Defer scripts, não bloquear main thread |
| **CLS** (Cumulative Layout Shift) | Estabilidade visual | ≤ 0.1 | width/height em imagens, iframes, ads |

## 11. Checklist de Performance

- [ ] Scripts com `defer` ou `async` (nunca sync no head)
- [ ] Imagens com `loading="lazy"` (abaixo da dobra)
- [ ] Hero image com `fetchpriority="high"` e `loading="eager"`
- [ ] width/height em todas imagens e vídeos
- [ ] `decoding="async"` em imagens
- [ ] Preload de fonts críticas
- [ ] Preconnect para origins third-party
- [ ] Responsive images com `srcset`/`sizes`
- [ ] CSS crítico inline, CSS não-crítico carregado async
- [ ] Resource hints (preload, prefetch, preconnect) usados estrategicamente
- [ ] Font display swap
- [ ] Evitar render-blocking resources no início
