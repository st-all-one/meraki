# ADR-019 — i18n de UI no kernel; conteúdo traduzido por módulo

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Incorporação seletiva do public-v7 |
| **Relacionadas** | ADR-008, ADR-011, ADR-016, ADR-018 |

## Contexto

O public-v7 nasce com quatro locales (`pt_BR`, `en`, `es`, `fr`), `__()` nativo e conteúdo em
`jsonb` por locale. O esqueleto tinha todas as strings em português hardcoded nas views Eta, sem
qualquer noção de locale. Sem uma decisão, cada módulo inventaria seu próprio mecanismo e o
`<html lang>` continuaria fixo em `pt-BR`.

Também era necessário resolver o impacto no cache HTTP: o corpo varia por locale, e um cache
compartilhado não pode servir inglês para quem pediu francês.

## Decisão

1. **UI no kernel** (`src/kernel/i18n/`):
   - locales canônicos `pt-BR`, `en`, `es`, `fr`; `pt-BR` é o default e o fallback.
   - dicionários TS (`locales/*.ts`) com chaves planas; `t(chave, params)` interpola `{name}` e
     nunca injeta HTML (Eta mantém autoescape).
   - precedência: `?lang=` explícito → cookie `locale` → `Accept-Language` →
     `brand.defaultLocale` (06) → `pt-BR`.
   - `?lang=` válido persiste o cookie (`SameSite=Lax`, 1 ano; `Secure` em produção); não muda a URL.
   - `localeMiddleware` roda antes do cache/rotas e publica `c.get("locale")`.

2. **Views recebem `it.t` e `it.locale`** pelo helper `render`; `renderFragment` aceita o locale
   explicitamente. O `<html lang>` vem do locale resolvido. Títulos/descrições podem ser chave i18n
   ou texto literal (o helper só traduz quando a chave existe).

3. **Cache**: `httpCache` emite `Vary: Accept-Encoding, Accept-Language, Cookie`. O locale pode vir
   de header/cookie, então o cache compartilhado não pode misturar respostas. Promover o locale para
   a URL (prefixo) no futuro permite remover `Cookie` do `Vary`.

4. **Conteúdo de domínio é do módulo, não do kernel.** O kernel não conhece JSONB de conteúdo nem
   queries por locale; cada módulo decide o formato (ex.: coluna `content` TEXT/JSON com mapa
   `{locale: valor}` validado por Zod) e usa `it.t` apenas para a moldura da UI.

5. **Sem dependência nova.** Nada de ICU/biblioteca de i18n: chaves planas, interpolação simples e
   fallback cobrem a UI; pluralização complexa entra por ADR quando houver caso real.

## Consequências

**Positivas**

- Todo módulo novo herda `<html lang>`, troca de idioma e fallback sem código próprio.
- O texto não sai do HTML por concatenação; o autoescape continua sendo o gate de XSS.
- O cache deixa explícita a variação por idioma.

**Custos / negativas**

- `Vary: Cookie` reduz o cache compartilhado de HTML público para quem tem o cookie de locale.
- Chaves são strings; um typo retorna a própria chave (visível em teste, não quebra a página).
- Conteúdo traduzido por módulo ainda precisa de modelagem e validação por módulo.
- Sem pluralização/ordenação por locale além do texto simples.

## Verificação

- `tests/unit/i18n_test.ts`: normalização, precedência, interpolação, paridade de chaves.
- Integração: `Accept-Language` (en), `?lang=fr` com `Set-Cookie`, espanhol no login e `Vary`.
- `deno task check` e `deno task test` verdes.
