# 0011 — Formulários com `Field` e as dependências reais do CLI do shadcn/ui

- **Data:** 2026-10-14
- **Status:** aceita

## Contexto

O plano (e o [ADR 0006](./0006-vitest-no-backend-e-frontend.md), no que toca ao frontend) partiu
do rascunho: formulários com o componente `Form` do shadcn/ui, e uma base de dependências
(`clsx`, `tailwind-merge`) que o CLI instalaria. Na implementação (rodada 1, tarefas T008 e T009),
o CLI do shadcn/ui **4.21.4** mostrou outra realidade:

- o componente `form` **não existe mais** no registry; o substituto é `Field`, que se combina com
  `react-hook-form` + `zod`;
- o CLI instalou `cn` (0.4.0) no lugar de `clsx` + `tailwind-merge`, e trouxe `shadcn` (como
  dependência de runtime), `@fontsource-variable/geist` e `next-themes` (exigido pelo sonner).

A constituição (Princípio II) exige justificar toda dependência, e o Princípio VII exige o
shadcn/ui para formulários.

## Opções consideradas

1. **Fixar um CLI antigo** só para ter o `Form` — contraria o Princípio VII na prática (versão
   abandonada) e quebra a versão de R-01.
2. **Escrever nosso próprio `Form`** — viola o Princípio VII (componente fora do shadcn/ui).
3. **Usar `Field` + `react-hook-form` + `zod`** — é o caminho atual do shadcn/ui; mesmas
   bibliotecas de antes, só muda o componente de apresentação.

## Decisão

Opção 3. Os formulários do projeto usam `Field` do shadcn/ui com `react-hook-form` e `zod`. As
dependências que o CLI 4.21.4 realmente instalou ficam aceitas e justificadas:

| Pacote | Por que é necessário |
|--------|---------------------|
| `cn` | utilitário `cn()` de classes (substitui `clsx` + `tailwind-merge` na base gerada) |
| `shadcn` | usado pelos estilos/utilitários gerados pelo CLI |
| `@fontsource-variable/geist` | fonte padrão do tema gerado |
| `next-themes` | exigido pelo componente `sonner` (toasts) |

## Consequências

- Positivo: seguimos o shadcn/ui atual; nenhuma dependência fora do que o CLI pede.
- Negativo: o padrão difere do rascunho e do `research.md`, que ainda falam em `Form`; o
  `plan.md` ganhou uma nota de atualização, e o texto original foi mantido.
- Três pacotes a mais em relação ao plano original.
- Fica registrado para o leitor do tutorial: **CLIs de componentes mudam**; confira o que o
  comando realmente instalou antes de confiar no plano.
