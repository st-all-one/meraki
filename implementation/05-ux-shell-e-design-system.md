# 05 — UX shell, design system e responsividade

**Objetivo:** construir o shell e os componentes base com UX primeiro, mobile-first e desktop denso, antes de encher as telas de features.

**Duração esperada:** 2–3 dias.

## 5.1 Mapa de telas

| Rota | Tela | Desktop | Mobile |
|---|---|---|---|
| `/login` | Login | coluna central | coluna |
| `/demands` | Índice de demandas | tabela + inspector | cards |
| `/my` | Minhas tarefas | lista | lista full |
| `/projects` | Pastas | grid/tabela | cards |
| `/projects/:key` | Lista da pasta | tabela + inspector | cards |
| `/projects/:key/board` | Quadro | colunas lado a lado | colunas com scroll horizontal |
| `/projects/:key/calendar` | Calendário | mês + barras início→fim | mês compacto + agenda |
| `/items/:id` | Detalhe da demanda | inspector 520 px ou página | full-screen |
| `/chat` | Chat Geral | lista de canais + mensagens | canal full |
| `/chat/:id` | Canal | mensagens + composer | full |
| `/search` | Busca | resultados em lista | lista |
| `/admin/users` | Usuários | tabela | cards |
| `/admin/tags` | Tags | tabela + renomear/arquivar | cards |
| `/account/password` | Conta | formulário | formulário |

Regra: **toda tela tem URL própria**. O inspector desktop não pode ser a única forma de abrir uma demanda.

## 5.2 Shell

### Desktop (`min-width: 1024px`)

```text
┌──────────────┬───────────────────────────────────────────────┐
│ sidebar 248  │ topbar: pasta | busca | usuário              │
│              ├───────────────────────────────────────────────┤
│ Demandas     │                                               │
│ Minhas       │  main: index/lista/board/calendário/chat      │
│ Pastas       │                                               │
│ Chat         │  inspector 520 px (quando demanda aberta)     │
│ Admin        │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

- Sidebar fixa, sem colapsar no MVP.
- Topbar com breadcrumb, busca (`/`), botão “Nova issue” (`c`) para todos e “Nova tarefa” no menu para admin/manager.
- Inspector de demanda: 480–560 px, scroll próprio, fecha com `Esc`; em rota direta, vira página.
- Chat: lista de canais à esquerda (240 px) + mensagens; no mobile, uma tela por vez.

### Mobile (`< 640px`)

- Topbar compacta com título e menu “Mais”.
- Bottom nav: **Demandas**, **Pastas**, **Chat**, **Mais**; Minhas tarefas no menu “Mais”.
- Demanda: full-screen, abas no topo; botão voltar.
- Board: colunas com scroll horizontal; card inteiro tocável; menu “Mover para”.
- Chat: canal full; composer fixo acima do teclado; preview em aba.
- Canvas: full-screen; toolbar essencial; sem hover.

### Tablet (`640–1023px`)

- Sidebar vira rail de ícones ou drawer; main ocupa a tela; inspector overlay.
- Não criar um terceiro layout complexo; usar os mesmos componentes com CSS.

## 5.3 Design tokens

Em `src/layout/assets/css/app.css` (Tailwind + daisyUI já existentes):

- Cores por variáveis: `--bg`, `--surface`, `--border`, `--muted`, `--fg`, `--accent`, `--success`, `--warning`, `--danger`.
- Status com texto + cor; nunca só cor.
- Tipografia: uma família local; tamanhos 14/16/20/24; linha 1.45.
- Espaço: múltiplos de 4; densidade desktop 32–36 px de linha; mobile 44 px de toque.
- Radius: 8 px; sombra só em overlay/inspector.
- Dark mode por `prefers-color-scheme`; sem toggle no MVP.

Componentes base:

```text
AppShell, Sidebar, Topbar, Breadcrumb, PageHeader
Button, IconButton, LinkButton, Menu, Dialog(confirm)
Input, Textarea, Select, Checkbox, FieldError, FormActions
Badge(kind/status/blocked), PriorityBadge(Q1–Q4/manual), DateRange, TagChips, TagInput, Avatar, DemandType
Table, Card, EmptyState, Skeleton, Toast
MarkdownEditor, MarkdownView, AttachmentList, ChatMessage, CanvasModal
```

Crie partials/macros reutilizáveis; não duplique markup de campo/erro.

## 5.4 Interação

- Índice/lista: selects inline para status/responsável; PO select só manager/admin; edição de início/fim/importância/tags no inspector, sem modal.
- Board: drag só muda status; menu “Mover para…” em cada card; ordem derivada; prioridade e tags no card.
- Filtros: form GET; URL contém `kind`, `status`, `assignee`, `po`, `tag` (repetível), `priority`, `ready`, `q`, `page`; sem estado JS.
- Prioridade: somente leitura para developer; manager/admin tem menu de override + “Voltar ao automático”. Nunca editar o quadrante por drag.
- Tags: input com autocomplete e chips; criar tag inexistente; máximo 8; filtro por chips.
- HTMX:
  - `hx-get` para partials; `hx-post` para mutações; `hx-target` no container da linha/coluna;
  - `hx-push-url` quando a ação muda a URL;
  - `hx-indicator` para loading; `aria-live` para resultado.
- Erros: resposta HTML do partial com erro + foco no campo; 409 recarrega a linha e avisa.
- Otimismo: só no drag do board; se falhar, reverte com toast.
- Atalhos: `/` busca, `c` nova issue (manager/admin abre menu para tarefa), `Esc` fecha inspector/modal; nenhum atalho de duas teclas.

## 5.5 Acessibilidade

- HTML semântico: `<table>` para lista desktop, `<nav>`, `<main>`, `<button>` real.
- Foco visível em todos os controles; skip link.
- Menu de movimento por teclado; drag nunca é a única ação.
- Contraste AA; labels explícitos; erros associados via `aria-describedby`.
- `aria-current="page"` na navegação; `aria-live="polite"` para salvar/erro.
- Não depender de hover para revelar ações; mobile first.

## 5.6 Performance e assets

- Sem CDN, sem fonte externa, sem avatar externo.
- CSS único construído no build; JS de interação mínimo.
- Chat (SSE) e canvas (Excalidraw) carregam só nas rotas que usam.
- Imagens de anexo com `loading="lazy"` e rota autenticada; sem `<img>` de domínio externo.
- Meta: primeira tela < 300 ms local; lista de 2.000 itens paginada em 50.

## 5.7 Passos

1. Remova o shell antigo de CMS e deixe `AppShell` com sidebar/topbar vazios.
2. Implemente tokens e componentes base; uma página de exemplo `/app`.
3. Monte o layout mobile-first; valide em 375, 768, 1440.
4. Adicione navegação por demandas/pastas e rotas placeholder.
5. Adicione busca no topbar e atalhos.
6. Adicione empty/error/loading e confirm dialog.
7. Verifique teclado/foco em todas as telas vazias.

## Aceite

- [ ] Shell funciona em 375, 768 e 1440 sem overflow.
- [ ] Bottom nav mobile e sidebar desktop navegam para as rotas corretas.
- [ ] Nenhuma ação depende de hover.
- [ ] `Esc` fecha inspector/modal; foco retorna ao gatilho.
- [ ] Tabela desktop e cards mobile usam o mesmo dado (tipo tarefa/issue).
- [ ] Nenhum recurso externo no Network.
- [ ] Contraste e foco visível conferidos.

## Riscos

- **Layout desktop “apertado”**: priorize linha de 36 px e inspector, não sidebar de 300 px.
- **Duplicar markup mobile/desktop**: use o mesmo partial e CSS; evite duas árvores.
- **HTMX + estado local**: não guarde filtros em JS; URL é a fonte.
- **Inspector como única rota**: quebra link compartilhado e mobile; mantenha `/items/:id`.
