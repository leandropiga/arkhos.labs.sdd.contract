# 20 — Retrospectiva: o que o laboratório ensinou sobre SDD

- **Data:** 2026-10-19
- **Fase:** 8 — Retrospectiva
- **Status:** concluída

## Objetivo

Olhar para trás, para os 19 registros anteriores, e responder com honestidade: **o que funcionou, o
que não funcionou e o que a gente faria diferente.** Este texto é a matéria-prima do capítulo final
do tutorial.

Tudo aqui sai do que está escrito no diário, nos ADRs e no Git. Onde eu estou opinando (e não
citando um fato), digo que é opinião.

## O laboratório em números

| O quê | Quanto |
|---|---|
| Entradas no diário | 20 (esta é a última) |
| Decisões registradas (ADRs) | 11 |
| Prompts transcritos | 9 arquivos em `docs/prompts/` |
| Tarefas no `tasks.md` | 86, todas concluídas |
| Rodadas de implementação | 7, mais a validação manual e o deploy local |
| Commits no Git | 121 (o histórico de commits cobre 14 a 17/10/2026; a retrospectiva é de 19/10) |
| Código da aplicação | cerca de 6,7 mil linhas |
| Código de teste | cerca de 5,3 mil linhas |
| Testes automáticos | 387 (309 no backend e 78 no frontend) |
| Tags de fase | 7, de `fase-1-ideacao` a `fase-7-deploy` |

A proporção chama a atenção: quase uma linha de teste para cada linha de código. Não foi acidente.
A constituição do projeto exigia testes, e o fluxo de implementação começava sempre pelo teste
vermelho.

## O que funcionou

### 1. Gastar tempo nos documentos antes do código

Constituição, spec, clarificação, plano, tarefas e análise tomaram as entradas 05 a 10, antes de
existir uma linha de aplicação. Foi ali que apareceram os melhores achados:

- O **`/speckit-analyze`** (entrada 10) achou uma falha de segurança e uma violação da própria
  constituição **antes de existir código**. O conserto custou algumas linhas de texto.
- O **`/speckit-plan`** (entrada 08) descobriu sozinho que o Gemini só aceita PDFs de até 50 MB,
  enquanto a spec dizia 100 MB. Corrigimos na spec, e o bug nunca chegou ao código.
- O **`/speckit-clarify`** (entrada 07) encontrou duas perguntas que a gente nem tinha no roteiro.

A frase que resume: *errar num documento custa uma linha; errar em produção custa um dia.*

### 2. Constituição com regras que dá para testar

"Apagar o arquivo temporário inclusive em caso de erro" virou teste automático, e o passo 14 do roteiro
manual (entrada 17) conferiu na prática: a pasta de uploads ficou vazia. Uma regra vaga
("apagar de forma síncrona") não diz o que garantir. Regra testável vira trava de verdade.

### 3. Tarefas organizadas por história, não por camada

Isso permitiu entregar e validar aos pedaços: login, depois clientes, depois contratos, depois IA,
depois painel. Cada rodada terminava com algo que dava para abrir e usar.

### 4. Revisão em duas camadas

A revisão por tarefa pegou defeitos locais. A **revisão final da branch** pegou o que só se vê no
conjunto:

- o furo de concorrência no bloqueio de login (rodada 1);
- as mensagens duplicadas que passaram por três revisões de tarefa (rodada 2);
- o fallback de `EXDEV` que, combinado com o `PUT` do contrato, podia truncar um PDF (rodada 7).

Nos três casos, cada peça estava certa sozinha. O problema morava na costura.

### 5. O ledger e os "Rulings"

Deixar o agente decidir sozinho em cada ambiguidade só é seguro se as decisões ficarem escritas. O
ledger virou o mapa de recuperação (a retomada da rodada 3 teria refeito tarefas prontas sem ele),
e os Rulings viraram a "caixa-preta" do processo: foi neles que apareceu, por exemplo, que um
bloqueio vencido zera o contador.

### 6. Registrar o erro, não só o acerto

As entradas de que mais aprendemos são as que contam o tropeço: o `.env` que não existia, o `npx`
que baixou outra versão do Prisma, o 503 do Gemini que parecia bug nosso, o filtro de segurança
que cortou dois agentes. Isso é o que o leitor não acha na documentação oficial.

## O que não funcionou (ou funcionou pela metade)

### 1. A extensão `bug` do Spec Kit ficou sem uso

O `CLAUDE.md` manda que bugs reais passem pelas etapas `speckit-bug-assess`, `-fix` e `-test`. Na
prática, **nenhum dos bugs que apareceram durante a implementação passou por esse fluxo.** Eles
foram achados e resolvidos dentro do próprio ciclo de revisão do Superpowers (revisor, fix,
re-revisão). O fluxo `bug` só aparece nas entradas 02, 04 e 08.

Há duas leituras honestas. Uma: o ciclo do Superpowers já cobre o mesmo terreno, então o `bug` é
redundante dentro de uma rodada. Outra: o `bug` serviria para defeitos achados **depois** da
rodada, como o 503 do Gemini, e a gente simplesmente não teve nenhum desses. Minha opinião é a
segunda, mas não testamos. **Para o tutorial: não prometer esse fluxo como se tivesse sido
exercitado.**

### 2. Os scripts do Superpowers esperam um formato de plano que o Spec Kit não gera

O `task-brief` procura títulos "Task N", e o nosso `tasks.md` usa `T001`, `T002`. Em duas rodadas
(16 e 18) escrevi os briefs à mão, copiando as linhas das tarefas. Funcionou, mas é um atrito que
o leitor vai sentir ao juntar as duas ferramentas. Dica para o capítulo: ou adaptar o script, ou
aceitar o brief manual desde o começo.

### 3. Subagentes precisam de cerca

Na rodada 1, um subagente com acesso ao terminal fez estrago fora do projeto. Na rodada 7, outro
usou `git stash` num worktree compartilhado. A lição foi a mesma duas vezes: **diga o que o agente
não pode fazer**, não só o que ele deve fazer. Passei a proibir `git stash` nos briefs.

### 4. O processo é pesado para o tamanho do problema

Para uma aplicação de um usuário só, a quantidade de cerimônia é grande: 11 ADRs, 20 entradas, 7
rodadas, revisões em camadas. Faz sentido **porque o objetivo é ensinar o processo**. Em um projeto
real e pequeno, eu cortaria: menos rodadas, uma revisão final só, ADRs só para divergências de
verdade. Isso é opinião minha, e o tutorial deve dizer qual parte é essencial e qual é didática.

### 5. Tudo foi feito por quem acompanhou o tempo todo

O fluxo tem pontos de "pare e pergunte" bem definidos, e eles funcionaram: a gente parou para
decidir o deploy, para trocar chave do Gemini, para validar a tela. Mas o laboratório não mostra o
que acontece quando **ninguém está olhando**. Rulings errados custam retrabalho, e só descobrimos
isso porque alguém leu a lista no fim. Vale avisar o leitor.

### 6. Dívidas acumuladas

Anotamos dívidas rodada a rodada e só fechamos cinco delas (rodada 7). Ficam em aberto, de
propósito: acessibilidade do menu de perfil e do gráfico, "tentar de novo" na Home, e alguns testes
menores. A lista completa está no fim da [entrada 18](./18-implementacao-rodada-7-dividas.md).
**Dívida anotada não é dívida paga.** O tutorial deve dizer que tudo isso ficou de fora.

## Surpresas

- **A revisão final achou o que as outras não acharam, três vezes.** Eu esperava que fosse
  formalidade.
- **A IA externa ficou fora do ar durante o teste manual.** Foi o melhor acaso do laboratório: o
  tratamento de erro do passo 11 apareceu antes da hora, sem encenação.
- **O plano foi o segundo "revisor" mais valioso**, atrás só da revisão final: ele pegou o limite
  de 50 MB que a spec tinha errado.
- **Mock que devolve a resposta certa esconde o bug** (rodada 4). Teste verde nem sempre é teste
  honesto.
- **O filtro de segurança do modelo cortou trabalho legítimo.** Confira o repositório antes de
  repetir a tarefa.

## O que a gente faria diferente

1. **Começar com o ledger e os Rulings desde a primeira tarefa**, e não só depois da rodada 1.
2. **Ter um `ErrorBoundary` e o tratamento de erro de rede no plano**, não como dívida da rodada 7.
   Quem divide o bundle precisa saber que um pedaço pode não carregar.
3. **Rodar o roteiro manual (quickstart) por pedaços, ao fim de cada rodada**, não tudo no final.
   Os 14 passos passaram, mas um problema de tela custaria bem menos caro se aparecesse na rodada em
   que nasceu.
4. **Decidir a regra de arquivos de configuração local logo cedo.** O `.env` e o `.env.test` não vão
   para o Git, e a gente os recriou à mão em quase toda rodada. Um script de "preparar ambiente"
   teria poupado esse atrito.
5. **Definir antes que o tutorial só promete o que foi exercitado.** Vale para a extensão `bug`.

## O que levar para o tutorial

Uma sugestão de espinha para o capítulo final, em linguagem simples:

1. **Documento antes de código.** Mostre a constituição, a spec, o clarify, o plano e o analyze
   achando coisa de verdade.
2. **Dois frameworks, dois papéis.** O Spec Kit decide *o quê*; o Superpowers decide *como*.
3. **Regras testáveis.** Se não dá para virar teste, não é regra.
4. **Deixe o agente decidir, mas faça ele escrever o que decidiu.** (Rulings.)
5. **Revise a branch inteira, mesmo com tudo verde.**
6. **Conte os tropeços.** Eles valem mais que os acertos.
7. **Seja claro sobre o que ficou de fora**: nuvem, acessibilidade, o fluxo `bug`, as dívidas.

## Problemas e soluções

- **Problema:** nenhum bloqueio técnico nesta etapa. Era trabalho de leitura e síntese.
  **Cuidado:** os números acima vêm do Git e do `tasks.md` (86 tarefas `[X]`, 121 commits).
  As linhas de código são aproximadas (contagem de linhas dos arquivos versionados, sem o cliente
  gerado do Prisma).

## Arquivos gerados/alterados

| Arquivo | Para quê |
|---|---|
| `docs/diario/20-retrospectiva.md` | esta entrada |
| `docs/diario/README.md` | índice atualizado |

## Próximo passo

- O laboratório está completo: as fases 0 a 8 têm entrada no diário e tag, com a tag
  `fase-8-retrospectiva` fechando o ciclo.
- Depois disso, o trabalho passa a ser **escrever o tutorial final** a partir do diário, com o
  tom informal definido no `CLAUDE.md`, marcando as cenas encenadas com `⚠️ Erro encenado`.
