# Constituição do Projeto: Sistema de Gestão de Contratos

## Princípios Fundamentais

### I. Test-First (INEGOCIÁVEL)

- Toda lógica de negócio e todo endpoint da API DEVEM começar por um teste que falha, seguindo
  o ciclo TDD: vermelho → verde → refatorar.
- Nenhum código de produção é escrito sem um teste que o exija e que tenha sido visto falhando.
- O framework de testes é o **Vitest**, tanto no backend quanto no frontend.
- Rotas HTTP do backend DEVEM ser testadas com **supertest**.

**Por quê:** o teste escrito antes é a especificação executável do comportamento. Ele impede que
o código (escrito por pessoas ou por IA) invente comportamentos que ninguém pediu.

### II. Simplicidade e Dependências Mínimas

- Novas dependências de terceiros só DEVEM ser adicionadas quando não houver alternativa razoável
  na plataforma (Node.js, navegador, bibliotecas já adotadas pela stack).
- Recursos nativos da plataforma DEVEM ser preferidos a novos pacotes.
- Toda dependência nova que não esteja listada nesta constituição DEVE ser justificada no plano
  técnico da funcionalidade.

**Por quê:** cada pacote a mais é superfície de ataque na cadeia de suprimentos e custo de
manutenção. Menos dependências, menos surpresas.

### III. Resiliência e Erros Padronizados

- Todas as rotas da API DEVEM passar por um **middleware centralizado** de tratamento de erros.
- Respostas de erro NUNCA DEVEM expor detalhes internos do servidor (stack trace, mensagens do
  banco, caminhos de arquivo, segredos).
- Toda resposta de erro DEVE ser JSON, com formato tipado e padronizado, igual em todas as rotas.

**Por quê:** um único ponto de tratamento garante consistência para o frontend e evita vazamento
de informação sensível por descuido em rotas individuais.

### IV. Arquivos Temporários com Ciclo de Vida Garantido

- PDFs DEVEM ser recebidos com o pacote **multer** e gravados temporariamente em disco antes do
  envio à API externa.
- O arquivo temporário DEVE ser apagado logo após o processamento, **inclusive em caso de erro**
  (ex.: bloco `finally` ou mecanismo equivalente).
- A remoção do arquivo temporário DEVE ser coberta por teste, tanto no caminho de sucesso quanto
  no de falha.

**Por quê:** contratos são documentos sensíveis. Arquivos esquecidos no disco são vazamento de
dados esperando para acontecer.

### V. Integração Exclusiva com o Google Gemini

- A análise por IA DEVE usar exclusivamente a API do Google Gemini, por meio do SDK oficial
  **@google/genai** (versão mais recente) e do modelo **gemini-3.8-flash**.
- A chave da API DEVE ficar somente no servidor, em variável de ambiente.
- A chave NUNCA DEVE chegar ao frontend: nem no bundle, nem em respostas da API, nem em logs.

**Por quê:** um único provedor mantém a integração simples e previsível; a chave no servidor
evita uso indevido e cobranças inesperadas.

### VI. Autenticação com JWT em Cookie HttpOnly

- O login DEVE ser feito por usuário e senha.
- Uma autenticação bem-sucedida DEVE gerar um token **JWT**, armazenado obrigatoriamente em
  **cookie HttpOnly**.
- O token NUNCA DEVE ser guardado em `localStorage`, `sessionStorage` ou outro armazenamento
  acessível por JavaScript.

**Por quê:** cookie HttpOnly não pode ser lido por scripts, o que protege o token contra ataques
de Cross-Site Scripting (XSS).

### VII. Design System Exclusivo com shadcn/ui

- A interface DEVE usar exclusivamente componentes do **shadcn/ui**, copiados para o código do
  projeto.
- Outras bibliotecas de componentes visuais NÃO DEVEM ser adicionadas.

**Por quê:** com os componentes dentro do repositório, temos controle total sobre a apresentação
e nenhuma dependência opaca de UI.

## Arquitetura e Stack Tecnológica

- **Monorepo**, com frontend e backend em diretórios separados: `backend/` e `frontend/`.
- **Backend:** Node.js com Express e TypeScript. ORM **Prisma**, conectado a **PostgreSQL**.
- **Banco de dados:** PostgreSQL rodando em **Docker**, via `docker-compose` na raiz do
  repositório.
- **Frontend:** React com **Vite**, TypeScript e **Tailwind CSS versão 4**.
- **Testes:** Vitest (backend e frontend) e supertest (rotas HTTP).
- **Uploads:** multer.
- **IA:** @google/genai com o modelo gemini-3.8-flash.

Qualquer troca de item desta lista é uma emenda à constituição (ver Governança).

## Fluxo de Desenvolvimento e Portões de Qualidade

- Toda funcionalidade passa por especificação (o *quê*) antes do plano técnico e da
  implementação (o *como*).
- O plano técnico de cada funcionalidade DEVE conter uma verificação explícita de conformidade
  com esta constituição antes da quebra em tarefas.
- Na lista de tarefas, os testes de cada comportamento DEVEM vir antes da implementação
  correspondente (Princípio I).
- Uma funcionalidade só é considerada pronta quando todos os testes passam e nenhum princípio
  desta constituição é violado sem justificativa registrada.

## Governança

- Esta constituição prevalece sobre qualquer outra prática, convenção ou preferência do projeto.
- Emendas DEVEM ser feitas pelo comando `/speckit-constitution`, com registro do motivo em um
  ADR em `docs/decisoes/`.
- Versionamento semântico:
  - **MAJOR:** remoção ou redefinição incompatível de um princípio.
  - **MINOR:** novo princípio ou seção, ou ampliação relevante de uma regra existente.
  - **PATCH:** esclarecimentos, ajustes de redação e correções sem mudança de significado.
- Toda revisão de plano, tarefas e código DEVE verificar a conformidade com esta constituição.
  Exceções DEVEM ser justificadas por escrito no plano técnico da funcionalidade.

**Versão**: 1.0.0 | **Ratificada em**: 2026-10-14 | **Última emenda**: 2026-10-14
