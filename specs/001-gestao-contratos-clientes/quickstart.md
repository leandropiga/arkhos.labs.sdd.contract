# Quickstart: rodar e validar a Gestão de Contratos

**Data**: 2026-10-14 | **Plano**: [plan.md](./plan.md)

Guia para subir a aplicação localmente e conferir, de ponta a ponta, que as histórias da
[spec](./spec.md) funcionam. Detalhes de rotas e erros estão no [contrato da API](./contracts/api.md).

## Pré-requisitos

- Node.js 24 LTS e npm
- Docker com Docker Compose v2 ou superior
- Uma chave da API do Gemini (só para a validação da História 4)

## 1. Subir o banco

```bash
docker compose up -d
```

Cria o PostgreSQL com dois bancos: `contratos` (desenvolvimento) e `contratos_test` (testes).

## 2. Backend

```bash
cd backend
cp .env.example .env          # preencha GEMINI_API_KEY, JWT_SECRET, SEED_USUARIO e SEED_SENHA
npm install
npx prisma migrate deploy
npm run seed                  # cria o primeiro usuário a partir de SEED_USUARIO / SEED_SENHA
npm run dev                   # API em http://localhost:3000/api
```

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # app em http://localhost:5173 (proxy de /api para o backend)
```

## 4. Rodar os testes

```bash
cd backend && npm test        # Vitest + supertest contra o banco contratos_test
cd frontend && npm test       # Vitest + React Testing Library
```

Resultado esperado: todos os testes passam e nenhum chama a API real do Gemini.

## 5. Roteiro de validação manual

| # | História | Passos | Resultado esperado |
|---|----------|--------|--------------------|
| 1 | Login (P1) | Abrir `http://localhost:5173/clientes` sem login | Vai para `/login` |
| 2 | Login (P1) | Entrar com o usuário do seed | Menu com Home, Clientes e Contratos |
| 3 | Login (P1) | Sair; errar a senha 5 vezes; tentar a senha certa | Aviso de bloqueio temporário; após 15 min entra |
| 4 | Clientes (P1) | Cadastrar 2 clientes em UFs diferentes; tentar repetir um CPF | Lista com os 2; CPF repetido recusado |
| 5 | Clientes (P1) | Filtrar por parte do nome sem acento; filtrar por CPF com pontuação | Só os clientes certos aparecem |
| 6 | Contratos (P2) | Cadastrar contrato com PDF; tentar com um `.txt` renomeado para `.pdf`; tentar com um PDF acima de 50 MB | Primeiro aceito; os outros dois recusados com mensagem |
| 7 | Contratos (P2) | Filtrar por título e por período; abrir o detalhe; abrir o PDF | Filtros corretos; PDF abre |
| 8 | Clientes (P1) | Tentar excluir o cliente que tem contrato | Bloqueado, com a quantidade de contratos |
| 9 | Análise (P3) | No detalhe do contrato, "Solicitar Análise de PDF" | Painel com resumo, riscos e cláusulas; data de geração |
| 10 | Análise (P3) | Sair da tela e voltar | Análise continua visível |
| 11 | Análise (P3) | Com `GEMINI_API_KEY` inválida no `.env`, pedir análise | Toast "serviço de análise temporariamente indisponível"; análise anterior continua |
| 12 | Painel (P4) | Abrir a Home | Gráfico por UF e totais batem com os cadastros |
| 13 | Perfil (P5) | Alterar nome, foto (URL) e telefone | Nome e foto aparecem no menu |
| 14 | Arquivos | Após os passos 6 e 9, listar `backend/tmp/uploads` | Diretório vazio (Princípio IV) |
