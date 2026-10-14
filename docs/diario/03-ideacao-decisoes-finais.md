# 03 — Ideação: decisões finais

- **Data:** 2026-10-14
- **Fase:** 1 — Ideação
- **Status:** concluída

## Objetivo

Fechar as três decisões que ficaram pendentes no [diário 02](./02-ideacao-revisando-o-rascunho.md)
e encerrar a Fase 1 com uma tag no Git.

## Passo a passo

### 1. Bugs: reais **e** um encenado

Vamos registrar todo bug que aparecer de verdade e, além disso, provocar um de propósito.

Para que o erro do Gemini aconteça de fato, conferimos primeiro os limites da API:

| Limite do Gemini | Valor |
|------------------|-------|
| Tamanho máximo de um PDF (inline ou File API) | 50 MB ou 1000 páginas |
| Tamanho máximo de uma requisição com dados inline | 100 MB |
| Retenção de arquivos na File API | 48 horas |

A partir disso, montamos a "pegadinha": na clarificação da spec, o limite do PDF vai ser
**100 MB**, e não os 5 MB do rascunho. Um PDF de 60 a 100 MB vai estourar o teto do Gemini.

> ⚠️ **Erro encenado:** isso é de propósito e vai estar escrito assim no tutorial. Num projeto
> real, você leria os limites da API *antes* de escrever a spec. Aqui a gente "esquece" de propósito
> para mostrar como o SDD conserta o problema: primeiro na spec, depois no código.

Um detalhe que torna a cena mais interessante: o rascunho dizia que a solução era "trocar para a
File API". Só que o limite de 50 MB vale **também** para a File API. Então, se o agente tentar
esse atalho, vai falhar de novo, e a causa raiz só aparece quando a gente volta à spec.
Vamos ver o que acontece de verdade e registrar.

Detalhes: [ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md).

### 2. Testes: Vitest nos dois lados

O rascunho pedia Jest no backend. Trocamos por Vitest no backend e no frontend: é uma ferramenta
só, com TypeScript e ESM nativos, e a sintaxe é praticamente a mesma do Jest.
[ADR 0006](../decisoes/0006-vitest-no-backend-e-frontend.md).

### 3. Antigravity: fora deste tutorial

O tutorial cobre só o Claude Code, e tudo o que estiver nele foi testado. Uma versão para o
Antigravity pode sair depois, como tutorial separado.
[ADR 0007](../decisoes/0007-tutorial-somente-claude-code.md).

### 4. Atualizar os documentos de referência

- `docs/ideacao/visao-do-produto.md`: limite de 100 MB com o aviso de erro encenado.
- `CLAUDE.md`: nova seção "Desvios já decididos", para o agente aplicar os ADRs ao gerar os
  prompts a partir do rascunho, e a regra de marcar cenas encenadas.

### 5. Fechar a fase com uma tag

```bash
git tag -a fase-1-ideacao -m "Fase 1 - Ideacao concluida"
git push origin fase-1-ideacao
```

Quem estiver seguindo o tutorial pode voltar a este ponto com `git checkout fase-1-ideacao`.

## Prompts utilizados

[`docs/prompts/03-decisoes-fase-1.md`](../prompts/03-decisoes-fase-1.md)

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `docs/decisoes/0005-bugs-reais-e-bug-encenado.md` | Estratégia de bugs |
| `docs/decisoes/0006-vitest-no-backend-e-frontend.md` | Vitest nos dois lados |
| `docs/decisoes/0007-tutorial-somente-claude-code.md` | Antigravity fora |
| `docs/ideacao/visao-do-produto.md` | Atualizado (limite do PDF) |
| `CLAUDE.md` | Desvios decididos e regra de cenas encenadas |

## Problemas e soluções

- **Problema:** a pesquisa inicial dizia "50 MB para inline", o que sugeria que bastaria um PDF
  grande em base64 para reproduzir o bug do rascunho. Lendo a documentação com mais calma, vimos
  que o limite de 50 MB vale para **qualquer** forma de envio de PDF.
  **Solução:** redesenhamos a cena. A causa raiz deixa de ser "inline vs. File API" e passa a ser
  "a spec contradiz um limite do fornecedor", que é um aprendizado de SDD mais útil.

## Aprendizados

- Para provocar um erro de propósito, você precisa entender o sistema tão bem quanto para evitá-lo.
- Decisões que contrariam o rascunho ficam no `CLAUDE.md`. Assim o agente não "volta" para a versão
  antiga sem perceber.

## Próximo passo

- Fase 2 — Especificação: instalar Spec Kit (`uv tool install specify-cli`), extensão `bug` e
  Superpowers, rodar `specify init --here --integration claude` e escrever a constituição.
