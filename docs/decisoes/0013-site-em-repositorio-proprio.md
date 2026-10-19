# 0013 — O tutorial vive num repositório próprio (Astro Starlight)

- **Data:** 2026-10-19
- **Status:** aceita

## Contexto

O tutorial será publicado no GitHub Pages, com um post no LinkedIn apontando para ele. Este é o
primeiro de uma **série**: os próximos tutoriais tratarão de outras situações do dia a dia de
quem programa. Então o conteúdo de cada tutorial precisa ficar separado dos demais, e o site não
pode ficar preso a um projeto só. O autor deixou a escolha da ferramenta comigo.

## Opções consideradas

1. **Site dentro do laboratório** — um repositório só. Acopla a série a um projeto de exemplo e
   mistura código da aplicação com texto do site.
2. **Repositório separado `tutoriais`** com **Astro Starlight** — documentação pronta (busca,
   tema escuro, leitura em celular), MDX, e o plugin `starlight-sidebar-topics` dá um
   "tópico" na barra lateral por tutorial, o que mantém o conteúdo isolado.
3. **MkDocs Material ou VitePress** — equivalentes para este caso. Escolhi o Starlight pelo
   isolamento por tópicos e pelo MDX; não é um julgamento de que os outros sejam piores.

## Decisão

Opção 2. Repositório público `leandropiga/tutoriais`, estrutura em três níveis
(assunto → tutorial → capítulo), publicação por GitHub Actions em
`https://leandropiga.github.io/tutoriais/`. Cada tutorial é um tópico da barra lateral. Os links
entre capítulos ficam dentro do mesmo tutorial; entre tutoriais, só pela página do assunto.
O laboratório fica público como material de apoio (tags `fase-N-…` para o leitor fazer checkout).

## Consequências

- Um repositório a mais para manter, em troca de uma série que cresce sem mexer no laboratório.
- O conteúdo dos capítulos é copiado e adaptado do laboratório; se o diário mudar, o site não muda
  sozinho.
- Dependência do Astro e do plugin de tópicos; versões travadas no `package-lock.json`.
