# 01 — Conectando o Claude Code ao GitHub

- **Data:** 2026-10-14
- **Fase:** 0 — Setup do laboratório
- **Status:** concluída

## Objetivo

Deixar o Claude Code criar o repositório no GitHub e fazer commit, push e tags sozinho. Assim a
gente fica focado no SDD e não em ficar alternando entre terminal e navegador.

Por que GitHub e por que desse jeito? Está explicado no [ADR 0002](../decisoes/0002-github-via-gh-cli.md).
Resumindo: o Claude Code já sabe rodar comandos no terminal. Se o terminal estiver logado no
GitHub, o Claude também está. Não precisa de plugin nem de servidor extra.

## Contexto / pré-requisitos

- Git instalado.
- Uma conta no GitHub.
- Claude Code instalado e aberto na pasta do projeto.

## Passo a passo

### 1. Instale o GitHub CLI (`gh`)

O `gh` é a ferramenta oficial do GitHub para o terminal. Com ele dá para criar repositórios, abrir
PRs, ver issues etc.

```powershell
# Windows
winget install --id GitHub.cli
```

```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu): veja https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

Feche e abra o terminal de novo, e confira:

```powershell
gh --version
```

### 2. Faça login

```powershell
gh auth login
```

Responda assim:

| Pergunta | Resposta |
|----------|----------|
| Where do you use GitHub? | `GitHub.com` |
| Preferred protocol for Git operations? | `HTTPS` |
| Authenticate Git with your GitHub credentials? | `Yes` |
| How would you like to authenticate? | `Login with a web browser` |

O terminal mostra um código, abre o navegador, você cola o código e autoriza. Pronto.

> **Por que "Authenticate Git" = Yes?** Isso faz o `git push` usar o mesmo login do `gh`.
> Sem isso, o push pediria senha/token separado, e o Claude travaria esperando você digitar.

Confira se deu certo:

```powershell
gh auth status
```

A saída deve ser parecida com esta:

```text
github.com
  ✓ Logged in to github.com account SEU-USUARIO (keyring)
  - Git operations protocol: https
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

O escopo `repo` é o que permite criar repositórios e fazer push. O token fica guardado no cofre de
senhas do sistema (keyring), e não dentro do projeto.

### 3. Configure sua identidade no Git

Os commits feitos pelo Claude vão sair com o seu nome:

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 4. (Opcional) Pré-autorize os comandos no Claude Code

Por segurança, o Claude Code pede sua permissão antes de rodar comandos. Para não precisar aprovar
cada `git commit`, criamos o arquivo `.claude/settings.json` no projeto com uma lista do que é
liberado e do que é proibido:

```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)", "Bash(git add:*)", "Bash(git commit:*)",
      "Bash(git push:*)", "Bash(git tag:*)", "Bash(gh repo view:*)"
    ],
    "deny": [
      "Bash(git push --force:*)", "Bash(gh repo delete:*)"
    ]
  }
}
```

(O arquivo completo do projeto também tem as versões `PowerShell(...)`, porque no Windows o
Claude Code pode usar os dois terminais.)

Repare que **criar repositório** (`gh repo create`) não está liberado. Isso é de propósito: é uma
ação que publica coisas na internet, então é bom o Claude perguntar antes.

### 5. Peça ao Claude para criar o repositório

Agora é só pedir em linguagem natural. Por baixo dos panos, o Claude roda algo assim:

```bash
git add .
git commit -m "diario(00-01): setup do laboratorio e conexao com GitHub"
gh repo create arkhos.labs.sdd.contract --private --source . --remote origin --push
```

Escolhemos `--private` por enquanto: o repositório fica fechado durante o desenvolvimento e vira
público quando o tutorial for lançado (`gh repo edit --visibility public --accept-visibility-change-consequences`).

O `gh repo create` com `--source .` cria o repositório no GitHub, configura o `origin` e já faz o
push, tudo de uma vez.

## Prompts utilizados

[`docs/prompts/01-guia-e-github.md`](../prompts/01-guia-e-github.md)

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `.claude/settings.json` | Permissões pré-aprovadas para `git`/`gh` |
| `docs/decisoes/0001-spec-kit-e-superpowers.md` | Escolha dos frameworks |
| `docs/decisoes/0002-github-via-gh-cli.md` | Escolha do GitHub + `gh` |
| `CLAUDE.md` | Passou a apontar `TUTORIAL_DRAFT.md` como guia |

## Problemas e soluções

- Nenhum: no ambiente do laboratório o `gh` já estava instalado e logado. Se o seu `gh auth status`
  mostrar "not logged in", volte ao passo 2.

## Aprendizados

- O Claude Code herda o que o seu terminal sabe fazer. Logou o `gh`, o Claude ganhou GitHub.
- Use as listas de `allow` e `deny` para deixar o agente trabalhar sozinho no que é seguro e
  continuar perguntando no que é sensível.

## Próximo passo

- Fase 1 — Ideação: revisar o rascunho e decidir o que fica igual e o que muda.
