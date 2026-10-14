# 14 — Implementação, rodada 4: análise de riscos por IA (T058–T065)

- **Data:** 2026-10-14
- **Fase:** 5 — Implementação
- **Status:** concluída (falta o merge na `main`)

## Objetivo

Entregar a **História 4**: o botão "Solicitar Análise de PDF". O backend manda o PDF para o
Gemini, espera no máximo 15 s e guarda o resultado (resumo, riscos e cláusulas críticas). Se a IA
falhar, a pessoa vê um aviso e a análise anterior continua lá. Foram as tarefas T058 a T065 do
`tasks.md`, com o `subagent-driven-development` do Superpowers
([ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md)), mais as dívidas que a
rodada 3 deixou anotadas.

## Contexto / pré-requisitos

- Rodada 3 mergeada na `main` ([entrada 13](./13-implementacao-rodada-3.md)).
- Worktree `.worktrees/004-rodada-4-analise`, branch `004-rodada-4-analise`.
- Worktree novo não traz `node_modules`, `.env` nem o client do Prisma (`src/generated` fica fora
  do Git). Foi preciso copiar os `.env`, rodar `npm ci` nos dois pacotes e `npx prisma generate`.

```bash
git worktree add .worktrees/004-rodada-4-analise -b 004-rodada-4-analise main
cd .worktrees/004-rodada-4-analise
cp ../003-rodada-3-contratos/backend/.env ../003-rodada-3-contratos/backend/.env.test backend/
cp ../003-rodada-3-contratos/frontend/.env frontend/
(cd backend && npm ci && npx prisma generate)
(cd frontend && npm ci)
```

Baseline antes de mexer: backend 207 testes, frontend 54.

## Passo a passo

### 1. Três grupos de tarefas

Em vez de um implementador por tarefa, juntei as tarefas por camada. Cada grupo seguiu TDD (teste
primeiro, vendo falhar) e um commit por tarefa:

1. **T058, T061, T062** — teste do cliente de IA, modelo `AnaliseContrato` (com migração) e o
   cliente real do Gemini. O commit da T058 fica vermelho de propósito.
2. **T059, T063, T064** — teste HTTP, serviço (com a trava de concorrência) e a rota
   `POST /api/contratos/:id/analise`. Entraram junto as dívidas do backend: `analiseEmAndamento`
   que expira em 60 s e `PUT` sem corpo devolvendo 400 em português.
3. **T060, T065** — teste e painel de análise no detalhe do contrato. Entraram junto as dívidas do
   frontend: `useAtrasado` em um só lugar, "Carregando..." nas listas e guarda de duplo envio ao
   excluir.

### 2. O que as revisões pegaram

Cada grupo passou por uma revisão de tarefa. Dois grupos voltaram com defeitos de verdade:

- **Grupo 2 — corrida na análise (Important).** Se alguém trocava o PDF com uma análise em curso,
  a análise do PDF *antigo* era gravada como se fosse do novo. E o `finally` liberava a trava de
  qualquer análise, não só a própria. Correção: a análise guarda o seu carimbo e só grava dentro
  de uma transação que confere se a trava ainda é dela; o `finally` só libera a própria trava.
- **Grupo 3 — toast com o texto errado (Critical).** O aviso de IA fora do ar mostrava a mensagem
  que vinha do backend, diferente do texto que a spec manda. O teste não pegava porque o mock já
  devolvia o texto certo. Correção: texto fixo no frontend, e o mock do teste passou a devolver a
  mensagem real do backend.
- **Grupo 3 — data no dia errado (Important).** A data da análise era cortada em UTC. No Brasil
  (UTC-3), uma análise feita às 22h30 aparecia com o dia seguinte. Correção: formatar no fuso
  local, com o `TZ` fixado nos testes para não depender da máquina.

### 3. Revisão final e verificação

A revisão final da branch (modelo mais capaz) não achou nada Crítico e liberou o merge. Rodei as
suítes de novo depois dos relatórios:

```bash
cd backend && npx vitest run && npx tsc --noEmit    # 231 testes
cd ../frontend && npx vitest run && npx tsc -b      # 66 testes
npm run build && grep -ri GEMINI dist               # vazio: a chave não vai pro bundle
```

## Rulings do ledger

Decisões tomadas sem parar para perguntar (custo se estiver errado entre parênteses):

1. **Briefs montados à mão.** O script `task-brief` da skill procura títulos "Task N", mas o
   `tasks.md` usa `T058`. (Nada: só o jeito de montar o pedido.)
2. **`PUT` trocando o PDF durante uma análise** → o resultado é descartado com
   `409 ANALISE_EM_ANDAMENTO` e mensagem própria; o `contracts/api.md` não diz nada sobre isso.
   (Trocar código ou mensagem; um 404 seria mais exato se o contrato foi excluído no meio.)
3. **`<select>` cru continua** nos formulários de cliente e contrato. O Select do shadcn é Radix;
   trocar exigiria reescrever os testes (`selectOptions`) e adicionar polyfills do jsdom.
   (Fica um `<select>` nativo estilizado.)
4. **Corrida estreita no `PUT` adiada.** A transação do `PUT` confirma *antes* de o PDF novo ser
   renomeado no storage. Um `POST /analise` nesse intervalo de um `rename` leria o PDF antigo e
   gravaria como análise do novo. É uma janela minúscula num app de um usuário. (Pode gravar
   análise do PDF antigo; candidato à extensão `bug` ou à fase 7.)

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `backend/prisma/schema.prisma` + migração `analise_contrato` | modelo `AnaliseContrato` (única por contrato, `ON DELETE CASCADE`) |
| `backend/src/modules/analise/` | cliente do Gemini, serviço com trava, rota e `trava.ts` |
| `backend/tests/unit/cliente-ia.test.ts`, `backend/tests/http/analise.test.ts` | testes da história 4 |
| `frontend/src/features/contratos/painel-analise.tsx` | painel de análise |
| `frontend/src/lib/use-atrasado.ts` | `useAtrasado` único (antes triplicado) |
| `specs/.../tasks.md` | T058–T065 marcadas `[X]` |

## Problemas e soluções

- **Problema:** worktree novo sem o client do Prisma (`generated` fora do Git).
  **Solução:** `npx prisma generate` depois do `npm ci`.
- **Problema:** timers falsos com supertest e Prisma ficam frágeis.
  **Solução:** o serviço aceita `tempoLimiteIaMs` e os testes usam 100 ms em vez de esperar 15 s.
- **Problema:** o teste da corrida estourava o tempo-limite antes do `PUT`.
  **Solução:** esse teste usa um app com tempo-limite de 10 s.

## Aprendizados

- **Mock que devolve a resposta "certa" esconde o bug.** O teste do toast só ficou honesto quando o
  mock passou a devolver a mensagem *real* do backend.
- **Concorrência é onde a revisão mais paga.** As duas corridas foram achadas lendo, não rodando.
- **Fuso horário é bug clássico de data.** Timestamp precisa de fuso local; data pura (data de
  assinatura) continua como está.

## Dívidas anotadas

- Corrida estreita do `PUT` (ruling 4) e `<select>` do shadcn (ruling 3).
- Minors: `paraAnaliseDto` em arquivo próprio; `key={contrato.id}` no `PainelAnalise`; data dentro
  de `<time>`; teste duplicado em `cliente-ia.test.ts`; documentar o 409 de descarte no `api.md`.
- Da rodada 3, ainda para o deploy (fase 7): `EXDEV` no `fs.rename` entre volumes e cabeçalhos
  `Cache-Control`/`nosniff` no download do PDF.

## Próximo passo

- Merge de `004-rodada-4-analise` na `main` (commit de etapa) e push.
- Rodada 5: Histórias 5 e 6 (painel da Home e perfil, T066–T073).
