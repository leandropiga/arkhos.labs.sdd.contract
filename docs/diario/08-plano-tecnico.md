# 08 — O plano técnico (e o bug que nunca aconteceu)

- **Data:** 2026-10-14
- **Fase:** 3 — Planejamento técnico
- **Status:** concluída

## Objetivo

Transformar a spec (o *quê*) num plano técnico (o *como*): estrutura de pastas, modelo de dados,
rotas da API, versões dos pacotes e como cada regra da constituição vai ser cumprida. Ainda sem
escrever código.

Esta etapa acabou ensinando a lição mais importante do tutorial até aqui. Spoiler: o plano
encontrou um erro que nós plantamos de propósito.

## Contexto / pré-requisitos

- Constituição, spec e clarificação prontas (entradas [05](./05-constituicao.md),
  [06](./06-especificacao.md) e [07](./07-clarificacao.md)).
- Prompt preparado em [`docs/prompts/06-plano-tecnico.md`](../prompts/06-plano-tecnico.md).

## Passo a passo

### 1. Preparar o prompt

O rascunho não tem texto para o `/speckit-plan`, só diz "rode o comando". Então escrevemos um do
zero, com o que a constituição não cobre: versão do Node, sessão de 8 h, bloqueio de login que
sobrevive a reinicialização, seed do primeiro usuário, proxy do Vite, dublê do Gemini nos testes.

Também conferimos o ambiente antes:

```powershell
node --version            # v24.14.0
docker compose version    # v5.1.3
```

### 2. Rodar o comando

```text
/speckit-plan Escreva o plano e todos os artefatos em português do Brasil. ...
```

O comando roda um script que copia o template do plano para a pasta da funcionalidade:

```powershell
.specify/scripts/powershell/setup-plan.ps1 -Json
```

E depois trabalha em duas fases:

- **Fase 0 — Pesquisa** (`research.md`): resolve as dúvidas técnicas. Para cada decisão:
  o que foi escolhido, por quê, e quais alternativas foram descartadas.
- **Fase 1 — Design**: `data-model.md` (entidades), `contracts/api.md` (rotas e erros) e
  `quickstart.md` (como subir e validar).

Antes e depois do design, o plano passa pelo **Constitution Check**: uma tabela que confere,
princípio por princípio, se o plano obedece à constituição.

### 3. O que a pesquisa encontrou

O agente consultou o npm e a documentação oficial. Três achados reais:

**a) Uma armadilha no npm.** A tag `latest` do pacote `prisma` aponta para uma versão de teste:

```bash
npm view prisma dist-tags --json
# "latest": "8.0.0-rc.22"   ← release candidate!
npm view @prisma/client dist-tags --json
# "latest": "7.10.0"
```

Um `npm install prisma` ingênuo instalaria uma RC incompatível com o client. O plano fixa 7.10.0
nos dois.

**b) A documentação do Gemini mudou.** Os exemplos atuais usam uma API nova
(`ai.interactions.create`). O plano manteve `generateContent` + `response.text`, como no
[ADR 0004](../decisoes/0004-atualizacoes-tecnicas-do-rascunho.md), e conferiu nas definições de
tipo do SDK que `response.text` é mesmo uma propriedade. A API nova ficou registrada como
alternativa.

**c) O limite de 50 MB do Gemini.** Aqui está a virada.

### 4. O bug que nunca aconteceu

Lembra do plano das entradas [03](./03-ideacao-decisoes-finais.md) e
[07](./07-clarificacao.md)?

> ⚠️ **Erro encenado:** na clarificação, respondemos que o PDF poderia ter até **100 MB**, sabendo
> que o Gemini só aceita **50 MB**. A ideia era deixar o erro estourar na implementação e mostrar
> o fluxo de correção de bugs do Spec Kit.

Só que o `/speckit-plan`, na pesquisa, leu a documentação do Gemini e escreveu no
`research.md`:

> A spec (FR-017) aceita PDFs de até **100 MB**. Logo, contratos entre 50 e 100 MB serão aceitos
> no cadastro, mas a análise deles vai falhar — e trocar de inline para File API **não** resolve.

E registrou o problema como o risco **R1** do plano.

Repare no comportamento: o agente **não mudou a spec por conta própria**. Ele seguiu a spec,
apontou o conflito e deixou a decisão com a gente. É assim que tem que ser: a spec manda, mas o
plano tem a obrigação de avisar quando ela contradiz o mundo real.

> **Transparência:** o limite de 50 MB estava escrito no `CLAUDE.md` deste repositório, que o
> agente lê em toda sessão. Mas o agente não o tirou de lá: ele foi conferir na documentação
> oficial, como um plano bem-feito deve fazer. Num projeto real, sem nenhuma dica, a pesquisa
> teria encontrado o mesmo limite.

### 5. Corrigir onde o erro nasceu: na spec

Tínhamos duas opções: manter os 100 MB e deixar o bug acontecer (para mostrar o fluxo de bugs),
ou corrigir agora. Escolhemos corrigir. "O plano pegou o problema antes do código" mostra melhor
o valor do SDD do que qualquer bug encenado.
([ADR 0009](../decisoes/0009-plano-pega-o-limite-do-gemini.md)).

A correção seguiu a ordem do SDD: **spec primeiro, depois o resto**.

| Arquivo | Mudança |
|---------|---------|
| `spec.md` | FR-017: 100 MB → **50 MB**; caso extremo atualizado; a resposta na seção `Clarifications` ganhou uma "Emenda pós-plano" (o histórico fica) |
| `research.md` | nota de atualização no R-07; upload com limite de 50 MB |
| `plan.md` | risco R1 marcado como resolvido; resta o limite de 1.000 páginas do Gemini (baixo impacto) |
| `data-model.md`, `contracts/api.md`, `quickstart.md` | 50 MB em todos os lugares |

Quanto custou? Mudar um número em meia dúzia de documentos. Se o erro aparecesse na Fase 5,
seria um bug de produção para investigar, reproduzir e corrigir em código e testes.

### 6. Atualizar as decisões do laboratório

- [ADR 0009](../decisoes/0009-plano-pega-o-limite-do-gemini.md): novo, explica a mudança.
- [ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md): a parte do bug encenado foi
  substituída; a de bugs reais continua (todo bug real passa pelo `/speckit-bug-*`).
- `CLAUDE.md`: saiu a regra "não revelar ao agente o limite de 50 MB". Não há mais nada a
  esconder.
- [Visão do produto](../ideacao/visao-do-produto.md): nota de atualização no item que previa o
  bug.

### 7. O resto do plano, em resumo

| Decisão | Escolha | Por quê |
|---------|---------|---------|
| Hash de senha | `scrypt` nativo do Node | constituição, Princípio II: nada de pacote se o Node já faz |
| JWT | biblioteca `jose` | assinar token à mão é arriscado; `jose` não tem dependências |
| Validação | `zod` nos dois lados | o Form do shadcn/ui já usa zod |
| PDFs | pasta temporária (multer, limpa no `finally`) + pasta permanente | concilia a constituição (apagar o temporário) com a spec (guardar para download) |
| Tempo-limite da IA | `AbortSignal.timeout(15_000)` | nativo |
| Busca sem acento | coluna normalizada com `normalize("NFD")` | nativo, sem extensão do Postgres |
| Banco de teste | mesmo container, banco `contratos_test` | testes de rota contra banco real |

O Constitution Check passou antes e depois do design, sem violações.

## Prompts utilizados

- [`docs/prompts/06-plano-tecnico.md`](../prompts/06-plano-tecnico.md), enviado com
  `/speckit-plan`.

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `specs/001-gestao-contratos-clientes/plan.md` | Plano: contexto, Constitution Check, riscos, estrutura |
| `specs/001-gestao-contratos-clientes/research.md` | 12 decisões técnicas com alternativas |
| `specs/001-gestao-contratos-clientes/data-model.md` | Entidades e regras |
| `specs/001-gestao-contratos-clientes/contracts/api.md` | Rotas REST e formato de erro |
| `specs/001-gestao-contratos-clientes/quickstart.md` | Como subir e validar |
| `specs/001-gestao-contratos-clientes/spec.md` | Emenda: PDF até 50 MB |
| `docs/decisoes/0009-plano-pega-o-limite-do-gemini.md` | Nova decisão |

## Problemas e soluções

- **Problema:** a spec pedia 100 MB, acima do limite do Gemini.
  **Solução:** o plano detectou; emendamos a spec e propagamos para os artefatos do plano.
- **Problema:** `npm install prisma` instalaria uma release candidate.
  **Solução:** versão fixada (`prisma@7.10.0`) e registrada no `research.md`.
- **Observação:** o `@types/node` mais recente é da linha 26, mas o runtime é o Node 24. Os
  tipos acompanham o runtime (24.x).

## Aprendizados

- A pesquisa do plano não é burocracia: é onde a spec encontra o mundo real.
- Quando o plano aponta um conflito, a correção começa na spec. Código vem depois.
- Errar num documento custa uma linha. Errar em produção custa um dia.
- Sempre confira `dist-tags` quando uma versão parecer estranha.

## Próximo passo

- Fase 4 — Quebra em tarefas: rodar `/speckit-tasks`.
