# Live Regions — Conteúdo Dinâmico e Atualizações

## O Problema

Conteúdo que atualiza sem recarregar a página (timers, notificações, resultados de busca, chat) é invisível para leitores de tela sem ARIA live regions.

## Atributos de Live Region

### aria-live (obrigatório para live regions genéricas)

| Valor | Comportamento | Uso |
|---|---|---|
| `off` | Não anuncia automaticamente (padrão) | Conteúdo que não é mudança dinâmica |
| `polite` | Anuncia quando usuário estiver ocioso | Atualizações de informação geral |
| `assertive` | Anuncia imediatamente, interrompendo | Alertas críticos; usar com moderação |

### aria-atomic

| Valor | Comportamento |
|---|---|
| `false` (padrão) | Anuncia apenas parte que mudou |
| `true` | Anuncia a live region inteira a cada mudança |

### aria-relevant

| Valor | Tipos de mudança a anunciar | Padrão |
|---|---|---|
| `additions text` | Elementos adicionados + texto alterado | **Padrão** |
| `additions` | Só elementos adicionados | — |
| `removals` | Elementos removidos | — |
| `all` | additions + removals + text | — |

### aria-busy

`aria-busy="true"` → muda para `"false"` quando carregamento completo. AT espera.

## Funções com Live Region Implícita

| Role | Comportamento | Recomendação |
|---|---|---|
| `alert` | `assertive`, atômico | Anuncia conteúdo dinâmico e estático. NÃO anunciar conteúdo pré-existente |
| `status` | `polite` | Adicionar redundante `aria-live="polite"` para compatibilidade |
| `log` | `polite` | Adicionar redundante `aria-live="polite"` |
| `marquee` | `off` | Rolagem contínua |
| `timer` | `off` | Relógio/cronômetro |
| `progressbar` | — | Anuncia via `aria-valuenow` |

## Padrão de Implementação

### 1. Live Region Básica (aria-live)
```html
<div aria-live="polite" id="resultados">
  <!-- Conteúdo inserido via JS -->
</div>
```
```js
function atualizarResultados(novosResultados) {
  const regiao = document.getElementById('resultados');
  regiao.textContent = ''; // limpar
  regiao.textContent = novosResultados; // inserir
}
```

### 2. Live Region com aria-atomic (relógio)
```html
<div id="relogio" role="timer" aria-live="polite" aria-atomic="true">
  <span id="horas">17</span>:<span id="minutos">33</span>
</div>
```
Sem `aria-atomic`, AT anuncia só "34" quando muda para "17:34". Com `aria-atomic`, anuncia "17:34" completo.

### 3. Live Region com aria-relevant (chat/roster)
```html
<ul id="participantes" aria-live="polite" aria-relevant="additions removals">
  <!-- usuários entram/saem -->
</ul>
```

### 4. Alert (role="alert")
```html
<div role="alert" id="notificacao">
  <!-- Inserir dinamicamente -->
</div>
```
```js
function mostrarNotificacao(msg) {
  const alert = document.getElementById('notificacao');
  alert.textContent = msg;
  // Nota: role="alert" já tem aria-live="assertive" implícito
}
```

## Boas Práticas

1. **Adicione `aria-live` ANTES das mudanças** — seja no HTML inicial ou via JS antes de inserir conteúdo
2. **Comece com live region vazia**, depois insira conteúdo
3. **NÃO use `aria-live="assertive"` por padrão** — interrompe o usuário
4. **`role="alert"` vs `role="alert"` + `aria-live`**: Não adicione `aria-live="assertive"` a `role="alert"` — causa duplicação de anúncio no VoiceOver iOS
5. **Esconda visualmente se necessário**: Se a live region for visualmente oculta mas precisa ser anunciada, use classe .sr-only (não `display:none` ou `aria-hidden`)
6. **Não use live region para conteúdo que existe no carregamento** — AT já anuncia conteúdo inicial
7. **Em atualizações frequentes** (ex: timer 1s), use `aria-atomic="true"` ou limpe e reinsira conteúdo

## O Que EVITAR

- `aria-live="assertive"` para notificações triviais
- Inserir `role="alert"` estático no HTML (não é anunciado como alerta)
- `display: none` em live region (remove da árvore de acessibilidade)
- `aria-hidden="true"` em live region (impede anúncio)
- Live regions sem `aria-live` definido (padrão é `off`)
- Múltiplos `role="alert"` na página (cada um interrompe)

## Referência

- [MDN: ARIA Live Regions](/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [WAI-ARIA Authoring Practices: Live Regions](https://www.w3.org/WAI/ARIA/apg/practices/live-region/)

## Checklist

- [ ] Toda atualização dinâmica visível é anunciada por live region
- [ ] `aria-live` definido antes da mudança de conteúdo
- [ ] `polite` usado por padrão, `assertive` só para urgências
- [ ] `aria-atomic` usado quando o contexto completo é necessário
- [ ] `aria-relevant` configurado conforme necessidade (additions/removals)
- [ ] `role="alert"` usado apenas para conteúdo dinâmico de emergência
- [ ] Testado com leitor de tela real (NVDA, VoiceOver, TalkBack)
