# Acessibilidade Cognitiva

## Escopo

A acessibilidade cognitiva cobre:

| Condição | Caráter |
|---|---|
| Demência, Alzheimer | Permanente, progressivo |
| Aphasia | Permanente |
| Autismo (TEA) | Permanente |
| TDAH | Permanente (gerenciável) |
| Dislexia, Discalculia | Permanente |
| Depressão | Temporário/permanente |
| Privação de sono | Temporário |
| Efeito de substâncias | Temporário |
| Envelhecimento | Permanente |

## Habilidades Cognitivas Afetadas

1. **Atenção** — concentrar-se no conteúdo
2. **Memória** — lembrar fluxos de tarefas
3. **Velocidade de processamento** — tempo para entender
4. **Gerenciamento de tempo** — cumprir prazos
5. **Letras e linguagem** — ler e escrever (dislexia)
6. **Números, símbolos, matemática** — discalculia
7. **Compreensão e tomada de decisão** — escolhas informadas

## Estratégias Fundamentais

```
1. Conteúdo em múltiplos formatos (texto, áudio, vídeo)
2. Linguagem simples e clara (plain language)
3. Foco no conteúdo importante, sem distrações
4. Layout e navegação consistentes
5. Elementos familiares (links azuis sublinhados, etc.)
6. Processos divididos em etapas lógicas com progresso
7. Autenticação simplificada (sem comprometer segurança)
8. Formulários com instruções claras e recuperação de erros
```

## WCAG — Diretrizes Específicas

### 1.3 Adaptável
- Conteúdo apresentável em diferentes formas sem perder estrutura
- Layout responsivo

### 2.2 Tempo Suficiente

| Critério | Descrição | Nível |
|---|---|---|
| 2.2.1 | Ajuste de tempo: permitir desligar/ajustar/estender (mín. 10×) | A |
| 2.2.2 | Pausar, parar, esconder: conteúdo em movimento/automático > 5s | A |
| 2.2.6 | Timeouts: avisar duração e ação necessária | AAA |

Mecanismos:
- Botão para estender sessão
- Salvar estado antes de timeout
- Aviso de inatividade com tempo restante

### 2.4 Navegável

| Critério | Descrição |
|---|---|
| 2.4.1 | Skip link para pular blocos repetitivos |
| 2.4.2 | `<title>` descritivo por página |
| 2.4.6 | Headings e labels descritivos |
| 2.4.10 | Headings de seção para organizar conteúdo |

### 3.1 Legível

```html
<!-- Declarar idioma da página -->
<html lang="pt-BR">

<!-- Idioma de trecho específico -->
<p>O termo <span lang="en">debugging</span> é usado para...</p>
```

| Critério | Descrição | Nível |
|---|---|---|
| 3.1.1 | Idioma da página declarado (`lang`) | A |
| 3.1.2 | Idioma de partes específicas | AA |
| 3.1.3 | Palavras incomuns definidas (glossário inline) | AAA |
| 3.1.4 | Abreviações explicadas (`<abbr>`) | AAA |
| 3.1.5 | Nível de leitura adequado | AAA |

### 3.2 Previsível

| Critério | Descrição |
|---|---|
| 3.2.1 | Foco não muda contexto |
| 3.2.2 | Input não muda contexto automaticamente |
| 3.2.3 | Navegação consistente em todo o site |
| 3.2.4 | Identificação consistente (mesma função, mesmo label) |

Exemplo de erro:
```html
<!-- ERRADO: foco em select já dispara ação -->
<select onchange="location = this.value;">
  <option>Selecionar página...</option>
  <option value="/page1">Página 1</option>
</select>

<!-- CERTO: botão de ação separado -->
<select id="page-select">
  <option>Selecionar página...</option>
  <option value="/page1">Página 1</option>
</select>
<button onclick="navigate()">Ir</button>
```

### 3.3 Assistência de Entrada

| Critério | Descrição | Nível |
|---|---|---|
| 3.3.1 | Erro identificado automaticamente (campo com erro) | A |
| 3.3.2 | Labels ou instruções presentes | A |
| 3.3.3 | Sugestão de correção de erro | AA |
| 3.3.4 | Prevenção de erros (revisão, confirmação, reversão) | AA |
| 3.3.5 | Ajuda sensível ao contexto | AAA |
| 3.3.6 | Prevenção de erros para todos os tipos | AAA |

## Boas Práticas de Linguagem

### Plain Language
```html
<!-- Complexo -->
<p>A utilização do componente deverá ser efetuada mediante prévia autorização.</p>

<!-- Simples -->
<p>Você precisa de autorização para usar este componente.</p>
```

### Técnicas:
- Frases curtas (≤ 20 palavras)
- Voz ativa no presente
- Palavras comuns em vez de jargão
- Marcadores e listas
- Títulos descritivos
- Glossário inline para termos técnicos

## Consistência Visual

```css
/* Links sempre sublinhados */
a { text-decoration: underline; }
a:visited { color: #551a8b; }
```

## Formulários e Prevenção de Erros

### Revisão Antes de Enviar

```html
<form id="checkout">
  <!-- campos... -->
  <h2>Revise suas informações:</h2>
  <dl>
    <dt>Nome</dt>
    <dd id="review-name"></dd>
    <dt>Endereço</dt>
    <dd id="review-address"></dd>
  </dl>
  <input type="checkbox" id="confirm" required>
  <label for="confirm">Confirmo que as informações estão corretas</label>
  <button type="submit">Finalizar compra</button>
</form>
```

## Distrações e Interrupções

- Permitir adiar/suprimir interrupções não emergenciais
- Não atualizar conteúdo automaticamente sem opção de controle
- Usar `aria-live="polite"` para notificações não críticas

## Leitura e Compreensão

### Ferramentas de Legibilidade
- [Hemingway Editor](https://hemingwayapp.com/) — nível de leitura
- [WebFX Readability](https://www.webfx.com/tools/read-able/) — pontuação de legibilidade
- Meta: ≤ 8ª série (≈ 13-14 anos) para conteúdo geral

## Autenticação

| Boa Prática | Descrição |
|---|---|
| Alternativa a CAPTCHA | Lógica simples, honeypot, ou verificação de comportamento |
| Logins alternativos | SSO, magic link, ou biometria |
| Não expirar sessão sem aviso | Aviso de timeout com opção de estender |
| Copiar/colar permitido em campos de senha | Não bloquear paste em senhas |
| Gerenciador de senhas permitido | `autocomplete` correto |

## Referência

- [MDN: Cognitive accessibility](/en-US/docs/Web/Accessibility/Guides/Cognitive_accessibility)
- [WCAG 2.2: Understandable](https://www.w3.org/WAI/WCAG21/Understanding/understandable)
- [W3C COGA](https://www.w3.org/WAI/GL/task-forces/coga/)
- [Plain Language Guidelines](https://www.plainlanguage.gov/guidelines/)

## Checklist

- [ ] Idioma declarado no `<html lang="...">`
- [ ] Trechos em outro idioma marcados com `lang`
- [ ] Abreviações explicadas na primeira ocorrência
- [ ] Navegação consistente entre páginas
- [ ] Mesma função, mesmo label em todo o site
- [ ] Foco não muda contexto automaticamente
- [ ] Timeouts têm aviso e opção de extensão (≥ 20s de aviso)
- [ ] Conteúdo em movimento > 5s tem controle de pausa
- [ ] Labels e instruções claras em formulários
- [ ] Erros identificados com sugestão de correção
- [ ] Revisão/confirmação antes de ações críticas (financeiro, legal)
- [ ] Linguagem simples (plain language)
- [ ] CAPTCHA evitado ou com alternativa
- [ ] Ajuda sensível ao contexto disponível
