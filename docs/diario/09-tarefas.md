# 09 — Quebrando o plano em tarefas

- **Data:** 2026-10-14
- **Fase:** 4 — Quebra em tarefas
- **Status:** concluída

## Objetivo

Transformar o plano numa **lista de tarefas pequenas**, cada uma com um arquivo e um objetivo
claros. É essa lista que o agente vai executar na implementação, uma tarefa por vez.

Por que não ir direto do plano para o código? Porque um plano diz *o que* construir, mas não
*em que ordem*. A lista de tarefas resolve a ordem, mostra o que pode ser feito em paralelo e dá
um ponto de parada claro depois de cada pedaço.

## Contexto / pré-requisitos

- Plano pronto ([entrada 08](./08-plano-tecnico.md)): `plan.md`, `research.md`,
  `data-model.md`, `contracts/api.md`, `quickstart.md`.

## Passo a passo

### 1. Rodar o comando

```text
/speckit-tasks Escreva as tarefas em português do Brasil.
```

Por baixo dos panos, um script localiza a funcionalidade e o template:

```powershell
.specify/scripts/powershell/setup-tasks.ps1 -Json
```

O agente lê todos os artefatos do plano e monta o `tasks.md`.

### 2. Como a lista é organizada

O formato é rígido, e isso é bom:

```text
- [ ] T042 [P] [US2] Descrição com o caminho do arquivo
```

| Parte | Significado |
|-------|-------------|
| `- [ ]` | checkbox: o agente marca quando termina |
| `T042` | ID sequencial, na ordem de execução |
| `[P]` | pode rodar em paralelo (arquivo diferente, sem depender de tarefa aberta) |
| `[US2]` | a qual história de usuário da spec a tarefa pertence |

As tarefas são agrupadas **por história de usuário**, não por camada técnica. Em vez de "fazer
todos os modelos, depois todas as rotas, depois todas as telas", cada história vai do banco à tela
e termina testável sozinha.

| Fase | Tarefas | O que entrega |
|------|---------|---------------|
| 1. Setup | 10 | Docker, os dois pacotes, Tailwind v4, shadcn, Vitest |
| 2. Fundação | 17 | erro padronizado, validação, modelos, sessão, seed, casca do frontend |
| 3. US1 Login (P1) 🎯 | 8 | login, logout, rotas protegidas, bloqueio |
| 4. US2 Clientes (P1) | 11 | cadastro, lista com filtros, exclusão bloqueada |
| 5. US3 Contratos (P2) | 11 | upload até 50 MB, filtros, download |
| 6. US4 Análise IA (P3) | 8 | Gemini com dublê, 15 s, toast |
| 7. US5 Painel (P4) | 4 | totais e gráfico por UF |
| 8. US6 Perfil (P5) | 4 | nome, foto, telefone |
| 9. Acabamento | 5 | segurança, desempenho, quickstart |
| **Total** | **78** | 41 marcadas como paralelizáveis |

### 3. Testes primeiro, de verdade

O template do Spec Kit diz que testes são "opcionais". Aqui não são: a constituição (Princípio I)
exige TDD. Então em cada história as tarefas de teste vêm **antes** e as de implementação dizem
qual teste precisam fazer passar:

```text
- [ ] T028 [P] [US1] Teste HTTP em backend/tests/http/auth.test.ts: ...
...
- [ ] T033 [US1] Criar backend/src/modules/auth/rotas-auth.ts ... até T028 e T029 passarem
```

Esse "até T0xx passar" é o critério de pronto de cada tarefa. Não tem discussão.

Outro detalhe: as regras dos campos foram **copiadas literalmente** do `data-model.md` para as
tarefas (ex.: `nomeCompleto` "obrigatório, 3–150 caracteres"). Assim, quem implementa não precisa
adivinhar nem reabrir outro documento.

### 4. O agente revisou a própria lista

Na primeira versão havia um problema de dependência:

- O teste de "não pode excluir cliente com contratos" (História 2) precisava criar contratos.
- Mas o modelo Contrato só era criado na História 3.

Ou seja, a História 2 não era testável sozinha, o que quebra a regra principal da lista. A
correção: Cliente e Contrato são usados por quatro histórias, então foram para a **Fundação**.
Depois disso, as tarefas foram renumeradas por um script (para não errar referências como
"até T037–T039 passarem"):

```bash
node renumerar.mjs specs/001-gestao-contratos-clientes/tasks.md
# tarefas: 78 | referências sem tarefa: nenhuma
```

E o formato foi validado com `grep`: toda tarefa tem checkbox, ID, rótulo de história (quando
deve ter) e caminho de arquivo.

### 5. MVP e ordem de entrega

- **MVP técnico:** Setup + Fundação + US1 (login).
- **Primeiro incremento útil:** + US2 (clientes). Com o P1 completo, o sistema já serve para
  alguma coisa.
- Depois: contratos → análise por IA → painel → perfil → acabamento.

No backend, só a US4 depende de outra história (precisa do upload da US3). As demais podem andar
em paralelo depois da Fundação.

## Prompts utilizados

Nenhum texto preparado: `/speckit-tasks Escreva as tarefas em português do Brasil.`

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `specs/001-gestao-contratos-clientes/tasks.md` | 78 tarefas em 9 fases |

## Problemas e soluções

- **Problema:** a História 2 dependia de um modelo criado na História 3.
  **Solução:** modelos compartilhados foram para a Fundação; tarefas renumeradas por script.
- **Observação:** o template do Spec Kit trata testes como opcionais. A constituição manda, então
  eles entraram como obrigatórios, sempre antes da implementação.

## Aprendizados

- Organizar por história (e não por camada) é o que permite entregar e testar aos pedaços.
- Um critério de pronto objetivo ("até o teste T0xx passar") evita tarefas que "quase" terminam.
- Releia a lista procurando dependências escondidas: elas quebram a independência das histórias.

## Próximo passo

- Fase 5 — Implementação com o Superpowers, começando pelo MVP (Setup + Fundação + US1).
