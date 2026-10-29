# 12 — Segurança e operação

**Objetivo:** fechar as superfícies do app online e privado (mas sem allowlist de IP), com defesa em profundidade proporcional a 10 pessoas.

**Duração esperada:** 3–4 dias.

## 12.1 Modelo de ameaça

O servidor será exposto na web, atrás de Caddy/TLS, sem VPN. O que importa:

| Ameaça | Controle |
|---|---|
| Força bruta/login | Argon2id, erro genérico, rate limit por IP+conta, sem signup |
| Sequestro de sessão | token opaco, hash no banco, cookie `HttpOnly`/`Secure`/`SameSite=Lax`, TTL, logout revoga |
| CSRF | `Origin`/`Sec-Fetch-Site` + content-type de formulário; JSON também valida origem |
| XSS | Markdown sem HTML, CSP, escape de nomes/tags, sem SVG/HTML em anexo |
| IDOR | toda query com `tenant_id` + autorização por recurso |
| Path traversal | storage key gerada; sem nome de usuário no caminho; sem symlink |
| Upload malicioso | magic bytes, allowlist, re-encode, `nosniff`, `Content-Disposition` |
| Abuso/DoS | body limits, rate limit, SSE limits, Caddy timeouts, disco/quota |
| Vazamento de anexo | download sempre autenticado/autorizado; sem static/data dir |
| SSE aberto | auth no subscribe, rechecagem, `no-store`, limite de conexões |
| Cache PWA vaza dados | precache só assets/offline; HTML/auth/anexos/chat/canvas network-only |
| Push SSRF | endpoint `https`, host público, sem redirect/loopback/private IP; timeout |
| Push spoof/segredo | VAPID privada no env; payload sem token; URL same-origin |
| Canvas WS abusado | auth/Origin no handshake, participantes ≤10, frame/tamanho/mensagens por segundo, idle timeout |
| Segredo no repo | `.env` ignorado, secrets no systemd, auditoria |
| Supply chain | lockfile, versões pinadas, revisão de licenças |

## 12.2 Sessão e login

- Senha: Argon2id; mínimo 12; sem “reset por e-mail”.
- Login: hash de `email|ip` na chave de rate limit; 5/min; `Retry-After`.
- Erro sempre genérico; tempo de hash constante (decoy).
- Sessão: 7 dias; `last_seen_at` a cada 5 min; `revoked_at`; cookie `__Host-`? Se usar `__Host-`, exige `Secure`, `Path=/`, sem `Domain`; em dev HTTP não funciona. Use `meraki_session` com `Secure` em produção.
- Troca de senha revoga outras sessões.
- Admin desativa usuário → revoga sessões.

## 12.3 CSRF/origin

- `hono/csrf` cobre formulários (`multipart`, `urlencoded`, `text/plain`), mas **não JSON**.
- Para toda mutação (incluindo JSON do canvas):
  - validar `Sec-Fetch-Site` (`same-origin`/`none`) **ou** `Origin` igual a `APP_URL`;
  - se ausente/ inválido em request de browser, 403.
- Não aceitar cookie de sessão em API pública; não há API pública no MVP.
- Teste matriz:
  - POST form sem Origin → 403;
  - POST JSON do canvas cross-origin → 403;
  - GET/HEAD não mutam;
  - login cross-origin sem cookie de sessão é permitido (não há CSRF de login).

## 12.4 CSP e headers

Global:

```text
default-src 'self';
base-uri 'none';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
```

- `frame-ancestors 'none'` no shell; o frame do canvas usa `frame-ancestors 'self'`.
- Frame do canvas: `script-src 'self' 'unsafe-eval'`, `style-src 'self' 'unsafe-inline'`, `worker-src 'self' blob:`, `img-src 'self' data: blob:`, `connect-src 'self'`.
- Sem `unsafe-inline` no shell; sem CDN/fontes externas.
- HSTS em produção; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` sem câmera/microfone/geolocalização; COOP/CORP.
- Sem CORS `*`; app same-origin.

## 12.5 Markdown e anexos

- Markdown: `html:false`, links http/https/mailto, sem imagens Markdown; render servidor.
- Anexos: allowlist PNG/JPEG/PDF; magic bytes; re-encode de imagem; sem SVG/HTML/JS.
- Download: auth + vínculo; `inline` só imagem re-encodada; `attachment` para PDF/outros; `nosniff`.
- Nome original escapado; storage key hash.
- Quota/limite/rate limit; doctor/prune.
- Nunca servir `DATA_PATH` pelo Caddy.

## 12.6 Rate limits

Em memória, uma instância:

| Superfície | Limite inicial |
|---|---|
| Login | 5/min por hash(email+IP) |
| Chat | 30/min por usuário/canal |
| Upload | 10/min por usuário |
| Criação de tarefa | 60/min por usuário |
| SSE | 5 conexões/usuário; 20/canal |
| Busca | 60/min por usuário |

- 429 + `Retry-After`.
- Limpeza periódica de janelas.
- Sem fail-open quando o processo está saudável.

## 12.7 Logs e erros

- Request id; `error_id`; status; rota; ator (id), sem corpo.
- Redigir `authorization`, `cookie`, `password`, `email` (quando necessário), `body_md`, caminhos.
- Erro público: “Algo deu errado” + id; log privado com stack.
- 5xx não vaza SQL/caminho.
- Auditoria: login falho/sucesso, admin (criar/desativar/redefinir), arquivar/restaurar.

## 12.8 Backup e recuperação

- `meraki backup`: SQLite online backup + inventário de `attachments`; saída JSON.
- Backup diário 02:30 via systemd timer; retenção 14 dias; offsite opcional (rsync/restic) — sem S3 obrigatório.
- `meraki restore` testado mensalmente em diretório temporário; `doctor` valida migrations, integridade, FKs, órfãos.
- Teste de restore antes do deploy e após migração.
- Segredos/backups com permissão `0600`; nunca no Git.

## 12.9 PWA e push

- PWA/SW exigem HTTPS; `sw.js` com `Cache-Control: no-cache` e scope `/`.
- Precache só offline/assets; nunca HTML autenticado, `/attachments`, `/chat/events`, canvas.
- `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` em env; rotação documentada (invalida subscriptions).
- `push_subscriptions.endpoint` validado (https, host público, sem redirect); endpoint/p256dh/auth não vão para logs.
- Notificação sem segredo; `hide_details` para lock screen; click só same-origin.
- `push_deliveries` com backoff; 404/410 desativa subscription; limite por usuário.
- Service worker sem `eval`; sem importar scripts de terceiros.

## 12.10 Dependências e build

- `deno.lock` commitado; versões pinadas no `deno.json`/`frontend`.
- `deno task check` inclui gates; adicione gate de CSP e de imports proibidos.
- Revisar licenças (Somlos, Excalidraw MIT, HTMX, daisyUI).
- Sem pacote abandonado; remover imports não usados.
- `deno compile` com permissões mínimas:
  - `--allow-net` (servidor),
  - `--allow-env`,
  - `--allow-read`/`--allow-write` no `DATA_PATH` (se possível, path-scoped),
  - sem `--allow-run` (após remover ffmpeg/OTel).
- Se `--allow-run` for inevitável, justificar e remover no MVP.

## 12.11 Checklist de auditoria

- [ ] `rg` não encontra `unsafe-eval` fora do frame do canvas.
- [ ] `rg` não encontra `Access-Control-Allow-Origin: *`.
- [ ] Nenhum `static` aponta para `DATA_PATH`.
- [ ] Nenhuma rota de anexo sem auth.
- [ ] Nenhum `innerHTML` de Markdown não confiável.
- [ ] Nenhum upload sem magic bytes/limite.
- [ ] Nenhum JSON mutante sem origin check.
- [ ] Nenhum segredo em `.env.example`, docs, Git.
- [ ] Backup/restore executados.
- [ ] `deno task check` + testes de segurança passam.
- [ ] SW não cacheia HTML/auth/anexos/chat/canvas.
- [ ] VAPID privada não está no repo; endpoint de push validado.

## Aceite

- [ ] Matriz de CSRF (form/JSON/GET) passa.
- [ ] XSS de Markdown/anexo bloqueado.
- [ ] IDOR/path traversal/upload falso bloqueados.
- [ ] Rate limits e SSE limits funcionam.
- [ ] CSP do shell e do frame corretas.
- [ ] Backup/restore/doctor validados.
- [ ] Logs sem segredo/corpo/endpoint de push.
- [ ] PWA/push: cache, SSRF, permissão e click testados.

## Riscos

- **Sem allowlist de IP**: login é a única porta; rate limit e senha forte são obrigatórios.
- **CSP do canvas**: isolar; nunca relaxar o shell.
- **SSE e proxy**: buffering pode esconder eventos; testar no Caddy real.
- **Rate limit em memória**: reinício zera; suficiente para 10 pessoas, mas documente.
- **Push depende do navegador**: FCM/APNs/Mozilla; indisponibilidade não pode derrubar o app.
