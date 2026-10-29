# 08 — Markdown e conversas

**Objetivo:** ter um único sistema de mensagens ricas para conversa de demanda e chat, com Markdown seguro, preview ao vivo, anexos e edição.

**Duração esperada:** 3–4 dias.

## 8.1 Decisão de modelo

Não haverá tabela `comments`. A conversa de uma demanda é um **canal `chat` com `scope='demand'`**:

- `chat_channels`: `general`, `project`, `demand`;
- `chat_messages`: `body_md` (fonte da verdade), renderizado no servidor;
- `chat_message_attachments`: anexos;
- `chat_reads`: não lidos (fase 09).

Isso permite reutilizar editor, renderer, anexos, SSE, permissões e export em todos os lugares.

## 8.2 Subconjunto Markdown

Use `markdown-it` (ou equivalente) com configuração compartilhada entre servidor e preview:

```ts
{
  html: false,        // HTML cru aparece como texto, nunca é renderizado
  linkify: true,
  breaks: true,       // quebra de linha vira <br> no chat
  typographer: false
}
```

Permitir:

- parágrafos, quebras, headings 1–4, listas ordenadas/não ordenadas;
- negrito, itálico, riscado, código inline, blocos de código;
- blockquote, hr, tabelas;
- links `http://`, `https://`, `mailto:`; texto linkado é escapado;
- listas de tarefas com checkbox (opcional).

Proibir/ignorar:

- **imagens Markdown** (`![...]`) — imagens entram como anexo;
- HTML cru (`<script>`, `<iframe>`, `<img>`), mesmo “inofensivo”;
- links `javascript:`, `data:`, `vbscript:`, `file:`;
- iframes, vídeos, estilos, classes controladas pelo usuário.

Renderer customizado para links:

```ts
link_open: (tokens, idx) => {
  const href = tokens[idx].attrGet("href") ?? "";
  if (!/^(https?:|mailto:)/i.test(href)) {
    tokens[idx].attrSet("href", "#");
    tokens[idx].attrSet("data-invalid-link", "1");
  } else {
    tokens[idx].attrSet("rel", "nofollow noopener noreferrer");
  }
}
```

Não usar `dangerouslySetInnerHTML` em conteúdo não renderizado pelo servidor; no preview, o HTML vem do mesmo pipeline/config e é sanitizado pela ausência de HTML cru.

## 8.3 Composer

Componente `MarkdownEditor`:

- `<textarea>` com toolbar: negrito, itálico, código, link, lista, citação, tabela;
- preview ao vivo com debounce de 150 ms;
- desktop: lado a lado (editor 50%, preview 50%);
- mobile: abas **Escrever / Prévia**; toolbar acima do teclado;
- `Ctrl/Cmd+Enter` envia; `Esc` fecha preview/limpa foco;
- contador de caracteres (limite 10.000);
- colar imagem/drag-and-drop → upload de anexo (fase 07);
- anexos aparecem como chips removíveis antes de enviar;
- não converter para HTML no cliente nem salvar HTML; salvar `body_md`.

O preview e o render final precisam usar a mesma versão/config do Markdown. Se o bundle do cliente não puder compartilhar o módulo do servidor, teste os dois com a mesma matriz de casos.

## 8.4 Conversa da demanda

- Ao abrir a aba **Conversa**, criar o canal `demand` se não existir (idempotente, unique por `demand_id`).
- Lista em ordem cronológica; mensagens do autor atual à direita no desktop? Não: use lista vertical simples, autor + avatar + hora; chat não é mensageiro pessoal.
- Cada mensagem: autor, horário, Markdown renderizado, anexos, “editado”.
- Editar/arquivar apenas a própria mensagem; manager/admin qualquer (matriz).
- Mensagem arquivada mostra “removida” sem apagar o registro; anexos ficam até prune.
- Histórico da demanda é separado (aba Histórico); não misturar eventos de sistema na conversa.
- Deletar/arquivar demanda não apaga mensagens; o canal é arquivado junto.

Rotas:

```text
GET  /items/:id/conversation            partial da lista + composer
POST /items/:id/messages                multipart (body_md + attachments)
POST /messages/:id/edit                 editar body_md
POST /messages/:id/archive              soft archive
GET  /messages/:id                       partial de uma mensagem (edição)
```

Toda ação: sessão → CSRF → autorização pela demanda/canal → validação → transação.

## 8.5 Renderização e cache

- Não armazenar HTML no banco; renderizar no servidor na leitura e no evento SSE.
- Renderização é pura e determinística; se o renderer mudar, mensagens antigas refletem a nova versão.
- Para listas longas, paginar 50 mensagens; “carregar anteriores” no topo.
- Não usar cache HTTP para conteúdo autenticado (`no-store`).

## 8.6 Anexos

- Reutilizar o upload da fase 07.
- Limite: 3 anexos por mensagem; 10 MiB cada.
- Preview: imagens re-encodadas inline; PDF como chip/download.
- Se o upload falhar, a mensagem **não** é criada; mostrar erro por arquivo.
- O corpo pode ser vazio se houver anexo? Sim, para “olha isso”; validar `body_md` vazio + anexo > 0.

## 8.7 Segurança

- `html: false` + links allowlist; testar payloads:
  - `<script>alert(1)</script>`;
  - link com esquema `javascript:` disfarçado de texto;
  - `![x](https://evil/x.png)` (deve virar texto/ser ignorado);
  - `<img src=x onerror=...>`;
  - link `data:text/html,...`.
- Escapar `original_name`; não interpolar Markdown em atributo HTML.
- Não permitir CSS/estilo no Markdown.
- CSP estrita; preview não usa `unsafe-inline`.
- Limite de 10.000 caracteres e de anexos.
- Logs não guardam corpo.

## 8.8 UX

- Conversa da demanda no inspector/página; não abrir modal.
- Mensagens agrupadas por dia; horário relativo (“há 5 min”).
- “Nova mensagem” com atalho; scroll para a última após envio.
- Edição inline com “Salvar/Cancelar”; preservar markdown.
- Mobile: composer fixo acima do teclado; preview em aba; anexos via botão.
- Empty state: “Comece a conversa. Use Markdown para código, listas e links.”

## 8.9 Testes

- Markdown básico e tabelas; code fences; links.
- XSS: HTML cru, javascript/data, imagem externa, atributo.
- Preview e render final produzem o mesmo HTML seguro.
- Editar/arquivar própria mensagem; permissão alheia.
- Mensagem com anexo; falha de upload não cria mensagem.
- Paginação; ordem; horário.
- Mobile tabs; toolbar insere marcação correta.

## Aceite

- [ ] Conversa de demanda cria/reutiliza canal `demand`.
- [ ] Markdown é salvo cru e renderizado com segurança.
- [ ] Preview ao vivo no desktop e mobile.
- [ ] Anexos no composer e na mensagem.
- [ ] Editar/arquivar com permissão.
- [ ] Nenhum HTML cru/imagem Markdown executável.
- [ ] `no-store` em conteúdo autenticado.

## Riscos

- **Dois renderers divergentes**: compartilhe config ou teste matriz; não confie no preview como sanitização.
- **Markdown “rico demais”**: sem imagens, HTML, iframes, matemática ou diagramas no MVP; anexos cobrem imagem.
- **Mensagens longas**: limite e paginação; não carregar histórico inteiro.
- **Edição sem histórico**: se o time precisar de auditoria de mensagem, adicionar `chat_message_edits`; não no MVP.
