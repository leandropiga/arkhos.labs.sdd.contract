# 15 — Implementação, rodada 5: painel da Home e perfil (T066–T073)

- **Data:** 2026-10-14
- **Fase:** 5 — Implementação
- **Status:** concluída (falta o merge na `main`)

## Objetivo

Entregar as **Histórias 5 e 6**: a Home com os totais e o gráfico de clientes por UF, e a tela de
perfil (nome, foto e telefone), com o menu do topo mostrando nome e foto. Foram as tarefas T066 a
T073 do `tasks.md`, com o `subagent-driven-development` do Superpowers
([ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md)).

## Contexto / pré-requisitos

- Rodada 4 mergeada na `main` ([entrada 14](./14-implementacao-rodada-4.md)).
- Worktree `.worktrees/005-rodada-5-painel-perfil`, branch `005-rodada-5-painel-perfil`.
- Os `.env` não existiam mais na máquina. Criei a partir dos exemplos.

```bash
git worktree add .worktrees/005-rodada-5-painel-perfil -b 005-rodada-5-painel-perfil main
cd .worktrees/005-rodada-5-painel-perfil
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
(cd backend && npm ci && npx prisma generate)
(cd frontend && npm ci)
```

Baseline antes de mexer: backend 231 testes, frontend 66.

## Passo a passo

### 1. Três grupos de tarefas

Como na rodada 4, juntei as tarefas por camada. Teste primeiro (commit vermelho de propósito),
depois a implementação:

1. **T066, T068, T070, T072** — backend: `GET /api/painel` e `GET/PUT /api/perfil`.
2. **T067, T069** — frontend: Home com dois Cards e gráfico de barras (Chart do shadcn/ui).
3. **T071, T073** — frontend: tela de perfil, Menu de Perfil e o botão "Sair" que **mudou de lugar**.

### 2. O que as revisões pegaram

As três revisões de tarefa e a revisão final saíram sem nada Crítico ou Importante. Pontos que
valem registro:

- **"Sair" mudou de casa.** Dois testes antigos (`layout-app` e `rota-protegida`) precisaram de
  ajuste: agora o menu lê o usuário da sessão e o teste abre o menu antes de clicar em "Sair".
  O revisor conferiu que nenhuma asserção ficou mais fraca.
- **O menu atualiza na hora.** A sessão ganhou `atualizarUsuario`; ao salvar o perfil, nome e foto
  mudam no menu sem recarregar a página.

### 3. Verificação

```bash
cd backend && npx vitest run && npx tsc --noEmit    # 251 testes
cd ../frontend && npx vitest run && npx tsc -b      # 75 testes
```

## Rulings do ledger

Decisões tomadas sem parar para perguntar (custo se estiver errado entre parênteses):

1. **Briefs montados à mão** — o script `task-brief` procura "Task N" e o `tasks.md` usa `T066`.
   (Nada: só o jeito de montar o pedido.)
2. **Telefone aceita pontuação na entrada** ("(11) 98765-4321") e grava só os dígitos (10 ou 11),
   como o módulo de clientes. O `data-model.md` restringe o valor guardado. (Apertar a regra é uma
   linha.)
3. **`PUT /api/perfil` é substituição completa:** campo omitido vira `null`. O formulário sempre
   manda os três. (Cliente que mandar só `nome` apaga foto e telefone sem aviso.)
4. **Texto do estado vazio da Home:** "Nenhum cliente cadastrado ainda. Cadastre clientes para ver
   aqui a distribuição por estado (UF)." A spec só pede "estado vazio explicativo". (Trocar o texto.)
5. **Testes antigos adaptados só para o "Sair" mudar de lugar**, sem mexer nas asserções.
   (Perda de cobertura do logout, se algo escapou.)

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `backend/src/modules/painel/` | serviço (contagens e `groupBy` por UF) e rota |
| `backend/src/modules/perfil/rotas-perfil.ts` | `GET/PUT /api/perfil` com zod |
| `backend/tests/http/painel.test.ts`, `perfil.test.ts` | testes das histórias 5 e 6 |
| `frontend/src/features/painel/home.tsx` | Home com totais e gráfico |
| `frontend/src/features/perfil/tela-perfil.tsx` | formulário de perfil |
| `frontend/src/components/layout/menu-perfil.tsx` | Avatar com iniciais + menu "Meu perfil" / "Sair" |
| `specs/.../tasks.md` | T066–T073 marcadas `[X]` |

## Problemas e soluções

- **Problema:** `.env` ausente no worktree novo.
  **Solução:** copiar dos `.env.example` e `.env.test.example`.
- **Problema:** jsdom nunca carrega imagens, então o fallback de iniciais não dispara sozinho.
  **Solução:** os testes do perfil substituem `window.Image` por um stub que dispara o erro.

## Aprendizados

- **Mover um botão mexe em testes que não são seus.** Vale conferir, na revisão, que o ajuste só
  trocou o caminho até o botão e deixou as asserções como estavam.
- **"Só dígitos" tem duas leituras** (entrada ou valor guardado). Registrar a escolha evita briga depois.

## Dívidas anotadas

- `fotoUrl` sem limite de tamanho no cliente e no backend (candidato a `.max(2048)`, fase 6).
- `aria-label="Menu do perfil"` esconde o nome visível (WCAG 2.5.3); os testes dependem do texto exato.
- Gráfico com `role="img"` não expõe os valores por UF a leitores de tela; Home sem botão de nova tentativa no erro.
- "Perfil salvo." não some ao voltar a editar; faltam testes de `PUT` só com `nome`.
- Da rodada 3/4, ainda para o deploy (fase 7): `EXDEV` no `fs.rename`, cabeçalhos do download do PDF e a corrida estreita do `PUT` de contrato.

## Próximo passo

- Merge de `005-rodada-5-painel-perfil` na `main` (commit de etapa) e push.
- Rodada 6: acabamento (T074–T078) — segurança transversal, desempenho, bundle sem chave, README e roteiro manual.
