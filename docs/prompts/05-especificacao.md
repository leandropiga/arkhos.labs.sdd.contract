# 05 — Especificação funcional

- **Data:** 2026-10-14
- **Destino:** `/speckit-specify` (Claude Code)
- **Base:** "Especificação Funcional do Sistema" do `TUTORIAL_DRAFT.md`, alinhada com a
  [visão do produto](../ideacao/visao-do-produto.md). Texto convertido para português do Brasil.

## Como usar

No Claude Code, digite `/speckit-specify` seguido do texto abaixo (tudo numa mensagem só).

## Texto

```text
Escreva a especificação em português do Brasil.

Desenvolva a especificação funcional da Aplicação de Gestão de Contratos de Clientes. O sistema
tem dois domínios principais: Clientes e Contratos (de compra e venda). Quem usa é um(a)
operador(a) administrativo(a) de uma pequena empresa, que hoje guarda os contratos em pastas e
e-mails e tem dificuldade para encontrá-los, contá-los e lembrar dos riscos de cada um.

## Clientes

- O cadastro tem os seguintes campos obrigatórios: Nome Completo, Telefone, Endereço, CPF e RG.
- Há uma tela de listagem de clientes com paginação e filtros por Nome e por CPF.
- Um cliente pode existir sem nenhum contrato vinculado.

## Contratos

- O cadastro registra: Título do Contrato, Data de Assinatura, Cliente (escolhido entre os
  clientes cadastrados) e o arquivo do contrato, aceito somente no formato PDF.
- Um cliente pode ter vários contratos (relação 1:N).
- Um contrato não pode existir sem cliente: ele precisa estar vinculado a um cliente válido.
- Há uma tela de listagem de contratos com paginação e filtros por título e por intervalo de
  datas.

## Análise do contrato por IA

- Na tela de detalhes de um contrato existe um botão "Solicitar Análise de PDF".
- Ao clicar, o PDF é enviado de forma segura a um serviço de IA, que devolve um resumo executivo
  dos riscos jurídicos e das cláusulas críticas do contrato.
- O resultado aparece em um painel na mesma tela, que continua visível depois que a análise
  termina.

## Navegação, painel e acesso

- O menu lateral tem três áreas: Home (painel), Clientes e Contratos.
- A Home mostra um painel com:
  1. um gráfico com a distribuição dos clientes por estado (UF);
  2. o total de contratos cadastrados;
  3. o total de clientes cadastrados.
- O acesso ao sistema exige login com usuário e senha.
- Existe um Menu de Perfil onde a pessoa logada edita seus dados: Nome, URL da foto de perfil e
  Telefone.

## Fora do escopo desta versão

- Cadastro público de usuários, recuperação de senha e perfis de acesso diferentes.
- Assinatura digital, versionamento de contratos e alertas de vencimento.
```

## O que mudou em relação ao rascunho

| Rascunho | Aqui | Por quê |
|----------|------|---------|
| Português de Portugal, tom formal | Português do Brasil, frases diretas | público do tutorial |
| Começa direto nos requisitos | Parágrafo curto sobre quem usa e qual é o problema | dá ao agente o *porquê*, que a spec usa nas histórias de usuário |
| "API baseada no Google Gemini" | "um serviço de IA" | a spec diz *o quê*; o fornecedor já está na constituição (Princípio V) |
| "Endereço de Faturação" | "Endereço" | mesma coisa, mais simples |
| "total de clientes **ativos**" | "total de clientes cadastrados" | a visão do produto não tem conceito de cliente ativo/inativo |
| Sem itens fora do escopo | Seção "Fora do escopo" | vem da [visão do produto](../ideacao/visao-do-produto.md); evita que o agente invente telas |

## O que ficou de fora **de propósito**

Estas lacunas continuam no texto porque o `/speckit-clarify` precisa encontrá-las (próximo
prompt):

- **Endereço em um campo só.** Sem UF separada, o gráfico por estado não tem de onde tirar o
  dado. É a primeira pergunta que o rascunho espera do agente.
- **Nenhum limite de tamanho para o PDF.** Na clarificação vamos responder **100 MB**.
  > ⚠️ **Erro encenado:** o valor é de propósito. O Gemini aceita no máximo 50 MB por PDF, e não
  > vamos contar isso ao agente ([ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md)).
- **Nenhum comportamento para lentidão ou falha da IA.** Na clarificação vamos responder: timeout
  de 15 segundos, com um aviso não bloqueante (toast).
- **As perguntas em aberto da visão do produto**: quem cria o primeiro usuário, se CPF e RG são
  únicos e validados, o que acontece com os contratos ao excluir um cliente, e se a análise da IA
  é guardada ou gerada de novo a cada clique. Vamos conferir se o agente pergunta sobre elas.
