# FAQ e troubleshooting

> Sintoma → causa provável → correção. Comece pelo panic (a mensagem costuma
> apontar arquivo:linha) e depois confira registro/discovery.

## Build e dev server

**`panic: asset bundle not found` / `AssetBundle::load().unwrap()`**
Rodou `cargo run`/`cargo test` sem bundle. Use `topcoat dev`, ou
`topcoat asset bundle [--release]` no perfil certo.

**Asset 404 em produção**
Bundle de outro perfil/binário. Regenere com o mesmo profile e suba junto; para
`--out`, use `AssetBundle::load_dir`. Para CDN, `AssetConfig::hosted_at` com o
manifesto correspondente.

**CSS do Tailwind vazio/404**
`build.rs` sem `render()`, ou `stylesheet!()` sem bundle. Confirme
`BuildConfig::new().render()` e o bundle.

**`topcoat: command not found`**
`~/.cargo/bin` fora do PATH; ou use `cargo topcoat`.

**Migration falha com "table exists"**
Você rodou `generate`/`apply` duas vezes. Use o fluxo do Toasty e um banco limpo em
dev, ou crie uma migration nova.

## Rotas

**404 em rota que existe**
- `#[page("/x")]` absoluto não é registrado por `module_router!()` → `.discover()`
  ou `.page(handler)`.
- Módulo não é filho do módulo do `module_router!()`.
- `segment!(kind = Group)` removeu o segmento da URL.
- Trailing slash divergente → o default redireciona 308; se virou 404, está
  `Strict`.

**405 Method Not Allowed**
Método não registrado. `#[page]` só faz GET; use `#[route(POST)]` ou
`#[page(POST)]`. WebSocket exige GET + upgrade.

**Shard/procedure 404**
Falta `.discover()`/`.route(..)`; ou o path gerado mudou após editar o arquivo
(linha/coluna). Fixe `#[shard("/path")]`.

**Dois handlers no mesmo path**
Métodos iguais → panic no build ("duplicate route"). Métodos diferentes são válidos;
`*` coexiste com específico.

**Layer não roda**
- Layer por path não casa com o path servido (grupos/params).
- Layer pathless é a única que vê 404/405.
- Descoberta com path duplicado é rejeitada.

**Layout não envolve**
Layouts envolvem **páginas**. `#[route]` que devolve view não é envolvido.

**`segment!` panic**
Foi chamado depois de um handler do módulo. Mova para o topo do módulo.

**`./` panic no módulo raiz**
O path raiz não tem forma de barra final.

## Views e componentes

**`expected view node` / erro de sintaxe em `view!`**
Texto sem aspas, vírgula entre filhos, argumento nomeado depois de filho, ou
`match` com corpo múltiplo sem bloco.

**`disabled="false"` desabilita**
Literal está presente. Use `disabled=(flag)`.

**`aria-expanded` não funciona**
Atributo enumerado: passe `"true"`/`"false"` como string, não `bool`.

**Ícone/HTML aparece escapado**
Interpolação é escapada. Para markup confiável use `Unescaped` (não `raw!`).

**Atributos fora de ordem / duplicados**
`attributes!` é `HashMap`; chaves são case-sensitive. Não dependa de ordem; evite
`class` + `CLASS`.

**`cx` não existe no componente**
`cx: &Cx` é detectado **pelo nome**; o parâmetro precisa se chamar `cx`.

**Recursão não compila**
`impl View` infinito. Use `.boxed()` (ou `Child`).

**Panic de identidade ambígua**
Loop sem `#[key]`, ou helper que consome identidade sem `cx.keyed(id)`.

**Status/headers da view somem**
Renderizou para `String`. Use `render_response`/`.single()` e devolva como resposta.

## Runtime e sinais

**`runtime::script()` panic**
Router sem `.runtime()`. Chame depois das layers de app.

**Expressão não compila**
Fora do vocabulário (ex.: `format!`, métodos de terceiros). Simplifique, use
`raw!` com fallback ou uma procedure.

**`raw!` panic no render**
Sem fallback Rust. Passe o segundo argumento ou use só dentro de evento.

**Sinal "reseta" após submit**
Valor restaurado não desserializou no tipo; `init` rodou. Valide e normalize antes
de usar; evite depender de estado não persistido.

**`signal` panic**
Criado fora de escopo de render ou dentro de `#[memoize]`.

**Input não atualiza/limpa**
`value` é default; o usuário manda. Para sempre aplicar: `Expr::dynamic()`.

**Sinais trocados em lista**
`#[key]` ausente.

**`set` não existe no servidor**
Mutações só no vocabulário de expressões. Altere estado no servidor por
procedure/shard/banco e reflita via sinal inicial.

**Uma expressão não reage**
Ela não lê sinal (é estática). Leia `signal.get()` ou torne `.dynamic()`.

## Shards e procedures

**403/redirect inesperado**
Guard de página não roda; falta `require_user` dentro do endpoint.

**Argumento inválido derruba a página**
Valide no shard (retorne `bad_request`/view de erro) em vez de deixar panic.

**Requisições duplicadas ao digitar**
Comportamento normal: mudanças no mesmo tick coalescem; a mais nova aborta a
anterior. Se ainda for excessivo, faça debounce no cliente.

**Path do endpoint mudou**
Path gerado inclui linha/coluna. Fixe path explícito.

**Cliente recebe erro opaco de procedure**
`Err` vira status; o browser só vê falha. Use `Result` aninhado/JSON para erro
tratável.

## Cookies e sessão

**Cookie não persiste**
Sem `Path=/` (jar puro), ou `Secure` em HTTP, ou domínio/host diferente.

**`remove` não apaga**
Path/domain diferentes da escrita.

**Panic ao escrever cookie**
Streaming começou. Escreva antes de retornar a view/stream.

**Sessão inválida após deploy**
`Key::generate()` por processo. Persista a chave.

**Usuário continua logado após logout em outro device**
`stop` só encerra a sessão atual; revogue registros por usuário.

**Sessão expira antes do esperado**
`refresh` não persistiu `expires_at`, ou `lifetime` curto.

**Cookie adulterado aceito**
Usou jar puro. Use `private` para dados do cliente.

**`private_cookies` panic**
Falta `Key` em app context.

## Assets, Tailwind, fontes e ícones

**Classe não aparece**
Nome montado dinamicamente. Use literal/safelist.

**Fonte 404**
Não registrada (`.discover()`/`.font`) ou não bundleada.

**Muitos preloads**
Família com todos os pesos. Especifique `weight: [..]`.

**Ícone ausente**
Set não passou por `stage()` no build.

**SVG quebrado**
`IconData::new` valida/escapa; `unescaped_unchecked` exige SVG confiável.

**`ui add --overwrite` apagou edições**
Restore do git; revise antes de sobrescrever.

## Streaming e WebSocket

**Primeiro byte lento**
Barreira de irmãos. Isole o trecho lento em `suspense`/`live!`.

**`live!` panic "must emit"**
Emita ao menos uma vez; comece com placeholder.

**Só a última mensagem aparece**
`emit!` substitui o conteúdo; emita o estado completo.

**Trabalho duplicado após reconexão**
O corpo `live!` reinicia. Inicie jobs fora e observe o estado.

**429 em `connected`**
Mais de 64 renders conectados por socket. Reduza regiões ou aumente o limite.

**SSE não chega**
Proxy bufferizando; desligue buffering e envie `KeepAlive`.

**Erro de status não muda após streaming**
Headers já enviados. Decida status antes do primeiro byte.

## Segurança

**403 em POST legítimo**
`OriginPolicy`: envie `Origin`/`Sec-Fetch-Site` same-origin ou ajuste
`trust_origins`/`exempt_paths` (lembre: exempt ignora método).

**POST cross-origin passa**
Request sem `Origin`/`Sec-Fetch-Site` é aceito; proteja com autenticação/token.

**XSS com atributo**
Valor escapado não impede `javascript:` em URL, CSS/JS em contexto errado, ou nome
dinâmico `onclick`. Valide.

**Open redirect**
Helpers não checam origem; use allowlist de path local.

**CSP bloqueia runtime**
Script inline + `new Function`. Aceite `unsafe-inline`/`unsafe-eval` ou remova
runtime/streaming da rota.

**IP do cliente é `None`**
Configure `TrustedProxies`; sem isso, o header é ignorado.

## i18n e e-mail

**`locale(cx)` panic**
Nenhum `Locale` no contexto. Injete em `#[layer]` (não em layout).

**Tradução não troca**
`messages!`/arquivo não recarregado; reinicie `topcoat dev`/`l10n check`.

**Chave crua na tela**
Chave ausente/inválida. `topcoat l10n check`.

**E-mail não sai**
Sem transporte ou SMTP inválido; em dev use `FileTransport`/`MemoryTransport`.

**E-mail chega sem HTML**
Corpo `html:` montado com erro ou transporte convertendo; verifique `TextBody`.

## Performance

**Página inteira espera um componente**
Ver streaming (acima).

**N+1 de usuário**
Falta `#[memoize]` no lookup compartilhado.

**HTML enorme**
Listas não paginadas, ícones inline repetidos, atributos dinâmicos desnecessários.

**Servidor sobrecarregado por prefetch**
Muitos links ou `Viewport`; use `Intent`/`Never` na página cara.

## Como obter ajuda

1. Reproduza com `RUST_BACKTRACE=1` e leia o panic (arquivo:linha).
2. Reduza para uma página/rota mínima.
3. Confira features e `.discover()`.
4. Rode `topcoat fmt` (erros de macro) e `cargo clippy`.
5. Compare com `examples/<feature>` correspondente.
