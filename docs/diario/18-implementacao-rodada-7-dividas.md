# 18 — Implementação, rodada 7: dívidas antes do deploy (T079–T083)

- **Data:** 2026-10-17
- **Fase:** 6 — Testes e validação (acerto de contas antes da fase 7)
- **Status:** concluída

## Objetivo

Ao longo das rodadas 3 a 6 fomos anotando "dívidas": coisas que não quebravam nada, mas que
incomodariam em produção. Antes de pensar em deploy, escolhemos as cinco que mexem com produção ou
segurança e fechamos todas. As outras ficaram anotadas (lista no fim).

> **Divergência do plano.** Essas cinco tarefas não estavam no `tasks.md` original. Criei a
> "Fase 10: Dívidas técnicas antes do deploy" (T079 a T083) antes de começar, para a rodada ter
> escopo explícito como manda o [ADR 0010](../decisoes/0010-implementacao-superpowers-sobre-tasks.md).

## Contexto / pré-requisitos

- Validação manual concluída ([entrada 17](./17-validacao-manual-quickstart.md)).
- Worktree `.worktrees/007-rodada-7-dividas`, branch `007-rodada-7-dividas`.

```bash
git worktree add .worktrees/007-rodada-7-dividas -b 007-rodada-7-dividas main
cd .worktrees/007-rodada-7-dividas
cp ../../backend/.env backend/.env
cp backend/.env.test.example backend/.env.test
(cd backend && npm ci) && (cd frontend && npm ci)
```

## Passo a passo

### 1. As cinco tarefas

| Tarefa | O problema | A correção |
|---|---|---|
| T079 | `rename` falha com `EXDEV` quando a pasta temporária e o storage ficam em volumes diferentes (comum em Docker) | se der `EXDEV`, copia e apaga o temporário |
| T080 | o download do PDF não dizia ao navegador para não guardar cache nem adivinhar o tipo | `Cache-Control: private, no-store` e `X-Content-Type-Options: nosniff` |
| T081 | **corrida no `PUT` do contrato**: a transação confirmava *antes* de o PDF novo entrar no storage; uma análise pedida nesse intervalo lia o PDF antigo e gravava como se fosse do novo | o `rename` do PDF passou para *dentro* da transação, antes do commit |
| T082 | `fotoUrl` aceitava texto de qualquer tamanho | máximo de 2048 caracteres, no backend e no formulário |
| T083 | o frontend era um arquivo só de 964 kB (o Vite avisava) | `React.lazy` nas telas e grupos de vendor |

### 2. Dois lados em paralelo, a corrida sozinha

Backend e frontend não se tocam, então rodaram ao mesmo tempo (T079, T080 e T082 de um lado; T083 e
o formulário da T082 do outro). A T081 foi sozinha, depois, porque mexe em concorrência e porque os
testes do backend dividem o mesmo banco: dois rodando juntos se atropelariam.

### 3. A corrida do `PUT` (T081), explicada

Antes, a ordem era: (1) grava no banco e confirma; (2) move o PDF novo para o storage. Entre o
passo 1 e o 2 existia um intervalo minúsculo em que o banco já dizia "contrato novo", mas o arquivo
ainda era o velho. Uma análise pedida ali lia o PDF velho.

O teste que prova isso falhou primeiro, como deve ser: ele pausa o `PUT` exatamente no `rename` e
dispara a análise nesse momento. Depois da correção, o `update` da linha segura um *lock* no
Postgres, e a trava do `POST /analise` espera esse lock soltar. Quando ela entra, o PDF novo já está
no lugar.

Trocamos um problema por outro menor: se o commit falhar *depois* do `rename`, fica o PDF novo com a
linha antiga. Aceitei (ver Rulings).

### 4. Resultado do bundle (T083)

| | Antes | Depois |
|---|---|---|
| Arquivo JS | 1 de 964,61 kB (gzip 292,70) | maior: `home` com 361,68 kB (gráfico) |
| Carregado de início | 964 kB | 542 kB (`index` 182 + `vendor-react` 257 + `vendor-radix` 103) |
| Aviso do Vite (>500 kB) | sim | sumiu |

Cada tela de cliente ou contrato virou um pedacinho de 3 a 7 kB, carregado quando a pessoa entra
nela.

### 5. Revisão e uma volta de correção

A revisão aprovou as cinco tarefas, sem nada Critical. Achou um **Important** de verdade, na junção
de duas tarefas: o fallback do `EXDEV` (T079) copiava *por cima* do PDF do contrato. Se a cópia
morresse no meio, o PDF ficava truncado, e no `PUT` o banco desfazia mas o arquivo antigo já tinha
sido estragado. Correção: copiar para `<destino>.<uuid>.part` na mesma pasta e só então fazer
`rename` (que é atômico). Dois testes ficaram mais firmes de brinde (o da corrida agora exige que a
IA tenha sido chamada; o da `fotoUrl` crava 2049 caracteres). A re-revisão confirmou as três
correções.

## Prompts utilizados

Briefs curtos por grupo, escritos a partir das linhas do `tasks.md`; ficaram em
`.superpowers/sdd/` (fora do Git).

## Arquivos gerados/alterados

| Arquivo | Para quê |
|---|---|
| `backend/src/lib/armazenamento.ts` | fallback de `EXDEV` com `.part` |
| `backend/src/modules/contratos/rotas-contratos.ts` | cabeçalhos do download |
| `backend/src/modules/contratos/servico-contratos.ts` | `rename` dentro da transação |
| `backend/src/modules/perfil/rotas-perfil.ts` | `fotoUrl` com no máximo 2048 |
| `frontend/src/features/perfil/tela-perfil.tsx` | mesmo limite no formulário |
| `frontend/src/rotas.tsx`, `frontend/vite.config.ts` | `React.lazy` e chunks |
| `backend/tests/**`, `frontend/tests/perfil/**` | testes novos de cada tarefa |
| `specs/.../tasks.md` | Fase 10 (T079–T083) criada e marcada `[X]` |

Testes ao final: backend 309, frontend 76, build sem aviso.

## Problemas e soluções

- **Problema:** o filtro de segurança do modelo cortou dois implementadores da T081 (primeiro o
  Opus, depois o Sonnet) no meio do trabalho, com "safeguards flagged this message". Era alarme
  falso: o texto falava só de concorrência e arquivos.
  **Solução:** conferi o estado do repositório. O primeiro não tinha deixado nada. O segundo já
  tinha feito o commit e o relatório antes de ser cortado, então rodei a suíte eu mesmo (308 testes
  verdes) e segui para a revisão.
- **Problema:** um implementador usou `git stash` por engano, com `pop` na hora.
  **Solução:** a lista de stash ficou vazia. Worktrees compartilham o stash; nos briefs seguintes
  proibi `git stash`.
- **Problema:** o teste da `fotoUrl` no backend foi escrito junto com a correção e nunca foi visto
  falhando. O revisor mostrou que ele falharia sem o `.max` (uma URL de 2072 caracteres daria 200).
  **Solução:** mantido, e cravado em 2049 depois.

## Rulings

1. **Rename e commit não são atômicos (T081).** Se o commit falhar depois do `rename`, ou se o
   timeout de 30 s estourar durante uma cópia lenta, fica o PDF novo com a linha antiga. *Decisão:*
   aceitar. Antes era o contrário (banco novo, PDF velho), então a mudança é neutra ou melhor, e a
   janela é mínima num app de um usuário. *Se estiver errado:* uma análise antiga vale para um PDF
   novo até a próxima edição.
2. **Três Minors do frontend ficaram para depois:** `Suspense` envolvendo todo o `<Routes>` (na
   primeira visita a cada tela o menu some por um instante); `rotas.tsx` reformatado inteiro com
   aspas e ponto e vírgula fora do estilo; fallback "Carregando..." sem `role`. *Custo se errado:*
   só aparência.

## Aprendizados

- **Consertar uma coisa pode abrir outra.** O fallback de `EXDEV` (T079) estava certo sozinho, mas
  junto com o `PUT` (T081) virou risco. Quem achou foi a revisão olhando as duas juntas.
- **Teste de corrida precisa de um gancho no ponto exato**, não de `sleep` e sorte.
- **Dividir o bundle traz uma falha nova:** se um pedaço não carregar (por exemplo depois de um
  deploy, com nome de arquivo antigo), a tela quebra. O projeto não tem `ErrorBoundary`.
- **O filtro de segurança do modelo pode cortar trabalho legítimo.** Confira o repositório antes de
  repetir a tarefa; às vezes ela já terminou.

## Dívidas que sobraram

- Sem `ErrorBoundary` para chunk lazy que falha ao carregar (**fazer antes do deploy**).
- O rollback do `rename` se o commit falhar (Ruling 1) e os três Minors do frontend (Ruling 2).
- Sem teste para falha no `rename` do `.part`; o `rm` no `catch` pode engolir o erro original.
- Acessibilidade: `aria-label` do menu de perfil, gráfico sem valores para leitores de tela, Home
  sem "tentar de novo", "Perfil salvo." que não some.
- Testes: `PUT` do perfil só com `nome`; `desempenho.test.ts` não limpa os 20.000 registros; teste
  de segurança frágil se `GEMINI_API_KEY` estiver vazia; minors da rodada 4.

## Próximo passo

- Fase 7: planejar o deploy (começando pelo `ErrorBoundary`).
