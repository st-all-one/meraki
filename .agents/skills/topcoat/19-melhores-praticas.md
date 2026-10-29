# Melhores práticas

> Regras que reduzem retrabalho em apps Topcoat: fronteiras claras, guards por
> função, streaming consciente e nada de mágica escondida em layers.

## 1. Arquitetura

```
src/
├── main.rs                 # start, migrações, wiring
├── app.rs                  # router + layout raiz
├── app/                    # rotas = árvore de módulos
│   ├── _common.rs          # helpers de request/UI
│   ├── _admin.rs           # grupo protegido (layout/layer)
│   ├── posts.rs
│   ├── posts/id.rs
│   └── api/health.rs
├── components/             # UI reutilizável (sem acesso a banco)
├── features/               # casos de uso: auth, catalog, orders
├── db.rs                   # pool/ORM
└── assets/                 # bundle gerado
```

- **Rotas espelham o domínio**; o path é o módulo, não um arquivo de configuração.
- **`features/` não conhece `view!`**; devolve dados/DTOs. Componentes não conhecem
  SQL. Páginas orquestram os dois.
- **Um `Cx` por request** atravessa tudo; não crie "service locator" global.
- **Erros de domínio** convertem para `topcoat::Error` no handler, não no banco.
- **Config** entra por `app_context` (tipos próprios), não por `env!` espalhado.
- **Wiring explícito** em `router()`: é o lugar de ler env, montar pool, registrar
  serviços.

## 2. Roteamento

- Prefira módulos; só use paths absolutos para APIs/handlers isolados.
- Nomeie módulos no singular/plural coerente; kebab-case é automático.
- Use `_grupo` para escopo (admin, marketing), nunca para "esconder" URL.
- Um `module_param!` por módulo; valide com `error = …`.
- `#[layout]` para chrome; `#[layer]` para request-scoped values. Não coloque
  regra de negócio em layer.
- Monte o router em uma função `pub fn router()` para testes e embedding.
- `.discover()` sempre; evita "esqueci de registrar".
- `not_found!()` para 404 com marca; crie página própria para `/`.
- Evite `*` em rotas; prefira métodos explícitos.
- Congele paths públicos com testes de `href!`.

## 3. Views e componentes

- Componentes recebem dados prontos; não fazem I/O escondido, salvo componentes
  "container" explícitos (`post_list`).
- Props obrigatórias para o essencial; `#[default]` para apresentação.
- `Child` para composição; evite `attrs: Attributes` se não for repassar.
- `class!` para variantes; `class="…"` para listas fixas.
- Não monte HTML com `format!`; não use `Unescaped` com input.
- `#[key]` em todo loop que cria componentes/sinais/regiões.
- `element_id(cx)` em vez de IDs manuais.
- Metadados HTTP no topo da view; status em fallback de erro.
- Componentes de UI não dependem de `Cx` a menos que precisem de sinais/IDs.
- Prefira componentes pequenos e nomeados ao invés de helpers que retornam views.

## 4. Contexto e estado

- Um valor por tipo; newtypes para evitar colisão.
- `app_context` só para dependências de processo (pool, config, cliente HTTP).
- `request_context` para tenant, locale, request id, usuário resolvido.
- `#[memoize]` em lookups compartilhados; nunca em dados que devem persistir.
- Guards como funções (`require_user`, `require_admin`) chamadas em toda superfície.
- Evite `RefCell`/`Mutex` em contexto; prefira imutável + interior mutável do banco.
- Clone `Cx` para trabalho que sobrevive ao handler; nunca mute headers depois.

## 5. Runtime

- Sinais guardam **estado de UI**, não verdade de negócio.
- Derive identidade/autorização no servidor; não aceite `user_id` de sinal.
- Use `#[shard]` quando a fonte é o servidor; `$()` quando é cálculo local.
- Limite e valide todo argumento de shard/procedure (tamanho, faixa, allowlist).
- Um shard por região coesa; não transforme a página em N shards.
- Prefetch default é bom; meça o custo em páginas caras.
- `connected` só quando o HTML muda por eventos; para eventos puros, SSE.
- Evite `raw!`; quando usar, sempre com fallback Rust.

## 6. Segurança

- Auth em página **e** em shard/procedure/fragmento/WS.
- Mutações só por métodos unsafe; nunca GET que muda estado.
- Cookies com defaults seguros; dados do cliente em `private`.
- Redirects só para paths locais; URLs externas em allowlist.
- `Unescaped` restrito a constantes/sanitizado.
- Nada de segredo em records, sinais, logs ou mensagens de erro.
- Revise CSP: runtime exige inline/eval.
- Fixe versões de assets remotos e dependências.
- Faça threat model por superfície (página, API, shard, upload, webhook).

## 7. Assets e estilo

- Todo asset via `asset!`; nenhuma URL manual com versão.
- Bundle no pipeline de release, mesmo perfil do binário, publicado junto.
- CDN/edge em produção.
- Tailwind: classes literais; `components.toml` commitado.
- Fontes: pesos explícitos, host local; limite preloads.
- Ícones: sets fixados; `stage()` no build.
- UI vendorizada: edite com consciência; `add --overwrite` é destrutivo.

## 8. Performance

- Isole I/O lento em `suspense`/`live!`.
- Evite N+1: memoize + queries em lote.
- Não renderize listas não paginadas.
- Meça TTFB, p95 e tamanho de HTML; perfis de release.
- Compressão na borda; cache de HTML só com cuidado (sessão).
- Shards: queries indexadas, debounce no cliente se necessário.
- Prefetch: limite em páginas caras.

## 9. Documentação e comunicabilidade

O guia oficial é denso e correto, mas tem lacunas que custam tempo:

- `llms.txt` é o melhor mapa para agentes; comece por ele.
- Não existe página de escaping/segurança: a regra de `Unescaped` só aparece no
  rustdoc e num parágrafo de `view.md`.
- `raw!` é JavaScript, não HTML; o nome engana.
- Panics (path param não declarado, `segment!` após handler, `./` na raiz,
  identidade ambígua, cookie após selagem, `render` fora do build) estão
  dispersos em rustdoc/testes.
- Ordem de layers/runtime é a fonte de erro mais comum; o demo `admin` acerta.
- `topcoat dev` e deploy não têm referência dedicada.
- Há drift entre CHANGELOG e código (ex.: escape de `<` em comentários).

Ao trabalhar no projeto:

1. Leia o guia da feature **e** o rustdoc da macro.
2. Compare com `examples/<feature>` e `demos/admin`.
3. Se a doc e o código divergirem, o código vence; registre a divergência.
4. Ao adicionar uma feature, atualize `llms.txt` e este guia (convenção do repo).

## 10. Qualidade e CI

```sh
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --workspace
topcoat fmt --check
topcoat l10n check
```

- Testes de render puro para views/componentes.
- Testes HTTP com `Router::handle` para auth/redirect/limites.
- Smoke manual para runtime/streaming/assets.
- Revise `Cargo.lock` e atualizações 0.x (breaking).

## 11. Versionamento e evolução

- Pine a versão exata (`=0.11.0`) durante a adoção; 0.x quebra.
- Leia `CHANGELOG.md` dos crates afetados antes de subir.
- Isole APIs experimentais (`shards`, `records`, `raw!`) atrás de módulos próprios.
- Mantenha um "adapter" para sessão/auth para facilitar troca futura.
- Documente decisões em ADRs curtos: routing, auth, streaming, assets.

## 12. Checklist de revisão de PR

- [ ] Rota registrada e testada (`.discover()` quando aplicável).
- [ ] `href!` em links internos; sem paths literais.
- [ ] Guard de auth presente; autorização por recurso.
- [ ] Entrada validada (path/query/body/sinais/args).
- [ ] Nada de `Unescaped` com input.
- [ ] Erros mapeados; 500 não vaza detalhe.
- [ ] Cookies antes do streaming; atributos seguros.
- [ ] Views com `#[key]` em loops; IDs via `element_id`.
- [ ] Componentes lentos em região de streaming.
- [ ] Assets via `asset!`; sem URL manual.
- [ ] Teste cobre o comportamento novo (não só "não panicou").
- [ ] `topcoat fmt` aplicado.

## 13. Anti-padrões

| Anti-padrão | Consequência |
|---|---|
| `#[layer("/admin")]` como única auth | shards/procedures abertos |
| Regra de negócio em layout/componente | duplicação, ordem imprevisível |
| Estado global mutável em `Cx` | corrida/dados vazando entre requests |
| `format!` para HTML + `Unescaped` | XSS e perda de otimização |
| Um componente gigante que busca tudo | TTFB alto e difícil de testar |
| Shard para cada campo de formulário | rajada de requests |
| Cookie store para dados grandes | cookie estourado/truncado |
| `Key::generate()` no arranque | logout geral em cada deploy |
| Ignorar `topcoat fmt` | diffs gigantes e revisão ruim |
