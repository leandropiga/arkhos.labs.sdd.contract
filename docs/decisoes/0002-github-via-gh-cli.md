# 0002 — Hospedar no GitHub e deixar o Claude Code operar via `gh` CLI

- **Data:** 2026-10-14
- **Status:** aceita

## Contexto

O repositório precisa ficar no GitHub (o leitor do tutorial vai clonar e fazer checkout das tags
de cada fase). Queremos que o próprio Claude Code faça as operações (criar repositório, commit,
push, tags, PRs), sem a gente ficar alternando para o navegador.

## Opções consideradas

1. **GitHub CLI (`gh`) + Git local**: o Claude Code roda `git` e `gh` pelo terminal. É simples,
   oficial, funciona igual em Windows/macOS/Linux e o leitor consegue repetir tudo à mão.
2. **Servidor MCP do GitHub**: expõe a API do GitHub como ferramentas para o agente. É poderoso,
   mas exige configurar token e servidor MCP. Para o que precisamos, é complexidade a mais.
3. **GitHub App do Claude (`/install-github-app`)**: serve para mencionar `@claude` em issues e PRs
   e rodar o Claude no GitHub Actions. Resolve outro problema (automação na nuvem), não a
   operação local.

## Decisão

Opção 1. O Claude Code usa `git` + `gh`, autenticados uma vez pelo usuário com `gh auth login`.
A opção 3 pode voltar a ser considerada na fase de deploy/CI.

## Consequências

- Pré-requisito do tutorial: instalar o `gh` e fazer login (passo a passo no diário 01).
- O Claude Code pede permissão antes de rodar comandos `git`/`gh`. Dá para pré-autorizar os
  comandos mais comuns em `.claude/settings.json`.
- O token fica no cofre de credenciais do sistema (keyring), nunca no repositório.
- Visibilidade inicial: **privado**. O repositório vira público quando o tutorial for publicado.
