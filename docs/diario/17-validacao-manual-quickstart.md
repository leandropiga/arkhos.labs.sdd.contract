# 17 — Validação manual: o roteiro do quickstart (T078)

- **Data:** 2026-10-15 a 2026-10-17
- **Fase:** 6 — Testes e validação
- **Status:** concluída (14 de 14 passos validados)

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
| 1 | Abrir `/clientes` sem login | ok (vai para `/login`) |
| 2 | Entrar com o usuário do seed | ok (menu com Home, Clientes e Contratos) |
| 3 | 5 senhas erradas | ok (aviso de bloqueio temporário; o desbloqueio de 15 min não foi esperado) |
| 4 | Cadastrar 2 clientes; repetir CPF | ok (CPF repetido recusado) |
| 5 | Filtros por nome sem acento e CPF com pontuação | ok |
| 6 | Contrato com PDF válido, falso e grande | ok |
| 7 | Filtros, detalhe e abrir o PDF | ok |
| 8 | Excluir cliente que tem contrato | ok (bloqueado, com a quantidade) |
| 9 | Solicitar análise de PDF | ok na segunda tentativa (a primeira bateu no 503 do Gemini, ver abaixo) |
| 10 | Sair da tela e voltar | ok (análise continua visível) |
| 11 | Chave inválida no `.env` | ok (aviso de indisponível; análise anterior continua) |
| 12 | Home com gráfico por UF e totais | ok |
| 13 | Perfil: nome, foto e telefone | ok |
| 14 | `backend/tmp/uploads` vazio | ok |

### 4. O passo 9 falhou (de primeira): e a culpa não era nossa

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

Mais tarde o Gemini voltou ao normal e a análise funcionou, sem mexer em código.

> Lição para o tutorial: **leia o log antes de "consertar"**. A mensagem da tela é genérica de
> propósito; o motivo de verdade está no log do servidor.

### 5. Passo 11: o `.env` só é lido na partida

Para simular a chave inválida, a troca no `backend/.env` não bastou: o servidor leu o arquivo ao
subir. Foi preciso **reiniciar o backend** (`tsx watch` vigia o código, não o `.env`). Depois do
teste, o mesmo na volta: restaurar a chave e reiniciar. Vale avisar o leitor do tutorial.

```powershell
# parar o que escuta na porta 3000 e subir de novo
Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

```bash
cd backend && npm run dev
```

## Prompts utilizados

Nenhum prompt novo ao framework nesta etapa. A conversa foi de condução do roteiro.

## Arquivos gerados/alterados

| Arquivo | Para quê |
|---|---|
| `backend/.env` | completado (fora do Git) |
| `docs/diario/17-validacao-manual-quickstart.md` | esta entrada |
| `specs/.../tasks.md` | T078 marcada `[X]` |

## Problemas e soluções

Ver os tropeços 1 e 2 e o passo 9 acima.

## Aprendizados

- **Mudou `.env`? Reinicie o servidor.** Variáveis de ambiente são lidas só na partida.
- Uma IA externa **vai** ficar indisponível de vez em quando. Tratar isso com mensagem amigável não
  é capricho, é requisito.
- Testar com a chave real mostra coisas que os testes com IA "de mentirinha" não mostram.

## Próximo passo

- Fase 7: deploy. Dívidas para olhar antes: as listadas nas entradas 15 e 16 e o chunk de 964 kB.
