# 19 — Deploy: a aplicação roda inteira na sua máquina (T084–T086)

- **Data:** 2026-10-17
- **Fase:** 7 — Deploy
- **Status:** concluída

## Objetivo

Fechar a fase de deploy. Aqui, "deploy" quer dizer **rodar a aplicação completa localmente**, como
decidimos no [ADR 0003](../decisoes/0003-deploy-local-com-sugestoes.md). Antes de seguir, perguntei
de novo se a gente queria mudar de ideia e publicar em nuvem. A resposta foi manter local. Então
nenhum ADR novo: o 0003 continua valendo.

> Dica para o tutorial: **vale reabrir uma decisão antiga quando chega a hora de executá-la.** O
> ADR foi escrito antes de existir código. Perguntar de novo custa um minuto e evita surpresa.

## Contexto / pré-requisitos

- Dívidas da rodada 7 fechadas ([entrada 18](./18-implementacao-rodada-7-dividas.md)).
- Worktree `.worktrees/008-fase-7-deploy-local`, branch `008-fase-7-deploy-local`.
- Três tarefas novas no `tasks.md`, "Fase 11: Deploy local" (T084 a T086).

## Passo a passo

### 1. `ErrorBoundary` (T084)

Na rodada 7 dividimos o frontend em pedaços que carregam sob demanda. Isso trouxe um risco novo: se
um pedaço não carregar (rede caiu, ou o app foi atualizado e o nome do arquivo mudou), a tela
ficava em branco, sem explicação.

Criei o `ErroBoundary` (`frontend/src/components/erro-boundary.tsx`), uma classe React em volta do
`Suspense` das rotas. Se uma tela falhar ao carregar, aparece uma mensagem em português e um botão
**"Recarregar a página"**. O teste usa um `lazy` cujo import dá erro e confere a mensagem e o clique
no botão.

### 2. Instalação limpa (T085)

O teste de verdade de "roda na máquina de outra pessoa" é começar do zero. Clonei a branch numa
pasta temporária, sem nenhum arquivo meu, e fiz tudo do início:

```bash
git clone --branch 008-fase-7-deploy-local . /tmp/clone-limpo
cd /tmp/clone-limpo
cp backend/.env.test.example backend/.env.test
(cd backend && npm ci && npx vitest run)
(cd frontend && npm ci && npx vitest run && npm run build)
```

| Etapa | Resultado |
|---|---|
| `npm ci` backend e frontend | ok |
| Testes do backend | 27 arquivos, 309 testes passando |
| Testes do frontend | 15 arquivos, 78 testes passando |
| `npm run build` | ok, sem aviso de chunk grande |

O roteiro manual completo (14 passos, com o Gemini de verdade) já tinha sido feito na
[entrada 17](./17-validacao-manual-quickstart.md).

### 3. Onde publicar, para quem quiser (T086)

Acrescentei ao `README.md` a seção **"Onde publicar (sugestões)"**, como o ADR 0003 pede: Render,
Railway e VPS com Docker Compose, sem passo a passo, e com os pontos de atenção que a gente **não
testou**: variáveis de ambiente, cookies e CORS em domínio real, disco persistente para os PDFs,
migrações a cada publicação e a instabilidade ocasional do Gemini.

## Prompts utilizados

Nenhum prompt novo ao framework. A T084 foi um brief curto, escrito a partir da linha do
`tasks.md`.

## Arquivos gerados/alterados

| Arquivo | Para quê |
|---|---|
| `frontend/src/components/erro-boundary.tsx` | tela de erro com botão de recarregar |
| `frontend/src/rotas.tsx` | `ErroBoundary` em volta do `Suspense` |
| `frontend/tests/components/erro-boundary.test.tsx` | teste do boundary |
| `README.md` | seção "Onde publicar (sugestões)" |
| `specs/.../tasks.md` | Fase 11 (T084–T086) criada e marcada `[X]` |

## Problemas e soluções

- **Problema:** nenhum bloqueio nesta etapa. A instalação limpa passou de primeira.
  **Observação:** o `.env.test` não vai para o Git. Quem clonar precisa copiar do
  `.env.test.example` antes de rodar os testes do backend, e o README e o quickstart dizem isso.

## Rulings

Nenhum. A T084 foi revisada por mim direto no diff (um componente de 32 linhas e um embrulho nas
rotas), sem subagente revisor. *Custo se errado:* o `ErroBoundary` não se reinicia ao trocar de
rota, mas o botão de recarregar cobre esse caso.

## Aprendizados

- **"Roda na minha máquina" não prova nada.** Clone limpo prova mais, porque pega arquivo esquecido
  e dependência que só existia por acaso.
- **Cada otimização cria um modo de falha novo.** Dividir o bundle trouxe o erro de "pedaço não
  carregou"; a resposta é tratá-lo, não esconder.
- **Deploy local também é decisão.** O tutorial termina com o app rodando e com um mapa honesto do
  que falta para publicar, em vez de fingir que nuvem é trivial.

## Dívidas que sobraram

As da [entrada 18](./18-implementacao-rodada-7-dividas.md) que não eram do deploy: acessibilidade
(menu de perfil, gráfico, Home sem "tentar de novo"), testes menores e os minors do frontend.

## Próximo passo

- Fase 8: retrospectiva (o que funcionou, o que não funcionou, o que mudaríamos no fluxo SDD).
