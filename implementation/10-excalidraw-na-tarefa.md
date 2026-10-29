# 10 — Excalidraw colaborativo na demanda

**Objetivo:** qualquer usuário com acesso à demanda pode abrir/iniciar o canvas, e todos que estão vendo/interagindo entram na mesma sala identificada, em um modal full-screen, com persistência e export.

**Duração esperada:** 6–8 dias.

## 10.1 Escopo

- **Um canvas por demanda** (`whiteboards.demand_id unique`), criado on-demand por qualquer usuário com acesso.
- Botão **Canvas** na demanda; abre um **modal full-screen** que domina a viewport (desktop e mobile).
- Quem abre entra como **participante identificado** (nome, cargo/cor, cursor) e **pode editar imediatamente**; não há modo leitura obrigatório.
- Colaboração em tempo real via **WebSocket** (Hono/Deno), um processo, sem Redis.
- Persistência:
  - cena atual (`whiteboards.scene_json`);
  - snapshots append-only (`whiteboard_snapshots`);
  - sessões de participação (`whiteboard_sessions`);
  - imagens (`whiteboard_files`);
  - exports `.excalidraw`/PNG/SVG (`whiteboard_exports` + `demand_attachments kind=canvas_export`).
- Não há DMs; o canvas é da demanda, não um quadro branco solto.

## 10.2 UI/UX do modal

```text
┌──────────────────────────────────────────────────────────────┐
│ MER-42 · Canvas      participantes: Ana, Bruno, Caio   Salvo │
│ [Exportar] [Tela cheia] [Fechar X]                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  Excalidraw (100% × 100%)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Abre como `<dialog>` full-screen ou overlay `position: fixed; inset: 0; width: 100dvh`.
- Foco preso no modal; `Esc` fecha; ao fechar, retorna foco ao botão.
- Mobile: ocupa toda a tela; toolbar essencial; sem hover.
- Participantes: avatares/nomes no topo; cor por usuário; cursor/seleção identificados.
- “Salvando…/Salvo há X” discreto; conflito não existe no modo colaborativo (o servidor/persister reconcilia).
- Botão “Exportar” com `.excalidraw`, PNG, SVG.
- Se o WebSocket cair: banner “Reconectando…”; edição local continua; ao reconectar, reentra e reconcilia.
- Qualquer usuário com acesso à demanda pode abrir; não há botão “somente gerente”.

## 10.3 Build do frontend

`frontend/whiteboard/`:

```text
main.tsx
styles.css
```

Dependências pinadas:

```text
@excalidraw/excalidraw@0.18.0
react@19
react-dom@19
```

Build com esbuild via `scripts/build-whiteboard.ts` (sem Vite/Node runtime):

```bash
deno run --allow-read --allow-write --allow-run npm:esbuild@0.25 \
  frontend/whiteboard/main.tsx \
  --bundle --format=esm --minify --sourcemap \
  --outfile=static/whiteboard/whiteboard.js
```

- Copie o CSS e as fontes de `@excalidraw/excalidraw/dist/prod/fonts` para `static/vendor/excalidraw/fonts`.
- Defina `window.EXCALIDRAW_ASSET_PATH = "/static/vendor/excalidraw/"`.
- O bundle só carrega no frame do canvas, não no shell.

## 10.4 CSP e isolamento

O Excalidraw usa `new Function`/workers/estilos inline. Não relaxe a CSP global.

- Modal contém um **iframe same-origin** `/items/:id/canvas/frame` em 100% × 100%.
- Headers do frame:
  - `script-src 'self' 'unsafe-eval'`;
  - `style-src 'self' 'unsafe-inline'`;
  - `worker-src 'self' blob:`;
  - `img-src 'self' data: blob:`;
  - `connect-src 'self'`;
  - `frame-ancestors 'self'`.
- Shell global: `script-src 'self'`, sem `unsafe-eval`; `frame-src 'self'`.
- O iframe tem sessão/cookies e é same-origin; autenticação normal.
- Sem fontes/CDN/Excalidraw+; esconder UI promocional.

## 10.5 Bootstrap e WebSocket

Rotas:

```text
POST /items/:id/canvas                cria canvas se não existir (qualquer acesso)
GET  /items/:id/canvas/frame          HTML do frame
GET  /api/items/:id/canvas            { scene, version, files, participants }
POST /api/items/:id/canvas/files      upload de imagem
POST /api/items/:id/canvas/export     { format: excalidraw|png|svg }
WS   /items/:id/canvas/ws             colaboração
```

Todas:

- sessão + acesso à demanda (tarefa ou issue);
- CSRF/origin em POST/JSON (não depender só de `hono/csrf`);
- `no-store`;
- limites: cena ≤5 MB, frame ≤256 KB, arquivo ≤10 MB, mensagens/s;
- `tenant_id`.

### Handshake WebSocket

1. Validar cookie de sessão e `Origin`/`Sec-Fetch-Site`.
2. Carregar a demanda com `tenant_id`; negar se arquivada/sem acesso.
3. Aceitar; gerar `participantId`, cor e nome; registrar em memória.
4. Enviar `scene-state` (última cena + versão + participantes).
5. Broadcast `participant-joined` para os demais.
6. Fechar conexões ociosas após 30 min sem mensagem; heartbeat 20 s.

### Protocolo

```text
client -> server:
  { type: "scene-update", elements: [...], appState?: {...} }
  { type: "cursor", x, y, tool? }
  { type: "snapshot", scene: {...}, version }
  { type: "ping" }

server -> client:
  { type: "scene-state", scene, version, participants }
  { type: "scene-update", elements, from }
  { type: "cursor", id, name, color, x, y }
  { type: "participant-joined" | "participant-left", participant }
  { type: "saved", version, at }
  { type: "error", message }
```

- O servidor **não descriptografa** nada; a cena é texto JSON normal, protegida por TLS e autorização. Não usar E2E no MVP.
- Relay para todos os participantes da sala, exceto o remetente.
- `reconcileElements` no cliente; `CaptureUpdateAction.NEVER` para não sujar undo.
- Throttle de updates ~30–60 ms; cursor ~30 fps; servidor limita mensagens/s e tamanho.
- O servidor valida `type`/tamanho; não executa conteúdo.

### Persistência

- O servidor escolhe o **primeiro participante** como `persister`; envia `persister: true` no `scene-state`.
- O persister envia `{type:"snapshot", scene, version}` a cada 5 s se houve mudança e ao sair.
- Servidor grava `whiteboards.scene_json` + `scene_version` e insere `whiteboard_snapshots` (append-only).
- Se o persister sair, promove o próximo participante.
- Se ninguém estiver conectado, a última cena permanece; ao abrir sozinho, o participante é persister.
- Snapshots: no máximo 1 por 5 s + manual/export/último; retenção configurável para não crescer sem limite (ex.: manter todos os manuais/exports e 1 por minuto de autosave).
- `whiteboard_sessions`: insert no join, update `left_at` no leave/abort; base para análise.

## 10.6 Imagens no canvas

- `onChange` entrega `files` (dataURLs); para cada `fileId` novo:
  1. POST `/canvas/files` (multipart);
  2. validação/re-encode da fase 07;
  3. `whiteboard_files` mapeia `fileId → attachment`;
  4. broadcast `file-added` (metadados) para os peers;
  5. peers baixam `/attachments/:id` e chamam `excalidrawAPI.addFiles`.
- Não enviar dataURL no WebSocket; só id/URL.
- Limite 10 MB/imagem; 50 MB/canvas.
- Cena sem dataURL; se o cliente enviar cena com dataURL, rejeitar/limpar.

## 10.7 Exportação/artefato

- `.excalidraw`: estrutura serializada; upload como `Attachment`; `whiteboard_exports(format='excalidraw')` e `demand_attachments(kind='canvas_export')`.
- PNG/SVG: `exportToBlob`/`exportToSvg`; mesmos vínculos.
- Aba **Anexos** da demanda mostra “Canvas interativo” + downloads.
- Export permitido a todos com acesso; nome `MER-42-canvas.excalidraw`.
- Snapshot/export não bloqueia a edição.

## 10.8 Segurança

- Acesso derivado da demanda; não há URL pública do canvas.
- Handshake WS valida sessão + Origin; cada mensagem é associada ao participante da conexão.
- Limites: conexões/usuário, participantes/sala (10), frame, cena, mensagens/s.
- CSP do frame isolada; shell estrita.
- Sem scripts/HTML na cena; arquivos validados.
- Logs sem cena/conteúdo.
- WebSocket em um processo; múltiplas instâncias exigiriam pub/sub (não no MVP).

## 10.9 Testes

- Duas sessões: ambas editam; veem mudanças e cursores; nomes identificados.
- Qualquer usuário (admin/manager/developer) com acesso abre e edita; sem permissão → 403.
- Criar canvas ao abrir; segundo usuário entra na mesma cena.
- Persister salva; se sair, outro assume; recarregar mantém.
- Snapshot append-only; sessão registrada.
- Upload de imagem; peer recebe; recarregar mantém.
- Export `.excalidraw`/PNG/SVG; anexo; download auth.
- CSP do shell estrita; frame com allowances; sem domínio externo.
- Reconexão; sem perda silenciosa; limite de mensagens.
- Modal full-screen, foco, `Esc`, mobile.

## Aceite

- [ ] Canvas por demanda criado por qualquer usuário com acesso.
- [ ] Modal full-screen; todos veem e interagem identificados.
- [ ] WebSocket relay + presença + cursores.
- [ ] Snapshot/sessão persistidos; recarregar mantém.
- [ ] Imagens e exports como anexos.
- [ ] CSP global não relaxada.
- [ ] Nenhum Redis/S3/Firebase.

## Riscos

- **Colaboração real é o maior escopo**: comece com relay + reconciliação; não adicione CRDT/undo distribuído.
- **Persister**: quedas promovem outro; snapshots podem perder até 5 s; aceitável.
- **CSP**: iframe isola; se falhar, rota dedicada, nunca relaxar o shell.
- **Cena grande**: limite 5 MB; arquivos separados.
- **Muitos snapshots**: retenção; manter manuais/exports e amostragem de autosave.
- **WebSocket e proxy**: Caddy precisa encaminhar upgrade; testar no deploy (fase 14).
