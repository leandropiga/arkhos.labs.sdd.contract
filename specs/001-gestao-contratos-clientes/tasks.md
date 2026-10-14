---

description: "Lista de tarefas para implementar a Gestão de Contratos de Clientes"
---

# Tarefas: Gestão de Contratos de Clientes

**Entrada**: documentos de design em `specs/001-gestao-contratos-clientes/`

**Pré-requisitos**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md),
[quickstart.md](./quickstart.md)

**Testes**: **obrigatórios**. A constituição (Princípio I, inegociável) exige TDD: em cada
história, as tarefas de teste vêm primeiro e precisam **falhar** antes da implementação
correspondente. Backend: Vitest + supertest contra o banco `contratos_test`. Frontend: Vitest +
React Testing Library, com `fetch` substituído por `vi.fn()`.

**Organização**: tarefas agrupadas por história de usuário, para que cada uma possa ser
implementada, testada e demonstrada sozinha.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[USn]**: história de usuário da spec (US1 = História 1, …)
- Caminhos seguem a estrutura do [plan.md](./plan.md): `backend/src/`, `backend/tests/`,
  `frontend/src/`, `frontend/tests/`

## Convenções que valem para todas as tarefas

- Toda resposta de erro da API usa `{ "erro": { "codigo", "mensagem", "campos?" } }` e os
  códigos da tabela de [contracts/api.md](./contracts/api.md#formato-padronizado-de-erro-princípio-iii).
- Toda rota, exceto `POST /api/auth/login`, exige sessão (middleware de T022).
- Versões fixadas conforme [research.md → R-01](./research.md#r-01-versões-dos-pacotes)
  (atenção: `prisma@7.10.0`, **não** a tag `latest`, que é uma RC).
- Textos exibidos ao usuário em português.

---

## Fase 1: Setup (infraestrutura compartilhada)

**Propósito**: criar o monorepo, o banco e os dois pacotes com suas ferramentas de teste.

- [X] T001 Criar `docker-compose.yml` na raiz com o serviço `postgres:18` (sem o campo `version`), porta 5432, volume nomeado e montagem de `docker/init-db.sql`; criar `docker/init-db.sql` que cria os bancos `contratos` e `contratos_test`
- [X] T002 Atualizar `.gitignore` da raiz com `backend/.env`, `backend/.env.test`, `frontend/.env`, `backend/tmp/`, `backend/storage/`, `node_modules/`, `dist/`
- [X] T003 Criar `backend/package.json` (ESM, `"type": "module"`) com as dependências e versões de R-01 (express 5.3.0, @prisma/client 7.10.0, prisma 7.10.0, @prisma/adapter-pg 7.10.0, pg 8.23.1, multer 2.4.0, @google/genai ^2.29.1, jose 6.2.12, zod 4.6.7; dev: typescript 7.0.2, tsx 4.23.15, vitest 5.0.4, supertest 7.3.1, @types/express 5.0.6, @types/multer 2.3.0, @types/supertest 7.2.1, @types/pg 8.23.1, @types/node 24.19.2) e scripts `dev` (`tsx watch --env-file=.env src/server.ts`), `test` (`vitest run`), `seed` (`tsx --env-file=.env prisma/seed.ts`)
- [X] T004 [P] Criar `backend/tsconfig.json` (strict, `module`/`moduleResolution` NodeNext, target ES2024) e `backend/vitest.config.ts` com `fileParallelism: false`, `globalSetup: tests/setup/global-setup.ts` e `setupFiles: tests/setup/limpar-banco.ts`
- [X] T005 [P] Criar `backend/.env.example` com `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `SEED_USUARIO`, `SEED_SENHA`, `UPLOAD_TMP_DIR=tmp/uploads`, `STORAGE_DIR=storage/contratos`, `PORT=3000`, `NODE_ENV=development`; criar `backend/.env.test.example` apontando `DATABASE_URL` para o banco `contratos_test`
- [X] T006 Criar o frontend com Vite (template `react-ts`) em `frontend/` e ajustar `frontend/package.json` às versões de R-01 (react/react-dom 19.3.0, @types/react/@types/react-dom 19.3.0, vite 8.3.4, @vitejs/plugin-react 6.1.2, typescript 7.0.2, react-router 8.4.0, zod 4.6.7)
- [X] T007 Configurar Tailwind CSS v4 em `frontend/vite.config.ts` (plugin `@tailwindcss/vite` 4.3.3) e `frontend/src/index.css` (`@import "tailwindcss";`); adicionar em `frontend/vite.config.ts` o proxy de `/api` para `http://localhost:3000`
- [X] T008 Rodar `npx shadcn@latest init` em `frontend/` (configuração Vite + Tailwind v4), gerando `frontend/components.json`, o tema em `frontend/src/index.css` e `frontend/src/lib/utils.ts`
- [X] T009 Adicionar componentes do shadcn/ui com `npx shadcn@latest add button input label form card table pagination dialog alert-dialog sonner chart sidebar avatar dropdown-menu badge skeleton` em `frontend/src/components/ui/`
- [X] T010 [P] Configurar testes do frontend: `frontend/vitest.config.ts` (ambiente `jsdom`, `setupFiles: tests/setup.ts`), `frontend/tests/setup.ts` (importa `@testing-library/jest-dom/vitest` e limpa mocks) e script `test` (`vitest run`) em `frontend/package.json` com @testing-library/react 16.3.3, @testing-library/user-event 14.6.8, @testing-library/jest-dom 7.0.1, jsdom 30.1.2

---

## Fase 2: Fundação (pré-requisitos que bloqueiam todas as histórias)

**Propósito**: erro padronizado, validação, banco, usuário, sessão e casca do frontend.

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase terminar.

### Testes da fundação (escrever primeiro e ver falhar)

- [X] T011 [P] Teste unitário de `ErroApp` e do middleware de erros em `backend/tests/unit/middleware-erros.test.ts`: `ErroApp` vira o JSON do contrato com o status certo; `ZodError` vira `400 VALIDACAO_INVALIDA` com `campos`; erro desconhecido vira `500 ERRO_INTERNO` com mensagem genérica e **sem** stack, SQL ou caminho de arquivo
- [X] T012 [P] Teste unitário de senha em `backend/tests/unit/senha.test.ts`: `gerarHash` produz valores diferentes para a mesma senha (sal aleatório); `verificarSenha` aceita a certa e recusa a errada
- [X] T013 [P] Teste unitário de JWT e cookies em `backend/tests/unit/jwt-cookies.test.ts`: token assinado expira em 8 h; token adulterado ou expirado é recusado; `lerCookie(cabecalho, "sessao")` extrai o valor; o cookie gerado tem `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=28800` e `Secure` só fora de `development`
- [X] T014 [P] Teste unitário de normalização em `backend/tests/unit/texto-busca.test.ts`: `"José ÁLVARES"` → `"jose alvares"`
- [X] T015 [P] Teste HTTP em `backend/tests/http/sessao.test.ts`: `GET /api/auth/sessao` sem cookie → `401 NAO_AUTENTICADO`; com cookie válido → `200 { usuario: Perfil }`; rota inexistente sob `/api` → `404 NAO_ENCONTRADO` no formato padronizado
- [X] T016 [P] Teste do cliente HTTP do frontend em `frontend/tests/lib/api.test.ts`: resposta 2xx devolve o JSON; resposta de erro lança `ErroApi` com `status`, `codigo`, `mensagem` e `campos`; resposta `401` de qualquer rota, exceto `POST /api/auth/login`, dispara o evento `sessao-expirada`

### Implementação da fundação

- [X] T017 Criar `backend/prisma.config.ts` (URL do banco via `DATABASE_URL`) e `backend/prisma/schema.prisma` com o modelo **Usuario** do [data-model](./data-model.md#usuario): `id` UUID; `usuario` "obrigatório, único, sem diferenciar maiúsculas (guardado em minúsculas)"; `senhaHash` obrigatório; `nome` "obrigatório, 1–120 caracteres"; `fotoUrl` opcional; `telefone` opcional; `tentativasFalhas` "padrão 0"; `bloqueadoAte` opcional; `criadoEm`/`atualizadoEm`. Gerar a migração inicial em `backend/prisma/migrations/`
- [X] T018 Adicionar em `backend/prisma/schema.prisma` os modelos compartilhados por várias histórias e gerar a migração. **Cliente**: `nomeCompleto` "obrigatório, 3–150 caracteres"; `nomeBusca` derivado e indexado; `telefone` "obrigatório; só dígitos, 10 ou 11"; `cpf` "obrigatório, **único**; só dígitos (11)"; `rg` "obrigatório, 1–20 caracteres, sem validação de formato"; `logradouro` "obrigatório, 1–200 caracteres"; `numero` "obrigatório, 1–20 caracteres (aceita "S/N")"; `cep` "obrigatório; só dígitos (8)"; `cidade` "obrigatório, 1–100 caracteres"; `uf` enum com as 27 UFs, indexado. **Contrato**: `titulo` "obrigatório, 3–200 caracteres"; `tituloBusca` derivado e indexado; `dataAssinatura` "data (sem hora)", indexada; `clienteId` "FK → Cliente, obrigatória, `ON DELETE RESTRICT`; indexada"; `arquivoNomeOriginal`; `arquivoTamanhoBytes` "1 a 52.428.800 (50 MB)"; `analiseIniciadaEm` opcional
- [X] T019 [P] Criar `backend/src/config/env.ts`: lê e valida com zod as variáveis de T005; falha na inicialização se faltar alguma obrigatória. Antes, escrever o teste `backend/tests/unit/env.test.ts` (sem `JWT_SECRET` → erro citando a variável; com todas → objeto tipado) e vê-lo falhar
- [X] T020 [P] Criar `backend/src/lib/prisma.ts` (PrismaClient com `@prisma/adapter-pg`), `backend/src/lib/senha.ts` (scrypt de `node:crypto`, sal aleatório, `timingSafeEqual`), `backend/src/lib/jwt.ts` (jose, HS256, expiração 8 h), `backend/src/lib/cookies.ts` e `backend/src/lib/texto-busca.ts` até T012–T014 passarem
- [X] T021 Criar `backend/src/http/erros.ts` (classe `ErroApp` e os códigos de [contracts/api.md](./contracts/api.md)), `backend/src/http/middleware-erros.ts` e `backend/src/http/validar.ts` (valida `body`/`query` com zod) até T011 passar
- [X] T022 Criar `backend/src/http/autenticacao.ts`: lê o cookie `sessao`, verifica o JWT, carrega o usuário e põe em `req.usuario`; senão `401 NAO_AUTENTICADO`
- [X] T023 Criar `backend/src/app.ts` (Express, `express.json()`, rotas sob `/api`, `GET /api/auth/sessao` protegida, 404 padronizado, middleware de erros por último) e `backend/src/server.ts` (sobe `app` na `PORT`) até T015 passar
- [X] T024 Criar `backend/prisma/seed.ts`: cria (ou atualiza) o usuário a partir de `SEED_USUARIO`/`SEED_SENHA`, com senha em hash e `nome` igual ao usuário
- [X] T025 Criar a infraestrutura de testes do backend: `backend/tests/setup/global-setup.ts` (carrega `.env.test` com `process.loadEnvFile` e roda `prisma migrate deploy`), `backend/tests/setup/limpar-banco.ts` (apaga todas as tabelas antes de cada arquivo) e `backend/tests/helpers/sessao.ts` (`criarUsuarioELogar()` devolve o cabeçalho `Cookie` válido para o supertest)
- [X] T026 [P] Criar `frontend/src/lib/api.ts` (`fetch` com `credentials: "same-origin"`, JSON, conversão do erro padronizado em `ErroApi`, emissão do evento `sessao-expirada` em `401` exceto no login) até T016 passar
- [X] T027 Criar a casca do frontend: `frontend/src/main.tsx` (Router + `<Toaster />` do shadcn/ui), `frontend/src/rotas.tsx` (rotas `/login`, `/`, `/clientes/*`, `/contratos/*`, `/perfil`) e `frontend/src/components/layout/layout-app.tsx` com o menu lateral (Sidebar do shadcn/ui) com Home, Clientes e Contratos (FR-032)

**Checkpoint**: a API responde no formato padronizado, existe um usuário via seed e o frontend
renderiza o menu. As histórias podem começar.

---

## Fase 3: História 1 — Entrar no sistema (P1) 🎯 MVP

**Objetivo**: login com usuário e senha, logout, rotas protegidas e bloqueio após 5 erros.

**Teste independente**: abrir uma tela interna sem login (vai para `/login`), entrar com o
usuário do seed (vê o menu), sair (volta ao login).

### Testes da História 1 (escrever primeiro e ver falhar)

- [ ] T028 [P] [US1] Teste HTTP em `backend/tests/http/auth.test.ts`: login correto → `200`, cookie `sessao` com `HttpOnly` e corpo `{ usuario: Perfil }` sem `senhaHash`; senha errada e usuário inexistente → `401 CREDENCIAIS_INVALIDAS` com a **mesma** mensagem; corpo sem `usuario` → `400 VALIDACAO_INVALIDA`; logout → `204` e cookie expirado; após logout, `GET /api/auth/sessao` → `401`
- [ ] T029 [P] [US1] Teste HTTP do bloqueio em `backend/tests/http/auth-bloqueio.test.ts` (FR-002, cenário 5): 5 senhas erradas seguidas → a 6ª tentativa, mesmo com a senha certa, devolve `429 LOGIN_BLOQUEADO`; com `bloqueadoAte` no passado, a senha certa entra e zera `tentativasFalhas`; um login certo antes da 5ª falha zera a contagem; o bloqueio está no banco (sobrevive a um novo `app`)
- [ ] T030 [P] [US1] Teste da tela de login em `frontend/tests/auth/tela-login.test.tsx`: envia usuário e senha; em sucesso navega para `/`; em `401` mostra "Usuário ou senha inválidos."; em `429` mostra o aviso de bloqueio temporário
- [ ] T031 [P] [US1] Teste da proteção de rotas em `frontend/tests/auth/rota-protegida.test.tsx`: sem sessão (`401` em `/api/auth/sessao`) redireciona para `/login`; com sessão renderiza o layout; o botão "Sair" chama `POST /api/auth/logout` e volta para `/login`; ao receber o evento `sessao-expirada` durante o uso, redireciona para `/login` (FR-004)

### Implementação da História 1

- [ ] T032 [US1] Criar `backend/src/modules/auth/servico-auth.ts`: login com usuário em minúsculas, regra de bloqueio "falha → `tentativasFalhas += 1`; se `tentativasFalhas == 5` → `bloqueadoAte = agora + 15 min`; tentativa com `bloqueadoAte > agora` → recusada (sem alterar contadores); sucesso → `tentativasFalhas = 0`, `bloqueadoAte = nulo`"
- [ ] T033 [US1] Criar `backend/src/modules/auth/rotas-auth.ts` com `POST /api/auth/login` (público), `POST /api/auth/logout` e mover `GET /api/auth/sessao` para cá; registrar em `backend/src/app.ts` até T028 e T029 passarem
- [ ] T034 [US1] Criar `frontend/src/features/auth/tela-login.tsx` (Form + Input + Button do shadcn/ui, validação zod de campos obrigatórios) até T030 passar
- [ ] T035 [US1] Criar `frontend/src/features/auth/rota-protegida.tsx` (consulta `/api/auth/sessao`, redireciona para `/login` sem sessão ou ao receber `sessao-expirada`, expõe o usuário por contexto) e o botão "Sair" no `frontend/src/components/layout/layout-app.tsx` até T031 passar

**Checkpoint**: História 1 funcional e testável sozinha.

---

## Fase 4: História 2 — Cadastrar e encontrar clientes (P1)

**Objetivo**: CRUD de clientes com validações, lista paginada com filtros por nome e CPF, e
exclusão bloqueada para cliente com contratos.

**Teste independente**: cadastrar clientes, listar, paginar e filtrar por nome e CPF, sem
nenhum contrato.

### Testes da História 2 (escrever primeiro e ver falhar)

- [ ] T036 [P] [US2] Teste unitário de CPF em `backend/tests/unit/cpf.test.ts`: aceita com e sem pontuação; normaliza para 11 dígitos; recusa dígitos verificadores inválidos e sequências repetidas (`111.111.111-11`)
- [ ] T037 [P] [US2] Teste HTTP de cadastro e edição em `backend/tests/http/clientes-cadastro.test.ts`: `POST /api/clientes` válido → `201`; cada campo obrigatório vazio → `400 VALIDACAO_INVALIDA` com o campo em `campos`; CPF inválido, CEP sem 8 dígitos e UF fora das 27 → `400`; CPF repetido → `409 CPF_DUPLICADO`; `PUT` aplica as mesmas regras; `GET /api/clientes/:id` de um cliente com 2 contratos devolve `contratos` com 2 itens (`ContratoResumo`), do mais recente para o mais antigo (FR-014); `GET /api/clientes/:id` inexistente → `404`; sem sessão → `401`
- [ ] T038 [P] [US2] Teste HTTP de listagem em `backend/tests/http/clientes-listagem.test.ts`: 25 clientes → página 1 com 20 itens em ordem alfabética e `totalPaginas: 2`; `pagina=99` devolve a última página; filtro `nome=jose` encontra "José"; filtro `cpf` com pontuação encontra o cliente; filtro sem resultado devolve `itens: []`
- [ ] T039 [P] [US2] Teste HTTP de exclusão em `backend/tests/http/clientes-exclusao.test.ts`: cliente sem contratos → `204`; cliente com 2 contratos (inseridos direto pelo Prisma) → `409 CLIENTE_COM_CONTRATOS` com mensagem citando "2 contratos"
- [ ] T040 [P] [US2] Teste das telas de clientes em `frontend/tests/clientes/clientes.test.tsx`: a lista mostra itens e paginação; digitar no filtro de nome refaz a busca; o formulário mostra o erro do campo vindo de `campos`; a exclusão bloqueada mostra a mensagem da API; lista vazia mostra "Nenhum cliente encontrado."

### Implementação da História 2

- [ ] T041 [P] [US2] Criar `backend/src/lib/cpf.ts` (normalizar e validar dígitos verificadores) até T036 passar
- [ ] T042 [US2] Criar `backend/src/modules/clientes/esquemas-clientes.ts` (zod: limites do modelo Cliente de T018, CPF/CEP/telefone aceitos com pontuação e normalizados para dígitos, UF entre as 27) e `backend/src/modules/clientes/servico-clientes.ts` (criar, editar, buscar por id com `totalContratos` e a lista `contratos` (`ContratoResumo[]`), listar com filtros e paginação de 20 por página, preencher `nomeBusca`, traduzir violação de unicidade em `409 CPF_DUPLICADO`, bloquear exclusão com `409 CLIENTE_COM_CONTRATOS` informando a quantidade)
- [ ] T043 [US2] Criar `backend/src/modules/clientes/rotas-clientes.ts` (`GET/POST /api/clientes`, `GET/PUT/DELETE /api/clientes/:id`, todas autenticadas) e registrar em `backend/src/app.ts` até T037–T039 passarem
- [ ] T044 [P] [US2] Criar `frontend/src/features/clientes/lista-clientes.tsx` (Table + Pagination do shadcn/ui, filtros por nome e CPF, estado vazio)
- [ ] T045 [P] [US2] Criar `frontend/src/features/clientes/form-cliente.tsx` (Form do shadcn/ui com Nome Completo, Telefone, CPF, RG, Logradouro, Número, CEP, Cidade e UF em lista; mostra erros de `campos`; serve para criar e editar)
- [ ] T046 [US2] Criar `frontend/src/features/clientes/detalhe-cliente.tsx` (dados do cliente, lista de contratos vinculados, botão excluir com AlertDialog e exibição do `409`) e ligar as rotas `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar` em `frontend/src/rotas.tsx` até T040 passar

**Checkpoint**: Histórias 1 e 2 funcionam de forma independente.

---

## Fase 5: História 3 — Cadastrar contratos com PDF e encontrá-los (P2)

**Objetivo**: CRUD de contratos com upload de PDF (até 50 MB), lista paginada com filtros por
título e período, detalhe e download.

**Teste independente**: com um cliente cadastrado, cadastrar contratos, filtrar, abrir o detalhe
e o PDF.

### Testes da História 3 (escrever primeiro e ver falhar)

- [ ] T047 [P] [US3] Teste HTTP de upload em `backend/tests/http/contratos-upload.test.ts`: PDF válido → `201` e arquivo em `STORAGE_DIR/<id>.pdf`; arquivo `.pdf` sem a assinatura `%PDF-` → `400 ARQUIVO_INVALIDO`; arquivo que começa com `%PDF-` mas não tem `%%EOF` no final (truncado) → `400 ARQUIVO_INVALIDO`; sem arquivo → `400 ARQUIVO_INVALIDO`; arquivo acima de 50 MB (52.428.800 bytes) → `413 ARQUIVO_MUITO_GRANDE`; `clienteId` inexistente → `400 VALIDACAO_INVALIDA`; **em todos os casos, `UPLOAD_TMP_DIR` fica vazio depois da requisição** (Princípio IV)
- [ ] T048 [P] [US3] Teste HTTP de listagem em `backend/tests/http/contratos-listagem.test.ts`: ordem por `dataAssinatura` decrescente; 20 por página; filtro `titulo` sem acento/maiúscula; filtro `dataInicio`/`dataFim` inclusivo nas duas pontas; filtros combinados; `dataInicio > dataFim` → `400 VALIDACAO_INVALIDA`; `pagina=99` devolve a última página válida
- [ ] T049 [P] [US3] Teste HTTP de detalhe, edição, exclusão e download em `backend/tests/http/contratos-detalhe.test.ts`: `GET /api/contratos/:id` traz cliente e `analise: null`; `PUT` sem arquivo mantém o PDF; `PUT` com arquivo substitui o PDF e apaga o antigo; `DELETE` → `204` e apaga o arquivo; `GET /api/contratos/:id/arquivo` → `200 application/pdf` com `Content-Disposition` usando o nome original
- [ ] T050 [P] [US3] Teste das telas de contratos em `frontend/tests/contratos/contratos.test.tsx`: formulário exige cliente e arquivo; mostra a mensagem de `413`; lista filtra por título e período; o detalhe mostra título, data, cliente e link para o PDF

### Implementação da História 3

- [ ] T051 [P] [US3] Criar `backend/src/lib/armazenamento.ts`: `salvarDoTemporario(caminhoTmp, id)` (`fs.rename` para `STORAGE_DIR/<id>.pdf`), `caminhoDoPdf(id)`, `removerPdf(id)`
- [ ] T052 [US3] Criar `backend/src/http/upload.ts`: multer `diskStorage` em `UPLOAD_TMP_DIR`, `limits.fileSize` de 52.428.800 bytes (erro do multer → `413 ARQUIVO_MUITO_GRANDE`), verificação de `%PDF-` nos primeiros bytes e `%%EOF` nos últimos 1.024 bytes (→ `400 ARQUIVO_INVALIDO`) e remoção do temporário em `finally`, com ou sem erro
- [ ] T053 [US3] Criar `backend/src/modules/contratos/esquemas-contratos.ts` e `backend/src/modules/contratos/servico-contratos.ts` (criar, editar com substituição opcional do PDF — apagando arquivo antigo e análise (FR-031) —, excluir apagando arquivo, buscar, listar com filtros e paginação de 20)
- [ ] T054 [US3] Criar `backend/src/modules/contratos/rotas-contratos.ts` (`GET/POST /api/contratos`, `GET/PUT/DELETE /api/contratos/:id`, `GET /api/contratos/:id/arquivo`) e registrar em `backend/src/app.ts` até T047–T049 passarem
- [ ] T055 [P] [US3] Criar `frontend/src/features/contratos/lista-contratos.tsx` (Table + Pagination, filtro de título e período com dois `Input type="date"` do shadcn/ui (nativo; dispensa react-day-picker e date-fns), estado vazio)
- [ ] T056 [P] [US3] Criar `frontend/src/features/contratos/form-contrato.tsx` (título, data de assinatura, seleção de cliente, campo de arquivo `accept="application/pdf"`, aviso do limite de 50 MB; criar e editar)
- [ ] T057 [US3] Criar `frontend/src/features/contratos/detalhe-contrato.tsx` (dados, link "Abrir PDF" para `/api/contratos/:id/arquivo`, excluir com AlertDialog) e ligar as rotas `/contratos`, `/contratos/novo`, `/contratos/:id`, `/contratos/:id/editar` em `frontend/src/rotas.tsx` até T050 passar

**Checkpoint**: Histórias 1, 2 e 3 funcionam de forma independente.

---

## Fase 6: História 4 — Solicitar análise de riscos por IA (P3)

**Objetivo**: botão "Solicitar Análise de PDF", análise pelo Gemini com tempo-limite de 15 s,
resultado persistente no painel e toast em caso de falha.

**Teste independente**: com um contrato cadastrado, solicitar a análise, sair, voltar e ver o
resultado (com dublê da IA nos testes).

### Testes da História 4 (escrever primeiro e ver falhar)

- [ ] T058 [P] [US4] Teste unitário do cliente da IA em `backend/tests/unit/cliente-ia.test.ts`, com o SDK `@google/genai` substituído por `vi.mock`: chama `models.generateContent` com modelo `gemini-3.8-flash`, `inlineData` com `mimeType: "application/pdf"`, `responseMimeType: "application/json"` e `abortSignal`; lê `response.text` (propriedade); JSON fora do schema → erro; aborto pelo tempo-limite → erro
- [ ] T059 [P] [US4] Teste HTTP em `backend/tests/http/analise.test.ts` com um `ClienteIA` dublê injetado no `app`: sucesso → `200 Analise` e `GET /api/contratos/:id` passa a trazer `analise` com `geradaEm`; nova análise substitui a anterior; dublê que falha ou demora mais de 15 s → `503 IA_INDISPONIVEL` e a análise anterior continua; dublê com `analisavel: false` → `422 PDF_NAO_ANALISAVEL`; segunda chamada com `analiseIniciadaEm` recente → `409 ANALISE_EM_ANDAMENTO`; trava liberada depois de sucesso e de falha; substituir o PDF pelo `PUT` apaga a análise
- [ ] T060 [P] [US4] Teste do painel de análise em `frontend/tests/contratos/painel-analise.test.tsx`: o botão "Solicitar Análise de PDF" fica desabilitado e mostra carregamento durante o pedido; sucesso mostra resumo, riscos com gravidade, cláusulas e data; `503` mostra o toast "O serviço de análise está temporariamente indisponível. Tente novamente em instantes." e mantém a análise anterior na tela

### Implementação da História 4

- [ ] T061 [US4] Adicionar o modelo **AnaliseContrato** em `backend/prisma/schema.prisma` e gerar a migração: `contratoId` "FK → Contrato, **única** (no máximo uma análise vigente), `ON DELETE CASCADE`"; `resumo` texto; `riscos` JSON "lista de `{ titulo, descricao, gravidade: "BAIXA" | "MEDIA" | "ALTA" }`"; `clausulasCriticas` JSON "lista de `{ clausula, motivo }`"; `geradaEm`
- [ ] T062 [US4] Criar `backend/src/modules/analise/cliente-ia.ts`: interface `ClienteIA` e implementação com `@google/genai` (`GEMINI_API_KEY` só daqui), `generateContent` com o PDF inline em base64, prompt em português pedindo resumo executivo dos riscos jurídicos e cláusulas críticas, schema de saída (`analisavel`, `resumo`, `riscos`, `clausulasCriticas`), `abortSignal: AbortSignal.timeout(15_000)` e validação zod da resposta até T058 passar. O idioma do resumo (FR-026, português) não é testável com dublê: fica para a validação manual (passo 9 do quickstart)
- [ ] T063 [US4] Criar `backend/src/modules/analise/servico-analise.ts`: trava atômica com `updateMany` em `analiseIniciadaEm` (nulo ou mais antigo que 60 s; senão `409`), lê o PDF de `STORAGE_DIR`, chama `ClienteIA`, faz *upsert* da análise só em sucesso, converte falhas em `503 IA_INDISPONIVEL` ou `422 PDF_NAO_ANALISAVEL`, libera a trava em `finally`
- [ ] T064 [US4] Criar `backend/src/modules/analise/rotas-analise.ts` (`POST /api/contratos/:id/analise`), permitir injetar `ClienteIA` na criação do `app` em `backend/src/app.ts` e incluir `analise` e `analiseEmAndamento` na resposta de `GET /api/contratos/:id` até T059 passar
- [ ] T065 [US4] Criar `frontend/src/features/contratos/painel-analise.tsx` (Card com resumo, riscos com Badge de gravidade, cláusulas e data; botão "Solicitar Análise de PDF"; toast via Sonner em `503` e `409`; mensagem própria em `422`) e incluir no `frontend/src/features/contratos/detalhe-contrato.tsx` até T060 passar

**Checkpoint**: Histórias 1 a 4 funcionam de forma independente.

---

## Fase 7: História 5 — Ver o painel da Home (P4)

**Objetivo**: gráfico de clientes por UF e totais de clientes e contratos.

**Teste independente**: com clientes em UFs diferentes e alguns contratos, os números da Home
batem com os cadastros.

### Testes da História 5 (escrever primeiro e ver falhar)

- [ ] T066 [P] [US5] Teste HTTP em `backend/tests/http/painel.test.ts`: banco vazio → `totalClientes: 0`, `totalContratos: 0`, `clientesPorUf: []`; com 3 clientes em SP, 1 em MG e 2 contratos → totais corretos e só UFs com clientes
- [ ] T067 [P] [US5] Teste da Home em `frontend/tests/painel/home.test.tsx`: mostra os dois totais e o gráfico; com `clientesPorUf: []` mostra o estado vazio explicativo

### Implementação da História 5

- [ ] T068 [US5] Criar `backend/src/modules/painel/servico-painel.ts` (contagens e `groupBy` por `uf`) e `backend/src/modules/painel/rotas-painel.ts` (`GET /api/painel`), registrar em `backend/src/app.ts` até T066 passar
- [ ] T069 [US5] Criar `frontend/src/features/painel/home.tsx` (Cards com os totais e gráfico de barras com o Chart do shadcn/ui; estado vazio) e ligar na rota `/` em `frontend/src/rotas.tsx` até T067 passar

**Checkpoint**: Histórias 1 a 5 funcionam de forma independente.

---

## Fase 8: História 6 — Editar o próprio perfil (P5)

**Objetivo**: a pessoa logada edita nome, URL da foto e telefone; o menu mostra nome e foto (ou
iniciais).

**Teste independente**: alterar os três campos, salvar e ver nome e foto no menu.

### Testes da História 6 (escrever primeiro e ver falhar)

- [ ] T070 [P] [US6] Teste HTTP em `backend/tests/http/perfil.test.ts`: `GET /api/perfil` devolve o perfil sem `senhaHash`; `PUT` válido → `200`; `fotoUrl` "URL `http` ou `https` válida" (outra coisa → `400 VALIDACAO_INVALIDA` em `fotoUrl`); `nome` vazio → `400`; telefone "só dígitos, 10 ou 11"
- [ ] T071 [P] [US6] Teste do perfil em `frontend/tests/perfil/perfil.test.tsx`: salvar atualiza nome e foto no menu; URL inválida mostra erro no campo; sem foto (ou foto que não carrega) mostra as iniciais no Avatar

### Implementação da História 6

- [ ] T072 [US6] Criar `backend/src/modules/perfil/rotas-perfil.ts` com esquema zod e `GET/PUT /api/perfil`, registrar em `backend/src/app.ts` até T070 passar
- [ ] T073 [US6] Criar `frontend/src/features/perfil/tela-perfil.tsx` (Form do shadcn/ui) e o Menu de Perfil em `frontend/src/components/layout/menu-perfil.tsx` (Avatar com fallback de iniciais + DropdownMenu com "Meu perfil" e "Sair"; o botão "Sair" criado na T035 é **movido** do layout para este menu, mantendo T031 verde), ligar a rota `/perfil` até T071 passar

**Checkpoint**: todas as histórias funcionam de forma independente.

---

## Fase 9: Acabamento e itens transversais

**Propósito**: requisitos que atravessam várias histórias e a validação final.

- [ ] T074 [P] Teste HTTP transversal em `backend/tests/http/seguranca.test.ts`: toda rota listada em [contracts/api.md](./contracts/api.md), exceto `POST /api/auth/login`, devolve `401` sem cookie (SC-005); nenhuma resposta de erro contém `stack`, `prisma`, caminho de arquivo ou o valor de `GEMINI_API_KEY` (SC-009)
- [ ] T075 [P] Teste de desempenho em `backend/tests/http/desempenho.test.ts`: com 10.000 clientes e 10.000 contratos inseridos em lote, listagens e filtros respondem em até 2 s (SC-004)
- [ ] T076 Conferir que o bundle do frontend não contém `GEMINI_API_KEY` nem chamadas ao Gemini (`npm run build` em `frontend/` e busca no `frontend/dist/`) (Princípio V)
- [ ] T077 [P] Criar o `README.md` da raiz com o resumo do projeto e o link para [quickstart.md](./quickstart.md)
- [ ] T078 Executar o roteiro de validação manual de [quickstart.md](./quickstart.md) (14 passos) e registrar o resultado no diário

---

## Dependências e ordem de execução

### Dependências entre fases

- **Setup (Fase 1)**: sem dependências.
- **Fundação (Fase 2)**: depende do Setup; **bloqueia todas as histórias**.
- **Histórias (Fases 3–8)**: dependem só da Fundação. Podem seguir em paralelo ou em ordem de
  prioridade (P1 → P5).
- **Acabamento (Fase 9)**: depois das histórias desejadas.

### Dependências entre histórias

- **US1 (P1)**: só a Fundação.
- **US2 (P1)**: só a Fundação (os modelos Cliente e Contrato estão em T018; o teste de exclusão
  bloqueada insere contratos direto pelo Prisma).
- **US3 (P2)**: só a Fundação no backend (os testes criam clientes pelo Prisma). A tela de
  contrato escolhe o cliente pela API `GET /api/clientes` da US2.
- **US4 (P3)**: precisa do upload e do armazenamento de PDFs da US3.
- **US5 (P4)**: só a Fundação (os testes criam clientes e contratos pelo Prisma).
- **US6 (P5)**: só a Fundação.

### Dentro de cada história

- Testes primeiro, e eles precisam **falhar** antes da implementação (Princípio I).
- Modelo → serviço → rotas → telas.
- Fechar a história (todos os testes verdes) antes de passar para a próxima prioridade.

### Oportunidades de paralelismo

- Setup: T004, T005 e T010.
- Fundação: os testes T011–T016 entre si; T019, T020 e T026.
- Em cada história, todos os testes marcados [P] entre si; telas de lista e formulário [P].
- No backend, US1, US2, US3, US5 e US6 dependem só da Fundação e podem andar juntas; a US4
  espera a US3.

---

## Exemplo de paralelismo: História 2

```text
# Testes da História 2, juntos:
Tarefa: "Teste unitário de CPF em backend/tests/unit/cpf.test.ts"
Tarefa: "Teste HTTP de cadastro e edição em backend/tests/http/clientes-cadastro.test.ts"
Tarefa: "Teste HTTP de listagem em backend/tests/http/clientes-listagem.test.ts"
Tarefa: "Teste HTTP de exclusão em backend/tests/http/clientes-exclusao.test.ts"
Tarefa: "Teste das telas de clientes em frontend/tests/clientes/clientes.test.tsx"

# Depois do serviço e das rotas, telas em paralelo:
Tarefa: "Criar frontend/src/features/clientes/lista-clientes.tsx"
Tarefa: "Criar frontend/src/features/clientes/form-cliente.tsx"
```

---

## Estratégia de implementação

### MVP primeiro (História 1)

1. Fase 1: Setup
2. Fase 2: Fundação (crítica, bloqueia tudo)
3. Fase 3: História 1 (login)
4. **Parar e validar**: passos 1–3 do quickstart
5. Seguir para a História 2, que junto com a 1 forma o primeiro incremento útil (P1 completo)

### Entrega incremental

1. Setup + Fundação → base pronta
2. US1 → login funcionando (MVP técnico)
3. US2 → clientes (P1 completo: já dá para usar)
4. US3 → contratos com PDF
5. US4 → análise por IA (o diferencial)
6. US5 → painel
7. US6 → perfil
8. Acabamento → validação completa do quickstart

Cada história fecha com todos os testes verdes e um commit, sem quebrar as anteriores.

---

## Observações

- [P] = arquivos diferentes, sem dependência de tarefa incompleta.
- O rótulo [USn] liga a tarefa à história da spec, para rastreabilidade.
- Nenhum teste chama a API real do Gemini.
- Fazer commit ao fim de cada tarefa ou grupo lógico.
- Evitar: tarefas vagas, duas tarefas no mesmo arquivo em paralelo, dependências que quebrem a
  independência das histórias.
