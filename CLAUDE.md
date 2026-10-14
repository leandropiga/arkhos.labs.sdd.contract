# CLAUDE.md

## Propósito do repositório

Laboratório de estudo de **SDD (Spec-Driven Development)**. O produto final não é só a aplicação:
é o **registro completo do processo**, da ideação ao deploy, que servirá de base para um tutorial público.

Idioma do projeto e da documentação: **português (pt-BR)**.

## Guia de referência

- `TUTORIAL_DRAFT.md` é o **guia central**: define a aplicação (gestão de contratos de clientes),
  a stack (Node.js/Express/Prisma, React/Vite/Tailwind v4/shadcn/ui, PostgreSQL em Docker, Gemini)
  e o fluxo (Spec Kit para *o quê*, Superpowers para *como*). Os textos de constituição e
  especificação dele são o ponto de partida dos prompts.
- `TUTORIAL_DRAFT_PROMPT.md` é o prompt que gerou o rascunho (requisitos originais).
- O rascunho **não é imutável**. Podemos divergir dele quando fizer sentido, mas toda divergência
  vira um ADR em `docs/decisoes/` — essas diferenças entram na versão final do tutorial.

## Regra principal: registrar tudo

Toda etapa de trabalho DEVE deixar rastro em `docs/`:

1. **Diário** (`docs/diario/`): uma entrada por etapa, numerada (`NN-titulo-curto.md`), seguindo
   `docs/diario/_template.md`. Registrar: objetivo, comandos executados, prompts usados,
   arquivos gerados/alterados, problemas encontrados e como foram resolvidos, aprendizados.
   Atualizar o índice em `docs/diario/README.md`.
2. **Decisões** (`docs/decisoes/`): toda escolha relevante (framework SDD, stack, hospedagem,
   trade-offs, divergências do rascunho) vira um ADR curto (`NNNN-titulo.md`, ver `_template.md`)
   e é listada em `docs/decisoes/README.md`.
3. **Prompts** (`docs/prompts/`): prompts significativos enviados ao agente/framework SDD,
   transcritos na íntegra (são material didático).

Regras de escrita:
- O tutorial final terá **linguagem informal e simples** (diferente do tom acadêmico do rascunho).
  Escrever o diário já nesse tom: frases curtas, conversando com o leitor, sem jargão desnecessário.
- Público: devs que ainda não usam IA para programar, mas querem conhecer SDD.
- Explicar o *porquê*, não só o *o quê*.
- Registrar erros e becos sem saída — eles são parte valiosa do tutorial.
- Comandos em blocos de código copiáveis, indicando o shell (PowerShell / bash).
- Não apagar entradas antigas; correções entram como nova entrada ou nota "Atualização".
- **Cenas encenadas** (ex.: bug provocado de propósito, ADR 0005) devem aparecer marcadas com um
  aviso explícito `⚠️ Erro encenado`, para o leitor saber o que é simulação didática.
- O tutorial cobre **somente o Claude Code** (ADR 0007). Não escrever instruções para outros agentes.

## Desvios já decididos em relação ao rascunho

Ao gerar prompts a partir do `TUTORIAL_DRAFT.md`, aplicar os ADRs:
- 0004: comandos e versões atualizados (Spec Kit `--integration claude`, `gemini-3.8-flash` etc.).
- 0005: no `/speckit-clarify`, o limite do PDF é **100 MB** (não 5 MB). Não revelar ao agente o
  limite de 50 MB do Gemini.
- 0006: Vitest no backend e no frontend (não Jest).
- 0008: Superpowers v7 via `superpowers@superpowers-marketplace` (não o marketplace oficial).

## Git e GitHub

- Remoto: GitHub, operado pelo Claude Code via `gh` CLI (ver ADR 0002).
- Um commit por etapa concluída, mensagem em pt-BR no formato `diario(NN): <resumo>` ou
  `feat|fix|docs|chore: <resumo>`. Fazer push após cada commit de etapa.
- Ao fim de cada fase, criar tag `fase-N-<nome>` (ex.: `fase-1-ideacao`) e enviá-la ao remoto,
  para que o leitor possa fazer checkout de cada ponto.

## Fases

0. Setup do laboratório (inclui conexão com GitHub)
1. Ideação
2. Especificação (constituição, spec, esclarecimentos)
3. Planejamento técnico
4. Quebra em tarefas
5. Implementação
6. Testes e validação
7. Deploy
8. Retrospectiva
