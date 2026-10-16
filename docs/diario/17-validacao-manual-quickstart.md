# 17 — Validação manual: o roteiro do quickstart (T078)

- **Data:** 2026-10-15 a 2026-10-16
- **Fase:** 6 — Testes e validação
- **Status:** em andamento (faltam os passos 9, 10 e 11; falta registrar os passos 1 a 5)

## Objetivo

Os testes automáticos dizem que o código faz o que a gente combinou. Mas ninguém ainda **usou o app
de verdade**. Esta etapa é isso: seguir os 14 passos da seção 5 do
[quickstart](../../specs/001-gestao-contratos-clientes/quickstart.md), na tela, com a chave real do
Gemini, e anotar o que acontece.

## Contexto / pré-requisitos

- Rodada 6 mergeada na `main` ([entrada 16](./16-implementacao-rodada-6.md)).
- Docker com o PostgreSQL no ar.
- Chave do Gemini no `backend/.env`.

## Passo a passo

### 1. Montar o ambiente (e dois tropeços)

O `backend/.env` só tinha a `GEMINI_API_KEY`. Faltavam o banco, o segredo do JWT, o usuário do
seed e as pastas. Completei a partir do `.env.example`:

```bash
cd backend
# acrescentado ao .env (JWT_SECRET gerado com crypto.randomBytes)
# DATABASE_URL, JWT_SECRET, SEED_USUARIO, SEED_SENHA, UPLOAD_TMP_DIR, STORAGE_DIR, PORT, NODE_ENV
npm ci
npx prisma migrate deploy
npm run seed
npm run dev          # API em http://localhost:3000
```

```bash
cd frontend
npm ci
npm run dev          # app em http://localhost:5173
```

- **Tropeço 1:** na pasta principal não havia `node_modules`. Só o worktree da rodada tinha, e eu
  tinha acabado de apagá-lo. Sem as dependências, o `npx prisma` baixou outra versão (8, em
  testes) e o comando `migrate` nem existia nela. Solução: `npm ci` nas duas pastas.
- **Tropeço 2:** o comando que juntava migração, seed e servidores estourou o tempo limite. Servidor
  de desenvolvimento não termina, então rodei cada passo separado e deixei os servidores em
  segundo plano.

### 2. Arquivos de teste para o passo 6

Gerei três arquivos fora do repositório (em `Downloads/arquivos-teste-contratos`):

| Arquivo | Para quê |
|---|---|
| `1-contrato-valido.pdf` | PDF pequeno com texto de contrato (também serve para a análise de IA) |
| `2-falso-texto-renomeado.pdf` | texto puro com extensão `.pdf` (deve ser recusado) |
| `3-grande-demais-51MB.pdf` | começa como PDF, mas passa de 50 MB (deve ser recusado) |

### 3. Resultados, passo a passo

| # | Passo | Resultado |
|---|---|---|
| 6 | Contrato com PDF válido, falso e grande | ok |
| 7 | Filtros, detalhe e abrir o PDF | ok |
| 8 | Excluir cliente que tem contrato | ok (bloqueado, com a quantidade) |
| 9 | Solicitar análise de PDF | **falhou, ver abaixo** |
| 12 | Home com gráfico por UF e totais | ok |
| 13 | Perfil: nome, foto e telefone | ok |
| 14 | `backend/tmp/uploads` vazio | ok |

### 4. O passo 9 falhou: e a culpa não era nossa

Na tela apareceu "serviço de análise temporariamente indisponível". Primeiro reflexo: achar que o
nosso código estava com bug. Antes de mexer em qualquer coisa, olhei o log do backend. Ele mostra
a resposta que o Google devolveu:

```text
503 UNAVAILABLE: This model is currently experiencing high demand.
Spikes in demand are usually temporary. Please try again later.
```

Ou seja: a chave está certa (a chamada chegou ao Gemini), mas o **modelo estava sobrecarregado**.
Foram duas tentativas, as duas com 503. O app fez o certo: mapeou o erro para `503 IA_INDISPONIVEL`
e mostrou a mensagem combinada, sem vazar nada técnico (Princípio III). Sem querer, isso já foi um
ensaio do passo 11.

> Lição para o tutorial: **leia o log antes de "consertar"**. A mensagem da tela é genérica de
> propósito; o motivo de verdade está no log do servidor.

## Prompts utilizados

Nenhum prompt novo ao framework nesta etapa. A conversa foi de condução do roteiro.

## Arquivos gerados/alterados

| Arquivo | Para quê |
|---|---|
| `backend/.env` | completado (fora do Git) |
| `docs/diario/17-validacao-manual-quickstart.md` | esta entrada |

## Problemas e soluções

Ver os tropeços 1 e 2 e o passo 9 acima.

## Aprendizados

- Uma IA externa **vai** ficar indisponível de vez em quando. Tratar isso com mensagem amigável não
  é capricho, é requisito.
- Testar com a chave real mostra coisas que os testes com IA "de mentirinha" não mostram.

## Próximo passo

- Repetir o passo 9 quando o Gemini normalizar; depois os passos 10 e 11.
- Registrar os passos 1 a 5 e fechar a etapa (commit, push e tag da fase).
