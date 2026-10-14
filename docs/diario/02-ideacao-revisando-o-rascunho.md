# 02 — Ideação: revisando o rascunho

- **Data:** 2026-10-14
- **Fase:** 1 — Ideação
- **Status:** em andamento (faltam 3 decisões, ver "Próximo passo")

## Objetivo

Antes de abrir o Spec Kit, parar e pensar: **o que** vamos construir e se o nosso guia
(`TUTORIAL_DRAFT.md`) ainda está certo. Na ideação a gente não escreve código nem spec formal.
O resultado é uma visão do produto e uma lista de decisões.

## Por que essa etapa importa

O rascunho foi gerado por uma IA fazendo pesquisa. IA erra e a internet muda rápido. Se a gente
copiasse os comandos do rascunho sem conferir, ia travar logo no `specify init`. Lição número um
do SDD: **especificação ruim gera código ruim**, e isso vale também para o tutorial.

## Passo a passo

### 1. Conferir as versões atuais das ferramentas

```bash
gh api repos/github/spec-kit/releases/latest --jq '.tag_name + " " + .published_at'
# v1.2.0 2026-10-13T15:49:05Z

gh api repos/obra/superpowers/releases/latest --jq '.tag_name + " " + .published_at'
# v7.0.0 2026-10-10T00:28:58Z

npm view @google/genai version
# 2.29.1
```

### 2. Comparar o rascunho com a documentação oficial

Fontes consultadas: README do [Spec Kit](https://github.com/github/spec-kit), o
[quickstart](https://github.github.io/spec-kit/quickstart.html) e a
[página de integrações](https://github.github.io/spec-kit/reference/integrations.html), o README do
[Superpowers](https://github.com/obra/superpowers), o README do
[SDK `@google/genai`](https://github.com/googleapis/js-genai) e a documentação do Gemini
([modelos](https://ai.google.dev/gemini-api/docs/models) e
[documentos/PDF](https://ai.google.dev/gemini-api/docs/document-processing)).

| O rascunho diz | Situação | O que fazer |
|----------------|----------|-------------|
| `uv tool install specify-cli --from git+...` | desatualizado | `uv tool install specify-cli` |
| `specify init ... --ai claude` | desatualizado | `--integration claude` |
| comandos `/speckit-constitution`, `/speckit-specify`... | ✅ certo | — |
| fluxo constitution → specify → clarify → plan → tasks | incompleto | existem também `checklist`, `analyze` e `converge` |
| `/speckit-bug-assess` | existe, mas é extensão | `specify extension add bug` |
| `/plugin install superpowers@claude-plugins-official` | ✅ certo | — |
| Antigravity: `npx @skills-hub-ai/cli install ...` | não oficial | `agy plugin install https://github.com/obra/superpowers` |
| modelo `gemini-2.5-flash` | legado | `gemini-3.8-flash` |
| `response.text()` | errado | `response.text` |
| `version: '3.8'` no compose | obsoleto | remover |
| bug: PDF em base64 estoura a API | **não acontece** | ver decisão pendente abaixo |

Todas as correções estão no [ADR 0004](../decisoes/0004-atualizacoes-tecnicas-do-rascunho.md).

### 3. Escrever a visão do produto

Resumimos o que a app faz, quem usa, o que entra e o que fica de fora em
[`docs/ideacao/visao-do-produto.md`](../ideacao/visao-do-produto.md). Esse texto não é a spec,
é o "papo de corredor" organizado que vai alimentar o `/speckit-specify` depois.

### 4. Decidir sobre o deploy

O rascunho não tem deploy. Decisão: a app roda **local**, e o tutorial termina com uma seção de
**sugestões** (Render, Railway ou VPS), sem passo a passo
([ADR 0003](../decisoes/0003-deploy-local-com-sugestoes.md)).

## Prompts utilizados

[`docs/prompts/02-iniciar-fase-1.md`](../prompts/02-iniciar-fase-1.md)

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `docs/ideacao/visao-do-produto.md` | Visão, escopo e perguntas em aberto |
| `docs/decisoes/0003-deploy-local-com-sugestoes.md` | Deploy local + sugestões |
| `docs/decisoes/0004-atualizacoes-tecnicas-do-rascunho.md` | Correções técnicas do rascunho |

## Problemas e soluções

- **Problema:** o "bug simulado" do rascunho (PDF em base64 estourando a API do Gemini) não se
  sustenta. O Gemini aceita PDF *inline* de até 50 MB, e o nosso limite é 5 MB. Pior: a própria
  constituição do rascunho já manda salvar em disco e usar a File API, então o bug contradiz a
  regra que deveria ter evitado o problema.
  **Solução:** pendente (decisão abaixo).
- **Problema:** o `npmjs.com` bloqueou a leitura automática (HTTP 403).
  **Solução:** lemos o README direto do repositório do SDK com `gh api`.

## Aprendizados

- Trate o texto gerado por IA como um rascunho de colega júnior: ótimo ponto de partida, mas
  confira as fontes.
- Deixamos de propósito algumas perguntas sem resposta na visão do produto, para ver se o
  `/speckit-clarify` encontra essas lacunas sozinho.

## Próximo passo

Decisões pendentes para fechar a Fase 1:

1. **Bugs no tutorial:** registrar só bugs reais (com `/speckit-bug-assess`), encenar um bug ou
   fazer os dois?
2. **Testes:** manter Jest (backend) + Vitest (frontend), ou usar Vitest nos dois?
3. **Antigravity:** manter as instruções (corrigidas e marcadas como "não testado"), remover ou
   testar também?
