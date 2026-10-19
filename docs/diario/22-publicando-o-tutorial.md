# 22 — Publicando o tutorial

- **Data:** 2026-10-19
- **Fase:** Pós-8 — Tutorial
- **Status:** concluída

## Objetivo

Transformar o diário num tutorial público: 11 capítulos em um site no GitHub Pages, num repositório
próprio ([ADR 0013](../decisoes/0013-site-em-repositorio-proprio.md)), para um público de sêniores
que já usam IA em vibe coding ([ADR 0012](../decisoes/0012-publico-do-tutorial.md)).

## O que foi feito

1. Revisão de privacidade e laboratório público ([entrada 21](./21-preparando-o-laboratorio-publico.md)).
2. Repositório `leandropiga/tutoriais` com Astro Starlight e um tópico da barra lateral por
   tutorial (`starlight-sidebar-topics`), para a série crescer sem misturar conteúdo.
3. Visão geral, `fontes.md` com a origem de cada número de benchmark e 11 capítulos, cada um com as
   mesmas sete seções.
4. Revisão final por um revisor independente (um agente em contexto limpo, modelo mais capaz).
5. Publicação por GitHub Actions em <https://leandropiga.github.io/tutoriais/>.

## Tropeços

- **`topic` no frontmatter não funcionava** até estender o schema do conteúdo com `topicSchema`; a
  página `fontes.md` falhava o build com "Failed to find the topic".
- **Autolink `<https://…>` não vale em MDX** e quebrou o build do capítulo 02.
- **`description:` com dois-pontos no YAML** quebrou o build (duas vezes). Aspas resolvem.
- **Commitei com o build quebrado duas vezes** porque o comando seguia mesmo com erro. Depois passei
  a só commitar com `npm run build` verde.
- **A revisão independente achou dois problemas sérios** que eu não vi:
  1. as tags de partida de quatro capítulos não correspondiam ao conteúdo (no laboratório a ideação
     veio **antes** de instalar as ferramentas, e a tag `fase-4-tarefas` fica antes da análise);
  2. a frase "duas eu nem tinha pensado" era contradita pelo próprio tutorial: só uma das duas
     perguntas era realmente nova.
  Corrigi no texto e não mexi nas tags públicas.
- **Benchmarks:** duas cifras que eu tinha (250 mil desenvolvedores no Kiro; Rackspace 52 semanas
  em 3) **não** passaram na conferência com a fonte primária e saíram.

## Aprendizados

- Um revisor com contexto limpo acha incoerências que o autor não vê.
- Marcos de Git precisam ser conferidos contra o texto que os cita.
- Número de benchmark sem fonte primária não entra.

## Limitações

- Não inspecionei o site em celular nem no tema escuro (o Starlight é responsivo por padrão).
- Os comandos de instalação do capítulo 02 não foram reexecutados; só as versões foram conferidas.

## Próximo passo

- Post no LinkedIn (rascunho em `divulgacao/linkedin.md` no repositório `tutoriais`).
