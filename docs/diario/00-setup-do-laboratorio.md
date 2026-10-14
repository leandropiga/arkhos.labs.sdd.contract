# 00 — Setup do laboratório

- **Data:** 2026-10-13
- **Fase:** 0 — Setup do laboratório
- **Status:** concluída

## Objetivo

Preparar um repositório vazio para servir de laboratório de **Spec-Driven Development (SDD)**,
com uma estrutura de documentação que registre cada passo — da ideação ao deploy — para virar
um tutorial público depois.

## Contexto / pré-requisitos

Ambiente usado:

| Ferramenta | Versão |
|------------|--------|
| Windows 11 Pro | 10.0.26200 |
| Git | 2.53.0 |
| Node.js | 24.14.0 |
| Python | 3.14.3 |
| uv | 0.11.32 |
| Agente de IA | Claude Code (Claude Opus 5.5) |

## Passo a passo

### 1. Criar o diretório e iniciar o Git

```powershell
mkdir C:\Developer\labs\arkhos.labs.sdd.contract
cd C:\Developer\labs\arkhos.labs.sdd.contract
git init -b main
```

### 2. Criar a estrutura de registro

```text
.
├── CLAUDE.md                 # instruções para o agente: "registre tudo"
├── README.md
└── docs/
    ├── diario/               # uma entrada por etapa (este arquivo é a 00)
    │   ├── README.md         # índice
    │   └── _template.md
    ├── decisoes/             # ADRs: por que escolhemos X e não Y
    │   └── _template.md
    └── prompts/              # prompts relevantes, na íntegra
```

### 3. Instruir o agente

O `CLAUDE.md` é lido automaticamente pelo Claude Code a cada sessão. Nele ficou a regra de que
toda etapa gera uma entrada no diário, toda decisão relevante gera um ADR e prompts relevantes
são guardados. Assim o registro não depende de lembrarmos de pedir.

## Prompts utilizados

Ver [`docs/prompts/00-prompt-inicial.md`](../prompts/00-prompt-inicial.md).

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `CLAUDE.md` | Regras do laboratório para o agente |
| `README.md` | Apresentação do repositório |
| `docs/diario/*` | Diário de bordo + template |
| `docs/decisoes/_template.md` | Template de ADR |
| `docs/prompts/00-prompt-inicial.md` | Prompt que iniciou o projeto |

## Aprendizados

- Em SDD, a documentação é insumo de primeira classe; aqui ela também é o produto (o tutorial).
- Colocar a regra de registro no `CLAUDE.md` torna o hábito automático para o agente.

## Próximo passo

- Fase 1 — Ideação: definir o problema que a aplicação resolve e escolher o framework SDD
  (registrar como ADR `0001`).

## Atualização (2026-10-14)

O rascunho `TUTORIAL_DRAFT.md` (e o prompt que o gerou, `TUTORIAL_DRAFT_PROMPT.md`) foi adicionado
na raiz e passa a ser o guia central do laboratório. Com isso a escolha do framework ficou
definida: Spec Kit + Superpowers ([ADR 0001](../decisoes/0001-spec-kit-e-superpowers.md)).
