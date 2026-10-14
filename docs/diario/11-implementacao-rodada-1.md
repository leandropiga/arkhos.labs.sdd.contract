# 11 — Implementação, rodada 1: o MVP de login (T001–T035)

- **Data:** 2026-10-14
- **Fase:** 5 — Implementação
- **Status:** concluída

## Objetivo

Colocar o código de pé pela primeira vez: **Setup + Fundação + História 1** (login, sessão e
bloqueio após 5 erros). Foram as tarefas T001 a T035 do `tasks.md`, executadas pelo fluxo
`subagent-driven-development` do Superpowers, como decidido no
[ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md).

A ideia do fluxo: um subagente **novo** para cada tarefa (contexto limpo), uma revisão
"fez o que a spec manda?" e "o código está bom?" depois de cada uma, e uma revisão geral no fim.
Você, humano, só aparece de novo quando tudo termina.

## Contexto / pré-requisitos

- `tasks.md` pronto e analisado ([entradas 09 e 10](./10-analise.md)).
- Docker rodando (PostgreSQL 18 via `docker compose`).
- Superpowers v7 instalado ([entrada 04](./04-instalando-spec-kit-e-superpowers.md)).

## Passo a passo

### 1. O pedido

O prompt está na íntegra em [`docs/prompts/07-implementacao-mvp.md`](../prompts/07-implementacao-mvp.md).
Os pontos que mais pesaram:

- O plano é o `tasks.md` (não se regenera nem se cria outro plano).
- Worktree em `.worktrees/`, branch `001-rodada-1-mvp`.
- TDD rigoroso e commit por tarefa (`test|feat|chore: Tnnn <resumo>`), com `[X]` no `tasks.md`
  **no mesmo commit**.
- Parar ao fim da T035 e **perguntar antes de merge, push ou qualquer coisa fora do worktree**.

Depois do primeiro pedido, a única outra mensagem minha no meio foi "pode seguir, me avise só ao
fim da T035".

### 2. O que saiu

- **44 commits** na branch, **94 arquivos**, as 35 tarefas marcadas `[X]`.
- Backend: Express 5 + Prisma 7 + PostgreSQL, com JWT em cookie HttpOnly, senha com scrypt,
  bloqueio de login persistente e middleware único de erros.
- Frontend: Vite + React + Tailwind v4 + shadcn/ui, tela de login, rotas protegidas e menu lateral.

Suítes no fim (rodadas depois da última correção):

```text
backend/   npx vitest run   → Test Files 12 passed (12) | Tests 78 passed (78)
frontend/  npx vitest run   → Test Files  6 passed (6)  | Tests 27 passed (27)
```

`tsc --noEmit` (backend) e `npm run build` (frontend, que agora também confere os tipos dos
testes) passam.

### 3. Como o fluxo se comportou

- Todas as tarefas passaram pelas duas revisões. A T021 e a T027 precisaram de uma rodada de
  correção; as demais passaram de primeira.
- A **revisão final da branch** (feita com o modelo mais capaz) saiu como "pronta com correções".
  Quatro problemas sérios, todos corrigidos com teste escrito antes:
  1. **Bloqueio de login furado por concorrência.** 50 tentativas simultâneas foram todas
     verificadas, contra o SC-005. Passou a ser atômico no banco.
  2. **Mensagens do zod em inglês** apareciam nos erros da API.
  3. **`Perfil.id`** era `number` no frontend e UUID (`string`) no backend.
  4. **`rotas.tsx`** (a proteção de rotas) não tinha teste.

  Mais dois detalhes menores: asserções "mortas" num teste (que nunca falhariam) e o cabeçalho
  `X-Powered-By` ligado.

## Prompts utilizados

- [`docs/prompts/07-implementacao-mvp.md`](../prompts/07-implementacao-mvp.md)

## Rulings do ledger

Na v7 o agente **decide sozinho** o que for ambíguo e anota no ledger como
`Ruling: <decisão> — <motivo> — <custo se errado>`. Aqui estão todos, na ordem. É material
valioso para o tutorial: mostra o tipo de decisão que a IA toma sem te chamar.

| # | Decisão | Custo se errado |
|---|---------|-----------------|
| P1 | A T004 criou os arquivos de setup de teste vazios; a T025 os preencheu | dois arquivos reescritos |
| P2 | Ordem real da Fundação: T017…T022, **T025, T023**, T024, T026, T027 | só a ordem dos commits difere da numeração |
| P3 | O helper `criarUsuarioELogar` assina o JWT direto, sem a rota de login | o helper não exercita o login real (a T028 cobre) |
| P4 | `app.ts` exporta a fábrica `criarApp()` | renomear imports nos testes |
| P5 | `shadcn@4.21.4` em vez de `@latest`, com dependências nas versões de R-01 | CLI mais antigo que o do dia |
| P6 | Removido o lint que vem no template do Vite (o plano não o justifica) | projeto sem lint |
| P7 | `@types/node` 24.19.2 como devDependency do frontend | uma dependência a mais |
| P8 | As libs recebem segredo e ambiente por parâmetro | assinaturas mais verbosas |
| P9 | Tarefas só de teste são commitadas **falhando** (TDD) | suíte vermelha em commits intermediários |
| P10 | O client gerado do Prisma fica fora do Git; um `postinstall` o gera | quem clona precisa do `generate` |
| P11 | O seed ganhou teste próprio | um teste a mais |
| P12 | O layout ganhou teste próprio | sobreposição parcial com a T031 |
| — | O trailer `Co-Authored-By` é o do modelo que escreveu cada commit (alguns dizem Haiku) | trailers diferentes no histórico |
| — | Vulnerabilidades do `npm audit` na CLI do Prisma aceitas, sem `audit fix` | exposição só em desenvolvimento |
| T006 | `create-vite` atual; removido do template o que não está em R-01 | algum pacote pode precisar voltar |
| T008 | Aceitos `cn`, `shadcn` (runtime) e `@fontsource-variable/geist` | 3 pacotes a mais; o plano precisa registrar |
| T008 | Mantido o `button.tsx` que o `init` gerou | nenhum |
| T009 | O `form` não existe no registry; trocado por `Field` + react-hook-form + zod | padrão diferente do plano ([ADR 0011](../decisoes/0011-formularios-com-field-e-dependencias-do-shadcn.md)) |
| T009 | Aceitos `next-themes` e os componentes extras do sidebar | um pacote a mais |
| T016 | `vitest.config` do frontend com `unstubGlobals` e `mockReset` | config mexida fora do arquivo de teste |
| T021 | O `validar.ts` ganhou teste próprio | um teste a mais |
| T022 | O middleware de autenticação ganhou teste unitário | sobreposição com a T015 |
| T026 | O `api.ts` trata resposta não-JSON e falha de rede | dois testes a mais |
| T026 | Código `ERRO_DE_REDE`, que só existe no cliente | o contrato talvez precise listá-lo |
| T028 | Logout é rota protegida, **sem** revogação do JWT | token copiado vale até 8 h |
| — | Bloqueio vencido **zera o contador** (a regra literal "== 5" deixaria um contador parado em 5 sem bloquear nunca mais) | diverge do texto do data-model |
| T033 | Cookie `Secure` mantido fora de development; cenário de logout da T028 passou a enviar cookies explícitos | o teste não usa o cookie jar do supertest |
| T034 | Rota `/login` ligada à `TelaLogin` já na T034 | uma linha antecipada |
| Final | Correção final cobriu os 4 achados sérios e 2 menores; `plan.md`/ADR ficaram para o commit de etapa (este) | merge sem o `plan.md` atualizado (resolvido neste commit) |
| Final | Rota coringa e logout que falha ficam para as próximas rodadas | UX pior em casos raros |

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml`, `docker/init-db.sql` | PostgreSQL 18 com os bancos `contratos` e `contratos_test` |
| `backend/` | API: env, erros, validação, auth (login/logout/sessão/bloqueio), seed, testes |
| `frontend/` | SPA: shadcn/ui, cliente HTTP, rotas protegidas, menu, tela de login, testes |
| `specs/.../tasks.md` | T001–T035 marcadas `[X]` |
| [`docs/decisoes/0011-…`](../decisoes/0011-formularios-com-field-e-dependencias-do-shadcn.md) | ADR do `Field` e das dependências reais do shadcn |
| `specs/.../plan.md` | nota de "Atualização" sobre o ADR 0011 |

O ledger (`.superpowers/sdd/`, fora do Git) guarda os relatórios, briefs e a lista de itens
menores adiados.

## Problemas e soluções

- **Problema:** na T023, um subagente rodou `taskkill /IM node.exe` para parar o servidor de
  desenvolvimento. Isso matou **todos** os processos Node da máquina, não só os do projeto.
  **Solução:** nada se perdeu de forma permanente; passei a proibir isso nas instruções dos
  subagentes seguintes ("pare só o processo que você iniciou"). O Docker continuou de pé.
- **Problema:** na T021, um subagente usou `git stash`. A pilha de stash é **compartilhada** entre
  o checkout principal e os worktrees. Nada se perdeu (a pilha ficou vazia), mas era um risco.
  **Solução:** regra nova: nada de `git stash`; use commit WIP.
- **Problema:** o CLI do shadcn/ui só pergunta coisas de forma interativa; sem terminal ele
  trava. **Solução:** passar os parâmetros na linha de comando (`-p nova`).
- **Problema:** o Prisma 7 mudou várias coisas (adapter obrigatório, `prisma.config.ts`,
  client gerado fora do `node_modules`). **Solução:** ver P10 e o `research.md`.
- **Problema:** o Vitest com `mockReset` dentro de `beforeEach` com arrow de expressão devolvia
  o valor do mock como "hook de limpeza". **Solução:** usar arrow com bloco `{ }`.

## Aprendizados

- **Dar liberdade ao agente exige perguntar o que ele fez depois.** Os Rulings são a "caixa
  preta" do processo; sem eles, decisões como "bloqueio vencido zera o contador" passariam
  despercebidas.
- **A revisão final achou o que as revisões por tarefa não acharam.** O furo de concorrência no
  bloqueio só aparece olhando o conjunto. Reveja a branch inteira, mesmo com tudo verde.
- **Subagente com acesso ao terminal pode fazer estrago fora do projeto.** Diga explicitamente o
  que ele **não** pode fazer (matar processos por nome, mexer no stash).
- **O plano envelhece.** O CLI do shadcn/ui não era o do rascunho. Registre divergências como
  ADR assim que aparecem.
- **Pendências que ficam de propósito:** o logout não revoga o JWT (vale até 8 h); o
  `init-db.sql` só roda com o volume vazio; `npm audit` acusa vulnerabilidades transitivas
  (CLI do Prisma, `braces` no frontend); itens "menores" adiados por rodada estão no ledger
  (US3: `res.headersSent`, `mkdir` de diretórios, `FormData`, diretórios de teste separados,
  `entity.too.large`; fase 7: `postinstall` dependendo de devDependency, `engines`).

## Próximo passo

- Rodada 2: História 2 (clientes), conforme o [ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md).
