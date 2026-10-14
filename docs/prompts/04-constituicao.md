# 04 — Constituição do projeto

- **Data:** 2026-10-14
- **Destino:** `/speckit-constitution` (Claude Code)
- **Base:** constituição do `TUTORIAL_DRAFT.md`, adaptada pelos ADRs 0004 (versões), 0006 (Vitest)
  e 0007 (só Claude Code). Texto convertido para português do Brasil.

## Como usar

No Claude Code, digite `/speckit-constitution` seguido do texto abaixo (tudo numa mensagem só).

## Texto

```text
Escreva a constituição em português do Brasil.

# Constituição do Projeto: Sistema de Gestão de Contratos

## Artigo I: Arquitetura e Stack Tecnológica

1. O projeto usa arquitetura monorepo, com frontend e backend em diretórios separados
   (`backend/` e `frontend/`).
2. Backend: Node.js com Express e TypeScript. O ORM é o Prisma, conectado ao PostgreSQL que roda
   em Docker (docker-compose na raiz do repositório).
3. Frontend: React com Vite, TypeScript e Tailwind CSS versão 4.
4. Design System: o frontend usa exclusivamente componentes do shadcn/ui, copiados para o código
   do projeto, para termos controle total sobre a apresentação.

## Artigo II: Qualidade e Metodologia de Implementação

1. Test-First (inegociável): toda lógica de negócio e todo endpoint da API começam por um teste
   que falha (TDD: vermelho → verde → refatorar). Usamos Vitest no backend e no frontend; rotas
   HTTP são testadas com supertest.
2. Simplicidade: evitar dependências de terceiros desnecessárias. Preferir recursos nativos da
   plataforma a novos pacotes, reduzindo riscos na cadeia de suprimentos.
3. Resiliência: todas as rotas da API passam por um middleware centralizado de tratamento de
   erros. Erros nunca expõem detalhes internos do servidor e sempre retornam JSON tipado e
   padronizado.

## Artigo III: Integrações Críticas e Segurança

1. Arquivos: PDFs são recebidos com o pacote multer, gravados temporariamente em disco antes do
   envio à API externa e apagados logo após o processamento, inclusive em caso de erro.
2. Análise por IA: o sistema se comunica exclusivamente com a API do Google Gemini, usando o SDK
   oficial @google/genai (versão mais recente) e o modelo gemini-3.8-flash. A chave da API fica
   somente no servidor, em variável de ambiente, e nunca chega ao frontend.
3. Autenticação: login por usuário e senha, gerando token JWT armazenado obrigatoriamente em
   cookie HttpOnly, para proteger contra ataques de Cross-Site Scripting (XSS).
```

## O que mudou em relação ao rascunho

| Rascunho | Aqui | Por quê |
|----------|------|---------|
| Jest no servidor | Vitest + supertest | ADR 0006 |
| "versão mais recente" do Gemini, sem modelo | `gemini-3.8-flash` | ADR 0004 |
| Português de Portugal, tom formal | Português do Brasil | público do tutorial |
| Diretórios não nomeados | `backend/` e `frontend/` | evita que o agente invente nomes |
| Exclusão "síncrona" do PDF | apagar "inclusive em caso de erro" | deixa a regra testável |
