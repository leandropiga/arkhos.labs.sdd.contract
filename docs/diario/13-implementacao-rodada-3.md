# 13 — Implementação, rodada 3: contratos com PDF (T047–T057)

- **Data:** 2026-10-14
- **Fase:** 5 — Implementação
- **Status:** concluída (falta o merge na `main`)

## Objetivo

Entregar a **História 3**: cadastrar contratos com PDF (até 50 MB), listar com filtros de título e
período, ver o detalhe, baixar o PDF, editar e excluir. Foram as tarefas T047 a T057 do `tasks.md`,
com o `subagent-driven-development` do Superpowers
([ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md)).

## Contexto / pré-requisitos

- Rodada 2 mergeada ([entrada 12](./12-implementacao-rodada-2.md)).
- Worktree `.worktrees/003-rodada-3-contratos`, branch `003-rodada-3-contratos`.
- O trabalho começou numa sessão anterior (testes T047–T049, T051 e T052 já commitados) e foi
  retomado aqui pelo ledger e pelo `git log`, sem refazer nada.

## Passo a passo

### 1. Retomar de onde parou

O pedido foi só "continue a rodada 3". O escopo estava no diário 12 e no ledger
(`.superpowers/sdd/`, fora do Git). O ledger mostrava T047–T049 prontas; T051 e T052 estavam
commitadas sem relatório nem revisão. Não refiz nada: continuei em T053.

### 2. Backend (T053–T054)

Um implementador cuidou do serviço, dos esquemas e das rotas de `/api/contratos`, reaproveitando o
`armazenamento.ts` e o `upload.ts`. Os testes que já estavam escritos (T047–T049) passaram a
ficar verdes. A revisão cobriu T051–T054 de uma vez e aprovou.

### 3. Telas (T050, T055–T057)

Outro implementador escreveu primeiro o teste (T050), viu falhar, e depois fez a lista, o
formulário e o detalhe, mais as quatro rotas. A revisão conferiu também os dois defeitos que
apareceram na rodada 2 (estado que não reinicia ao trocar de id e linhas velhas depois de erro):
as telas novas já nasceram corrigidas.

### 4. Revisão final e verificação

Rodei eu mesmo as suítes depois dos relatórios: backend 207 testes verdes, frontend 54, e
`tsc` limpo nos dois. A revisão final da branch (modelo mais capaz) não achou nada Crítico nem
Importante; checou também path traversal, injeção no `Content-Disposition` e autenticação.

```bash
cd backend && npx vitest run && npx tsc --noEmit
cd ../frontend && npx vitest run && npx tsc -b
```

## Rulings do ledger

Decisões tomadas sem parar para perguntar (custo se estiver errado entre parênteses):

1. **Escopo da rodada = T047–T057 (História 3).** Você não deu escopo explícito. (Refazer o recorte.)
2. **413 no frontend mostra texto fixo** "O arquivo é muito grande. O limite é de 50 MB." em vez
   da mensagem da API. (Trocar por `erro.mensagem`.)
3. **Seletor de cliente = busca com debounce + `select` (máx. 20)**, sem combobox. (Trocar o componente.)

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `backend/src/lib/armazenamento.ts`, `backend/src/http/upload.ts` | guardar PDFs e middleware de upload (multer, 50 MB, `%PDF-`/`%%EOF`, limpeza do temporário) |
| `backend/src/modules/contratos/` | esquemas, serviço e rotas de `/api/contratos` |
| `backend/tests/http/contratos-*.test.ts`, `backend/tests/helpers/arquivos.ts` | testes HTTP da US3 |
| `frontend/src/features/contratos/` | lista, formulário e detalhe |
| `frontend/src/lib/api.ts` | passou a aceitar `FormData` |
| `frontend/tests/contratos/contratos.test.tsx` | testes das telas |
| `specs/.../tasks.md` | T047–T057 marcadas `[X]` |

## Problemas e soluções

- **Problema:** T051/T052 estavam commitadas sem relatório (sessão interrompida).
  **Solução:** o ledger e o `git log` disseram o que existia; as duas entraram na revisão do
  backend junto com T053–T054.
- **Problema:** o revisor não conseguia ver se `ZodError` virava `400` no middleware de erros.
  **Solução:** conferi eu mesmo (`middleware-erros.ts`): já tratava.

## Aprendizados

- **O ledger é o mapa de recuperação.** Sem ele, a retomada teria refeito tarefas prontas.
- **Relatório de subagente não é prova.** Rodar as suítes depois é barato e fecha a conta.
- **Corrigir na rodada seguinte o que a anterior ensinou** funciona: passar as lições (reset por
  id, sem linhas velhas) no pedido do revisor evitou repetir os mesmos bugs.

## Próximo passo

- Merge de `003-rodada-3-contratos` na `main` (commit de etapa) e push.
- Rodada 4: História 4 (análise de riscos por IA). Itens adiados que ela deve tratar: expiração de
  `analiseEmAndamento`, `PUT` sem corpo (400 com mensagem em português), `useAtrasado` triplicado
  (mover para `@/lib`), `select` cru, indicador de carregamento da lista, guarda de duplo envio ao excluir.
- Adiados para o deploy (fase 7): `fs.rename` falha com `EXDEV` se `UPLOAD_TMP_DIR` e
  `STORAGE_DIR` ficarem em volumes Docker diferentes (e a divergência banco/arquivo no `PUT`
  vem junto); cabeçalhos `Cache-Control: private, no-store` e `nosniff` no download do PDF.
