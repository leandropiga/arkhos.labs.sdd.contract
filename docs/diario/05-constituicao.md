# 05 — Escrevendo a constituição

- **Data:** 2026-10-14
- **Fase:** 2 — Especificação
- **Status:** concluída

## Objetivo

Criar a **constituição** do projeto: as regras que valem para tudo o que vier depois.

Pense nela como o "contrato de convivência" entre você e o agente. A spec diz *o que* construir.
A constituição diz *como a gente trabalha aqui*, para qualquer funcionalidade: qual stack usar,
como testar, o que é proibido. Nos próximos comandos (`/speckit-plan`, `/speckit-tasks`), o
Spec Kit relê esse arquivo e confere se o plano respeita as regras.

## Contexto / pré-requisitos

- Spec Kit e Superpowers instalados ([entrada 04](./04-instalando-spec-kit-e-superpowers.md)).
- Claude Code reiniciado depois da instalação, para os comandos `/speckit-*` aparecerem.
- O texto da constituição já preparado em
  [`docs/prompts/04-constituicao.md`](../prompts/04-constituicao.md).

## Passo a passo

### 1. Preparar o texto

A gente não mandou o texto do rascunho do jeito que estava. Antes, aplicamos as decisões já
tomadas:

| Rascunho | O que mandamos | Por quê |
|----------|----------------|---------|
| Jest no servidor | Vitest + supertest | [ADR 0006](../decisoes/0006-vitest-no-backend-e-frontend.md) |
| "versão mais recente" do Gemini | `gemini-3.8-flash` | [ADR 0004](../decisoes/0004-atualizacoes-tecnicas-do-rascunho.md) |
| Português de Portugal, tom formal | Português do Brasil | público do tutorial |
| Pastas sem nome | `backend/` e `frontend/` | evita que o agente invente nomes |
| Apagar o PDF "de forma síncrona" | apagar "inclusive em caso de erro" | vira uma regra testável |

A última linha merece um comentário. "Síncrono" fala de *como* o código roda. O que a gente
quer de verdade é uma garantia: **o arquivo nunca fica para trás**, nem quando dá erro. Escrever
a regra desse jeito permite criar um teste para ela.

### 2. Rodar o comando

No Claude Code, digite `/speckit-constitution` e cole o texto na mesma mensagem:

```text
/speckit-constitution Escreva a constituição em português do Brasil.

# Constituição do Projeto: Sistema de Gestão de Contratos
...
```

(O texto completo está em [`docs/prompts/04-constituicao.md`](../prompts/04-constituicao.md).)

### 3. O que o agente fez por baixo dos panos

O comando segue um roteiro fixo:

1. Procurou *hooks* de extensão em `.specify/extensions.yml`. Não havia nenhum para este comando.
2. Rodou um script para descobrir qual template de constituição usar:

   ```powershell
   .specify/scripts/powershell/resolve-template.ps1 constitution-template -Json
   ```

3. Leu o `.specify/memory/constitution.md`, que até então era só o template com campos do tipo
   `[PRINCIPLE_1_NAME]`.
4. Preencheu tudo e gravou o arquivo, com a versão **1.0.0**.

### 4. Como os três artigos viraram sete princípios

O template do Spec Kit tem espaço para 5 princípios e 2 seções livres. Nosso texto tinha três
artigos com vários itens cada um. O agente reorganizou assim:

| Texto original | Na constituição |
|----------------|-----------------|
| Art. II.1 Test-First | I. Test-First (INEGOCIÁVEL) |
| Art. II.2 Simplicidade | II. Simplicidade e Dependências Mínimas |
| Art. II.3 Resiliência | III. Resiliência e Erros Padronizados |
| Art. III.1 Arquivos | IV. Arquivos Temporários com Ciclo de Vida Garantido |
| Art. III.2 Gemini | V. Integração Exclusiva com o Google Gemini |
| Art. III.3 Autenticação | VI. Autenticação com JWT em Cookie HttpOnly |
| Art. I.4 shadcn/ui | VII. Design System Exclusivo com shadcn/ui |
| Art. I.1 a I.3 (stack) | Seção "Arquitetura e Stack Tecnológica" |
| (não estava no texto) | Seção "Fluxo de Desenvolvimento e Portões de Qualidade" |
| (não estava no texto) | Governança: emendas e versionamento |

Repare: cada princípio ganhou um parágrafo **"Por quê:"**. Regras com motivo são mais fáceis de
seguir (e de discutir quando alguém quiser mudar).

### 5. Revisar o que o agente acrescentou

Isso é importante: **o agente não só copiou, ele completou**. Algumas regras não estavam no
nosso texto:

- Testar a remoção do PDF no caminho de sucesso **e** no de erro (Princípio IV).
- Proibir guardar o token em `localStorage` ou `sessionStorage` (Princípio VI).
- Justificar no plano técnico qualquer dependência nova fora da constituição (Princípio II).
- A seção de fluxo (testes antes da implementação na lista de tarefas, checagem da constituição
  no plano).
- A governança: emendas pelo próprio `/speckit-constitution`, com um ADR em `docs/decisoes/`, e
  versionamento semântico (MAJOR, MINOR, PATCH).

Lemos uma por uma e aceitamos todas: elas só deixam explícito o que o texto já pedia. Mas fica a
lição: **leia a constituição gerada**. Ela vai mandar em todo o resto do projeto.

### 6. Tirar o relatório antes do commit

O agente colocou no topo do arquivo um comentário HTML chamado *Sync Impact Report*. É um resumo
da mudança para você revisar, e o próprio Spec Kit diz que ele deve sair antes do commit.
Guardamos uma cópia aqui, porque é didático:

```text
Versão: (template sem valores) → 1.0.0
Tipo de bump: MAJOR inicial — primeira ratificação da constituição a partir do template.

Princípios (placeholders → títulos definidos):
- [PRINCIPLE_1_NAME] → I. Test-First (INEGOCIÁVEL)
- [PRINCIPLE_2_NAME] → II. Simplicidade e Dependências Mínimas
- [PRINCIPLE_3_NAME] → III. Resiliência e Erros Padronizados
- [PRINCIPLE_4_NAME] → IV. Arquivos Temporários com Ciclo de Vida Garantido
- [PRINCIPLE_5_NAME] → V. Integração Exclusiva com o Google Gemini
Princípios adicionados além do template:
- VI. Autenticação com JWT em Cookie HttpOnly
- VII. Design System Exclusivo com shadcn/ui

Seções adicionadas:
- [SECTION_2_NAME] → Arquitetura e Stack Tecnológica
- [SECTION_3_NAME] → Fluxo de Desenvolvimento e Portões de Qualidade
Seções removidas: nenhuma.

Templates dependentes (lidos em tempo de execução, não alterados por este comando):
- .specify/templates/plan-template.md (seção "Constitution Check") — ⚠ conferir no /speckit-plan
- .specify/templates/spec-template.md — ✅ sem dependência direta
- .specify/templates/tasks-template.md — ⚠ conferir que as tarefas de teste vêm antes das de
  implementação (Princípio I)

TODOs adiados: nenhum.
```

Depois, removemos o comentário do arquivo (as 30 primeiras linhas):

```bash
sed -i '1,30d' .specify/memory/constitution.md
```

## Prompts utilizados

- [`docs/prompts/04-constituicao.md`](../prompts/04-constituicao.md), enviado com
  `/speckit-constitution`.

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `.specify/memory/constitution.md` | Constituição v1.0.0: 7 princípios, stack, fluxo e governança |

## Problemas e soluções

- **Problema:** o template tem só 5 princípios, e o nosso texto tinha mais regras que isso.
  **Solução:** nenhuma ação manual. O comando permite mais ou menos princípios que o template, e
  o agente criou o VI e o VII.
- **Observação:** os títulos ficaram em português ("Princípios Fundamentais" em vez de "Core
  Principles"). Os níveis de título (`##`, `###`) continuam os do template, que é o que o Spec
  Kit exige. Vamos ver no `/speckit-plan` se os comandos seguintes lidam bem com isso.
- **Observação:** no terminal do Windows PowerShell 5.1, `Get-Content` mostra os acentos
  quebrados (`ConstituiÃ§Ã£o`). O arquivo está certo, em UTF-8. É só o terminal lendo com outra
  codificação. Use `Get-Content -Encoding utf8` ou abra no editor.

## Aprendizados

- A constituição é curta, mas pesa muito: tudo o que vem depois é conferido contra ela.
- Escreva regras que dê para testar. "Apagar inclusive em caso de erro" vira teste; "apagar de
  forma síncrona" não diz o que garantir.
- Revise o que o agente acrescentou. Ele completa lacunas, e às vezes isso é ótimo, às vezes não.

## Próximo passo

- Rodar `/speckit-specify` com o texto de especificação do rascunho, já com os ajustes dos ADRs.
