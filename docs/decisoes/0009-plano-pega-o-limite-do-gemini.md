# 0009 — Corrigir o limite do PDF no plano, em vez de encenar o bug

- **Data:** 2026-10-14
- **Status:** aceita (substitui a parte "bug encenado" da [0005](./0005-bugs-reais-e-bug-encenado.md))

## Contexto

O ADR 0005 previa um bug encenado: a spec aceitaria PDFs de 100 MB, sem contar ao agente que o
Gemini só aceita 50 MB, e a análise falharia na implementação.

Só que o `/speckit-plan` encontrou o conflito sozinho. Na pesquisa (Fase 0), o agente consultou a
documentação do Gemini e registrou o risco no `research.md` e no `plan.md`: PDFs de 50 a 100 MB
seriam aceitos no cadastro, mas a análise falharia, e trocar para a File API não resolveria.

Isso já era esperado: o limite estava escrito no `CLAUDE.md`, que todo agente lê, e um plano
honesto confere os limites das APIs externas.

## Opções consideradas

1. **Manter os 100 MB de propósito** e deixar o bug acontecer. Mantém a cena do fluxo
   `/speckit-bug-*`, mas ensina "ignore o aviso do plano", que é o oposto do que queremos.
2. **Corrigir agora na spec** (FR-017 → 50 MB) e propagar para o plano. A lição vira "o plano
   pegou o problema antes de existir uma linha de código".

## Decisão

Opção 2.

- A spec é emendada: PDF de até **50 MB** (FR-017), com registro na seção `Clarifications`.
- O plano, a pesquisa, o modelo de dados e o contrato da API passam a usar 50 MB.
- **Não há mais bug encenado** no tutorial. A parte de **bugs reais** do ADR 0005 continua
  valendo: todo bug que aparecer passa pela extensão `bug` do Spec Kit e entra no diário.

## Consequências

- O tutorial mostra o SDD fazendo o que promete: um erro que custaria depuração na Fase 5 foi
  resolvido na Fase 3, trocando um número num documento.
- A cena da clarificação (100 MB) continua no diário como aconteceu. O tutorial explica que o
  valor foi escolhido para provocar um erro e que o plano o descobriu antes.
- O fluxo `/speckit-bug-*` só aparece no tutorial se surgir um bug real. Se nenhum aparecer, o
  tutorial explica o fluxo sem demonstrá-lo.
- Não existe mais informação a esconder do agente: a regra "não revelar o limite de 50 MB" sai do
  `CLAUDE.md`.
- O script para gerar um PDF de 60–100 MB (consequência do ADR 0005) não é mais necessário. Um
  PDF acima de 50 MB ainda é útil para testar a recusa no upload.
