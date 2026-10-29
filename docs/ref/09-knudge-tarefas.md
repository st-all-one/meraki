# knudge — organização de tarefas

Análise de `_REF/knudge` (v0.6.1) para responder uma pergunta estreita: **o que desse modelo de trabalho ajuda o Meraki sem aumentar a complexidade?**

O knudge é uma CLI de memória durável para agentes, não um gerenciador de projetos. Ainda assim, a modelagem de trabalho é deliberadamente pequena e tem três ideias aproveitáveis: **derivar em vez de armazenar**, **separar trabalho de conhecimento** e **uma tarefa = uma unidade de trabalho**. O resto — árvore, impacto, fluxo, planos — é custo que o Meraki não precisa pagar.

## 1. Como funciona

A frase que define o modelo: **tarefa é uma view derivada de notas, não uma base paralela** (`wiki/specs/tarefas.md:4`). Épico, issue e tarefa são a mesma nota Markdown; o que muda é o campo `scope` (`wiki/specs/tarefas.md:17-18`).

| Peça | Regra | Evidência |
|---|---|---|
| Unidade | Toda tarefa/épico/issue é uma nota comum, mesmo store e mesmo contrato de bytes | `wiki/specs/tarefas.md:10-22` |
| Hierarquia | `epic ⊃ { issue ⊃ task \| task }`; `issue` é opcional; pai único; profundidade ≤ 4 | `wiki/specs/tarefas.md:52-64` |
| Pai | Marcador no corpo (`<!-- knudge:parent ID blocks N -->`); o grafo é projeção | `wiki/specs/tarefas.md:37-45` |
| Campos de decisão | `scope`, `kind`, `parent`, `blocks`, `status`, `checks`, `anchor`, `tag` | `wiki/specs/tarefas.md:94-107` |
| Derivados | Papel, modo, progresso, épico, impacto, contexto e fluxo nunca são gravados | `wiki/specs/tarefas.md:76-87` |
| Pronto/bloqueado | `ready` = dependências transitivas encerradas; ciclo bloqueia | `crates/knudge-core/src/retrieval/views.rs:1-6, 65-89` |
| Impacto | Nº de itens abertos que dependem transitivamente do item | `crates/knudge-core/src/task/impact.rs:1-21` |
| Status | `active`, `in_progress`, `blocked`, `closed`; transições validadas | `crates/knudge-core/src/task/lifecycle.rs:67-95` |
| Fechamento | `close` exige evidência/outcome; não é só “done” | `wiki/specs/tarefas.md:136`; `wiki/integration/06_tarefas_e_handoff.md:116` |
| Critérios | `--checks` guarda nomes de validators como critérios de aceite | `wiki/specs/tarefas.md:105` |
| Planejamento | `task plan`/templates geram passos; `batch` cria/atualiza em JSONL | `wiki/specs/tarefas.md:141-162` |
| Fluxo | Cycle/lead time, throughput e caminho crítico derivados do log | `wiki/specs/tarefas.md:179-187` |
| Conhecimento vs trabalho | `ask` responde o que se sabe; `task list` o que fazer; `ask` exclui trabalho por padrão | `wiki/specs/tarefas.md:189-198` |

**Consequência:** não existe “campo de progresso que mente”. A árvore, o status e o log são suficientes para recalcular tudo. O preço é recomputar a cada leitura e manter um grafo consistente.

## 2. O que vale trazer

### 2.1 Derivar estado de gestão, não armazenar

O Meraki já adotou isso para a prioridade Eisenhower: `end_date` + `importance` + `status` produzem Q1–Q4 na leitura; o banco só guarda a importância e o override. É a mesma disciplina do knudge, aplicada a um caso menor (`wiki/specs/tarefas.md:31, 76-87`).

**Trazer:** manter “prontidão” e “atenção” como filtros calculados, não como novos campos. Se um dia houver dependências, elas entram como relação; o estado continua derivado.

### 2.2 View “Prontas” — o único conceito novo que recomendo agora

O knudge tem uma view `ready` derivada de dependências (`crates/knudge-core/src/retrieval/views.rs:1-6`). O Meraki ainda não tem dependências; a versão simples usa o que já existe:

```text
pronta = kind=task
     and status != done
     and blocked=0
     and start_date <= hoje
     and archived_at is null
```

- Filtro de URL `?ready=1`; não é coluna, não é status e não vira tabela.
- Não inclui dependências: `blocked` continua sendo a válvula manual.
- Se um dia entrar `depends_on`, a fórmula cresce para “todas as dependências fechadas” sem mudar a UI.
- A view responde “o que eu posso começar hoje?” sem criar um segundo board.

**Custo:** uma cláusula SQL/consulta + um chip de filtro. **Ganho:** transforma `start_date` em algo operacional, não só decorativo.

### 2.3 Uma tarefa = uma unidade de trabalho

O knudge recomenda: `statement` = objetivo; corpo = critérios/contexto (`wiki/integration/06_tarefas_e_handoff.md:114`). O Meraki já tem `title` + `description`; a regra pode ser de produto, sem schema:

- Título curto e verificável; descrição guarda contexto, critérios de aceite e links.
- Evitar “tarefa guarda-chuva” que nunca fecha; se precisar agrupar, use pasta + tags.
- O detalhe já mostra histórico; não criar campo “critérios de aceite” no MVP.

### 2.4 Fechar com evidência — como prompt opcional

O knudge exige `outcome`/evidência no `close` (`wiki/specs/tarefas.md:136`). Para um time de 10 pessoas, tornar isso obrigatório adiciona fricção em toda tarefa. **Não trazer como campo obrigatório agora.** Se houver dor real de “concluiu sem explicar”, o menor passo é um prompt opcional ao mover para `done`, registrado no evento (`completion_note`), sem coluna nova.

### 2.5 Fronteira trabalho/conhecimento

O knudge separa `ask` (conhecimento) de `task list` (trabalho) e exclui trabalho da busca por padrão (`wiki/specs/tarefas.md:189-198`). O Meraki não tem wiki, mas pode preservar a fronteira:

- Tarefa/issue = trabalho com dono, status, datas e prioridade.
- Decisão/risco/erro = mensagem no canal da demanda ou evento de histórico, não um “tipo de tarefa”.
- Tags agrupam; não substituem decisão.

**Trazer:** a disciplina, não um novo módulo de notas. Um “tipo de tarefa decisão” só criaria status e fluxo paralelos.

### 2.6 Tags como vocabulário compartilhado

O knudge usa `--tag` como agrupamento (`wiki/specs/tarefas.md:106`). O Meraki já adotou tags globais com filtro AND; a lição é manter tags **planas** e sem hierarquia. Uma taxonomia com pai/filho vira um segundo sistema de projetos.

## 3. O que não trazer

| Conceito do knudge | Por que não |
|---|---|
| Árvore `epic ⊃ issue ⊃ task` + marcador de pai | O Meraki já tem pasta + `task`/`issue` + promoção. Adicionar pai, profundidade, ciclo, papel e rollup cria um segundo modelo de agrupamento. Tags + projeto bastam. |
| Papel derivado (Epic/Feature/Story/Sub-task/Bug/Spike/Risk/Decision) | É útil para um corpus de agente; para o time, vira vocabulário a aprender e UI condicional. `kind`/tags já classificam. |
| Progresso de épico | Só faz sentido com árvore. Sem árvore, o board e os contadores por status já respondem. |
| Impacto por dependências | Exige DAG, validação de ciclo, UI de relações e manutenção. O time não pediu dependências; `blocked` + Q1–Q4 cobrem o caso comum. |
| Caminho crítico/PERT, throughput, cycle/lead time | Métricas de portfólio. O Meraki deve primeiro medir o básico; `demand_events` já permite calcular depois. |
| `task plan` + templates + `batch` JSONL | Ferramenta de agente/CLI para criar árvores em lote. O produto é uma UI para 10 pessoas; formulário simples é melhor. |
| Âncoras de código (`--anchor`) | O knudge liga notas a arquivos para agentes. No Meraki, links na descrição resolvem; âncora é mais um campo para manter. |
| Nota como fonte da verdade / store único | O Meraki usa SQLite e eventos; não há ganho em trocar o banco por Markdown. O que vale é a disciplina de derivar, não o formato. |
| Máquina de status `active/in_progress/blocked/closed` | O Meraki tem 5 status de fluxo; não trocar por 4 estados. `blocked` já é flag separada. |
| `rewind`/handoff | Contexto de sessão de agente. Não é uma feature de gestão de tarefas. |

## 4. Mapa mínimo para o Meraki

| Knudge | Meraki | Decisão |
|---|---|---|
| `scope=task` | `items.kind=task` | já existe |
| `scope=issue` | `items.kind=issue` + promoção | já existe; não criar árvore |
| `--parent`/`blocks` | pasta + tags | **não**; projeto agrupa |
| `active/in_progress/blocked/closed` | `backlog/todo/doing/review/done` + `blocked` | manter o fluxo do Meraki |
| `--checks` | descrição/contexto | manter texto, sem campo novo |
| `--anchor` | link na descrição | **não** como campo |
| `--tag` | `tags` + `item_tags` | adotado |
| `ready` | `?ready=1` com início/blocked/status | **adotar** |
| `impact`/`flow` | — | **não** no MVP |
| `close --outcome` | `done` + histórico; prompt opcional | **não** obrigatório |
| `task plan`/`batch` | criação unitária na UI | **não** no MVP |

## 5. Recomendação final

**Adotar agora:** apenas a view `Prontas`. Ela usa `start_date`, `blocked` e `status` que já existem, não muda o schema e responde à pergunta operacional “o que posso começar?”.

**Adotar como disciplina, sem código:** título = uma unidade de trabalho; descrição = contexto/critério; histórico = evidência; tags = agrupamento plano.

**Deixar fora:** hierarquia/épicos, dependências/impacto, progresso rollup, planos/templates, batch e âncoras. São boas soluções para um corpus de agente; para o Meraki, adicionam vocabulário, tabelas e telas sem responder melhor às três perguntas do MVP.

## 6. Limites desta análise

- O knudge não é um produto de gestão para humanos; as conclusões são sobre **mecânica**, não sobre UX final.
- “Prontas” sem dependências é uma adaptação, não a view original: o knudge exige dependências fechadas; o Meraki usa `blocked` manual + data de início.
- Números de linha referem-se à cópia em `_REF/knudge` no momento do levantamento; revalidar se o repositório for atualizado.
