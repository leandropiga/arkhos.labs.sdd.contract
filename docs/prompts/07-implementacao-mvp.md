# 07 — Implementação, rodada 1: MVP (T001–T035)

- **Data:** 2026-10-14
- **Destino:** Claude Code, mensagem comum (sem comando `/`). O Superpowers reconhece o pedido e
  ativa o `subagent-driven-development`.
- **Base:** instrução de implementação do `TUTORIAL_DRAFT.md`, adaptada pelo
  [ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md) (rodadas, `tasks.md` como
  plano, marcação `[X]`, parar antes do merge) e pelo ADR 0006 (Vitest em vez de Jest).

## Antes de enviar

```powershell
docker info --format '{{.ServerVersion}}'   # o Docker precisa estar rodando
git status                                  # árvore limpa, na main
```

## Texto

```text
Inicie a implementação do arquivo de tarefas specs/001-gestao-contratos-clientes/tasks.md usando
o fluxo do Superpowers: superpowers:subagent-driven-development.

Escopo desta rodada: somente as tarefas T001 a T035 (Setup, Fundação e História 1). Ao concluir a
T035, pare e me mostre o resultado. Não comece a T036.

Regras:

1. O plano é o tasks.md. Não regenere nem reescreva o plano e não crie outro plano em
   docs/superpowers/plans/. A tarefa Tnnn corresponde à Task nnn no ledger.
2. A spec (specs/001-gestao-contratos-clientes/spec.md) é a autoridade. plan.md, research.md,
   data-model.md e contracts/api.md são o contexto técnico. A constituição
   (.specify/memory/constitution.md) é inegociável.
3. Trabalhe num worktree isolado em .worktrees/, numa branch chamada 001-rodada-1-mvp.
4. Um subagente novo por tarefa, com revisão de aderência à spec e de qualidade depois de cada
   uma, e uma revisão geral no fim da rodada.
5. TDD rigoroso (superpowers:test-driven-development): o teste é escrito primeiro e visto
   falhando pelo motivo certo antes do código. Quando a tarefa diz "até T0xx passar", esse é o
   critério de pronto.
6. Ao concluir cada tarefa, marque-a como [X] no tasks.md, no mesmo commit da tarefa.
7. Commits em português, no formato "test|feat|chore: Tnnn <resumo>".
8. Use exatamente as versões de research.md (R-01). Atenção: prisma@7.10.0, não a tag latest.
9. Para os testes, suba o banco com "docker compose up -d" e crie backend/.env e
   backend/.env.test locais a partir dos exemplos, com valores de desenvolvimento. Esses arquivos
   não vão para o Git. GEMINI_API_KEY pode ser um valor fictício: nenhum teste chama a API real.
10. Pare e me pergunte antes de: merge na main, push, ou qualquer ação fora do worktree.
11. Ao terminar a rodada: rode as suítes de teste completas do backend e do frontend e mostre a
    saída, e liste todos os Rulings do ledger. Vou copiá-los para o diário.
```

## O que mudou em relação ao rascunho

| Rascunho | Aqui | Por quê |
|----------|------|---------|
| Executar o arquivo de tarefas inteiro | Só T001–T035, e parar | o Superpowers 7 não pausa entre tarefas; o tamanho da rodada é o nosso ponto de revisão ([ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md)) |
| "Crie um worktree isolado" | Worktree em `.worktrees/`, branch com nome definido | facilita achar a branch no diário e no tutorial |
| "Não regenere o plano" | Mantido, e explicado como (`Tnnn` = `Task nnn`, nada em `docs/superpowers/plans/`) | o formato nativo do Superpowers é outro; sem isso ele tenderia a criar um plano próprio |
| — | Marcar `[X]` no `tasks.md` | rastreabilidade do Spec Kit |
| — | Spec como autoridade, constituição inegociável | é assim que a v7 resolve conflitos sozinha (*Rulings*) |
| Teste em Jest | Vitest + supertest | [ADR 0006](../decisoes/0006-vitest-no-backend-e-frontend.md) |
| — | Parar antes de merge e push | o merge na `main` é o nosso commit de etapa |
| — | Listar os *Rulings* | o ledger fica fora do Git; o diário guarda as decisões |
