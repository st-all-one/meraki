# Web Accessibility Guide — Índice e Visão Geral

## O que é Acessibilidade Web?

Acessibilidade (A11y) significa capacitar o maior número possível de pessoas a usar websites, mesmo quando suas capacidades físicas ou cognitivas são limitadas. A web é fundamentalmente projetada para funcionar para **todas as pessoas**, independentemente de hardware, software, idioma, localização ou habilidade.

## Populações-alvo

- Cegos e baixa visão (leitores de tela, lupas, alto contraste)
- Surdos e com deficiência auditiva (legendas, transcrições)
- Deficiências motoras (navegação apenas por teclado, switches, voz)
- Deficiências cognitivas (dislexia, TDAH, autismo, Alzheimer)
- Epilepsia fotossensível e distúrbios vestibulares
- Deficiências temporárias (braço quebrado, cirurgia ocular)
- Limitações situacionais (luz solar, ambiente barulhento)

## Os 4 Princípios WCAG (POUR)

| Princípio | Significado |
|---|---|
| **Perceivable** | O conteúdo deve ser perceptível por pelo menos um sentido |
| **Operable** | A interface e navegação devem ser operáveis (teclado, voz, toque) |
| **Understandable** | Informação e operação devem ser compreensíveis |
| **Robust** | Conteúdo deve funcionar com agentes de usuário atuais e futuros |

## Regra de Ouro da Acessibilidade Moderna

> **Use HTML semântico nativo sempre que existir. ARIA é apenas para quando não há alternativa HTML. "No ARIA is better than bad ARIA."**

## Níveis de Conformidade WCAG

- **A**: Mínimo. Remove barreiras mais graves.
- **AA**: Padrão recomendado. Meta legal na maioria dos países.
- **AAA**: Nível mais alto. Nem sempre possível para todo conteúdo.

## Documentos deste Guia

| # | Documento | Descrição |
|---|---|---|
| 00 | index.md | Visão geral e princípios |
| 01 | semantic-html.md | HTML semântico moderno como fundação |
| 02 | aria.md | ARIA: regras, funções, estados e propriedades |
| 03 | keyboard-accessibility.md | Navegação por teclado e gerenciamento de foco |
| 04 | color-and-contrast.md | Cor, contraste e uso de cor |
| 05 | live-regions.md | Regiões dinâmicas e aria-live |
| 06 | forms-and-labels.md | Formulários, rótulos e validação |
| 07 | multimedia.md | Imagens, vídeo e áudio |
| 08 | mobile-accessibility.md | Acessibilidade em dispositivos móveis |
| 09 | seizures-motion.md | Convulsões, movimento e preferências de redução |
| 10 | cognitive-accessibility.md | Acessibilidade cognitiva |
| 11 | testing-tools.md | Ferramentas de teste e validação |
| 12 | wcag-quick-reference.md | Referência rápida WCAG 2.2 |
| 13 | aria-advanced-roles.md | Roles avançadas (application, feed, term, note, math, ...) |
| 14 | structural-roles.md | Roles estruturais e mapeamento HTML → ARIA |
| 15 | aria-advanced-attributes.md | Atributos ARIA avançados |
| 16 | table-grid-attributes.md | Tabelas e grids: colindex/rowindex, spans, grids esparsos |
| 17 | web-components-shadow-dom.md | Web Components e Shadow DOM |
| 18 | svg-canvas.md | SVG e canvas |
| 19 | inert-forced-colors.md | `inert`, forced-colors e prefers-contrast |
| 20 | os-browser-settings.md | Configurações do SO/browser e media queries |
| 21 | keyboard-patterns.md | Padrões de teclado por widget |
| 22 | design-patterns.md | Padrões de design acessíveis |
| 23 | advanced-testing.md | Testes avançados (AT real, mocks) |
| 24 | wcag-supplement.md | Suplemento WCAG 2.2 |
| 25 | tag-role-reference.md | **Elemento HTML → role ARIA implícita** (referência completa; fonte da `sniffCSS`) |
