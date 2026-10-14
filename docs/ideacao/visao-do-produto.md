# Visão do produto — Gestão de Contratos de Clientes

> Resultado da Fase 1 (Ideação). Este documento é de propósito **não técnico**: ele diz *o que*
> queremos e *por quê*. O *como* fica para a constituição e o plano técnico (Spec Kit).

## O problema

Uma pequena empresa guarda contratos de compra e venda em pastas e e-mails. É difícil achar o
contrato de um cliente, saber quantos contratos existem e lembrar dos riscos de cada documento.

## A solução em uma frase

Um sistema web onde a pessoa cadastra clientes e seus contratos (com o PDF), encontra tudo
rápido com filtros, vê números no painel e pede para uma IA resumir os riscos de um contrato.

## Quem usa

Um(a) operador(a) administrativo(a), com login e senha. Não há perfis de acesso diferentes
nesta versão.

## O que entra (escopo)

- **Login** com usuário e senha.
- **Perfil**: a pessoa logada edita nome, foto (URL) e telefone.
- **Clientes**: nome, telefone, endereço, CPF e RG. Listagem com paginação e filtro (nome, CPF).
  Um cliente pode existir sem contratos.
- **Contratos**: título, data, cliente e arquivo PDF. Listagem com paginação e filtro (título,
  período). Todo contrato pertence a um cliente; um cliente pode ter vários.
- **Análise por IA**: na tela do contrato, o botão "Solicitar Análise de PDF" envia o arquivo ao
  Gemini e mostra um resumo de riscos e cláusulas críticas.
- **Home (dashboard)**: gráfico de clientes por estado (UF), total de contratos e total de
  clientes.
- **Menu**: Home, Clientes e Contratos.

## O que não entra (por enquanto)

- Cadastro público de usuários, recuperação de senha e múltiplos perfis de acesso.
- Assinatura digital, versionamento de contratos e alertas de vencimento.
- Deploy em nuvem: a app roda localmente ([ADR 0003](../decisoes/0003-deploy-local-com-sugestoes.md)).

## Mudanças que já sabemos que vão acontecer

O rascunho planeja estas "surpresas" para mostrar como o SDD lida com mudanças:

1. **Na especificação** (`/speckit-clarify`): o endereço vira campos separados (logradouro,
   número, CEP, cidade, UF), o PDF fica limitado a **100 MB** e a IA tem timeout de 15 s com aviso
   (toast).
   > ⚠️ **Erro encenado:** os 100 MB são de propósito. O Gemini aceita no máximo 50 MB por PDF.
   > Queremos que esse conflito apareça como bug mais tarde
   > ([ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md)). O rascunho original usava 5 MB.
2. **Na implementação**: um PDF grande faz a análise falhar e o bug é tratado pelo fluxo
   `/speckit-bug-assess` → `/speckit-bug-fix` → `/speckit-bug-test`.
3. **Depois da implementação**: o painel passa a mostrar o "total de análises por IA nos últimos
   30 dias", o que exige guardar o histórico de análises (spec → analyze → migration).

## Perguntas em aberto (vão para a especificação)

- Quem cria o primeiro usuário? (seed, script, tela?)
- CPF e RG devem ser únicos e validados?
- O que acontece com os contratos ao excluir um cliente?
- A análise da IA é guardada ou gerada de novo a cada clique?

Deixamos essas perguntas sem resposta de propósito: é o tipo de lacuna que o `/speckit-clarify`
deve encontrar sozinho. Vamos conferir se ele encontra.
