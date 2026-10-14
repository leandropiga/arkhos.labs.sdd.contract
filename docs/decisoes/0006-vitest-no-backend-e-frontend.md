# 0006 — Usar Vitest no backend e no frontend

- **Data:** 2026-10-14
- **Status:** aceita (diverge do rascunho)

## Contexto

A constituição do rascunho pede Jest no backend e Vitest no frontend. O backend usa TypeScript e
Prisma 7, que é ESM. O Jest com TypeScript + ESM exige configuração extra (`ts-jest`, flags
experimentais do Node, mapeamento de módulos).

## Opções consideradas

1. **Jest + Vitest** (rascunho): fiel ao guia, mas são duas ferramentas, duas configurações e mais
   atrito no backend.
2. **Vitest nos dois**: uma ferramenta só, com TypeScript e ESM nativos e API compatível com a do
   Jest (`describe`, `it`, `expect`).

## Decisão

Opção 2. O Artigo II.1 da constituição passa a dizer: "utilizando Vitest no servidor e no cliente".
Para testar as rotas HTTP do Express, usamos `supertest` junto com o Vitest.

## Consequências

- Uma única configuração de testes por pacote do monorepo, com os mesmos comandos nos dois lados.
- Quem conhece Jest continua em casa: a sintaxe dos testes é praticamente a mesma.
