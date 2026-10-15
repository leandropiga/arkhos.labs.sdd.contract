# 16 — Implementação, rodada 6: acabamento (T074–T077)

- **Data:** 2026-10-14
- **Fase:** 5 — Implementação
- **Status:** concluída (falta o merge na `main`; a T078 fica para a próxima etapa)

## Objetivo

Fechar os itens que atravessam o app todo: segurança transversal, desempenho com volume, bundle
sem chave da IA e README da raiz. Foram as tarefas T074 a T077 do `tasks.md`, com o
`subagent-driven-development` ([ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md)).
A T078 (roteiro manual de 14 passos) é manual, então ficou de fora desta rodada.

## Contexto / pré-requisitos

- Rodada 5 mergeada na `main` ([entrada 15](./15-implementacao-rodada-5.md)).
- Worktree `.worktrees/006-rodada-6-acabamento`; o worktree da rodada 5 foi removido.
- Os `.env` foram recriados dos exemplos, como na rodada anterior.

```bash
git worktree add .worktrees/006-rodada-6-acabamento -b 006-rodada-6-acabamento main
cd .worktrees/006-rodada-6-acabamento
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
(cd backend && npm ci) && (cd frontend && npm ci)
```

## Passo a passo

### 1. Dois grupos, em paralelo

Os grupos mexem em lugares diferentes, então rodaram ao mesmo tempo:

1. **T074 e T075** — dois arquivos de teste novos no backend.
2. **T076 e T077** — conferir o bundle e escrever o README.

O script `task-brief` do Superpowers espera títulos `Task N`, que o nosso `tasks.md` não tem.
Escrevi os dois briefs à mão, copiando as linhas das tarefas.

### 2. O que os testes provaram

- **T074 (`seguranca.test.ts`):** as 17 rotas protegidas devolvem `401 NAO_AUTENTICADO` sem cookie e
  com token inválido. Erros 400, 404, 409, 500 e 503 não vazam `stack`, `prisma`, caminho de
  arquivo nem a chave do Gemini. Nenhum bug real apareceu.
- **T075 (`desempenho.test.ts`):** com 10.000 clientes e 10.000 contratos, todas as consultas
  responderam em até 38 ms (limite: 2 s).
- **T076:** `npm run build` no frontend e `grep` no `dist/` por `GEMINI`, `genai`, `googleapis`:
  zero ocorrências. Não gerou arquivo, então não tem commit.

### 3. Revisão

Revisão única das quatro tarefas: spec ✅, qualidade aprovada, sem Critical/Important. Rodei a
suíte eu mesmo: backend 302 testes, frontend 75, tudo verde.

## Arquivos gerados/alterados

| Arquivo | Para quê |
|---|---|
| `backend/tests/http/seguranca.test.ts` | SC-005 e SC-009 |
| `backend/tests/http/desempenho.test.ts` | SC-004 |
| `README.md` | resumo, stack e como rodar |
| `specs/.../tasks.md` | T074–T077 marcadas `[X]` |

## Problemas e soluções

- **Problema:** o bloco "Como rodar" do README juntava backend e frontend no mesmo terminal;
  o `npm run dev` do backend não termina, então o frontend nunca subia.
  **Solução:** separei em dois blocos (achado do revisor).

## Rulings

Nenhum. Nenhum conflito entre tarefas; nada foi parado no limite de rodadas.

## Aprendizados

- **Testes transversais costumam passar de primeira** quando as rotas já nasceram com os mesmos
  padrões. O valor deles é travar a regressão, não achar bug hoje.
- **Frase de checklist não vira script sozinha:** o `task-brief` precisou de ajuste manual.

## Dívidas anotadas

- `desempenho.test.ts` não apaga os 20.000 registros ao fim (quem limpa é o setup global).
- `seguranca.test.ts`: `not.toContain(chave)` quebraria se `GEMINI_API_KEY` ficasse vazia.
- O chunk JS do frontend tem 964 kB (aviso do Vite): candidato a code splitting no deploy.

## Próximo passo

- Merge de `006-rodada-6-acabamento` na `main` (commit de etapa) e push.
- T078: roteiro manual do `quickstart.md` (14 passos) e registro no diário.
