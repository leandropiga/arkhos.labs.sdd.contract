# 0001 — Usar Spec Kit + Superpowers como frameworks SDD

- **Data:** 2026-10-14
- **Status:** aceita

## Contexto

Precisamos escolher o framework de SDD do laboratório. O rascunho do tutorial
(`TUTORIAL_DRAFT.md`) já propõe uma combinação de dois frameworks.

## Opções consideradas

1. **Só GitHub Spec Kit**: gera artefatos duráveis (constituição, spec, plano, tarefas), mas
   não obriga o agente a seguir uma disciplina na hora de implementar.
2. **Só Superpowers**: impõe TDD, worktrees, subagentes e revisão de código, mas os planos que
   gera são temporários. Não sobra uma spec "viva" no repositório.
3. **Spec Kit + Superpowers**: o Spec Kit cuida do *o quê* (artefatos), e o Superpowers cuida do
   *como* (execução disciplinada).
4. Outros (OpenSpec, BMAD, Kiro): bons, mas fogem do rascunho e não trazem ganho claro aqui.

## Decisão

Opção 3, como no rascunho. O Spec Kit é usado nas fases 2 a 4 (constituição → spec → clarify →
plano → tarefas), e o Superpowers na fase 5 em diante (implementação com TDD e subagentes).

## Consequências

- O leitor do tutorial precisa instalar as duas ferramentas.
- A implementação custa mais tempo e tokens (TDD + revisão a cada tarefa), em troca de menos
  retrabalho.
- Ainda vamos conferir, na prática, se os comandos citados no rascunho (ex.:
  `/speckit-bug-assess`) existem na versão atual das ferramentas. Divergências viram novos ADRs.
