# 10 — Conferindo a coerência antes do código

- **Data:** 2026-10-14
- **Fase:** 4 — Quebra em tarefas
- **Status:** concluída

## Objetivo

Antes de escrever código, conferir se a constituição, a spec, o plano e as tarefas **contam a
mesma história**. Mexemos na spec depois do plano (os 50 MB) e reorganizamos as tarefas; é
exatamente nessas costuras que as coisas se perdem.

O `/speckit-analyze` faz isso. Ele **só lê**: não muda nenhum arquivo, entrega um relatório e
pergunta se você quer sugestões de correção.

## Contexto / pré-requisitos

- `tasks.md` pronto ([entrada 09](./09-tarefas.md)).

## Passo a passo

### 1. Primeira rodada

```text
/speckit-analyze
```

O comando monta um inventário dos requisitos (FR-xxx e SC-xxx), liga cada tarefa a um requisito
e procura seis tipos de problema: duplicação, ambiguidade, falta de detalhe, conflito com a
constituição, buraco de cobertura e inconsistência.

Resultado: **10 achados**.

| ID | Severidade | O que era |
|----|------------|-----------|
| C1 | **CRITICAL** | O `shadcn init/add` instala pacotes (`radix-ui`, `clsx`, `tailwind-merge`…) que o plano não justificava. O componente de calendário ainda trazia `react-day-picker` e `date-fns`. A constituição (Princípio II) exige justificar toda dependência |
| A1 | HIGH | A spec diz "não revelar se o usuário existe", mas o bloqueio após 5 erros só acontece para usuário real. Quem tenta 6 vezes descobre se o nome existe |
| U1 | MEDIUM | A spec manda recusar PDF "corrompido", mas o plano só olhava o começo do arquivo (`%PDF-`). Um arquivo truncado passaria |
| G1 | MEDIUM | A sessão expira em 8 h, mas só a primeira tela conferia isso. Se expirasse no meio do uso, o app não mandaria para o login |
| G2 | MEDIUM | O contrato da API manda listar os contratos no detalhe do cliente, mas nenhuma tarefa de backend fazia isso |
| U2, I1, I2, G3, D1 | LOW | detalhes: teste faltando para `env.ts`, botão "Sair" criado em dois lugares, tipos do React fora da lista, um caso de paginação sem teste, uma repetição aceitável na spec |

> Por que o C1 é **CRITICAL** se é "só documentação"? Porque a regra do comando é clara:
> **conflito com a constituição é sempre crítico**. A constituição não se negocia dentro da
> análise; ou você ajusta spec/plano/tarefas, ou muda a constituição de forma explícita.

### 2. Decidir e corrigir

Para o A1 havia duas saídas: proteger também os nomes inexistentes (mais código) ou aceitar o
risco e escrever isso. Escolhemos **aceitar e registrar**: o sistema tem um único usuário, criado
na instalação, e o bloqueio já limita tentativas de senha. Risco aceito **por escrito** é
diferente de risco ignorado.

Pedimos as sugestões de correção, revisamos e aplicamos todas, inclusive as LOW:

| Achado | Correção |
|--------|----------|
| C1 | plano justifica a base do shadcn/ui; filtro de datas usa `Input type="date"` (nativo) em vez do calendário — duas dependências a menos |
| A1 | FR-002 cita a exceção; Premissas explicam o risco aceito; contrato da API anota o `429` |
| U1 | validação também procura `%%EOF` no fim do arquivo (sem biblioteca de PDF) |
| G1 | o cliente HTTP emite um evento `sessao-expirada` em qualquer `401` e o app volta ao login |
| G2 | tarefa e teste para devolver os contratos no detalhe do cliente |
| LOW | teste de `env.ts`, "Sair" é *movido* para o menu de perfil, tipos do React, caso de paginação |

Repare: nenhuma correção mudou a numeração das tarefas, e nenhum comando precisou ser refeito.
Foram edições pontuais em `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/api.md` e `tasks.md`.

### 3. Segunda rodada

```text
/speckit-analyze
```

Resultado: **zero achados**. Cobertura de 100% dos 40 requisitos, nenhum conflito com a
constituição, 78 tarefas no formato certo.

## Prompts utilizados

- `/speckit-analyze` (sem argumentos), duas vezes.
- Para o A1: "vamos pro recomendado". Depois: "aplique tudo, incluindo os LOW".

## Artefatos gerados

| Arquivo | Mudança |
|---------|---------|
| `specs/001-gestao-contratos-clientes/spec.md` | FR-002 e Premissas (risco aceito) |
| `specs/001-gestao-contratos-clientes/plan.md` | dependências do shadcn/ui justificadas |
| `specs/001-gestao-contratos-clientes/research.md` | validação com `%%EOF` |
| `specs/001-gestao-contratos-clientes/data-model.md` | regra do arquivo PDF |
| `specs/001-gestao-contratos-clientes/contracts/api.md` | nota no `429` |
| `specs/001-gestao-contratos-clientes/tasks.md` | 15 tarefas ajustadas |

## Problemas e soluções

- **Problema:** uma violação da constituição passou pelo plano e pelas tarefas sem ninguém notar.
  **Solução:** o analyze cruzou o plano com o que o CLI do shadcn realmente instala.
- **Problema:** um vazamento de informação no login, escondido entre duas regras corretas
  isoladamente.
  **Solução:** decisão explícita (risco aceito) registrada na spec.

## Aprendizados

- Cada documento pode estar certo sozinho e errado em conjunto. O analyze olha as costuras.
- Encontramos uma falha de segurança e uma violação da constituição **antes** de existir código.
  O conserto custou algumas linhas de texto.
- "Aceitar um risco" é uma decisão válida, desde que fique escrita.
- Rode o analyze de novo depois de corrigir: é a prova de que a correção não abriu outro buraco.

## Próximo passo

- Decidir como combinar o Spec Kit e o Superpowers na implementação (ADR 0010).
