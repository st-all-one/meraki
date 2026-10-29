# Avaliação — Topcoat 0.11 para o meraki

> **Veredito curto:** Topcoat é o framework Rust mais interessante para HTML-first que existe hoje, mas **não é uma base segura para o MVP**: é experimental (0.x), não traz auth/validação/jobs/banco/migrations e o runtime conflita com CSP estrita. Vale um **spike isolado**; não vale construir o produto inteiro sobre ele ainda. Se Rust for requisito, **Axum + Askama + HTMX** continua sendo a aposta de menor risco; se TypeScript for aceitável, o **Somlos cirúrgico** é o caminho com mais plataforma pronta (docs 01/03/05).
>
> Base avaliada: guia `.agents/skills/topcoat/` (22 capítulos + `SKILL.md`, 5.726 linhas, versão 0.11.0) e metadados públicos do crate. O CLI `topcoat` **não está instalado** neste ambiente; não houve compilação de app.

## 1. O que é, em fatos

| Item | Dado |
|---|---|
| Versão | **0.11.0** (24/10/2026) |
| Licença | **MIT** (o Somlos é projeto do próprio titular; ver doc 01) |
| Repositório | `tokio-rs/topcoat`; ~6,2 mil stars, 48 issues abertas, ativo em 29/10/2026 |
| Publicação | criado em 17/04/2026; **23 versões em ~6 meses**; ~72 mil downloads |
| Stack | Rust 1.99, edition 2024, Tokio, macros `view!`, roteamento por módulos, `Cx`, runtime de sinais/shards/procedures, streaming, cookies/sessões, assets, mail/l10n |
| Estado | **Experimental**; quebras entre 0.x; auth, validação, jobs e OpenAPI estão no roadmap |
| Modelo | Framework/biblioteca — **não é um skeleton de projeto**; você cria o app com `topcoat new` |

O guia cobre muito bem o “como fazer”: roteamento, views, componentes, concorrência, streaming, sessão, segurança, performance, testes e armadilhas. É documentação de qualidade, mas também é um catálogo de **panics e limites** — o próprio texto avisa que APIs experimentais podem mudar.

## 2. O que o Topcoat resolve bem

| Área | O que entrega | Valor para o meraki |
|---|---|---|
| Render | `view!` compilado, escaping por contexto, literais promovidos, componentes async | HTML tipado, sem template engine separado |
| Roteamento | árvore de módulos → URLs, `href!` tipado, layouts/layers por prefixo, params validados | bom para lista/quadro/calendário e links internos |
| Interação | HTMX/Alpine AJAX/Datastar/SSE/WS; opcionalmente sinais/shards/procedures | permite escolher o nível de JS |
| Sessão | token opaco, hash, cookie `__Host-`, rotação, expiração | fundação correta para login |
| Segurança | escaping, `OriginPolicy`, body limit 2 MiB, cookies prefixados | melhor que fazer tudo à mão |
| Assets | `asset!` com hash, bundle, Tailwind/fontes/ícones | pipeline sem Node |
| Testes | `Router::handle`, `CxTestBuilder`, render puro | testes HTTP sem abrir socket |
| Operação | binário Rust + assets; Tower para middleware | deploy familiar |

O ponto mais forte é a **ergonomia de SSR em Rust**: páginas, componentes, layouts, links e sessão no mesmo vocabulário, sem WASM e sem SPA. Para uma equipe Rust, isso é substancialmente melhor que montar Axum + Askama + sessão + assets na mão.

## 3. O que ele **não** resolve — e o meraki precisa

| Necessidade | Topcoat | Consequência |
|---|---|---|
| Banco, pool, queries | não incluso; exemplos usam SQLx/Toasty | você escolhe e mantém SQLx/SQLite |
| Migrations | não há runner além do CLI do Toasty | você escreve o runner ou usa `sqlx migrate` |
| Usuário/login/senha | só primitivas de sessão; sem tabela, hash ou fluxo | você constrói auth inteira |
| RBAC/permissões | nenhum | você constrói admin/member |
| Validação de formulário | nenhum | você valida tudo manualmente |
| CSRF token | **não existe**; só `OriginPolicy` | mutações cross-origin cobertas; token teria de ser feito |
| Rate limit | nenhum | você implementa (memória/SQLite) |
| Jobs/e-mail assíncrono | `send` é await; sem fila/retry | você constrói outbox/worker se precisar |
| OpenAPI | não existe | irrelevante para HTML interno, mas sem contrato |
| E2E | sem harness; Playwright externo | você monta |
| Deploy | sem guia oficial; `[INFERENCE]` em shutdown | você opera binário + assets + proxy |
| Multi-tenant | padrão manual (`Tenant` no contexto) | você filtra todas as queries |

O nome “batteries-included” vale para **render, assets, sessão, mail e l10n**; não vale para as preocupações de produto. Para o meraki, isso significa que o Topcoat cobre a casca, mas não o miolo.

## 4. Riscos específicos do Topcoat

### 4.1 Maturidade 0.x

- 23 versões em ~6 meses; o guia manda **pinar `=0.11.0`**.
- APIs de runtime, shards, records e procedures são explicitamente experimentais.
- Documentação e código podem divergir; “o código vence”.
- 48 issues abertas em um projeto novo; o custo de acompanhar breaking changes recai sobre você.

Para um app interno de 10 pessoas, isso pode ser aceitável **se** a equipe isolar o framework atrás de módulos e aceitar atualizações periódicas. Para uma base de longo prazo, é um risco maior que Askama/Axum.

### 4.2 Segurança: fundação boa, cobertura incompleta

O guia é honesto:

- **CSRF token não existe**; `OriginPolicy` só cobre métodos unsafe cross-origin e **não cobre GET** nem requests sem `Origin`/`Sec-Fetch-Site`.
- **Shards e procedures são rotas**: guards de página/layout **não rodam** neles. Toda superfície precisa de `require_user` e autorização por recurso.
- **Sinais/records são input do cliente**: todos os campos do record vão ao browser; valores restaurados não são confiáveis.
- **CSP**: o runtime usa script inline e `new Function`; páginas com runtime/streaming precisam de `'unsafe-inline'` e `'unsafe-eval'`. Não há hook de nonce.
- **Redirects** não checam origem (`//evil.example` passa).
- **Nomes dinâmicos de tag/atributo** são validados, mas panicam com input inválido; não são sanitização.

Isso é gerenciável — usar HTMX sem runtime, adicionar CSRF token, validar tudo, manter CSP estrita — mas é trabalho e disciplina que o framework não impõe. Para o meraki, que já exige sessão, CSRF e autorização em toda mutação, o “ganho” do runtime não compensa o risco.

### 4.3 Macros com arestas

O guia lista várias armadilhas que custam tempo:

- texto em `view!` precisa estar entre aspas;
- `disabled="false"` **desabilita**; use `disabled=(false)`;
- `#[key]` é obrigatório em loops que consomem identidade, senão panic;
- `cx` é detectado **pelo nome** do parâmetro;
- `module_param!`/`segment!` têm ordem e panic; `path_param` não declarado panic;
- layouts não envolvem `#[route]` que devolve view;
- renderizar para `String` descarta status/headers;
- assets exigem bundle do mesmo build; asset ausente panic;
- `raw!` é JavaScript, não HTML.

Nada disso é bloqueante, mas é uma curva de aprendizado e uma fonte de 500 em produção se a equipe não internalizar as regras.

### 4.4 Acoplamento de build e deploy

- O binário e o bundle de assets precisam ser **do mesmo build/perfil**; asset ausente panic.
- Cada perfil tem seu bundle; cache remoto é por URL e não revalida.
- SRI não é gerado; se usar CDN, calcule `integrity` à mão.
- Tailwind baixa binário na build (versão fixa, checksum não verificado por default); Fontsource via `@latest` é supply chain não fixada; use `host: Asset`.
- Runtime/streaming exigem proxy sem buffering e HTTP/1.1 para WS.

Para um único binário + Caddy, é operável; para 10 pessoas, é mais peça do que o necessário.

### 4.5 Caminhos e URLs derivados de arquivos

O roteamento por módulos é elegante, mas o path vem da árvore de arquivos; `#[page("/x")]` absoluto exige `.discover()`/registro. Shards/procedures têm path gerado por arquivo+linha+coluna e **mudam ao editar**. O guia recomenda paths explícitos para estabilidade.

Para um app interno com bookmarks e links em chat, isso é gerenciável com `href!` e paths explícitos, mas é mais um detalhe que pode quebrar URLs silenciosamente.

## 5. Aderência ao MVP do meraki

| Critério | Topcoat | Leitura |
|---|---|---|
| HTML server-side + HTMX | **5/5** | exatamente o modelo do MVP |
| Componentes/layouts tipados | **5/5** | melhor que Askama para lógica |
| Sessão/cookies | **4/5** | primitivas boas; falta user store |
| Auth/RBAC/CSRF | **2/5** | tudo manual; CSRF inexistente |
| Banco/migrations/backup | **1/5** | fora do escopo |
| Jobs/notificações | **1/5** | fora do escopo |
| Estabilidade | **2/5** | 0.x, 23 releases em 6 meses |
| Segurança/CSP | **3/5** | boa base; runtime enfraquece CSP |
| Testes | **3/5** | `Router::handle`; sem E2E |
| Operação | **3/5** | binário + assets; sem guia oficial |
| Ecossistema/contratação | **3/5** | tokio-rs, 6,2k stars; ainda novo |
| Simplicidade final | **3/5** | ótimo sem runtime; complexo com shards/streaming |

**Conclusão:** o Topcoat é um bom encaixe para **a camada de UI/rotas/sessão** de um app Rust, mas não para o **produto inteiro**. O meraki precisa de um núcleo enxuto (tasks + chat + anexos); o Topcoat adiciona um runtime, um modelo de streaming e um asset pipeline que só se pagam se você realmente usar sinais/shards/SSE/WS.

## 6. Topcoat × Askama+Axum × Somlos

| Dimensão | Topcoat | Axum + Askama + HTMX | Somlos (Deno/TS) |
|---|---|---|---|
| Linguagem | Rust | Rust | TypeScript/Deno |
| Maturidade | experimental 0.x | madura, peças estáveis | base própria, testada |
| Views | `view!` + componentes | Jinja-like Askama | JSX + HTMX |
| Interação | HTMX ou runtime signals/shards | HTMX + JS pontual | HTMX |
| Auth/sessão | primitivas | manual | completa (sessão, RBAC, CSRF, audit) |
| Banco/migrations | manual | manual (SQLx) | completo (Kysely, migrations, backup) |
| Segurança | boa base, CSRF/CSP incompletos | depende de você | mais completa |
| Deploy | binário + assets | binário + templates/static | binário Deno + assets |
| Risco | framework novo | baixo | escopo + stack TS |
| Esforço inicial | baixo para UI, alto para plataforma | médio | médio/alto para cortar |
| Fit ao MVP | camada de UI | **melhor equilíbrio** | plataforma completa, se TS |

O Topcoat não substitui o Somlos: um é framework Rust experimental; o outro é plataforma TypeScript completa. Se a decisão é **Rust**, o Topcoat é mais ergonômico que Askama, mas o preço é instabilidade e plataforma faltante. Se a decisão é **simplicidade**, Askama+Axum é a opção “chata” que ganha.

## 7. Quando vale a pena construir sobre Topcoat

**Vale** se:

- a equipe é Rust-first e quer evitar SPA/Node;
- o produto se beneficia de **sinais/shards/streaming** (dashboards vivos, colaboração, actualização contínua);
- você aceita pinar `=0.11.0`, isolar o framework e absorver breaking changes;
- o app é interno e pode relaxar CSP nas rotas com runtime;
- você tem tempo para escrever auth, CSRF, validação, migrations e testes.

**Não vale** se:

- o objetivo é o núcleo enxuto com lista, quadro, calendário, chat e anexos;
- a equipe não é Rust-first;
- CSP estrita é requisito;
- você quer uma base com auth/RBAC/migrations/backup prontos;
- você não quer ser early adopter de um framework 0.x.

Para o meraki, o critério decisivo é: **o diferencial do produto é a interação server-driven ou a simplicidade de gestão?** Se for a segunda, Topcoat é tecnologia a mais.

## 8. Se adotar: arquitetura recomendada

1. **Pine `topcoat = "=0.11.0"`** e isole o framework atrás de `src/web/` e `src/features/`; não espalhe `Cx`/`view!` pelo domínio.
2. **Comece sem runtime**: use `#[page]`, `#[layout]`, `#[route]`, `#[component]`, `href!`, `view!`, cookies/sessões e HTMX. Não chame `.runtime()`; evite `$()`, shards, procedures e streaming no MVP. Isso preserva CSP estrita e reduz a superfície de auth.
3. **Banco**: SQLx + SQLite (WAL, `BEGIN IMMEDIATE`), migrations próprias com checksum e backup/restore. Não dependa de Toasty sem avaliar maturidade.
4. **Auth**: tabela `users`/`sessions`, Argon2id, token opaco com hash, cookie `__Host-`, `SameSite=Lax`, `Secure`; `require_user(cx)` em página, layout, fragmento e qualquer endpoint. Adicione **CSRF token** manual (o Topcoat não tem).
5. **Validação**: um módulo `validate` com `serde` + regras explícitas; erros 422 + re-render com dados preservados (`rewrite`).
6. **CSRF/Origin**: mantenha `OriginPolicy`, mas não confie nela sozinha; token sincronizador em formulários e header HTMX.
7. **Views**: lista, quadro e calendário como `#[page]`/partials HTMX; board com SortableJS + endpoint POST de status; sem shards.
8. **Assets**: `asset!` + bundle; Tailwind opcional; se usar, fixe a versão e evite Fontsource `@latest`.
9. **Testes**: `Router::handle` para auth, CSRF, status/assignee, 409 de versão; Playwright para o board; sem depender de runtime.
10. **Deploy**: binário + `assets/` do mesmo build; Caddy; backup SQLite; health/ready.

Isso é basicamente “Askama+HTMX com uma camada de views mais ergonômica”. É viável, mas o ganho sobre Askama precisa ser grande para justificar o 0.x.

## 9. Spike recomendado antes de decidir

Um spike curto, isolado, com **uma** rota e **um** fluxo:

1. `topcoat new meraki-spike --minimal --no-interactive`;
2. adicione SQLx/SQLite e uma tabela `items`;
3. implemente login por sessão (sem runtime), lista com filtro e um POST HTMX de status;
4. monte um board simples com SortableJS e endpoint HTMX;
5. teste com `Router::handle` e rode `cargo clippy`/`cargo test`;
6. verifique CSP (sem runtime), bundle de assets e deploy do binário;
7. avalie o atrito: erros de macro, tempo de compilação, clareza do HTML, onboarding.

Critério de adoção: se o spike entregar a lista e o board com **menos** código/atrito que Askama+HTMX e a equipe aceitar a manutenção de 0.x, adote Topcoat como camada de UI. Se o atrito for maior, fique com Askama.

## 10. Veredito final

- **É uma boa tecnologia?** Sim; bem desenhada, documentada e com fundação de segurança melhor que a média.
- **É uma base para o meraki hoje?** **Não** para o produto inteiro; **sim** para um spike de UI/rotas/sessão.
- **É mais simples que Askama+HTMX?** Para views dinâmicas e componentes, sim; para o produto completo, não — falta meia plataforma e sobra um runtime experimental.
- **É mais simples que o Somlos?** Em stack e escopo, sim; em plataforma pronta, não.
- **Recomendação:** **não** construir o MVP sobre Topcoat agora. Faça o spike; se Rust for fixo e o spike convencer, use Topcoat **sem runtime** + SQLx + HTMX + auth própria. Caso contrário, **Axum + Askama + HTMX**; se TypeScript for aceitável, avaliar o **Somlos cirúrgico** (docs 01/03/05).
