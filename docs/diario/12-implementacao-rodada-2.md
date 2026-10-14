# 12 — Implementação, rodada 2: cadastro de clientes (T036–T046)

- **Data:** 2026-10-14
- **Fase:** 5 — Implementação
- **Status:** concluída (falta o merge na `main`)

## Objetivo

Entregar a **História 2**: cadastrar, editar, listar, filtrar e excluir clientes. Foram as tarefas
T036 a T046 do `tasks.md`, de novo com o `subagent-driven-development` do Superpowers
([ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md)).

Com ela, as histórias 1 e 2 (as duas P1) funcionam.

## Contexto / pré-requisitos

- Rodada 1 mergeada ([entrada 11](./11-implementacao-rodada-1.md)).
- Docker com o PostgreSQL de pé (`docker compose up -d`).
- Um worktree novo: o da rodada 1 já tinha sido removido, então foi preciso refazer o ambiente.

## Passo a passo

### 1. O pedido

Foi curto: "inicie a rodada 2". O agente achou o escopo no próprio diário 11 e no quadro de
rodadas do ADR 0010. Texto em
[`docs/prompts/08-implementacao-clientes.md`](../prompts/08-implementacao-clientes.md).

### 2. Preparar o worktree

```bash
git worktree add .worktrees/002-rodada-2-clientes -b 002-rodada-2-clientes
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test   # e trocar os valores "troque-por-..."
(cd backend && npm ci)
(cd frontend && npm ci)
(cd backend && npx prisma migrate deploy)
```

Antes de qualquer tarefa, rodei as suítes: backend 78 verdes, frontend 27 verdes. Assim, se algo
quebrasse depois, eu saberia que foi culpa da rodada.

### 3. Pré-voo

A skill manda cruzar as tarefas antes de começar (quem produz o quê, quem consome). Resultado:
nenhum conflito. Uma curiosidade: o script `task-brief` da skill procura títulos `Task N`, e o
`tasks.md` usa `T036`. Os briefs foram montados à mão a partir do `tasks.md`.

### 4. Execução, em lotes

| Lote | Tarefas | O que fez | Revisão |
|------|---------|-----------|---------|
| A | T036–T039 | só testes do backend, **vermelhos** de propósito | aprovado |
| B | T041–T043 | CPF, esquemas zod, serviço e rotas | aprovado |
| C | T040, T044–T046 | teste das telas, depois lista, formulário e detalhe | aprovado |

Um commit por tarefa, `[X]` no `tasks.md` no mesmo commit. Cada lote passou por uma revisão
(spec + qualidade) antes do próximo.

Dentro de um lote o fluxo foi sempre o mesmo: o teste é escrito e **visto falhando pelo motivo
certo** (módulo ou rota inexistente, não erro de digitação), só então vem o código.

### 5. Revisão final da branch

Feita com o modelo mais capaz. Sem nenhum problema Critical. O achado importante:

- **`campos` com duas mensagens para o mesmo campo.** O zod 4 não interrompe a cadeia de
  checagens, então um `rg` vazio devolvia "Informe o RG." **e** "O RG deve ter ao menos 1
  caracteres.". Quase invisível na tela (o formulário barra o vazio antes), mas é a resposta
  pública da API, com português errado. O revisor rodou um script de zod para provar.

Outras correções da mesma onda: byte NUL num campo de texto dava 500 (o Postgres recusa; agora é
400), a lista mostrava linhas antigas depois de uma busca que falhou, e o formulário/detalhe
mantinham o estado antigo ao trocar de `id`.

Uma re-revisão só do diff das correções confirmou os quatro itens.

### 6. O NUL, versão 2

A correção do NUL trouxe um problema novo: o agente escreveu o byte NUL **literal** dentro do
código, em vez do escape `'\u0000'`. Resultado: o Git passou a tratar o arquivo como binário e,
de quebra, o arquivo foi regravado em CRLF. O diff virou "Binary files differ". A re-revisão
pegou, e o conserto veio no commit `ab50239` (trocar o byte pelo escape e regravar em LF):

```bash
git ls-files --eol backend/src/modules/clientes/esquemas-clientes.ts
# i/lf    w/lf    attr/text=auto eol=lf
```

### 7. Resultado

```text
backend/   npx vitest run → Test Files 16 passed (16) | Tests 164 passed (164)   tsc --noEmit ok
frontend/  npx vitest run → Test Files  7 passed (7)  | Tests  41 passed (41)
```

(Antes da rodada: 78 e 27.)

## Rulings do ledger

Copiados de `.superpowers/sdd/tasks/progress.md` (o ledger fica fora do Git):

1. **UF em minúscula (`sp`) é rejeitada com 400.** O `data-model.md` lista as 27 siglas em
   maiúsculas e a spec não manda normalizar. *Se errado:* trocar o teste e usar `.toUpperCase()`.
2. **Contratos em `GET /api/clientes/:id` por `dataAssinatura` decrescente** (FR-014).
3. **T041+T042+T043 despachadas juntas** (um implementador, três commits, uma revisão): a T042 não
   tem teste verde isolado antes da T043. *Se errado:* revisão mais larga.
4. **T040+T044+T045+T046 despachadas juntas**, pelo mesmo motivo.
5. **UF como `<select>` nativo.** Não há Select do shadcn instalado; evita dependência nova.
   *Se errado:* trocar por `NativeSelect` depois.
6. **Estacionado, depois resolvido:** NUL literal e CRLF em `esquemas-clientes.ts`. O fluxo não
   prevê segunda onda de correção, então a decisão veio para o humano, que mandou corrigir
   (`ab50239`).
7. **Estacionado:** o detalhe mostra o cliente anterior por 1 frame ao trocar de `id` (o reset
   está num `useEffect`). Sem caminho na interface que troque de `id` direto. Adiado.

## Prompts utilizados

- [`docs/prompts/08-implementacao-clientes.md`](../prompts/08-implementacao-clientes.md)

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `backend/src/lib/cpf.ts` | normalizar CPF e validar dígitos verificadores |
| `backend/src/modules/clientes/` | esquemas zod, serviço e rotas de `/api/clientes` |
| `backend/tests/unit/cpf.test.ts`, `backend/tests/http/clientes-*.test.ts`, `backend/tests/helpers/clientes.ts` | testes da US2 |
| `frontend/src/features/clientes/` | lista, formulário (criar/editar) e detalhe |
| `frontend/src/rotas.tsx` | rotas `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar` |
| `frontend/tests/clientes/clientes.test.tsx` | testes das telas |
| `specs/.../tasks.md` | T036–T046 marcadas `[X]` |

## Problemas e soluções

- **Problema:** o limite de uso da API derrubou a revisão final no meio do trabalho.
  **Solução:** o agente derrubado guarda o trabalho feito; quando o limite liberou, mandei uma
  mensagem para o mesmo agente continuar de onde parou.
- **Problema:** o script `task-brief` da skill não entende o formato `T036` do Spec Kit.
  **Solução:** montar os briefs à mão a partir do `tasks.md`. Vale um ajuste na skill ou um
  formato de plano mais alinhado.
- **Problema:** um subagente criou um arquivo temporário fora do worktree
  (`.worktrees/2-placeholder`). **Solução:** ele mesmo apagou na hora; nada ficou. Mesma lição da
  rodada 1: diga o que o subagente não pode fazer.
- **Problema:** a correção do NUL piorou o arquivo (ver passo 6).
  **Solução:** a re-revisão pegou; novo commit.

## Aprendizados

- **Rodar a suíte antes de começar** dá a linha de base. Sem ela, "78 verdes" depois não prova nada.
- **Teste vermelho de verdade.** Os testes do lote A falharam por rota inexistente (404) e por
  módulo faltando, não por erro bobo. Os que já passavam (401, 404 de id inexistente) são
  guardas úteis, não testes mortos.
- **A revisão final continua valendo.** O defeito das mensagens duplicadas passou por três
  revisões de tarefa e só o olhar de conjunto (com um script que provou o caso) o tornou
  relevante.
- **Correção também precisa de revisão.** A "correção" do NUL criou um problema novo; sem a
  re-revisão do diff, ele teria ido para a `main`.
- **Agrupar tarefas pequenas** (lotes A, B, C) cortou despachos e revisões sem perder rastreio,
  porque o commit continua sendo por tarefa.

## Próximo passo

- Merge da branch `002-rodada-2-clientes` na `main` (commit de etapa) e push.
- Rodada 3: História 3 (contratos com PDF, limite de 50 MB), conforme o ADR 0010.
- Itens menores que seguem adiados: filtro `nome` sem escape de `%`/`_`, guarda de UUID repetida,
  `try/catch` redundante nas rotas (Express 5), P2003 sem teste, formatação de telefone/CEP no
  detalhe, `aria-describedby` nos erros.
