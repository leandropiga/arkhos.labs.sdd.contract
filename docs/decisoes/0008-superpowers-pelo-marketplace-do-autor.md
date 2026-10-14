# 0008 — Instalar o Superpowers pelo marketplace do autor (v7)

- **Data:** 2026-10-14
- **Status:** aceita (diverge do rascunho)

## Contexto

O rascunho manda instalar com `/plugin install superpowers@claude-plugins-official`. Fizemos isso
e veio a versão **6.4.1**, mas a release mais recente no GitHub é a **7.0.0** (2026-10-10). O
marketplace oficial da Anthropic fica algumas versões atrás.

O que mudou entre elas e nos afeta diretamente:

- **6.4.2:** o `writing-plans` deixou de "implementar o projeto inteiro durante o planejamento",
  um problema observado justamente com o **Opus 5.5**, o modelo que estamos usando.
- **7.0.0:** corrige a descoberta de hooks no **Windows** e os caminhos do **Git Bash** (nosso
  ambiente) e reescreve o brainstorming.

## Opções consideradas

1. **Marketplace oficial** (`claude-plugins-official`): um comando só, mas na versão 6.4.1.
2. **Marketplace do autor** (`obra/superpowers-marketplace`): um comando a mais, mas na versão 7.0.0.

## Decisão

Opção 2, instalado no **escopo de projeto**:

```bash
claude plugin marketplace add obra/superpowers-marketplace
claude plugin install superpowers@superpowers-marketplace --scope project
```

No `.claude/settings.json` declaramos o marketplace em `extraKnownMarketplaces` e o plugin em
`enabledPlugins`. Assim, quem clonar o repositório e abrir o Claude Code recebe a oferta de instalar
o mesmo plugin.

## Consequências

- Corremos o risco de pegar uma versão menos testada. Vale a pena por causa das correções para
  Windows e Opus 5.5.
- No tutorial, mostrar as duas opções e explicar por que escolhemos a segunda.
