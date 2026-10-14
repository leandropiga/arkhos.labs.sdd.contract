# 08 — Implementação, rodada 2: clientes (T036–T046)

- **Data:** 2026-10-14
- **Destino:** Claude Code, mensagem comum (sem comando `/`).
- **Base:** [prompt 07](./07-implementacao-mvp.md). Desta vez o pedido foi curto, porque as regras
  (plano = `tasks.md`, worktree, TDD, `[X]` no mesmo commit, parar antes do merge) já estavam no
  `CLAUDE.md` e no [ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md).

## Texto

Mensagens enviadas, na ordem:

```text
inicie a rodada 2
```

```text
pode seguir, me avise só ao fim da T046
```

No meio da rodada, o limite de uso da API derrubou a revisão final. Eu só disse "pode seguir" e o
agente retomou o revisor do ponto onde parou.

Depois da rodada:

```text
corrija o NUL e escreva o diário
```

## O que o agente deduziu sozinho

| Faltava dizer | De onde veio |
|---------------|--------------|
| Escopo da rodada (US2 = T036–T046) | `docs/diario/11-…` ("Próximo passo") e o quadro de rodadas do ADR 0010 |
| Worktree e nome da branch | convenção da rodada 1 → `.worktrees/002-rodada-2-clientes` |
| Parar antes do merge e do push | ADR 0010 |
| `.env` locais, Docker | diário 11 e `backend/.env.example` |

**Lição:** depois da primeira rodada, o prompt pode ser curto **se** as regras estiverem escritas
no repositório. Um `CLAUDE.md` e um ADR bons valem mais que um prompt comprido.
