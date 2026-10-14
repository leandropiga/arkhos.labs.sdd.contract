# 06 — Escrevendo a especificação

- **Data:** 2026-10-14
- **Fase:** 2 — Especificação
- **Status:** concluída

## Objetivo

Transformar a ideia do produto numa **especificação**: o documento que diz *o que* o sistema faz,
para quem e como saber se ficou certo. Nada de tecnologia aqui. A stack já está na constituição;
a spec fala de telas, regras e comportamentos.

## Contexto / pré-requisitos

- Constituição pronta ([entrada 05](./05-constituicao.md)).
- Texto da spec preparado em [`docs/prompts/05-especificacao.md`](../prompts/05-especificacao.md).

## Passo a passo

### 1. Preparar o texto

Partimos da "Especificação Funcional do Sistema" do rascunho e fizemos alguns ajustes (a tabela
completa está no arquivo do prompt). Os dois mais importantes:

- **Tiramos o nome "Gemini" da spec.** Escrevemos "um serviço de IA". O fornecedor já está
  fixado na constituição; a spec só descreve comportamento.
- **Deixamos lacunas de propósito.** O endereço continua um campo só, o PDF não tem limite de
  tamanho e não dissemos o que acontece se a IA demorar. Queremos ver o agente achar esses
  buracos.

### 2. Rodar o comando

```text
/speckit-specify Escreva a especificação em português do Brasil.

Desenvolva a especificação funcional da Aplicação de Gestão de Contratos de Clientes. ...
```

O que o comando fez:

1. Conferiu se havia *hooks* em `.specify/extensions.yml`. Não havia.
2. Leu `.specify/init-options.json`: a numeração é `sequential`, então a primeira funcionalidade
   ganhou o número `001`.
3. Criou a pasta `specs/001-gestao-contratos-clientes/` e gravou o caminho em
   `.specify/feature.json`. É assim que os próximos comandos (`clarify`, `plan`, `tasks`) sabem
   onde está a spec.
4. Escreveu a `spec.md` a partir do template.
5. Validou a spec contra um checklist de qualidade (`checklists/requirements.md`).

> **E a branch?** No Spec Kit 1.2.0, criar uma branch Git por funcionalidade é tarefa de um
> *hook* opcional. Como não instalamos nenhum, continuamos na `main`. Para um tutorial, isso é até
> melhor: o histórico fica linear e fácil de seguir com as tags.

### 3. O que saiu

| Seção | Conteúdo |
|-------|----------|
| Histórias de usuário | 6, com prioridade: login (P1), clientes (P1), contratos (P2), análise por IA (P3), painel (P4), perfil (P5) |
| Requisitos funcionais | 34 (FR-001 a FR-034) |
| Entidades | Usuário, Cliente, Contrato, Análise de Contrato |
| Critérios de sucesso | 9, todos mensuráveis (ex.: "encontrar um contrato em menos de 30 s") |

Cada história tem um **teste independente**: dá para entregar e testar uma sem as outras. Isso
vai ser útil na hora de quebrar em tarefas.

### 4. A validação corrigiu a própria spec

Na primeira passada, o checklist reprovou um requisito: o FR-030 dizia "demora excessiva da IA".
Quanto é excessivo? Não dá para testar. O agente trocou por um padrão de mercado, **60 segundos**,
e anotou isso nas Premissas. (O roteiro do rascunho prevê 15 segundos; isso vai aparecer na
clarificação.)

### 5. Três perguntas, e a nossa escolha

O `/speckit-specify` pode deixar no máximo **3** marcadores `[NEEDS CLARIFICATION]`. Ele usou os
três:

| Requisito | Pergunta |
|-----------|----------|
| FR-007 | O endereço é um campo só, mas o gráfico precisa da UF. Divide o endereço? |
| FR-017 | Qual é o tamanho máximo do PDF? |
| FR-010 | O que acontece ao excluir um cliente que tem contratos? |

Ele ofereceu respondermos ali mesmo. **Preferimos deixar para o `/speckit-clarify`**, que é a
etapa feita para isso, e assim a cena fica igual à do rascunho. Os marcadores continuam na spec
e o clarify vai tratar deles.

## Prompts utilizados

- [`docs/prompts/05-especificacao.md`](../prompts/05-especificacao.md), enviado com
  `/speckit-specify`.

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `specs/001-gestao-contratos-clientes/spec.md` | A especificação |
| `specs/001-gestao-contratos-clientes/checklists/requirements.md` | Checklist de qualidade (15 de 16 itens ok) |
| `.specify/feature.json` | Aponta para a funcionalidade ativa (fica fora do Git: está no `.gitignore`, porque é estado local da sua máquina) |
| `docs/prompts/05-especificacao.md` | O prompt usado |

## Problemas e soluções

- **Observação:** das lacunas que deixamos de propósito, o agente achou duas sozinho já no
  specify (endereço/UF e tamanho do PDF). A terceira (lentidão da IA) ele resolveu com um padrão
  em vez de perguntar.
- **Observação:** algumas "perguntas em aberto" da [visão do produto](../ideacao/visao-do-produto.md)
  não viraram perguntas. O agente decidiu sozinho e anotou nas **Premissas**: o primeiro usuário
  é criado na instalação, o CPF é único e validado, e a análise da IA fica guardada (só a mais
  recente). São escolhas razoáveis, mas mostram por que é preciso **ler as Premissas**: é ali que
  o agente esconde as decisões que tomou por você.
- **Observação:** no primeiro rascunho da spec, o agente esqueceu de marcar a lacuna do
  endereço/UF e só a percebeu ao revisar o próprio texto. Revisão vale até para a IA.

## Aprendizados

- A spec boa tem um "teste independente" por história. Isso obriga a pensar em entregas pequenas.
- O limite de 3 perguntas força o agente a priorizar; o resto vira premissa. Leia as premissas.
- O checklist de qualidade pega requisitos vagos ("demora excessiva") antes que eles virem código
  vago.

## Próximo passo

- Rodar `/speckit-clarify`, respondendo: endereço dividido (logradouro, número, CEP, cidade, UF),
  PDF de até 100 MB e timeout de 15 s com aviso (toast).
  > ⚠️ **Erro encenado:** os 100 MB são de propósito
  > ([ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md)).
