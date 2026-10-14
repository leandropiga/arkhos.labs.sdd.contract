# 0010 — Implementar com o Superpowers sobre o `tasks.md`, por incrementos

- **Data:** 2026-10-14
- **Status:** aceita

## Contexto

O [ADR 0001](./0001-spec-kit-e-superpowers.md) diz que o Spec Kit cuida do *o quê* e o
Superpowers do *como*, mas não diz **como os dois se encontram** na implementação. Há dois
executores possíveis para o mesmo `tasks.md`:

- `/speckit-implement` (Spec Kit): executa as tarefas em ordem na própria sessão e marca `[X]`.
  TDD é só uma instrução; não há worktree, subagentes nem revisão de código.
- Superpowers 7.0: `subagent-driven-development` (um subagente novo por tarefa, revisão de spec +
  qualidade depois de cada uma, revisão geral no fim), `using-git-worktrees`,
  `test-driven-development` e `finishing-a-development-branch`.

Detalhes da v7 que pesam na decisão:

- Ela **não pausa** entre tarefas: decide sozinha e registra cada decisão no *ledger* como
  `Ruling: <decisão> — <motivo> — <custo se errado>`. Só para diante de algo irreversível,
  sensível à segurança, fora do worktree (merge, push) ou de um plano quebrado.
- O ledger e os artefatos de trabalho ficam em `.superpowers/sdd/`, que é **ignorado pelo Git**.
- O formato nativo do plano é o do `writing-plans` (`Task N`, em `docs/superpowers/plans/`).

## Opções consideradas

1. **Só `/speckit-implement`**: simples e barato, mas abandona o ADR 0001 e deixa o TDD na boa
   vontade do agente.
2. **Superpowers sobre o `tasks.md`**: fiel ao rascunho ("não regenere o plano"), disciplina
   imposta pela ferramenta, decisões registradas. Mais caro em tempo e tokens.
3. **Híbrido com `writing-plans`**: o Superpowers reescreve cada história no formato dele.
   Duplica o `tasks.md` em dois planos que podem divergir.
4. **Superpowers inline (`executing-plans`)**: mais barato que a 2, mas sem contexto limpo por
   tarefa nem revisão por tarefa.

## Decisão

Opção 2, executada **por incrementos**.

- O plano é o `specs/001-gestao-contratos-clientes/tasks.md`. Ele **não é regenerado** e não se
  cria outro plano em `docs/superpowers/plans/`. A tarefa `Tnnn` corresponde à `Task nnn` no
  ledger.
- A **spec é a autoridade**; o `plan.md` e os artefatos de design são o contexto técnico; a
  constituição é inegociável.
- Cada rodada tem um escopo explícito no prompt ("execute de T001 a T035 e pare"), porque a v7 não
  pausa sozinha. Rodadas previstas:

  | Rodada | Tarefas | Entrega |
  |--------|---------|---------|
  | 1 | T001–T035 | Setup + Fundação + US1 (MVP) |
  | 2 | US2 | clientes (P1 completo) |
  | 3 | US3 | contratos com PDF |
  | 4 | US4 | análise por IA |
  | 5 | US5 + US6 | painel e perfil |
  | 6 | Acabamento | segurança, desempenho, quickstart |

- Cada tarefa concluída marca `[X]` no `tasks.md`, no mesmo commit, para manter a
  rastreabilidade do Spec Kit.

### Git

- O trabalho de cada rodada acontece num **worktree** em `.worktrees/`, numa branch própria, com
  commits por tarefa (pt-BR, `test|feat|chore: Tnnn <resumo>`).
- O agente **para antes do merge e do push**. Revisamos, e o merge na `main` (com push) é o
  "commit de etapa" exigido pelo `CLAUDE.md`. A tag da fase (`fase-5-implementacao`) sai na última
  rodada.

### Registro para o tutorial

- Ao fim de cada rodada, os *Rulings* do ledger (`.superpowers/sdd/…/progress.md`) são copiados
  para a entrada do diário, porque o ledger em si não vai para o Git.
- Bugs reais encontrados durante a implementação seguem o
  [ADR 0005](./0005-bugs-reais-e-bug-encenado.md) (extensão `bug` do Spec Kit).

## Consequências

- O leitor vê a divisão de trabalho na prática: o Spec Kit entrega a lista; o Superpowers a
  executa com disciplina.
- Mais tempo e tokens por tarefa (uma revisão a cada uma), em troca de menos retrabalho.
- O `/speckit-implement` fica fora do fluxo principal. O tutorial o cita como alternativa mais
  simples.
- Como o Superpowers não pausa, a revisão humana acontece **entre rodadas**, não entre tarefas.
  O tamanho das rodadas é o nosso controle.
- O `tasks.md` e o ledger contam a mesma história por caminhos diferentes (checkbox × ledger);
  se divergirem, vale o `git log`.
