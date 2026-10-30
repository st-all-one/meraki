# Template Boilerplate HTML Moderno

## Template Completo (Melhores Práticas)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Título da Página | Site</title>

  <!-- SEO -->
  <meta name="description" content="Descrição da página para SEO com até 160 caracteres." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://exemplo.com/pagina" />

  <!-- Social (Open Graph / Facebook) -->
  <meta property="og:title" content="Título para Redes Sociais" />
  <meta property="og:description" content="Descrição para compartilhamento social." />
  <meta property="og:image" content="https://exemplo.com/og-image.jpg" />
  <meta property="og:url" content="https://exemplo.com/pagina" />
  <meta property="og:type" content="website" />

  <!-- Social (Twitter) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Título para Twitter" />
  <meta name="twitter:description" content="Descrição para Twitter." />
  <meta name="twitter:image" content="https://exemplo.com/twitter-image.jpg" />

  <!-- Icons -->
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <!-- PWA / Web App Manifest -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1a1a2e" />

  <!-- Security -->
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self';
                 script-src 'self';
                 style-src 'self' 'unsafe-inline';
                 img-src 'self' data:;
                 font-src 'self';
                 connect-src 'self';
                 frame-src 'none';
                 object-src 'none';
                 base-uri 'self';
                 form-action 'self'" />

  <!-- Resource Hints -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://analytics.example.com" />
  <link rel="dns-prefetch" href="https://cdn.example.com" />

  <!-- Critical CSS -->
  <style>
    /* Critical path CSS here */
    :root {
      --color-primary: #1a1a2e;
      --color-text: #333;
      --color-bg: #fff;
    }
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--color-text);
      background: var(--color-bg);
      line-height: 1.6;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    /* Skip link */
    .skip-link {
      position: absolute;
      top: -100%;
      left: 0;
      background: #000;
      color: #fff;
      padding: 0.5rem 1rem;
      z-index: 1000;
    }
    .skip-link:focus {
      top: 0;
    }
  </style>

  <!-- Async CSS (non-critical) -->
  <link rel="preload" href="/styles.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="/styles.css" /></noscript>
</head>

<body>

  <!-- Skip Link -->
  <a href="#main-content" class="skip-link">Pular para o conteúdo principal</a>

  <!-- Header -->
  <header>
    <nav aria-label="Principal">
      <a href="/" aria-label="Página inicial">
        <img src="/logo.svg" width="150" height="40" alt="Logo do Site" />
      </a>
      <ul>
        <li><a href="/" aria-current="page">Home</a></li>
        <li><a href="/sobre">Sobre</a></li>
        <li><a href="/servicos">Serviços</a></li>
        <li><a href="/contato">Contato</a></li>
      </ul>
    </nav>

    <search>
      <form action="/busca" method="get" role="search">
        <label for="search-input" class="sr-only">Buscar no site</label>
        <input type="search" id="search-input" name="q"
               placeholder="Buscar..."
               autocomplete="off" />
        <button type="submit" aria-label="Buscar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </form>
    </search>
  </header>

  <!-- Main Content -->
  <main id="main-content">
    <article>
      <h1>Título Principal da Página</h1>
      <p class="post-meta">
        Publicado em <time datetime="2025-07-21">21 de julho de 2025</time>
        por <a href="/autor" rel="author">Nome do Autor</a>
      </p>

      <section>
        <h2>Primeira Seção</h2>
        <p>Conteúdo da primeira seção com <strong>ênfase importante</strong>
        e <em>ênfase secundária</em>.</p>

        <figure>
          <img src="/imagem.jpg" width="800" height="450"
               srcset="/imagem-480w.jpg 480w,
                       /imagem-800w.jpg 800w,
                       /imagem-1200w.jpg 1200w"
               sizes="(max-width: 600px) 100vw,
                      (max-width: 1000px) 50vw,
                      800px"
               loading="lazy" decoding="async"
               alt="Descrição descritiva da imagem" />
          <figcaption>Legenda explicativa da imagem</figcaption>
        </figure>
      </section>

      <section>
        <h2>Formulário de Exemplo</h2>
        <form action="/api/contato" method="post" novalidate>
          <fieldset>
            <legend>Informações Pessoais</legend>

            <label for="nome">Nome completo:</label>
            <input type="text" id="nome" name="nome" required
                   minlength="3" maxlength="100"
                   autocomplete="given-name"
                   aria-describedby="nome-error" />
            <span id="nome-error" role="alert" aria-live="polite"></span>

            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required
                   autocomplete="email"
                   aria-describedby="email-error" />
            <span id="email-error" role="alert" aria-live="polite"></span>

            <label for="assunto">Assunto:</label>
            <select id="assunto" name="assunto" required>
              <option value="">Selecione...</option>
              <option value="suporte">Suporte</option>
              <option value="vendas">Vendas</option>
              <option value="outro">Outro</option>
            </select>
          </fieldset>

          <fieldset>
            <legend>Mensagem</legend>
            <label for="mensagem">Sua mensagem:</label>
            <textarea id="mensagem" name="mensagem" rows="5" cols="40"
                      required minlength="10" maxlength="1000"></textarea>
          </fieldset>

          <button type="submit">Enviar</button>
          <button type="reset">Limpar</button>
        </form>
      </section>
    </article>

    <aside>
      <h2>Conteúdo Relacionado</h2>
      <ul>
        <li><a href="/artigo1">Artigo Relacionado 1</a></li>
        <li><a href="/artigo2">Artigo Relacionado 2</a></li>
      </ul>
    </aside>
  </main>

  <!-- Footer -->
  <footer>
    <nav aria-label="Rodapé">
      <ul>
        <li><a href="/privacidade">Política de Privacidade</a></li>
        <li><a href="/termos">Termos de Uso</a></li>
      </ul>
    </nav>
    <p>&copy; 2025 Nome do Site. Todos os direitos reservados.</p>
  </footer>

  <!-- Scripts (defer) -->
  <script defer src="/js/app.js"></script>

  <!-- Analytics (async) -->
  <script async src="https://analytics.example.com/script.js"
          integrity="sha384-..."
          crossorigin="anonymous"></script>
</body>
</html>
```

## Template Mínimo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site</title>
  <meta name="description" content="Descrição da página." />
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <header>
    <nav aria-label="Principal">
      <a href="/">Home</a>
      <a href="/sobre">Sobre</a>
    </nav>
  </header>

  <main>
    <h1>Título</h1>
    <p>Conteúdo.</p>
  </main>

  <footer>
    <p>&copy; 2025</p>
  </footer>

  <script defer src="/js/app.js"></script>
</body>
</html>
```

## Template para Email HTML

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f4f4f4;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:8px;">
          <tr>
            <td style="padding:30px;">
              <h1 style="margin:0;color:#333;">Título do Email</h1>
              <p style="color:#666;">Conteúdo do email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Template para PWA (App Shell)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Name</title>
  <meta name="description" content="Progressive Web App" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1a1a2e" />
  <link rel="icon" href="/icon-192.png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />

  <!-- Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</head>
<body>
  <header>
    <button id="menu-toggle" aria-label="Abrir menu" aria-expanded="false"
            aria-controls="sidebar">
      ☰
    </button>
    <h1>App Name</h1>
  </header>

  <aside id="sidebar" inert>
    <nav aria-label="Navegação">
      <ul>
        <li><a href="/" aria-current="page">Home</a></li>
        <li><a href="/sobre">Sobre</a></li>
      </ul>
    </nav>
  </aside>

  <main id="app-shell">
    <!-- Dynamic content loaded via JS -->
    <p>Carregando...</p>
  </main>

  <script defer src="/js/app.js"></script>
</body>
</html>
```
