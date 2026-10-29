# Serviços: e-mail e localização

> Duas features opcionais que seguem o mesmo padrão do resto: configurar no router
> e usar via `cx`/view. E-mail usa um transporte; l10n usa `Locale` no contexto.

## 1. E-mail

Feature: `mail` (SMTP com `mail-smtp`).

```rust
use topcoat::{
    mail::{MailConfig, RouterBuilderMailExt, SmtpTransport, send},
    Result,
    context::Cx,
    router::route,
    view::view,
};

let router = module_router!()
    .mail(MailConfig::builder()
        .transport(SmtpTransport::from_url("smtp://user:pass@localhost:2525")?.build())
        .build())
    .build();
```

```rust
use topcoat::mail::mail;

#[route(POST)]
async fn contact(cx: &Cx) -> Result<&'static str> {
    let msg = mail! {
        from: "site@example.com",
        to: "team@example.com",
        subject: "Novo contato",
        html: { cx => view! {
            <p>"Nome: " (name)</p>
        }}
    }?;
    send(cx, msg).await?;
    Ok("enviado")
}
```

Anexos e texto explícito:

```rust
use topcoat::mail::{Attachment, mail};

let msg = mail! {
    from: "site@example.com",
    to: "team@example.com",
    subject: "Fatura",
    text: "Segue a fatura.",
    html: { <p>"Segue a fatura."</p> },
    attachments: [
        Attachment::new("invoice.pdf", "application/pdf", pdf_bytes),
    ],
}?;
```

`Attachment::inline(cid, content_type, bytes)` serve imagens via `src="cid:…"`.
O texto puro é derivado do HTML por default; `text:`/`TextBody` sobrescreve.

### API

| Item | Uso |
|---|---|
| `mail! { … }` | constrói `Result<Mail>` validando campos |
| `send(cx, mail).await` | entrega pelo transporte; devolve `Receipt` |
| `MailConfig::builder().transport(..).build()` | configuração |
| `SmtpTransport::{relay,starttls,from_url}` | SMTP |
| `FileTransport` | grava `.eml` (dev/teste) |
| `MemoryTransport` | captura em memória (testes) |
| `Attachment::{new,inline}` | anexos |
| `TextBody::{FromHtml,Text,None}` | alternativa texto puro |

- O corpo `html:` é uma `view!`; interpolações são escapadas.
- `Receipt` contém `Message-ID`: significa que o transporte aceitou, **não** que
  foi entregue.
- `send` é `await` no handler: não há fila/retry/idempotência embutidos.
- Texto puro derivado do HTML é best-effort, não sanitizador.
- Layouts/headers customizados são responsabilidade do chamador.
- Para produção: SMTP com TLS, timeouts, bounce/complaint handling e, se o envio
  for lento, uma fila própria (fora do request).

### Testes

```rust
let transport = MemoryTransport::new();
let config = MailConfig::builder().transport(transport.clone()).build();
// …
let sent = transport.sent();          // inspecione assunto/destinatários
```

## 2. Localização (l10n)

Features: `l10n`, `l10n-fluent` (mensagens), `l10n-number`, `l10n-datetime`.

### Modelo

- `Locale` é um valor no **request context**.
- Você escolhe o locale por request (header, cookie, path, sessão).
- Traduções vêm de arquivos Fluent (`.ftl`) carregados por `messages!`.

### Escolher o locale

```rust
use topcoat::{
    Result,
    context::Cx,
    l10n::{Locale, accept_language, locale, negotiate},
    router::{Body, Next, layer, response::Response},
};

const AVAILABLE: &[&str] = &["pt-BR", "en"];

#[layer]
async fn set_locale(cx: &Cx, body: Body, next: Next<'_>) -> Result<Response> {
    let requested = accept_language(cx);
    let chosen: Locale = negotiate(requested, AVAILABLE);
    next.run(&cx.with(chosen), body).await
}
```

- `locale!( "pt-BR" )`/`"pt-BR".parse()` para constantes.
- `locale(cx)` panic sem `Locale`; `try_locale(cx)` devolve `Option`.
- **Criar o locale num layout não alcança a página**; use uma `#[layer]`.
- `negotiate` não aceita `*` (descartado) e pode escolher variante regional
  inesperada (`en-AU` → `en-US`).
- Alternativa com URL: `module_param!(locale: Locale)` e rejeite valores não
  suportados.

### Usar o locale

```rust
use topcoat::l10n::locale;
use topcoat::view::view;

view! {
    <html lang=(locale(cx).id()) dir=(locale(cx).id().direction())>
        <body>
            <p>"Idioma: " (locale(cx).id())</p>
        </body>
    </html>
}
```

`Locale` implementa `Serialize`/`Deserialize` como texto — pode ir em cookie/form.

### Fluent

```rust
use topcoat::l10n::{messages, t};

messages!("./l10n/{locale}.ftl");

// em qualquer lugar com cx/locale
let title = t!("page.title");
let greeting = t!("greeting", name: user.name.clone());
```

- `t!` aceita argumentos (`t!("greeting", name: user.name.clone())`); `t::locales()`
  lista idiomas carregados e `Translation::resolve`/`resolve_in` resolvem sem panic
  (placeholder quando falta).
- `t!` não valida chaves/args em compile-time; rode `topcoat l10n check`.
- Um módulo só pode chamar `messages!` **uma vez**.
- Arquivos `.ftl` novos não disparam rebuild do Cargo; `topcoat dev`/`l10n check`
  disparam.
- Hífen em IDs é interpretado como subtração pelo rustfmt; use string literal ou
  snake_case.
- Sem `Locale`, `Translation::resolve` mostra placeholder (`chave(args)`), não panic.
- Fallback regional é diferente de fallback entre línguas; documente a política.

### Números e datas

```rust
use topcoat::l10n::Number;
use topcoat::view::view;

view! {
    <span>$(Number::new(1234.5).min_fraction_digits(2))</span>
}
```

- `Number` segue `Intl.NumberFormat`; sem moeda/percentual.
- `DateTime`/`DateTimeStyle` com feature `l10n-datetime`; `jiff` opcional.
- Valores formatados usam o locale do contexto.

### Checklist de i18n

- [ ] Locale resolvido em `#[layer]`, nunca em layout.
- [ ] `<html lang>` e `dir` definidos.
- [ ] Todo texto de UI em Fluent; nada hardcoded em componentes.
- [ ] `topcoat l10n check` no CI.
- [ ] Números/datas via `Number`/`DateTime`, não `format!`.
- [ ] Fallback e `negotiate` testados com `*`, região e idioma desconhecido.
- [ ] Mensagens de erro de formulário também traduzidas.

## 3. Armadilhas

| Sintoma | Causa | Correção |
|---|---|---|
| `send` falha em dev | sem transporte configurado | `FileTransport`/`MemoryTransport` |
| e-mail "enviado" mas não chega | `Receipt` ≠ entrega | configure SMTP real e monitore |
| corpo sem texto puro | derivado best-effort | forneça `text:` explícito |
| locale some na página | definido em layout | mova para `layer` |
| tradução crua na tela | chave ausente no `.ftl` | `l10n check` |
| `messages!` duplicado | dois no mesmo módulo | consolide |
| número com ponto errado | formatou com `format!` | use `Number` |
