# Suplemento à Referência WCAG

## Critérios Faltantes

Os seguintes critérios WCAG estavam ausentes na tabela de `12-wcag-quick-reference.md`:

### 2.5.5 Target Size (AAA) — WCAG 2.1

| Propriedade | Valor |
|-------------|-------|
| **Princípio** | Operável |
| **Guideline** | 2.5: Input Modalities |
| **Nível** | AAA |
| **Descrição** | O tamanho do alvo para entradas por ponteiro tem pelo menos 44×44 px CSS, exceto quando: o alvo é fornecido por link inline equivalente, o alvo é determinado pelo agente de usuário (não pelo autor), ou o alvo é essencial (ex: mapas, jogos). |
| **Exceções** | Linha de texto inline, tamanho determinado pelo UA, essencial |
| **Teste** | Medir dimensões do target. Falha se < 44px em altura ou largura. |
| **Nota** | Em WCAG 2.2, este critério foi sucedido por **2.5.8 Target Size (AA)** com requisito similar mas em nível AA. |

```css
button, a, input, [role="button"], [tabindex] {
  min-width: 44px;
  min-height: 44px;
}
```

### 2.5.6 Concurrent Input Mechanisms (AAA) — WCAG 2.1

| Propriedade | Valor |
|-------------|-------|
| **Princípio** | Operável |
| **Guideline** | 2.5: Input Modalities |
| **Nível** | AAA |
| **Descrição** | O conteúdo não restringe a utilização de modalidades de entrada disponíveis na plataforma, exceto quando a restrição é essencial, necessária para a segurança do conteúdo ou necessária para respeitar as configurações do usuário. |
| **Exemplos** | Um app que só funciona com touch e bloqueia teclado/bluetooth falha. Uma página que exige mouse para hover e bloqueia touch. |
| **Teste** | Conectar teclado externo em tablet → deve funcionar. Usar touch em laptop → deve funcionar. |
| **Nota** | Raro ser violado em websites modernos, comum em apps que desativam zoom ou gestos. |

### 3.2.5 Change on Request (AAA) — WCAG 2.0

| Propriedade | Valor |
|-------------|-------|
| **Princípio** | Compreensível |
| **Guideline** | 3.2: Predictable |
| **Nível** | AAA |
| **Descrição** | Mudanças de contexto são iniciadas apenas por solicitação do usuário OU um mecanismo está disponível para desativar tais mudanças. |
| **Exemplos** | Um carrossel que avança automaticamente sem solicitação falha (a menos que haja pause). Uma página que redireciona após X segundos falha. |
| **Teste** | Verificar se nenhuma mudança de contexto ocorre sem ação do usuário. |
| **Nota** | Este critério reforça 3.2.1 (On Focus) e 3.2.2 (On Input) em nível AAA. |

---

## Tabela de Critérios por Versão WCAG

### WCAG 2.0 (2008) — 25 Critérios

| # | Critério | Nível |
|---|----------|-------|
| 1.1.1 | Non-text Content | A |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A |
| 1.2.2 | Captions (Prerecorded) | A |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A |
| 1.2.4 | Captions (Live) | AA |
| 1.2.5 | Audio Description (Prerecorded) | AA |
| 1.2.6 | Sign Language (Prerecorded) | AAA |
| 1.2.7 | Extended Audio Description (Prerecorded) | AAA |
| 1.2.8 | Media Alternative (Prerecorded) | AAA |
| 1.2.9 | Audio-only (Live) | AAA |
| 1.3.1 | Info and Relationships | A |
| 1.3.2 | Meaningful Sequence | A |
| 1.3.3 | Sensory Characteristics | A |
| 1.4.1 | Use of Color | A |
| 1.4.2 | Audio Control | A |
| 1.4.3 | Contrast (Minimum) | AA |
| 1.4.4 | Resize Text | AA |
| 1.4.5 | Images of Text | AA |
| 1.4.6 | Contrast (Enhanced) | AAA |
| 1.4.7 | Low or No Background Audio | AAA |
| 1.4.8 | Visual Presentation | AAA |
| 1.4.9 | Images of Text (No Exception) | AAA |
| 2.1.1 | Keyboard | A |
| 2.1.2 | No Keyboard Trap | A |
| 2.1.3 | Keyboard (No Exception) | AAA |
| 2.2.1 | Timing Adjustable | A |
| 2.2.2 | Pause, Stop, Hide | A |
| 2.2.3 | No Timing | AAA |
| 2.2.4 | Interruptions | AAA |
| 2.2.5 | Re-authenticating | AAA |
| 2.3.1 | Three Flashes or Below Threshold | A |
| 2.3.2 | Three Flashes | AAA |
| 2.4.1 | Bypass Blocks | A |
| 2.4.2 | Page Titled | A |
| 2.4.3 | Focus Order | A |
| 2.4.4 | Link Purpose (In Context) | A |
| 2.4.5 | Multiple Ways | AA |
| 2.4.6 | Headings and Labels | AA |
| 2.4.7 | Focus Visible | AA |
| 2.4.8 | Location | AAA |
| 2.4.9 | Link Purpose (Link Only) | AAA |
| 2.4.10 | Section Headings | AAA |
| 3.1.1 | Language of Page | A |
| 3.1.2 | Language of Parts | AA |
| 3.1.3 | Unusual Words | AAA |
| 3.1.4 | Abbreviations | AAA |
| 3.1.5 | Reading Level | AAA |
| 3.1.6 | Pronunciation | AAA |
| 3.2.1 | On Focus | A |
| 3.2.2 | On Input | A |
| 3.2.3 | Consistent Navigation | AA |
| 3.2.4 | Consistent Identification | AA |
| 3.2.5 | Change on Request | AAA |
| 3.3.1 | Error Identification | A |
| 3.3.2 | Labels or Instructions | A |
| 3.3.3 | Error Suggestion | AA |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA |
| 3.3.5 | Help | AAA |
| 3.3.6 | Error Prevention (All) | AAA |
| 4.1.1 | Parsing | A |
| 4.1.2 | Name, Role, Value | A |

### WCAG 2.1 (2018) — Adições (+17 = 50 total)

| # | Critério | Nível |
|---|----------|-------|
| 1.3.4 | Orientation | AA |
| 1.3.5 | Identify Input Purpose | AA |
| 1.4.10 | Reflow | AA |
| 1.4.11 | Non-text Contrast | AA |
| 1.4.12 | Text Spacing | AA |
| 1.4.13 | Content on Hover or Focus | AA |
| 2.1.4 | Character Key Shortcuts | A |
| 2.2.6 | Timeouts | AAA |
| 2.3.3 | Animations from Interactions | AAA |
| 2.5.1 | Pointer Gestures | A |
| 2.5.2 | Pointer Cancellation | A |
| 2.5.3 | Label in Name | A |
| 2.5.4 | Motion Actuation | A |
| 2.5.5 | Target Size | AAA |
| 2.5.6 | Concurrent Input Mechanisms | AAA |
| 4.1.3 | Status Messages | AA |
| 2.6.1 | (não usado) | — |

### WCAG 2.2 (2023) — Adições/Remoções (+9, -1 = 58 critérios)

| # | Critério | Nível | Status |
|---|----------|-------|--------|
| 2.4.11 | Focus Not Obscured (Minimum) | AA | Novo |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | Novo |
| 2.4.13 | Focus Appearance | AAA | Novo |
| 2.5.7 | Dragging Movements | AA | Novo |
| 2.5.8 | Target Size (Minimum) | AA | Novo |
| 3.2.6 | Consistent Help | A | Novo |
| 3.3.7 | Accessible Authentication | AA | Novo |
| 3.3.8 | Accessible Authentication (No Exception) | AAA | Novo |
| 3.3.9 | (não usado) | — | — |
| 4.1.1 | Parsing | A | **Removido** |

---

## Diferenças entre WCAG 2.0, 2.1 e 2.2

| Aspecto | WCAG 2.0 | WCAG 2.1 | WCAG 2.2 |
|---------|----------|----------|----------|
| Total de critérios | 61 | 78 | 86 |
| Critérios A | 25 | 30 | 30 |
| Critérios AA | 13 | 20 | 25 |
| Critérios AAA | 23 | 28 | 31 |
| Foco mobile | ❌ | ✅ (1.3.4, 1.3.5, 2.5.x) | ✅ |
| Foco cognitivo | Limitado | ✅ (1.3.5, 2.2.6) | ✅✅ (3.2.6, 3.3.7, 3.3.8) |
| Foco visual | Limitado | ✅ (1.4.10-1.4.13) | ✅✅ (2.4.11-2.4.13) |
| Drag & drop | ❌ | ❌ | ✅ (2.5.7) |

---

## Correções para `12-wcag-quick-reference.md`

1. **Incluir 2.5.5** (Target Size, AAA) na seção Operável entre 2.5.4 e 2.5.7
2. **Incluir 2.5.6** (Concurrent Input Mechanisms, AAA) na seção Operável
3. **Incluir 3.2.5** (Change on Request, AAA) na seção Compreensível entre 3.2.4 e 3.2.6
4. **Adicionar nota** sobre critérios novos em WCAG 2.2 vs carregados de 2.0/2.1
5. **Marcar 4.1.1 Parsing** como "Removido em WCAG 2.2"

---

## Tabela de Suporte a Atalhos de Leitor de Tela por Critério

| Critério | NVDA + Chrome | JAWS + Chrome | VoiceOver + Safari | TalkBack + Chrome |
|----------|--------------|---------------|-------------------|-------------------|
| 2.1.1 Keyboard | ✅ | ✅ | ✅ | ✅ |
| 2.1.2 No Keyboard Trap | ✅ | ✅ | ✅ | ✅ |
| 2.4.11 Focus Not Obscured | ⚠️ Parcial | ❌ Desconhecido | ✅ Nativo | ⚠️ Parcial |
| 2.4.13 Focus Appearance | ⚠️ Variável | ⚠️ Variável | ✅ Nativo | ⚠️ Variável |
| 3.3.7 Accessible Authentication | ✅ | ✅ | ✅ | ✅ |
| 4.1.3 Status Messages | ✅ (aria-live) | ✅ | ✅ | ✅ |
| 1.3.5 Identify Input Purpose | ✅ | ✅ | ✅ | ✅ |

---

## Guia Rápido de Alvo por Versão

```mermaid
WCAG 2.0 (2008)
  ├── 61 critérios
  └── Base para todas as versões seguintes

WCAG 2.1 (2018)
  ├── Adiciona 17 critérios
  ├── Foco em mobile e cognição
  └── Total: 78 critérios

WCAG 2.2 (2023)
  ├── Adiciona 9 critérios
  ├── Remove 1 critério (4.1.1)
  ├── Foco em interação, autenticação, foco
  └── Total: 86 critérios
```

---

## Checklist de Atualização

- [ ] `12-wcag-quick-reference.md` atualizado com 2.5.5, 2.5.6, 3.2.5
- [ ] 4.1.1 marcado como removido em WCAG 2.2
- [ ] Coluna "Versão" adicionada à tabela (2.0 / 2.1 / 2.2)
- [ ] Nota sobre escopo legal (muitas jurisdições ainda usam WCAG 2.0 AA ou 2.1 AA)
- [ ] Links para normativas locais (ex: Brasil e-MAG, EUA Section 508, EU EN 301 549)
