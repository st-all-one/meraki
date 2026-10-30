# Referência Rápida WCAG 2.2

## Os 4 Princípios (POUR)

| # | Princípio | Significado |
|---|---|---|
| 1 | **Perceivable** | O conteúdo deve ser perceptível |
| 2 | **Operable** | A interface deve ser operável |
| 3 | **Understandable** | O conteúdo deve ser compreensível |
| 4 | **Robust** | Deve funcionar com tecnologias atuais e futuras |

## Princípio 1: Perceivable

| Critério | Descrição | Nível |
|---|---|---|
| **1.1.1** Non-text Content | Todo conteúdo não textual tem alternativa textual | A |
| **1.2.1** Audio-only and Video-only | Alternativa para mídia pré-gravada | A |
| **1.2.2** Captions (Prerecorded) | Legendas para vídeo pré-gravado com áudio | A |
| **1.2.3** Audio Description or Media Alternative | Descrição para vídeo pré-gravado | A |
| **1.2.4** Captions (Live) | Legendas para áudio ao vivo | AA |
| **1.2.5** Audio Description (Prerecorded) | Áudio-descrição para vídeo | AA |
| **1.3.1** Info and Relationships | Estrutura e relações preservadas na marcação | A |
| **1.3.2** Meaningful Sequence | Orda de leitura faz sentido | A |
| **1.3.3** Sensory Characteristics | Instruções não dependem apenas de forma/tamanho/cor | A |
| **1.3.4** Orientation | Conteúdo não restrito a orientação única | AA |
| **1.3.5** Identify Input Purpose | Autocomplete para campos comuns | AA |
| **1.3.6** Identify Purpose | Ícones e regiões com propósito identificável | AAA |
| **1.4.1** Use of Color | Cor não é único meio de transmitir informação | A |
| **1.4.2** Audio Control | Mecanismo para parar/pausar áudio automático | A |
| **1.4.3** Contrast (Minimum) | Contraste ≥ 4.5:1 (texto normal), ≥ 3:1 (grande) | AA |
| **1.4.4** Resize Text | Texto redimensionável até 200% sem perda | AA |
| **1.4.5** Images of Text | Texto como imagem evitado (exceto essencial) | AA |
| **1.4.10** Reflow | Conteúdo sem scroll 2D em 320px (ou 1280px com zoom 400%) | AA |
| **1.4.11** Non-text Contrast | Componentes de UI e objetos gráficos ≥ 3:1 | AA |
| **1.4.12** Text Spacing | Sem perda ao sobrescrever espaçamento | AA |
| **1.4.13** Content on Hover or Focus | Conteúdo adicional em hover dismissível | AA |

## Princípio 2: Operable

| Critério | Descrição | Nível |
|---|---|---|
| **2.1.1** Keyboard | Toda funcionalidade disponível por teclado | A |
| **2.1.2** No Keyboard Trap | Foco não fica preso em elemento | A |
| **2.1.3** Keyboard (No Exception) | Toda funcionalidade por teclado (exc. traçado à mão livre) | AAA |
| **2.1.4** Character Key Shortcuts | Atalhos de tecla única podem ser desabilitados | A |
| **2.2.1** Timing Adjustable | Tempo ajustável (mín. 10× extensão) | A |
| **2.2.2** Pause, Stop, Hide | Conteúdo automático > 5s tem controle | A |
| **2.2.6** Timeouts | Alertar sobre timeout em atividade | AAA |
| **2.3.1** Three Flashes or Below | Nada que pisque > 3×/segundo | A |
| **2.3.2** Three Flashes | Nada que pisque > 3×/segundo em toda página | AAA |
| **2.4.1** Bypass Blocks | Skip link para pular blocos repetitivos | A |
| **2.4.2** Page Titled | Título descritivo por página | A |
| **2.4.3** Focus Order | Ordem de foco lógica | A |
| **2.4.4** Link Purpose (In Context) | Propósito do link claro no contexto | A |
| **2.4.5** Multiple Ways | Múltiplas formas de encontrar conteúdo | AA |
| **2.4.6** Headings and Labels | Headings e labels descritivos | AA |
| **2.4.7** Focus Visible | Foco visível nos elementos | AA |
| **2.4.11** Focus Not Obscured | Foco não fica oculto (mín. parcialmente visível) | AA |
| **2.4.12** Focus Not Obscured (Enhanced) | Foco totalmente visível | AAA |
| **2.4.13** Focus Appearance | Foco visível com área ≥ outline de 2px | AAA |
| **2.5.1** Pointer Gestures | Gestos multitoque têm alternativa de 1 toque | A |
| **2.5.2** Pointer Cancellation | Ação executada no up-event (não down-event) | A |
| **2.5.3** Label in Name | Nome acessível inclui texto visível do label | A |
| **2.5.4** Motion Actuation | Funcionalidade ativada por movimento tem alternativa | A |
| **2.5.7** Dragging Movements | Alternativa para arrastar (drag) | AA |
| **2.5.8** Target Size | Alvo ≥ 24×24px | AA |

## Princípio 3: Understandable

| Critério | Descrição | Nível |
|---|---|---|
| **3.1.1** Language of Page | Idioma da página declarado (`lang`) | A |
| **3.1.2** Language of Parts | Idioma de partes específicas | AA |
| **3.1.3** Unusual Words | Palavras incomuns definidas | AAA |
| **3.1.4** Abbreviations | Abreviações explicadas | AAA |
| **3.1.5** Reading Level | Nível de leitura adequado | AAA |
| **3.1.6** Pronunciation | Pronúncia disponível | AAA |
| **3.2.1** On Focus | Foco não muda contexto | A |
| **3.2.2** On Input | Input não muda contexto automaticamente | A |
| **3.2.3** Consistent Navigation | Navegação consistente entre páginas | AA |
| **3.2.4** Consistent Identification | Mesma função, mesmo label em todo site | AA |
| **3.2.6** Consistent Help | Ajuda sempre no mesmo lugar | A |
| **3.3.1** Error Identification | Erro de entrada identificado automaticamente | A |
| **3.3.2** Labels or Instructions | Labels/instruções para entrada de dados | A |
| **3.3.3** Error Suggestion | Sugestão de correção de erro | AA |
| **3.3.4** Error Prevention (Legal, Financial, Data) | Revisão/confirmação para ações críticas | AA |
| **3.3.5** Help | Ajuda sensível ao contexto | AAA |
| **3.3.6** Error Prevention (All) | Prevenção de erro para todos os tipos | AAA |
| **3.3.7** Accessible Authentication | Autenticação sem dependência de tarefa cognitiva | AA |
| **3.3.8** Accessible Authentication (No Exception) | Autenticação sem tarefa cognitiva (exceto objetos) | AAA |

## Princípio 4: Robust

| Critério | Descrição | Nível |
|---|---|---|
| **4.1.1** Parsing | HTML bem formado (removido em WCAG 2.2) | — |
| **4.1.2** Name, Role, Value | Nome, função e valor programáticos | A |
| **4.1.3** Status Messages | Mensagens de status anunciadas via ARIA (role="status", aria-live) | AA |

## Níveis de Conformidade

| Nível | Significado | Meta |
|---|---|---|
| **A** | Mínimo. Remove barreiras mais graves | Essencial |
| **AA** | Padrão recomendado. Base legal (ADA, EU Directive) | **Meta padrão** |
| **AAA** | Nível mais alto. Melhor experiência | Desejável, nem sempre exequível |

## Atalhos de Leitura

```
Perceivable:   Alternativas textuais, mídia, adaptável, distinguível
Operable:      Teclado, tempo, convulsões, navegável, entrada
Understandable: Legível, previsível, assistência de entrada
Robust:        Compatível, nome/função/valor, status messages
```

## Ferramentas para Verificação Rápida

| Requisito | Ferramenta |
|---|---|
| Contraste | WebAIM Contrast Checker / DevTools |
| HTML semântico | WAVE / aXe |
| ARIA | aXe DevTools / Accessibility Insights |
| Teclado | Navegação manual + Lighthouse |
| Leitor de tela | NVDA (Windows) / VoiceOver (Mac/iOS) |
| CI/CD | axe-core, Lighthouse CI, Pa11y |

## Referência

- [WCAG 2.2 Specification](https://w3c.github.io/wcag/guidelines/22/)
- [Understanding WCAG (MDN)](/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG)
- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG21/quickref/)
