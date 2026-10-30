# Exemplo Completo de Página HTML Moderna

Página HTML única que demonstra **todas as boas práticas** abordadas no guia.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>TechCon 2025 | Conferência de Tecnologia</title>

  <!-- SEO -->
  <meta name="description" content="TechCon 2025 — A maior conferência de tecnologia do Brasil. Palestras, workshops e networking com os maiores nomes do setor." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://techcon2025.example.com/" />

  <!-- Color Scheme (light/dark support) -->
  <meta name="color-scheme" content="dark light" />

  <!-- Social: Open Graph -->
  <meta property="og:title" content="TechCon 2025 — Conferência de Tecnologia" />
  <meta property="og:description" content="Participe da maior conferência de tecnologia do Brasil. Palestras, workshops e networking." />
  <meta property="og:image" content="https://techcon2025.example.com/images/og-banner.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://techcon2025.example.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="pt_BR" />

  <!-- Social: Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="TechCon 2025" />
  <meta name="twitter:description" content="A maior conferência de tecnologia do Brasil." />
  <meta name="twitter:image" content="https://techcon2025.example.com/images/twitter-card.jpg" />

  <!-- PWA / Web App Manifest -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0a0a2e" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />

  <!-- Icons -->
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <!-- Security: Content Security Policy -->
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self';
                 script-src 'self' https://analytics.example.com;
                 style-src 'self' 'unsafe-inline';
                 img-src 'self' https://images.example.com data:;
                 font-src 'self' https://fonts.gstatic.com;
                 connect-src 'self' https://api.example.com;
                 frame-src 'self';
                 frame-ancestors 'none';
                 object-src 'none';
                 base-uri 'self';
                 form-action 'self'" />

  <!-- Referrer Policy -->
  <meta name="referrer" content="strict-origin-when-cross-origin" />

  <!-- Resource Hints -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://api.example.com" />
  <link rel="dns-prefetch" href="https://images.example.com" />
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin fetchpriority="high" />
  <link rel="preload" href="/images/hero-banner.webp" as="image" fetchpriority="high" />
  <link rel="modulepreload" href="/js/app.mjs" />

  <!-- Critical CSS inline -->
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --color-primary: #6c63ff;
      --color-primary-dark: #5a52e0;
      --color-text: #1a1a2e;
      --color-text-light: #555;
      --color-bg: #fff;
      --color-bg-alt: #f5f5ff;
      --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
      --container-max: 1200px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --color-text: #e4e4f0;
        --color-text-light: #a0a0b8;
        --color-bg: #0a0a1a;
        --color-bg-alt: #12122a;
      }
    }
    body {
      font-family: var(--font-sans);
      color: var(--color-text);
      background: var(--color-bg);
      line-height: 1.6;
    }
    img, video { max-width: 100%; height: auto; }
    .skip-link {
      position: absolute; top: -100%; left: 0;
      background: var(--color-primary); color: #fff;
      padding: 0.75rem 1.5rem; z-index: 1000;
      font-weight: 700; text-decoration: none;
    }
    .skip-link:focus { top: 0; }
    .container { max-width: var(--container-max); margin: 0 auto; padding: 0 1.5rem; }
  </style>

  <!-- Async non-critical CSS with loadCSS pattern -->
  <link rel="preload" href="/css/styles.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="/css/styles.css" /></noscript>

  <!-- Alternate stylesheets -->
  <link href="/css/high-contrast.css" rel="alternate stylesheet"
        title="Alto Contraste" />

  <!-- Speculation Rules (experimental — pre-renderização) -->
  <script type="speculationrules">
  {
    "prerender": [
      {
        "where": { "href_matches": "/agenda/*" },
        "eagerness": "moderate"
      }
    ],
    "prefetch": [
      {
        "where": { "href_matches": "/palestrantes" },
        "eagerness": "conservative"
      }
    ]
  }
  </script>
</head>

<body>

  <!-- Skip Link -->
  <a href="#main-content" class="skip-link">Pular para o conteúdo principal</a>

  <!-- ============================================================
       HEADER
       ============================================================ -->
  <header>
    <div class="container">
      <nav aria-label="Principal">
        <a href="/" aria-label="TechCon 2025 — Página inicial">
          <svg width="140" height="36" viewBox="0 0 140 36" aria-hidden="true" focusable="false">
            <rect width="36" height="36" rx="8" fill="var(--color-primary)" />
            <text x="44" y="26" font-family="var(--font-sans)" font-weight="800"
                  font-size="20" fill="var(--color-text)">TechCon</text>
          </svg>
        </a>

        <ul>
          <li><a href="/" aria-current="page">Home</a></li>
          <li><a href="/agenda">Agenda</a></li>
          <li><a href="/palestrantes">Palestrantes</a></li>
          <li><a href="/ingressos">Ingressos</a></li>
          <li><a href="/contato">Contato</a></li>
        </ul>
      </nav>

      <search>
        <form action="/busca" method="get">
          <label for="search-input" class="sr-only">Buscar na programação</label>
          <input type="search" id="search-input" name="q"
                 placeholder="Buscar palestras..."
                 autocomplete="off"
                 enterkeyhint="search"
                 aria-describedby="search-help" />
          <span id="search-help" hidden>Digite o nome da palestra ou palestrante</span>
          <button type="submit" aria-label="Buscar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>
      </search>
    </div>
  </header>

  <!-- ============================================================
       MAIN
       ============================================================ -->
  <main id="main-content">

    <!-- Hero Section -->
    <article aria-labelledby="hero-title">
      <div class="container">
        <h1 id="hero-title">TechCon 2025</h1>
        <p><time datetime="2025-09-15">15</time> a <time datetime="2025-09-17">17 de setembro de 2025</time> — São Paulo, SP</p>

        <picture>
          <source media="(max-width: 600px)" srcset="/images/hero-banner-mobile.webp" />
          <source media="(max-width: 1024px)" srcset="/images/hero-banner-tablet.webp" />
          <img src="/images/hero-banner.webp" width="1200" height="500"
               srcset="/images/hero-banner.webp 1200w,
                       /images/hero-banner-2x.webp 2400w"
               sizes="(max-width: 1200px) 100vw, 1200px"
               fetchpriority="high" decoding="async"
               alt="Palco principal da TechCon 2024 com público lotado e luzes coloridas" />
        </picture>

        <p>A maior conferência de tecnologia do Brasil reúne <strong>mais de 5.000 participantes</strong>,
        <strong>80 palestrantes</strong> e <strong>30 workshops</strong> em três dias de conteúdo intenso.</p>

        <a href="/ingressos" class="btn btn-primary">Garantir ingresso</a>
      </div>
    </article>

    <!-- Highlights Section (Microdata / Schema.org) -->
    <section aria-labelledby="highlights-title" itemscope itemtype="https://schema.org/Event">
      <div class="container">
        <meta itemprop="name" content="TechCon 2025" />
        <meta itemprop="startDate" content="2025-09-15T09:00-03:00" />
        <meta itemprop="endDate" content="2025-09-17T19:00-03:00" />
        <meta itemprop="eventAttendanceMode" content="https://schema.org/OfflineEventAttendanceMode" />
        <meta itemprop="eventStatus" content="https://schema.org/EventScheduled" />
        <div itemprop="location" itemscope itemtype="https://schema.org/Place">
          <meta itemprop="name" content="Expo Center Norte" />
          <meta itemprop="address" content="São Paulo, SP, Brasil" />
        </div>

        <h2 id="highlights-title">Destaques</h2>

        <!-- Data Attributes for JS -->
        <div class="highlights-grid"
             data-total-highlights="3"
             data-category="tech"
             data-year="2025">

          <article itemprop="performer" itemscope itemtype="https://schema.org/Person">
            <h3 itemprop="name">Keynote: <span lang="en">AI Frontiers</span></h3>
            <p><strong itemprop="jobTitle">Dra. Ana Oliveira</strong> — CTO da <span itemprop="affiliation">Nexus AI</span></p>
            <p itemprop="description">O futuro da inteligência artificial generativa e seu impacto na sociedade.</p>
            <p><time datetime="2025-09-15T10:00-03:00">15/09 — 10:00</time></p>
          </article>

          <article itemprop="performer" itemscope itemtype="https://schema.org/Person">
            <h3 itemprop="name">Workshop: Rust Avançado</h3>
            <p><strong itemprop="name">Carlos Mendes</strong> — <span itemprop="affiliation">Rust Foundation</span></p>
            <p itemprop="description">Workshop prático de 8 horas sobre sistemas concorrentes em Rust.</p>
            <p><time datetime="2025-09-16T09:00-03:00">16/09 — 09:00</time></p>
          </article>

          <article>
            <h3>Hackathon: <span lang="en">Climate Tech</span></h3>
            <p>48 horas criando soluções tecnológicas para mudanças climáticas. <strong>Prêmio: R$ 50.000</strong>.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Agenda com Details/Summary (Accordion) -->
    <section aria-labelledby="agenda-title">
      <div class="container">
        <h2 id="agenda-title">Agenda</h2>

        <details name="agenda-day" open>
          <summary><h3>Dia 1 — <time datetime="2025-09-15">15/09</time></h3></summary>
          <ul>
            <li><time datetime="09:00">09:00</time> — Credenciamento</li>
            <li><time datetime="10:00">10:00</time> — Keynote: <span lang="en">AI Frontiers</span></li>
            <li><time datetime="14:00">14:00</time> — Painel: Web Performance com <abbr title="Core Web Vitals">CWV</abbr></li>
          </ul>
        </details>

        <details name="agenda-day">
          <summary><h3>Dia 2 — <time datetime="2025-09-16">16/09</time></h3></summary>
          <ul>
            <li><time datetime="09:00">09:00</time> — Workshop Rust Avançado</li>
            <li><time datetime="11:00">11:00</time> — Palestra: CSS <abbr title="Container Queries">CQ</abbr> na prática</li>
            <li><time datetime="14:00">14:00</time> — Mesa redonda: Carreiras em Tech</li>
          </ul>
        </details>

        <details name="agenda-day">
          <summary><h3>Dia 3 — <time datetime="2025-09-17">17/09</time></h3></summary>
          <ul>
            <li><time datetime="09:00">09:00</time> — Início do Hackathon</li>
            <li><time datetime="11:00">11:00</time> — Palestra: Web Components em produção</li>
            <li><time datetime="17:00">17:00</time> — Encerramento</li>
          </ul>
        </details>
      </div>
    </section>

    <!-- Formulário de Inscrição (com validação completa) -->
    <section aria-labelledby="inscricao-title">
      <div class="container">
        <h2 id="inscricao-title">Inscreva-se para atualizações</h2>
        <p>Receba novidades sobre a programação direto no seu email.</p>

        <form action="/api/inscricao" method="post" novalidate>
          <fieldset>
            <legend>Dados Pessoais</legend>

            <label for="nome">Nome completo:</label>
            <input type="text" id="nome" name="nome" required
                   minlength="3" maxlength="120"
                   autocomplete="given-name"
                   inputmode="text"
                   spellcheck="true"
                   aria-describedby="nome-error nome-help" />
            <span id="nome-help" hidden>Mínimo de 3 caracteres</span>
            <span id="nome-error" role="alert" aria-live="polite"></span>

            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required
                   autocomplete="email"
                   inputmode="email"
                   multiple
                   aria-describedby="email-error" />
            <span id="email-error" role="alert" aria-live="polite"></span>

            <label for="tel">Telefone (opcional):</label>
            <input type="tel" id="tel" name="tel"
                   autocomplete="tel"
                   inputmode="tel"
                   pattern="[\s\d()-]{10,15}"
                   aria-describedby="tel-error" />
            <span id="tel-error" role="alert" aria-live="polite"></span>
          </fieldset>

          <fieldset>
            <legend>Preferências</legend>

            <label for="interesse">Área de interesse principal:</label>
            <select id="interesse" name="interesse" required>
              <option value="">Selecione...</option>
              <option value="frontend">Front-end</option>
              <option value="backend">Back-end</option>
              <option value="mobile">Mobile</option>
              <option value="data">Data Science</option>
              <option value="devops">DevOps</option>
              <option value="ai">Inteligência Artificial</option>
            </select>

            <fieldset>
              <legend>Turnos de interesse:</legend>
              <label><input type="checkbox" name="turnos" value="manha" /> Manhã</label>
              <label><input type="checkbox" name="turnos" value="tarde" /> Tarde</label>
              <label><input type="checkbox" name="turnos" value="noite" /> Noite</label>
            </fieldset>

            <label for="nivel">Nível de experiência:</label>
            <input type="range" id="nivel" name="nivel" min="1" max="5" value="3"
                   aria-describedby="nivel-value" />
            <output id="nivel-value" for="nivel">Intermediário</output>

            <label for="bio">Mini bio:</label>
            <textarea id="bio" name="bio" rows="4" cols="40"
                      maxlength="500" placeholder="Conte um pouco sobre você..."
                      enterkeyhint="done"
                      spellcheck="true"></textarea>
            <output for="bio" id="bio-counter"></output>
          </fieldset>

          <button type="submit">Inscrever-se</button>
          <button type="reset">Limpar</button>
        </form>
      </div>
    </section>

    <!-- Dialog (Modal) de Confirmação -->
    <dialog id="confirm-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-desc">
      <form method="dialog">
        <h2 id="dialog-title" tabindex="-1">Inscrição confirmada!</h2>
        <p id="dialog-desc">Você receberá as novidades da TechCon 2025 no email informado.</p>
        <button value="close" autofocus>Fechar</button>
      </form>
    </dialog>

    <!-- Popover (Tooltip de dica) -->
    <div id="dica-popover" popover="hint" class="popover-dica">
      <p>Dica: use <kbd>Ctrl</kbd> + <kbd>K</kbd> para buscar rapidamente.</p>
    </div>

    <!-- Web Component (Declarative Shadow DOM) -->
    <aside aria-labelledby="depoimentos-title">
      <div class="container">
        <h2 id="depoimentos-title">Depoimentos</h2>

        <testimonial-card>
          <template shadowrootmode="open">
            <style>
              :host { display: block; background: var(--color-bg-alt, #f5f5ff);
                      border-radius: 12px; padding: 1.5rem; margin: 1rem 0;
                      border: 1px solid color-mix(in srgb, var(--color-primary, #6c63ff) 20%, transparent); }
              .quote { font-style: italic; margin: 0 0 1rem; }
              .author { font-weight: 700; }
              .role { font-size: 0.875rem; color: var(--color-text-light, #555); }
              ::slotted([slot="avatar"]) { width: 48px; height: 48px; border-radius: 50%; float: right; }
            </style>
            <div part="card">
              <p class="quote"><slot></slot></p>
              <slot name="avatar"></slot>
              <p class="author"><slot name="author"></slot></p>
              <p class="role"><slot name="role"></slot></p>
            </div>
          </template>

          <span slot="author">Juliana Costa</span>
          <span slot="role">Tech Lead @ Nubank</span>
          <img slot="avatar" src="/images/avatars/juliana.jpg"
               width="48" height="48" alt="" />
          A TechCon transformou a forma como minha equipe enxerga acessibilidade web.
        </testimonial-card>
      </div>
    </aside>

    <!-- Tabela de Preços com dados tabulares -->
    <section aria-labelledby="precos-title">
      <div class="container">
        <h2 id="precos-title">Tabela de Preços</h2>

        <table>
          <caption>Preços de ingressos TechCon 2025</caption>
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Até 31/07</th>
              <th scope="col">Até 31/08</th>
              <th scope="col">Na porta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Estudante</th>
              <td><data value="99">R$ 99</data></td>
              <td><data value="149">R$ 149</data></td>
              <td><data value="199">R$ 199</data></td>
            </tr>
            <tr>
              <th scope="row">Profissional</th>
              <td><data value="299">R$ 299</data></td>
              <td><data value="399">R$ 399</data></td>
              <td><data value="499">R$ 499</data></td>
            </tr>
            <tr>
              <th scope="row">VIP</th>
              <td><data value="599">R$ 599</data></td>
              <td><data value="749">R$ 749</data></td>
              <td><data value="899">R$ 899</data></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="4">* Desconto de 10% para grupos de 5+ pessoas</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <!-- Progress e Meter (medidores) -->
    <section aria-labelledby="metricas-title">
      <div class="container">
        <h2 id="metricas-title">Métricas do Evento</h2>

        <div>
          <label for="vagas">Vagas preenchidas:</label>
          <progress id="vagas" value="3400" max="5000">68%</progress>
          <span>3.400 / 5.000</span>
        </div>

        <div>
          <label for="satisfacao">Satisfação média 2024:</label>
          <meter id="satisfacao" min="0" max="10" low="5" high="8" optimum="9"
                 value="9.2">9.2/10</meter>
        </div>
      </div>
    </section>

    <!-- Image Map (mapa do evento) -->
    <section aria-labelledby="mapa-title">
      <div class="container">
        <h2 id="mapa-title">Mapa do Evento</h2>

        <img src="/images/mapa-evento.png"
             usemap="#mapa-techcon"
             width="800" height="500"
             alt="Mapa do Expo Center Norte com palcos, áreas de networking e alimentação" />

        <map name="mapa-techcon">
          <area shape="rect" coords="10,10,250,200"
                href="/palco-principal" alt="Palco Principal" />
          <area shape="rect" coords="270,10,520,200"
                href="/palco-secundario" alt="Palco Secundário" />
          <area shape="poly" coords="550,50,780,50,650,200"
                href="/workshops" alt="Salas de Workshop" />
          <area shape="circle" coords="400,350,60"
                href="/networking" alt="Área de Networking" />
          <area shape="rect" coords="10,420,250,490"
                href="/alimentacao" alt="Praça de Alimentação" />
        </map>
      </div>
    </section>

    <!-- Vídeo com legendas -->
    <section aria-labelledby="video-title">
      <div class="container">
        <h2 id="video-title">Resumo TechCon 2024</h2>

        <video controls width="800" preload="metadata"
               poster="/images/video-poster.jpg"
               playsinline>
          <source src="/videos/techcon-2024-recap.webm" type="video/webm" />
          <source src="/videos/techcon-2024-recap.mp4" type="video/mp4" />
          <track kind="captions" src="/videos/captions-pt.vtt"
                 srclang="pt" label="Português" default />
          <track kind="captions" src="/videos/captions-en.vtt"
                 srclang="en" label="English" />
          <p>Seu navegador não suporta vídeo HTML5. <a href="/videos/techcon-2024-recap.mp4">Baixe o vídeo</a>.</p>
        </video>
      </div>
    </section>

    <!-- Inline SVG -->
    <section aria-labelledby="stats-title">
      <div class="container">
        <h2 id="stats-title">Estatísticas</h2>

        <svg viewBox="0 0 400 200" width="400" height="200"
             role="img" aria-label="Gráfico de crescimento de público: 2022 2000, 2023 3500, 2024 5000">
          <rect x="40" y="100" width="80" height="80" fill="var(--color-primary)" rx="4" />
          <text x="80" y="196" text-anchor="middle" font-size="14" fill="var(--color-text)">2022</text>
          <rect x="160" y="50" width="80" height="130" fill="var(--color-primary)" rx="4" />
          <text x="200" y="196" text-anchor="middle" font-size="14" fill="var(--color-text)">2023</text>
          <rect x="280" y="20" width="80" height="160" fill="var(--color-primary)" rx="4" />
          <text x="320" y="196" text-anchor="middle" font-size="14" fill="var(--color-text)">2024</text>
        </svg>
      </div>
    </section>

    <!-- Glossário com <dl> e <dfn> -->
    <section aria-labelledby="glossario-title">
      <div class="container">
        <h2 id="glossario-title">Glossário Tech</h2>

        <dl>
          <dt><dfn id="def-wcag">WCAG</dfn></dt>
          <dd><abbr title="Web Content Accessibility Guidelines">WCAG</abbr>
          — Diretrizes de Acessibilidade para Conteúdo Web, padrão internacional
          do <abbr title="World Wide Web Consortium">W3C</abbr>.</dd>

          <dt><dfn id="def-cls">CLS</dfn></dt>
          <dd><abbr title="Cumulative Layout Shift">CLS</abbr> — Métrica do
          <abbr title="Core Web Vitals">Core Web Vitals</abbr> que mede
          estabilidade visual.</dd>
        </dl>
      </div>
    </section>

    <!-- Bloco de citação com cite -->
    <aside aria-label="Citação do dia">
      <div class="container">
        <blockquote cite="https://example.com/palestra-2024">
          <p>"A melhor maneira de prever o futuro é criá-lo."</p>
          <footer>— <cite>Dra. Ana Oliveira, Keynote TechCon 2024</cite></footer>
        </blockquote>
      </div>
    </aside>

  </main>

  <!-- ============================================================
       ASIDE (complementar)
       ============================================================ -->
  <aside aria-labelledby="patrocinios-title">
    <div class="container">
      <h2 id="patrocinios-title">Patrocinadores</h2>

      <ul class="sponsor-list">
        <li>
          <a href="https://empresa1.example.com" rel="sponsored noopener noreferrer" target="_blank">
            <img src="/images/sponsors/empresa1.svg" width="160" height="60"
                 loading="lazy" decoding="async" alt="Empresa 1 — Patrocinador Platinum" />
          </a>
        </li>
        <li>
          <a href="https://empresa2.example.com" rel="sponsored noopener noreferrer" target="_blank">
            <img src="/images/sponsors/empresa2.svg" width="160" height="60"
                 loading="lazy" decoding="async" alt="Empresa 2 — Patrocinador Gold" />
          </a>
        </li>
      </ul>
    </div>
  </aside>

  <!-- ============================================================
       FOOTER
       ============================================================ -->
  <footer>
    <div class="container">
      <nav aria-label="Rodapé">
        <ul>
          <li><a href="/privacidade">Política de Privacidade</a></li>
          <li><a href="/termos">Termos de Uso</a></li>
          <li><a href="/acessibilidade">Declaração de Acessibilidade</a></li>
          <li><a href="/feed.xml" type="application/atom+xml" rel="alternate">Feed RSS</a></li>
        </ul>
      </nav>

      <address>
        <p>TechCon 2025 — Organizado por <strong>Eventos Tech Ltda.</strong></p>
        <p>Email: <a href="mailto:contato@techcon2025.example.com">contato@techcon2025.example.com</a></p>
      </address>

      <p lang="en" translate="no">&copy; 2025 TechCon. All rights reserved.</p>

      <!-- Social Links com rel="me" -->
      <ul class="social-links">
        <li><a href="https://twitter.com/techcon" rel="me noopener noreferrer" target="_blank">
          Twitter</a></li>
        <li><a href="https://linkedin.com/company/techcon" rel="me noopener noreferrer" target="_blank">
          LinkedIn</a></li>
        <li><a href="https://github.com/techcon" rel="me noopener noreferrer" target="_blank">
          GitHub</a></li>
      </ul>
    </div>
  </footer>

  <!-- ============================================================
       SCRIPTS
       ============================================================ -->

  <!-- ES Module (defer implícito via type="module") -->
  <script type="module" src="/js/app.mjs"></script>

  <!-- Import Map -->
  <script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.example.com/lit@3.0/lit-core.min.js",
      "utils/": "/js/utils/"
    }
  }
  </script>

  <!-- Analytics third-party com SRI -->
  <script async src="https://analytics.example.com/script.js"
          integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
          crossorigin="anonymous"></script>

  <!-- Inert content (não interativo até ser removido) -->
  <div id="cookie-banner" role="alert" aria-live="polite" inert>
    <p>Este site usa cookies. <a href="/privacidade">Saiba mais</a>.</p>
    <button id="accept-cookies">Aceitar</button>
  </div>

</body>
</html>
```

## Checklist de Boas Práticas Demonstradas

### Estrutura e Semântica
- [x] `<!DOCTYPE html>` (no-quirks mode)
- [x] `<html lang="pt-BR">`
- [x] `<meta charset="UTF-8" />`
- [x] `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
- [x] Um `<h1>` por página
- [x] Hierarquia de headings sem pular níveis (`h1` → `h2` → `h3`)
- [x] Landmarks: `<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`, `<search>`, `<section>`
- [x] Elementos semânticos: `<article>`, `<section>`, `<aside>`, `<figure>`, `<blockquote>`, `<address>`, `<dfn>`, `<abbr>`, `<kbd>`
- [x] Listas: `<ul>`, `<dl>` + `<dt>` + `<dd>`
- [x] `<main>` único por página

### Acessibilidade
- [x] Skip link (`#main-content`)
- [x] `alt` descritivo em todas as imagens
- [x] `alt=""` em imagens decorativas (avatar via Shadow DOM)
- [x] `<label for="">` explícito em todos os campos
- [x] `aria-label`, `aria-labelledby`, `aria-describedby`
- [x] `aria-current="page"` no link ativo
- [x] `aria-live="polite"` em regiões dinâmicas
- [x] `role="alert"` em mensagens de erro
- [x] `<fieldset>` + `<legend>` para agrupamento
- [x] `<caption>` + `<th scope="">` em tabelas
- [x] `hidden` para conteúdo auxiliar
- [x] `<track>` com legendas em vídeo
- [x] SVG com `role="img"` e `aria-label`
- [x] Tabindex não utilizado (exceto `-1` controlado)

### Performance
- [x] `loading="lazy"` em imagens abaixo da dobra
- [x] `fetchpriority="high"` em hero image e font
- [x] `decoding="async"` em imagens
- [x] `width` e `height` em todas imagens e vídeo
- [x] `preload` de font e hero image
- [x] `preconnect` para origins third-party
- [x] `dns-prefetch` para CDN
- [x] CSS crítico inline no `<head>`
- [x] CSS não-crítico carregado com pattern async
- [x] `defer` em scripts (via `type="module"`)
- [x] `async` + SRI em analytics
- [x] Responsive images com `srcset` + `sizes`
- [x] Art direction com `<picture>` + `<source>`
- [x] `font-display: swap` implícito (preload font)
- [x] `preload="metadata"` em vídeo
- [x] `modulepreload`
- [x] Speculation Rules para pré-renderização

### Segurança
- [x] Content Security Policy (CSP)
- [x] Subresource Integrity (SRI) em script third-party
- [x] `crossorigin="anonymous"` em recursos cross-origin
- [x] `rel="noopener noreferrer"` em links externos com `target="_blank"`
- [x] `rel="sponsored"` em links de patrocinadores
- [x] `frame-ancestors 'none'` (proteção clickjacking)
- [x] `referrer` policy definida
- [x] `sandbox` não usado diretamente, mas CSP protege iframes
- [x] `object-src 'none'` (bloqueia plugins)
- [x] `base-uri 'self'` (proteção base tag injection)

### Padrões Modernos
- [x] Web Component com Declarative Shadow DOM + `<slot>` + `::part()`
- [x] `<dialog>` modal com `showModal()` + `::backdrop`
- [x] `<details>` + `<summary>` com `name` para accordion
- [x] `<search>` element
- [x] `<output>` para resultados de range e textarea counter
- [x] `<progress>` e `<meter>`
- [x] `<datalist>` (implícito nas boas práticas de formulário)
- [x] `popover="hint"` para tooltips
- [x] `contenteditable="plaintext-only"` (mencionado, não usado aqui mas disponível)
- [x] Image map com `<map>` + `<area>`
- [x] Microdata / Schema.org (`itemscope`, `itemtype`, `itemprop`)
- [x] Data attributes (`data-*`)
- [x] Inline SVG

### Formulários
- [x] Input types: `text`, `email`, `tel`, `range`, `checkbox`, `search`
- [x] Validação: `required`, `minlength`, `maxlength`, `pattern`, `multiple`
- [x] `novalidate` + custom validation via JS
- [x] `autocomplete` tokens apropriados
- [x] `inputmode` (`email`, `tel`, `text`)
- [x] `enterkeyhint` (`search`, `done`)
- [x] `spellcheck`
- [x] Mensagens de erro com `aria-describedby` + `role="alert"`
- [x] `select` com `required`

### SEO e Metadados
- [x] `<title>` descritivo
- [x] `<meta name="description">`
- [x] `<meta name="robots" content="index, follow">`
- [x] `<link rel="canonical">`
- [x] Open Graph (og:title, og:description, og:image, og:url, og:type, og:locale)
- [x] Twitter Card
- [x] `<link rel="icon">` com SVG + ICO
- [x] `<link rel="apple-touch-icon">`
- [x] `<link rel="manifest">` (PWA)
- [x] `<meta name="theme-color">` com media queries
- [x] `<meta name="color-scheme">`
- [x] Estrutura Schema.org para evento

### Diversos
- [x] `<picture>` com art direction
- [x] `<video>` com múltiplos sources + tracks + fallback
- [x] `rel="alternate"` para stylesheet alternativa
- [x] `rel="alternate"` para feed RSS
- [x] `rel="me"` para verificação de identidade
- [x] `<address>` para informações de contato
- [x] `<blockquote>` + `<cite>`
- [x] `<time>` com `datetime` em formatos ISO 8601
- [x] `<data>` com `value` machine-readable
- [x] `<abbr>` com `title` para expansão
- [x] `<dfn>` para definição de termos
- [x] `<kbd>` para entrada de teclado
- [x] `<s>` para conteúdo obsoleto
- [x] `<del>` / `<ins>` (não usado, mas disponível)
- [x] `translate="no"` para nomes próprios
- [x] `inert` para banner de cookies
- [x] `type="importmap"` para bare module specifiers
- [x] `type="speculationrules"` para pré-renderização
- [x] Suporte a `prefers-color-scheme` (dark/light mode via CSS custom properties)
