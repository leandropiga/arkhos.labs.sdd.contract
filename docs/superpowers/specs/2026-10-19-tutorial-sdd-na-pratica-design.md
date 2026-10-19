# Tutorial 1 da série: "SDD na prática" — desenho

- **Data:** 2026-10-19
- **Autor da ideia:** Leandro Piga. **Redação do documento:** Claude Code (palpites meus estão marcados como *[minha escolha]*).
- **Status:** rascunho para aprovação

## 1. Intenção e porquê

Escrever o **primeiro tutorial de uma série** que ensina, na prática, o *Spec-Driven Development*
(SDD) a quem já programa há anos, mas ainda trabalha em **vibe coding** (pede código à IA, ajusta
até funcionar) ou quer entender o SDD de perto.

O gancho pessoal, nas palavras do autor: durante o `/speckit-clarify` a IA fez perguntas que ele
**não tinha pensado em responder**. Esse momento é o coração do tutorial: o SDD obriga a decidir,
antes do código, o que no vibe coding só se descobre depois, quando mudar custa caro.

O tutorial é também **parte dos estudos do autor**. Ele diz isso abertamente e deixa claro que
**não existe jeito certo ou errado**: Spec Kit + Superpowers foi o caminho que ele escolheu estudar.

## 2. Leitor

- Programador sênior, em pt-BR.
- **Já usa IA para programar no dia a dia, mas em vibe coding** (pede código, ajusta até funcionar,
  sem um processo). Conhece o dia a dia da ferramenta: prompt, contexto, agente, tokens, as
  limitações. **Não conhece o SDD.**
- Sabe Node, React, SQL e Git. **Não** se explica o que é um `PUT` nem um commit.
- Tem o Claude Code instalado e aceita gastar tempo e tokens para reproduzir o projeto.

## 3. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- O leitor consegue **refazer em casa o mesmo projeto** (gestão de contratos de clientes), do zero,
  seguindo prompts e comandos copiáveis.
- O leitor entende **por que** cada etapa existe, vendo o que ela evitou ou achou.
- Cada capítulo é completo sozinho e termina com um gancho para o próximo.
- O leitor sabe que **a IA vai divergir** do que está escrito e sabe o que fazer quando isso acontecer.

**Não-objetivos**
- Ensinar Node, React, Prisma ou Docker.
- Comparar todas as ferramentas de SDD do mercado.
- Cobrir outros agentes além do Claude Code (ADR 0007).
- Ensinar deploy em nuvem (o deploy do laboratório é local, ADR 0003).

**Anti-objetivos (seria fracasso mesmo que "funcione")**
- Soar como propaganda de SDD ou de uma ferramenta.
- Citar benchmark sem fonte ou prometer ganho que ninguém mediu.
- Prometer que o leitor terá o mesmo resultado que o autor.
- Esconder os tropeços. Eles são parte do valor.

## 4. Decisões já tomadas pelo autor

1. Público: seniores que já usam IA, mas em vibe coding, ou que querem entender SDD de perto. Não é um tutorial para quem nunca usou IA.
2. Deve explicar a decisão de usar **dois frameworks** (Spec Kit e Superpowers), com humildade.
3. Capítulos fluidos, completos e com gancho. Muito *hands-on*.
4. Aviso explícito de que a IA gera resultados diferentes.
5. Começar com uma explicação breve de SDD e benefícios, **com benchmarks de empresas**, se houver.
6. O leitor **reproduz o mesmo projeto de contratos**.
7. Publicação no **GitHub Pages**, com um post no LinkedIn apontando para o site.
8. É o **primeiro de vários**: o conteúdo de cada tutorial fica separado.
9. O site mora num **repositório novo**, separado do laboratório.
10. O laboratório (`arkhos.labs.sdd.contract`) **passa a ser público**, depois de uma revisão.
11. Ferramenta do site: decisão minha *[minha escolha: Astro Starlight]*.

## 5. Estrutura do site (aprovada)

Três níveis: **assunto → tutorial → capítulo**.

```text
tutoriais/                                   ← repositório novo (leandropiga/tutoriais) [minha escolha de nome]
├── astro.config.mjs
└── src/content/docs/
    ├── index.mdx                            ← home: lista os assuntos
    └── ia-no-desenvolvimento/               ← assunto 1 [minha escolha de nome]
        ├── index.mdx                        ← lista os tutoriais do assunto
        └── sdd-na-pratica/                  ← tutorial 1
            ├── index.mdx                    ← visão geral, pré-requisitos, custo, aviso "a IA diverge"
            └── 01-...mdx … NN-...mdx        ← capítulos
```

Regras de isolamento:
- A barra lateral mostra só os capítulos do tutorial atual.
- Links entre capítulos só dentro do mesmo tutorial; entre tutoriais, só pela página do assunto.
- Cada tutorial tem seu próprio repositório de laboratório e linka só para ele.
- Alterar um tutorial não toca nos arquivos de outro. Só a home e a página do assunto sabem que ele existe.

## 6. Esqueleto de capítulo *[minha escolha]*

Todo capítulo segue a mesma ordem, para o leitor se achar rápido:

1. **Onde estamos** (2–3 linhas, para quem chegou direto neste capítulo) e a **tag** de partida.
2. **O que vamos fazer e por quê.**
3. **Passo a passo**, com comandos (PowerShell ou bash, indicando qual) e **prompts completos copiáveis**.
4. **O que esperar** e como conferir que deu certo.
5. **Se o seu deu diferente** (caixa fixa): como lidar e a **tag de chegada** para retomar.
6. **O que isso mostrou** (o aprendizado, incluindo o tropeço real do laboratório).
7. **Gancho** para o próximo capítulo.

## 7. Capítulos propostos *[minha escolha, a validar]*

Fonte de cada um: entradas do diário em `docs/diario/` e ADRs em `docs/decisoes/`.

| # | Capítulo | Cobre | Tag de chegada |
|---|---|---|---|
| — | Visão geral do tutorial | para quem é, custo em tokens/tempo, pré-requisitos, "a IA vai divergir", como usar as tags | — |
| 01 | Do vibe coding ao SDD | o que é SDD, benefícios, evidências (com cautela), a história da clarificação | — |
| 02 | Dois frameworks, uma escolha | por que Spec Kit + Superpowers, alternativas, "não há certo ou errado"; instalação e setup (diário 00, 01, 04; ADR 0001, 0002, 0008) | `fase-0-setup` *(a criar)* |
| 03 | Ideação | transformar uma ideia solta em visão do produto (diário 02, 03) | `fase-1-ideacao` |
| 04 | Constituição e especificação | regras testáveis; spec por histórias (diário 05, 06) | `fase-2-especificacao` (parcial) |
| 05 | O momento "não tinha pensado nisso" | `/speckit-clarify` (diário 07) | `fase-2-especificacao` |
| 06 | O plano que pegou o bug antes do código | `/speckit-plan`, o limite de 50 MB (diário 08; ADR 0005, 0009) | `fase-3-planejamento` |
| 07 | Tarefas e análise | `/speckit-tasks`, `/speckit-analyze` (diário 09, 10) | `fase-4-tarefas` |
| 08 | Implementar com subagentes | worktree, ledger, rodadas, TDD (diário 11; ADR 0010) | marco da rodada 1 *(tag a criar)* |
| 09 | Revisão em camadas e Rulings | o que a revisão final achou, rodadas 2–6 (diário 12–16) | `fase-5-implementacao` |
| 10 | Validação e dívidas | roteiro manual com IA real, rodada 7 (diário 17, 18) | `fase-6-validacao` |
| 11 | Deploy local e retrospectiva | diário 19, 20; o que faríamos diferente | `fase-8-retrospectiva` |

Total: 11 capítulos + visão geral. A divisão em 08/09 e a tag extra do capítulo 08 são sugestões.

## 8. Benchmarks e evidências *[política minha]*

Pesquisa feita em 2026-10-19. Resultado honesto: **não há estudo controlado e independente que
meça ganho do SDD especificamente.** O que existe:

- **Amazon Kiro** (IDE com fluxo de specs): a própria Amazon diz que mais de 250 mil desenvolvedores
  usaram nos três primeiros meses e cita um cliente (Rackspace) que teria feito em 3 semanas um
  trabalho estimado em 52. São números **da empresa**, não verificados por terceiros.
- **GitHub Spec Kit** (lançado em setembro de 2025, MIT): GitHub o descreve como um experimento.
  Dá para citar o lançamento e o fluxo, mas não ganhos.
- **Estudos acadêmicos pequenos** (preprints no arXiv): um estudo de caso com um engenheiro e
  quatro agentes sob SDD, e um piloto de quatro meses com três times usando Spec Kit que **não**
  mede produtividade. Servem como "indícios", não como prova.
- **Contrapeso obrigatório:** o estudo da **METR** (julho de 2025) com 16 desenvolvedores
  experientes: com IA, levaram **19% mais tempo**, e acharam que tinham sido 20% mais rápidos. É o
  melhor argumento a favor de ter processo, e é honesto incluí-lo.

Regras para o texto:
- Toda cifra vem com **fonte, data e quem a produziu** (empresa, universidade, preprint).
- Antes de publicar, **abrir cada fonte primária** (a pesquisa foi feita por resumo de busca) e
  conferir o número. Se não bater, sai.
- Dizer em uma frase que **o leitor não deve esperar um multiplicador**: o ganho que o autor viu
  foi achar decisões cedo, e isso ele mostra com exemplos do próprio projeto, não com percentuais.

## 9. Restrições

- Língua: pt-BR. Tom: informal e direto, de colega para colega, sem tom de vendedor nem de curso
  para iniciantes. Frases curtas. Primeira pessoa do autor.
- **O que se explica e o que não:** não se explica IA (prompt, contexto, agente, token, alucinação,
  "pedir ao Claude"): o leitor já usa. **Explica-se o SDD do zero**: constituição, especificação,
  clarificação, plano, tarefas, análise, rodada, ledger, ruling. Cada termo é apresentado na
  primeira vez que aparece. O contraste com o vibe coding é o fio condutor do texto.
- O `CLAUDE.md` do laboratório diz que o público é "devs que ainda não usam IA". Isso vale para o
  **diário** do laboratório e foi escrito antes de o autor definir o público do tutorial. **Para o
  tutorial, o público é o do item 2.** Registrar em ADR (`docs/decisoes/0012-...`) só essa mudança
  de público; a regra de escrita informal continua valendo.
- Só Claude Code (ADR 0007). Cenas encenadas marcadas com `⚠️ Erro encenado`.
- Prompts copiados do diário e de `docs/prompts/` **na íntegra**; comandos testados sempre que possível.
- O leitor nunca deve precisar do histórico privado do autor: tudo que o texto referencia tem de
  estar no repositório público.

## 10. Preparação do laboratório para ficar público *[minha proposta]*

Antes de mudar a visibilidade de `arkhos.labs.sdd.contract`:

1. Varrer o histórico (121 commits) e os arquivos versionados por: chaves/tokens, e-mails pessoais,
   caminhos da máquina (`C:\Users\...`), nomes de terceiros, dados de clientes reais.
2. Revisar `.claude/`, `.specify/`, `docs/prompts/` e o diário por trechos que não devam ir a público.
3. Decidir sobre as tags que o tutorial pede (hoje há `fase-1` a `fase-8`; falta `fase-0-setup` e
   um marco da rodada 1).
4. Só então tornar público. **Ação irreversível na prática** (conteúdo pode ser indexado): o autor
   confirma explicitamente antes.

## 11. Entregáveis

1. Novo repositório `tutoriais` (público), com site Astro Starlight e deploy automático no Pages
   via GitHub Actions.
2. Home, página do assunto "IA no desenvolvimento" e o tutorial 1 (visão geral + 11 capítulos).
3. ADR 0012 (público do tutorial é sênior) e ADR 0013 (site em repositório próprio, Starlight).
4. Entrada de diário por etapa relevante, como sempre.
5. Rascunho do **post do LinkedIn** (curto, com o gancho da clarificação), pronto para o autor
   publicar. Ele só entra depois de o site estar no ar, para o link ser real.
6. Laboratório público e revisado.

## 12. Fora de escopo agora

Comentários/analytics no site, domínio próprio, versão em inglês, vídeos, os tutoriais seguintes.
O desenho do site já deixa espaço para os próximos, mas não os cria.

## 13. O que fica para quem for construir

Escolha de tema visual do Starlight, ordem exata das seções dentro de cada capítulo, redação final
dos textos, nomes de arquivos, texto do post do LinkedIn, detalhes do workflow de deploy.

## 14. Riscos

- **Os comandos mudam** (Spec Kit, Superpowers e Claude Code evoluem rápido). Cada capítulo informa
  as versões usadas; o aviso "a IA e as ferramentas vão divergir" abre o tutorial.
- **Custo para o leitor:** a implementação por subagentes consome tokens. Dizer isso de antemão e
  marcar o que é opcional.
- **Reprodutibilidade:** o resultado do leitor não será igual. As tags são a rede de segurança.

## 15. Respostas ao revisor e chamadas minhas

Um revisor independente leu este documento antes da entrega. As respostas:

1. **Fonte do material.** O laboratório está nesta máquina e eu leio tudo. Os capítulos **copiam e
   adaptam** diário, ADRs e prompts para dentro do site, de modo que o tutorial funcione sem
   depender de o leitor navegar no laboratório. Prompts entram na íntegra. *[minha chamada]*
2. **Ordem do trabalho.** (a) revisar o laboratório; (b) criar as tags que faltam (`fase-0-setup` no
   commit do setup, e um marco da rodada 1 no último commit dela); (c) tornar o laboratório público
   **só com a confirmação explícita do autor**; (d) criar o repositório `tutoriais` e o site com os
   links reais; (e) escrever os capítulos; (f) publicar; (g) só então o rascunho do post. Criar tags
   e repositório público são ações externas: peço confirmação antes de cada uma. *[minha chamada]*
3. **"O que esperar" e "Se o seu deu diferente".** O diário registra o que aconteceu com o autor,
   não a recuperação do leitor. Eu escrevo essas caixas a partir dos tropeços reais do diário e dos
   critérios dos testes, e marco como orientação, não como garantia. *[minha chamada]*
4. **Versões.** O diário 04 registra as versões instaladas. Eu confiro de novo com `--version` na
   hora de escrever e anoto as versões e a data em cada capítulo.
5. **Voz.** Eu escrevo a prosa completa em primeira pessoa do autor, para ele revisar e reescrever
   como quiser. Nenhum capítulo é publicado sem o aval dele. *[minha chamada]*
6. **Benchmarks.** A verificação das fontes primárias é minha. Número que eu não conseguir
   confirmar na fonte original sai do texto, e eu aviso o autor em vez de ficar com uma lacuna
   silenciosa.
7. **Nomes.** A conta é `leandropiga` (conferido com `gh`). Repositório `tutoriais`, site de
   projeto em `https://leandropiga.github.io/tutoriais/`, logo `base: '/tutoriais'` no Astro. Eu
   crio o repositório com `gh`, depois da confirmação.
8. **Link de volta.** O README do laboratório ganha, ao publicar, um link para o tutorial. Nenhuma
   outra alteração no diário além da revisão de privacidade.
