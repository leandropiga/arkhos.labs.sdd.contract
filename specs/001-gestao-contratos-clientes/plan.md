# Plano de Implementação: Gestão de Contratos de Clientes

**Branch**: `001-gestao-contratos-clientes` | **Data**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Entrada**: especificação em `specs/001-gestao-contratos-clientes/spec.md` e prompt técnico em
`docs/prompts/06-plano-tecnico.md`.

## Resumo

Sistema web para um(a) operador(a) administrativo(a) cadastrar clientes e contratos (com o PDF),
encontrá-los com filtros e paginação, ver um painel com totais e clientes por UF, e pedir a uma
IA um resumo dos riscos jurídicos de cada contrato.

Abordagem: monorepo com `backend/` (API REST em Express 5 + Prisma 7 sobre PostgreSQL em Docker)
e `frontend/` (SPA em React 19 + Vite 8 + Tailwind v4 + shadcn/ui). Sessão por JWT em cookie
HttpOnly. PDFs recebidos pelo multer num diretório temporário e movidos para um armazenamento
permanente local; a análise lê o arquivo permanente e chama o Gemini (`gemini-3.8-flash`) com
tempo-limite de 15 s. Desenvolvimento guiado por testes com Vitest (+ supertest no backend).

## Contexto Técnico

**Linguagem/Versão**: TypeScript 7.0 sobre Node.js 24 LTS (backend); TypeScript 7.0 no navegador
via Vite (frontend).

**Dependências principais**: Express 5.3, Prisma 7.10 (+ `@prisma/adapter-pg`), multer 2.4,
@google/genai 2.29, jose 6.2, zod 4.6 / React 19.3, react-router 8.4, Tailwind CSS 4.3,
shadcn/ui (CLI 4.21), react-hook-form, recharts, sonner. Lista completa e motivos em
[research.md → R-01](./research.md#r-01-versões-dos-pacotes).

**Armazenamento**: PostgreSQL 18 (Docker) para dados; disco local para PDFs
(`STORAGE_DIR`), com diretório temporário separado para uploads (`UPLOAD_TMP_DIR`).

**Testes**: Vitest 5 nos dois pacotes; supertest para rotas HTTP contra o banco
`contratos_test`; React Testing Library + jsdom no frontend; dublê para o cliente do Gemini.

**Plataforma alvo**: execução local (Windows, macOS ou Linux com Docker); navegador de desktop.

**Tipo de projeto**: aplicação web (backend + frontend).

**Metas de desempenho**: listagens e filtros em até 2 s com 10.000 clientes e 10.000 contratos
(SC-004); espera máxima de 15 s pela IA (FR-030).

**Restrições**: PDF até 50 MB (FR-017, igual ao limite do Gemini); chave da IA só no servidor; nenhum arquivo temporário
remanescente após uma requisição; erros sem detalhes internos.

**Escala/escopo**: um tipo de usuário, poucas pessoas simultâneas; ~10 telas (login, home,
clientes: lista/form/detalhe, contratos: lista/form/detalhe, perfil).

## Constitution Check

*Portão: precisa passar antes da Fase 0 e ser reconferido depois da Fase 1.*

| Princípio / Seção | Como o plano atende | Antes | Depois |
|-------------------|---------------------|-------|--------|
| I. Test-First | Toda regra e rota começa por teste que falha; Vitest nos dois lados, supertest nas rotas; cada história com testes dos cenários de aceitação ([R-10](./research.md#r-10-banco-de-teste-e-execução-dos-testes)) | ✅ | ✅ |
| II. Simplicidade | Nativos onde possível: scrypt, `fetch`, `AbortSignal.timeout`, `--env-file`, parsing de cookie, normalização de texto. Dependências fora da constituição justificadas abaixo | ✅ | ✅ |
| III. Resiliência | Middleware único de erros; formato `{ erro: { codigo, mensagem, campos? } }` definido em [contracts/api.md](./contracts/api.md); `ERRO_INTERNO` sem detalhes | ✅ | ✅ |
| IV. Arquivos temporários | multer em `UPLOAD_TMP_DIR`; `finally` remove o temporário em sucesso e erro; testes conferem diretório vazio ([R-06](./research.md#r-06-armazenamento-dos-pdfs--arquivos-temporários-princípio-iv)) | ✅ | ✅ |
| V. Gemini exclusivo | `@google/genai` + `gemini-3.8-flash`, chave em `GEMINI_API_KEY` só no backend, isolado em `cliente-ia.ts` | ✅ | ✅ (limite de 50 MB alinhado à spec; ver Riscos R1) |
| VI. JWT em cookie HttpOnly | Cookie `sessao` HttpOnly, SameSite=Lax, Secure fora de dev; nada em `localStorage` | ✅ | ✅ |
| VII. shadcn/ui exclusivo | Inicializado com `npx shadcn@latest init`; toasts, forms, tabelas, paginação e gráfico via shadcn/ui | ✅ | ✅ |
| Stack | Monorepo `backend/` + `frontend/`, Express + TS + Prisma + PostgreSQL em Docker (compose na raiz), React + Vite + TS + Tailwind 4 | ✅ | ✅ |
| Fluxo | Spec esclarecida antes do plano; tarefas de teste antes das de implementação (a garantir no `/speckit-tasks`) | ✅ | ✅ |

**Dependências fora da constituição (Princípio II)**:

| Pacote | Por que é necessário |
|--------|---------------------|
| `@prisma/adapter-pg` + `pg` | o Prisma 7 se conecta ao PostgreSQL por *driver adapter* |
| `jose` | assinar/verificar JWT com segurança; sem dependências transitivas ([R-03](./research.md#r-03-jwt-e-cookie-de-sessão)) |
| `zod` | validação com lista de campos (Princípio III); já exigido pelo Form do shadcn/ui ([R-05](./research.md#r-05-validação-de-entrada)) |
| `tsx` | rodar TypeScript em desenvolvimento sem etapa de build |
| `react-router` | rotas da SPA e proteção por sessão |
| `react-hook-form`, `@hookform/resolvers`, `recharts`, `sonner`, `lucide-react` | dependências dos próprios componentes do shadcn/ui (Form, Chart, Sonner, ícones) |
| `@testing-library/*`, `jsdom` | testes de componentes React com Vitest |

Resultado: **portão aprovado**, sem violações a justificar.

## Riscos

| # | Risco | Impacto | Tratamento |
|---|-------|---------|------------|
| R1 | ~~**Conflito entre a spec e o fornecedor de IA.** A documentação do Gemini limita PDFs a 50 MB (inline e File API), mas FR-017 aceitava até 100 MB~~ **Resolvido:** FR-017 emendado para 50 MB ([R-07](./research.md#r-07-integração-com-o-gemini), [ADR 0009](../../docs/decisoes/0009-plano-pega-o-limite-do-gemini.md)). Resta o limite de 1.000 páginas do Gemini, não conferido no upload | Baixo: contrato com mais de 1.000 páginas em até 50 MB é raro; a análise falharia com `503 IA_INDISPONIVEL` | Aceito; reavaliar se aparecer na prática |
| R2 | Tag `latest` do `prisma` aponta para uma RC (8.0.0-rc.22) | `npm install prisma` instalaria versão instável e incompatível com o client 7.10 | Fixar `prisma@7.10.0` no `package.json` ([R-01](./research.md#r-01-versões-dos-pacotes)) |
| R3 | TypeScript 7.0 é recente (compilador reescrito) | Alguma ferramenta pode não ser compatível | Recuar para a 6.x mais recente e registrar no diário |
| R4 | Abortar a requisição ao Gemini não cancela o processamento no Google | A chamada pode ser cobrada mesmo após o tempo-limite | Aceito: volume baixo; registrado para o leitor |

## Estrutura do Projeto

### Documentação (desta funcionalidade)

```text
specs/001-gestao-contratos-clientes/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Fase 0 (/speckit-plan)
├── data-model.md        # Fase 1 (/speckit-plan)
├── quickstart.md        # Fase 1 (/speckit-plan)
├── contracts/
│   └── api.md           # Fase 1 (/speckit-plan)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado pelo /speckit-plan)
```

### Código-fonte (raiz do repositório)

```text
docker-compose.yml               # PostgreSQL 18, sem o campo `version`
docker/
└── init-db.sql                  # cria os bancos contratos e contratos_test

backend/
├── .env.example
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                  # primeiro usuário a partir de SEED_USUARIO / SEED_SENHA
├── src/
│   ├── server.ts                # sobe o HTTP
│   ├── app.ts                   # monta o Express (testável com supertest)
│   ├── config/env.ts            # lê e valida variáveis de ambiente
│   ├── http/
│   │   ├── erros.ts             # classe ErroApp + códigos do contrato
│   │   ├── middleware-erros.ts  # middleware centralizado (Princípio III)
│   │   ├── autenticacao.ts      # exige sessão válida
│   │   ├── upload.ts            # multer + limpeza do temporário (Princípio IV)
│   │   └── validar.ts           # zod → VALIDACAO_INVALIDA
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── senha.ts             # scrypt
│   │   ├── jwt.ts               # jose
│   │   ├── cookies.ts
│   │   ├── cpf.ts
│   │   ├── texto-busca.ts       # normalização sem acento
│   │   └── armazenamento.ts     # PDFs permanentes
│   └── modules/
│       ├── auth/                # login, logout, sessão, bloqueio
│       ├── perfil/
│       ├── clientes/
│       ├── contratos/
│       ├── analise/             # serviço + cliente-ia.ts (único ponto que fala com o Gemini)
│       └── painel/
├── tests/
│   ├── setup/                   # globalSetup (migrações) e limpeza do banco
│   ├── unit/                    # cpf, senha, texto-busca, regras de bloqueio…
│   └── http/                    # supertest por módulo, cobrindo os cenários da spec
├── tmp/uploads/                 # temporário (no .gitignore)
└── storage/contratos/           # PDFs permanentes (no .gitignore)

frontend/
├── .env.example
├── components.json              # gerado pelo shadcn init
├── vite.config.ts               # plugin React, Tailwind v4, proxy /api
├── src/
│   ├── main.tsx
│   ├── index.css                # @import "tailwindcss" + tema do shadcn
│   ├── rotas.tsx                # rotas e proteção por sessão
│   ├── lib/api.ts               # fetch + erro padronizado → exceção tipada
│   ├── components/
│   │   ├── ui/                  # componentes do shadcn/ui (copiados)
│   │   └── layout/              # menu lateral, menu de perfil
│   └── features/
│       ├── auth/                # tela de login
│       ├── painel/              # Home com gráfico e totais
│       ├── clientes/            # lista, formulário, detalhe
│       ├── contratos/           # lista, formulário, detalhe, painel de análise
│       └── perfil/
└── tests/                       # Vitest + React Testing Library por feature
```

**Decisão de estrutura**: opção "aplicação web" do template, com os diretórios `backend/` e
`frontend/` exigidos pela constituição. Dentro de cada um, organização por **módulo/feature**
(clientes, contratos, análise…), para que cada história de usuário da spec corresponda a uma
fatia de código e de testes que pode ser entregue sozinha.

## Complexity Tracking

Não há violações da constituição a justificar.
