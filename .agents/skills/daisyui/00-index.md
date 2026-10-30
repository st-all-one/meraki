# daisyUI 5 — Guia para Task Manager (TickTick)

## Sobre este guia

Baseado na documentação oficial do daisyUI (daisyui.com). Aborda implementação correta em **HTML puro** e **Rust (Leptos 0.8+)**.

## O que é daisyUI?

daisyUI é uma coleção de classes CSS semânticas construídas como plugin do **Tailwind CSS 4**. Não substitui o Tailwind — ele o estende com componentes nomeados (`btn`, `card`, `drawer`, `modal`, etc.) que encapsulam dezenas de utilitários em uma única classe.

### Filosofia

| Abordagem | Exemplo |
|---|---|
| Só Tailwind | `class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bgblue-700"` |
| daisyUI + Tailwind | `class="btn btn-primary"` |

daisyUI resolve: (a) velocidade de desenvolvimento, (b) consistência entre projetos, (c) temas múltiplos sem esforço.

### Compatibilidade

- **Framework-agnóstico** — funciona com qualquer tecnologia que use CSS
- **HTML puro**: via CDN ou Tailwind CLI
- **Rust/Leptos**: via npm + build tool (Trunk ou cargo-leptos)
- **Temas**: 30+ temas nativos, modo escuro automático, temas customizados

---

## Estrutura dos Arquivos

| Arquivo | Conteúdo |
|---|---|
| `01-installation.md` | Instalação: HTML (CDN + CLI) e Rust/Leptos |
| `02-color-system.md` | Sistema de cores, temas, customização |
| `03-components.md` | Componentes essenciais: botão, input, card, drawer, modal, etc. |
| `04-layout.md` | Layout 3 colunas estilo TickTick |
| `05-task-manager-html.md` | Implementação completa em HTML puro |
| `06-task-manager-leptos.md` | Implementação completa em Rust Leptos |
| `07-best-practices.md` | Boas práticas, troubleshooting, performance |
