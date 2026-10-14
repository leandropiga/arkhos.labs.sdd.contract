# 0004 — Corrigir comandos e versões desatualizados do rascunho

- **Data:** 2026-10-14
- **Status:** aceita

## Contexto

O rascunho foi gerado por pesquisa automatizada, e parte dos comandos e versões citados mudou.
Conferimos cada afirmação nas fontes oficiais em 2026-10-14 (detalhes no diário 02).

## Opções consideradas

1. Seguir o rascunho ao pé da letra (o leitor ia esbarrar em comandos que não funcionam).
2. Atualizar para o que as ferramentas fazem hoje.

## Decisão

Opção 2. Correções adotadas:

| Assunto | Rascunho | Agora |
|---------|----------|-------|
| Instalar Spec Kit | `uv tool install specify-cli --from git+https://...` | `uv tool install specify-cli` (v1.2.0, 2026-10-13) |
| Iniciar projeto | `specify init gestao-contratos --ai claude` | `specify init --here --integration claude` |
| Fluxo Spec Kit | constitution → specify → clarify → plan → tasks | + `checklist`, `analyze` e `converge` (verifica o código contra a spec) |
| `/speckit-bug-assess` | parece nativo | existe, mas é da extensão opcional: `specify extension add bug` |
| Superpowers no Claude Code | `/plugin install superpowers@claude-plugins-official` | igual, sem mudança (v7.0.0) |
| Superpowers no Antigravity | `npx @skills-hub-ai/cli install using-superpowers` | `agy plugin install https://github.com/obra/superpowers` (oficial) |
| Modelo Gemini | `gemini-2.5-flash` | `gemini-3.8-flash` (o 2.5 é legado e só está liberado para quem já usava) |
| Texto da resposta do SDK | `response.text()` | `response.text` (propriedade) |
| `docker-compose.yml` | `version: '3.8'` | remover: o campo está obsoleto no Docker Compose v2 |

## Consequências

- O `specify init` roda dentro deste repositório (`--here`), não numa pasta nova.
- Comandos exatos são reconferidos no momento em que forem executados. Se algo mudar de novo, a
  diferença vai para o diário.
