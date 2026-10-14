# 07 — Esclarecendo a especificação

- **Data:** 2026-10-14
- **Fase:** 2 — Especificação
- **Status:** concluída

## Objetivo

Tapar os buracos da spec **antes** de planejar. A ideia do SDD é simples: toda dúvida que sobra
na spec vira um chute do agente lá na frente, e chute em código custa caro para desfazer.

O `/speckit-clarify` lê a spec, procura ambiguidades e faz até **5 perguntas**, uma de cada vez.
Cada resposta entra direto no `spec.md`.

## Contexto / pré-requisitos

- Spec criada ([entrada 06](./06-especificacao.md)), com 3 marcadores `[NEEDS CLARIFICATION]`
  deixados de propósito para esta etapa.

## Passo a passo

### 1. Rodar o comando

Sem texto nenhum, só o comando:

```text
/speckit-clarify
```

O agente roda um script para achar a spec ativa:

```powershell
.specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly
```

Ele lê o `.specify/feature.json` (criado pelo specify) e devolve o caminho da spec. Curiosidade:
a saída mostra `"BRANCH": "001-gestao-contratos-clientes"`, mas continuamos na `main`. O Spec
Kit usa o nome da funcionalidade como "branch" mesmo quando não há branch de verdade.

### 2. As perguntas

O agente varre a spec por categorias (modelo de dados, segurança, falhas de integração, UX…),
escolhe as 5 dúvidas de maior impacto e pergunta uma por vez. Cada pergunta vem com uma
**recomendação** e uma tabela de opções. Você responde com uma letra.

| # | Pergunta | Recomendação do agente | Nossa resposta |
|---|----------|------------------------|----------------|
| 1 | Como guardar o endereço, se o gráfico precisa da UF? | A: dividir em 5 campos | **A**: Logradouro, Número, CEP, Cidade e UF |
| 2 | Qual o tamanho máximo do PDF? | A: 10 MB | **C: 100 MB** ⚠️ |
| 3 | Quanto esperar pela IA e como avisar a falha? | B: 60 s + toast | **A: 15 s + toast** |
| 4 | O que acontece ao excluir cliente com contratos? | A: bloquear | **A**: bloqueia e diz quantos contratos existem |
| 5 | O que fazer depois de várias senhas erradas? | A: pausa de 15 min | **A**: 5 erros seguidos → bloqueio de 15 min |

As perguntas 1, 2 e 3 são exatamente as lacunas que o rascunho previa. As perguntas 4 e 5 o agente
achou sozinho: uma de modelo de dados, outra de segurança.

Repare que nas perguntas 2 e 3 **discordamos da recomendação**. A recomendação é só uma sugestão.
Quem decide é você.

### 3. O momento em que o roteiro quase escapou

Na pergunta 2, a primeira resposta foi **A** (10 MB), a recomendação do agente. Só que o roteiro
pede 100 MB:

> ⚠️ **Erro encenado:** o limite de 100 MB é de propósito. O Gemini aceita no máximo 50 MB por
> PDF, e queremos que esse conflito apareça como bug mais tarde
> ([ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md)). Em um projeto real, você
> conferiria os limites da API antes de responder.

Como a decisão estava registrada no `CLAUDE.md` e no ADR 0005, o agente **parou e pediu
confirmação** antes de gravar: "com 10 MB, a cena do bug encenado deixa de existir; vale A ou C?".
Respondemos **C**, e os 100 MB entraram na spec.

Moral da história: decisões escritas protegem você até de você mesmo. Se o ADR não existisse, o
agente teria gravado 10 MB sem pestanejar (e estaria certo, do ponto de vista técnico).

### 4. O que mudou na spec

Cada resposta foi gravada logo depois de aceita, em dois lugares:

1. Numa seção nova, `## Clarifications`, com o histórico de perguntas e respostas:

   ```markdown
   ### Session 2026-10-14

   - Q: Qual é o tamanho máximo permitido para o arquivo PDF de um contrato? → A: 100 MB.
   ```

2. Nas partes da spec afetadas pela resposta. Por exemplo, a pergunta 3 mexeu no FR-030, no
   cenário 5 da História 4 e nas Premissas (o padrão de 60 s, chutado pelo specify, saiu).

| Resposta | Onde entrou |
|----------|-------------|
| Endereço em 5 campos | FR-007, FR-033, entidade Cliente |
| PDF até 100 MB | FR-017, casos extremos |
| 15 s + toast | FR-030, História 4, Premissas |
| Exclusão bloqueada | FR-010, História 2 (cenário novo), casos extremos |
| Bloqueio de login | FR-002, História 1 (cenário novo), SC-005 |

O checklist de qualidade foi de 15/16 para **16/16**: não sobrou nenhum `[NEEDS CLARIFICATION]`.

## Prompts utilizados

Nenhum texto preparado: o `/speckit-clarify` roda sem argumentos e as respostas foram letras
(A, C, A, A, A). A tabela do passo 2 é o registro completo.

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `specs/001-gestao-contratos-clientes/spec.md` | Spec com a seção `Clarifications` e 5 respostas aplicadas |
| `specs/001-gestao-contratos-clientes/checklists/requirements.md` | Checklist 16/16 |

## Problemas e soluções

- **Problema:** a primeira resposta da pergunta 2 contrariava uma decisão registrada (ADR 0005).
  **Solução:** o agente pediu confirmação antes de gravar; a resposta foi corrigida para 100 MB.
- **Observação:** duas dúvidas ficaram de fora por terem baixo impacto: como criar o primeiro
  usuário (já está nas Premissas) e se CPF/RG devem ser mascarados nas listagens (LGPD). Nenhuma
  impede o plano.

## Aprendizados

- O clarify não é um formulário: ele **descobre** perguntas. Duas das cinco não estavam no nosso
  roteiro.
- A recomendação do agente é um bom ponto de partida, não uma ordem. Discordamos duas vezes.
- Uma resposta errada no clarify vira requisito, que vira teste, que vira código. Corrigir aqui
  custa uma letra.

## Próximo passo

- Fase 3 — Planejamento técnico: rodar `/speckit-plan`.
