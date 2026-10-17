# arkhos.labs.sdd.contract

Laboratório de estudo de **Spec-Driven Development (SDD)**: uma aplicação construída do zero
seguindo um framework SDD, com cada passo — ideação, especificação, planejamento, tarefas,
implementação, testes e deploy — documentado para servir de tutorial.

## O que é a aplicação

É um sistema de **gestão de contratos de clientes**. Você faz login, cadastra clientes,
anexa contratos em PDF a eles e, se quiser, pede para a IA (Gemini) analisar os riscos de um
contrato. A Home mostra um painel com os totais e um gráfico de clientes por UF, e cada pessoa
pode editar o próprio perfil.

A chave do Gemini fica só no backend. O frontend nunca fala direto com a IA.

## Stack

- **Backend**: Node.js 24, Express, Prisma, Vitest
- **Frontend**: React, Vite, Tailwind v4, shadcn/ui, Vitest
- **Banco**: PostgreSQL em Docker
- **IA**: Gemini (análise de PDF)

## Como rodar

O passo a passo completo (banco, backend, frontend, testes e roteiro de validação manual)
está no [quickstart.md](./specs/001-gestao-contratos-clientes/quickstart.md). Em resumo:

```bash
docker compose up -d
cd backend && cp .env.example .env && npm install && npx prisma migrate deploy && npm run seed && npm run dev
```

Em outro terminal:

```bash
cd frontend && npm install && npm run dev
```

Antes de subir o backend, preencha o `.env` (`GEMINI_API_KEY`, `JWT_SECRET`, `SEED_USUARIO`, `SEED_SENHA`).
O app abre em `http://localhost:5173`.

## Onde publicar (sugestões)

Neste laboratório o deploy é **local** ([ADR 0003](docs/decisoes/0003-deploy-local-com-sugestoes.md)):
a aplicação roda inteira na sua máquina, e a gente **não validou nada em nuvem**. Se quiser
publicar, estas são três opções, do caminho mais fácil ao mais trabalhoso. Não tem passo a passo.

| Opção | Perfil | O que esperar |
|---|---|---|
| **Render** | Deploy direto do GitHub, com Postgres gerenciado | Mais simples para começar. Dá para ter um nível gratuito, com limites. |
| **Railway** | Parecido com o Render, com cobrança por uso | Também liga no GitHub e oferece Postgres pronto. |
| **VPS com Docker Compose** | Um servidor seu, onde você sobe o `docker-compose.yml` | Mais controle e mais aprendizado de infraestrutura, mas você cuida de servidor, domínio e HTTPS. |

Pontos de atenção que a gente **não testou** e que valem em qualquer uma das três:

- **Variáveis de ambiente:** `DATABASE_URL`, `JWT_SECRET` (longo e aleatório), `GEMINI_API_KEY`,
  `SEED_USUARIO` e `SEED_SENHA` precisam existir no servidor. Nunca coloque a chave do Gemini no frontend.
- **Domínio e cookies:** a sessão usa um cookie. Em domínio real, com HTTPS, confira as opções do
  cookie e se frontend e API ficam no mesmo domínio (ou como fica o CORS, se forem separados).
- **PDFs precisam de disco que sobrevive:** os contratos ficam em arquivos (`STORAGE_DIR`). Em
  plataformas com disco descartável, os PDFs somem a cada novo deploy; use um volume persistente.
- **Migrações:** rode `npx prisma migrate deploy` a cada publicação, e o `npm run seed` só na primeira.
- **Gemini:** o modelo às vezes fica sobrecarregado (já aconteceu na validação manual). O app mostra
  uma mensagem amigável, mas vale ficar de olho no custo e nos limites da sua chave.

## Como navegar

- [`docs/diario/`](docs/diario/README.md) — o passo a passo, em ordem.
- [`docs/decisoes/`](docs/decisoes/) — por que cada escolha foi feita (ADRs).
- [`docs/prompts/`](docs/prompts/) — os prompts usados com o agente de IA.
- [`docs/ideacao/`](docs/ideacao/visao-do-produto.md) — a visão do produto (o que e por quê).

Cada fase concluída tem uma tag Git (`fase-N-<nome>`), para que você possa fazer
`git checkout` em qualquer ponto do processo.

## Ponto de partida

- [`TUTORIAL_DRAFT.md`](TUTORIAL_DRAFT.md) — rascunho do tutorial, usado como guia.
- [`TUTORIAL_DRAFT_PROMPT.md`](TUTORIAL_DRAFT_PROMPT.md) — prompt que gerou o rascunho.
