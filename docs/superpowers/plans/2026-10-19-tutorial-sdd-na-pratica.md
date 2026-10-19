# Tutorial 1 "SDD na prática" — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar no GitHub Pages o tutorial 1 da série (11 capítulos + visão geral), em repositório próprio, e deixar o laboratório público e revisado.

**Architecture:** Dois repositórios. O laboratório `arkhos.labs.sdd.contract` (fonte do material e código de apoio, vira público) e o novo `tutoriais` (site Astro Starlight, conteúdo em MDX, deploy por GitHub Actions). O conteúdo dos capítulos é adaptado do diário, dos ADRs e dos prompts do laboratório, copiado para dentro do site.

**Tech Stack:** Astro + Starlight, plugin `starlight-sidebar-topics` (um "topic" por tutorial), MDX, GitHub Actions + Pages, `gh` CLI, Node 24.

**Spec:** `docs/superpowers/specs/2026-10-19-tutorial-sdd-na-pratica-design.md` (lab). Mande ler a spec inteira antes de qualquer tarefa de capítulo.

## Global Constraints

- Idioma pt-BR; tom informal e direto, primeira pessoa do autor (Leandro). Público: sênior que usa IA em vibe coding e não conhece SDD (spec §2, §9).
- Não explicar IA (prompt, contexto, agente, token). Explicar cada termo do SDD na primeira aparição.
- Só Claude Code (ADR 0007). Cenas encenadas marcadas `⚠️ Erro encenado`.
- Prompts copiados **na íntegra** de `docs/prompts/` e do diário; nunca parafrasear um prompt.
- Esqueleto fixo de capítulo (spec §6): Onde estamos + tag de partida; O que vamos fazer e por quê; Passo a passo; O que esperar; Se o seu deu diferente (+ tag de chegada); O que isso mostrou; Gancho.
- Cada capítulo informa as versões usadas (conferidas com `--version` no dia) e a data.
- Cifras de benchmark: fonte, data e autoria; só entram depois de conferidas na fonte primária (spec §8). Número não confirmado sai.
- Isolamento (spec §5): links entre capítulos só dentro do mesmo tutorial; a barra lateral mostra só o tutorial atual; entre tutoriais, só pela página do assunto.
- Site de projeto: URL `https://leandropiga.github.io/tutoriais/`, Astro `site: 'https://leandropiga.github.io'`, `base: '/tutoriais'`. Todo link interno respeita o `base`.
- Nada de dado pessoal no conteúdo público: e-mails, caminhos como `C:\Users\leand`, chaves, nomes de terceiros.
- **Ações externas pedem confirmação explícita do autor antes de rodar**: criar tags no remoto, tornar o laboratório público, criar o repositório público `tutoriais`, ativar o Pages, publicar.
- Mensagens de commit em pt-BR (`diario(NN):`, `docs:`, `feat:`, `chore:`); no laboratório, push após cada commit de etapa (CLAUDE.md).

## Review Focus

1. **Prompt divergente da fonte:** um prompt no capítulo que difere do original do laboratório (quebra a reprodução). Cada capítulo tem a verificação "prompts idênticos à fonte".
2. **404 no Pages por causa do `base`:** link, imagem ou favicon que funciona no `dev` e quebra publicado. A tarefa do site verifica com `astro build` + `astro preview` usando o `base` real.
3. **Capítulo aberto direto pelo LinkedIn:** o leitor que cai no capítulo 07 sem ter lido o 03 precisa do "Onde estamos" e da tag de partida. Verificado por capítulo.
4. **Vazamento entre tutoriais ou de dados pessoais:** link que cruza tutoriais, ou string com e-mail/caminho da máquina. Varredura final com `grep` (tarefa 16).
5. **Número de benchmark sem fonte primária conferida.** Tarefa 7 produz o arquivo de fontes, e a revisão confere cifra por cifra.

---

## Estrutura de arquivos

**Laboratório (`arkhos.labs.sdd.contract`)**
- `docs/diario/21-preparando-o-laboratorio-publico.md` — revisão de privacidade, tags, publicação.
- `docs/decisoes/0012-publico-do-tutorial.md`, `0013-site-em-repositorio-proprio.md` + `docs/decisoes/README.md`.
- `README.md` — link para o tutorial (tarefa 17).

**Site (`tutoriais`, novo)**
- `astro.config.mjs`, `package.json`, `.github/workflows/deploy.yml`
- `src/content/docs/index.mdx` (home), `src/content/docs/ia-no-desenvolvimento/index.mdx` (assunto)
- `src/content/docs/ia-no-desenvolvimento/sdd-na-pratica/index.mdx` (visão geral) e `01-…mdx` a `11-…mdx`
- `src/content/docs/ia-no-desenvolvimento/sdd-na-pratica/fontes.md` (fontes dos benchmarks; fora da barra lateral)
- `divulgacao/linkedin.md` (fora do conteúdo do site)

---

### Task 1: Revisão de privacidade do laboratório

**Files:**
- Create: `docs/diario/21-preparando-o-laboratorio-publico.md`
- Modify: arquivos do laboratório que a varredura apontar.

**Interfaces:**
- Produces: relatório de achados (arquivo+linha+decisão) na entrada 21; laboratório limpo para ficar público. Task 3 depende disso.

- [ ] **Step 1: Varrer arquivos versionados.** `git ls-files` + `grep -rnIE` por: `leandropiga@gmail`, `C:\\Users`, `C:/Users`, `/c/Users`, `leand`, `API_KEY=` com valor, `AIza`, `sk-`, `ghp_`, `password`, `Bearer ` e nomes próprios fora do autor. Registrar cada ocorrência.
- [ ] **Step 2: Varrer o histórico.** `git log -p --all -S"<padrão>"` para os mesmos padrões; incluir mensagens de commit e e-mails de autor (`git log --format='%ae %an'`). O e-mail de autor dos commits é público por natureza; registrar como achado informativo, sem reescrever histórico.
- [ ] **Step 3: Revisar `.claude/`, `.specify/`, `docs/prompts/`, `docs/diario/` à mão** por trechos que não devam ir a público (conversas, tokens, caminhos, notas privadas).
- [ ] **Step 4: Decidir e corrigir.** Cada achado vira: remover, trocar por genérico (`C:\Users\<você>`), ou aceitar (com motivo). Rodar de novo a varredura até zerar o que não foi aceito.
- [ ] **Step 5: Escrever a entrada 21 (parte 1)** no tom do diário: o que foi varrido, o que achou, o que mudou; atualizar `docs/diario/README.md`.
- [ ] **Step 6: Commit e push.** `git commit -m "diario(21): revisão de privacidade do laboratório"`.

Verificação: a varredura final do Step 4 não devolve nada fora da lista de aceitos.

### Task 2: Tags `fase-0-setup` e marco da rodada 1

**Files:** nenhum arquivo; tags Git. Registro na entrada 21.

**Interfaces:**
- Consumes: Task 1 concluída.
- Produces: tags `fase-0-setup` e `fase-5a-rodada-1` no remoto (usadas nos capítulos 02 e 08).

- [ ] **Step 1: Achar os commits.** `git log --oneline -- docs/diario/00-setup-do-laboratorio.md docs/diario/01-conectando-claude-ao-github.md` (último commit da fase 0) e o commit da rodada 1 (`git log --oneline --grep="rodada 1"`). Mostrar os dois hashes ao autor.
- [ ] **Step 2: Pedir confirmação** dos dois hashes e do nome das tags.
- [ ] **Step 3: Criar e enviar.** `git tag fase-0-setup <hash>`, `git tag fase-5a-rodada-1 <hash>`, `git push origin fase-0-setup fase-5a-rodada-1`.
- [ ] **Step 4: Conferir.** `git ls-remote --tags origin` lista as duas. Registrar na entrada 21 e commitar.

### Task 3: Tornar o laboratório público

**Files:** nenhum; configuração do repositório. Registro na entrada 21.

**Interfaces:**
- Consumes: Tasks 1 e 2 concluídas.
- Produces: `https://github.com/leandropiga/arkhos.labs.sdd.contract` público (capítulos linkam para ele).

- [ ] **Step 1: Mostrar ao autor** o resumo da revisão (Task 1) e pedir confirmação explícita, avisando que o conteúdo pode ser indexado e que tornar privado de novo não remove o que já foi copiado.
- [ ] **Step 2: Só após o "sim":** `gh repo edit leandropiga/arkhos.labs.sdd.contract --visibility public --accept-visibility-change-consequences`.
- [ ] **Step 3: Conferir** `gh repo view leandropiga/arkhos.labs.sdd.contract --json visibility` devolve `PUBLIC`, e abrir a URL sem login (`curl -sI`) devolve 200. Registrar e commitar.

### Task 4: ADRs 0012 e 0013

**Files:**
- Create: `docs/decisoes/0012-publico-do-tutorial.md`, `docs/decisoes/0013-site-em-repositorio-proprio.md`
- Modify: `docs/decisoes/README.md`, `CLAUDE.md` (uma linha: o público do **tutorial** é sênior; o diário segue o texto atual)

- [ ] **Step 1: ADR 0012** (template `_template.md`): contexto = `CLAUDE.md` diz "devs que ainda não usam IA"; decisão = tutorial 1 é para seniores que usam IA em vibe coding; consequência = não explica IA, explica SDD; o diário não muda.
- [ ] **Step 2: ADR 0013:** site em repositório `tutoriais` separado, Astro Starlight, `starlight-sidebar-topics`, publicação por Actions; opções descartadas = site dentro do laboratório (acopla a série a um projeto); MkDocs Material, VitePress (equivalentes, escolha do autor deixada a mim).
- [ ] **Step 3: Atualizar o índice** `docs/decisoes/README.md` e a nota no `CLAUDE.md`. Commit e push: `docs: ADRs 0012 e 0013`.

### Task 5: Repositório `tutoriais` e esqueleto do site

**Files (no novo repositório):** `package.json`, `astro.config.mjs`, `.github/workflows/deploy.yml`, `src/content/docs/index.mdx`, `.gitignore`, `README.md`.

**Interfaces:**
- Produces: site que builda e serve com `base: '/tutoriais'`; configuração de topics em `astro.config.mjs` em que **cada tutorial é um topic** (`label`, `link`, `items`/`autogenerate`). Tasks 6–15 só acrescentam arquivos de conteúdo e uma entrada de topic por tutorial.

- [ ] **Step 1: Pedir confirmação** para criar o repositório público `leandropiga/tutoriais`. Só depois: `gh repo create leandropiga/tutoriais --public --clone` em `C:\Developer\labs\`.
- [ ] **Step 2: Gerar o projeto** com `npm create astro@latest -- --template starlight` (conferir a sintaxe vigente na documentação do Starlight e usar a atual) e instalar `starlight-sidebar-topics`; versões travadas no `package-lock.json`.
- [ ] **Step 3: Configurar** `astro.config.mjs`: `site: 'https://leandropiga.github.io'`, `base: '/tutoriais'`, `title: 'Tutoriais'`, `defaultLocale` pt-BR, `lang: 'pt-BR'`, idioma da busca; um topic para "IA no desenvolvimento → SDD na prática" apontando para `/ia-no-desenvolvimento/sdd-na-pratica/` com `autogenerate` do diretório; o topic **não** lista os outros tutoriais.
- [ ] **Step 4: Home** `index.mdx` com título, uma frase e link para o assunto (ainda sem conteúdo do tutorial).
- [ ] **Step 5: Workflow de deploy** `.github/workflows/deploy.yml` com o fluxo oficial do Astro para Pages (`withastro/action` + `actions/deploy-pages`), disparado em push na `main`.
- [ ] **Step 6: Verificar.** `npm run build` sem erro; `npm run preview` e abrir `http://localhost:4321/tutoriais/` (home carrega, CSS e favicon carregam, busca abre).
- [ ] **Step 7: Commit e push.** `chore: esqueleto do site com Astro Starlight`. **Não ativar o Pages ainda** (Task 17).

### Task 6: Home, assunto e visão geral do tutorial

**Files:** `src/content/docs/index.mdx`, `…/ia-no-desenvolvimento/index.mdx`, `…/sdd-na-pratica/index.mdx`.

**Interfaces:** Consumes Task 5. Produces a página de visão geral, que todo capítulo linka em "Onde estamos".

- [ ] **Step 1: Home** lista os assuntos (um, por enquanto). **Assunto** lista os tutoriais (um) com a promessa em duas linhas.
- [ ] **Step 2: Visão geral do tutorial** com: para quem é e para quem não é; o que o leitor vai construir (o app de contratos, em uma frase e uma imagem/lista de telas); pré-requisitos (Node 24, Docker, Git, Claude Code, chave do Gemini opcional só para o capítulo de IA); **custo honesto** em tempo e tokens (estimar a partir do diário e dizer que é estimativa); **aviso de que a IA diverge**, e como as tags funcionam; mapa dos 11 capítulos; link do laboratório; "isto é parte dos meus estudos, não existe certo ou errado".
- [ ] **Step 3: Verificar** build + preview; todo link interno abre com o `base`.
- [ ] **Step 4: Commit.** `docs: home, assunto e visão geral do tutorial`.

> **Gabarito dos capítulos (Tasks 7–15).** Cada tarefa de capítulo segue os mesmos passos. "Fonte" = arquivos do laboratório que alimentam o texto.
> - [ ] **a.** Ler a fonte e a spec §6. Criar `NN-slug.mdx` com `title` e `description` no frontmatter e as sete seções do esqueleto.
> - [ ] **b.** Colar os prompts e comandos **na íntegra** da fonte; indicar PowerShell ou bash em cada bloco.
> - [ ] **c.** Escrever "Se o seu deu diferente" com 2 a 4 situações prováveis (tiradas dos tropeços da fonte) e a tag de chegada (`git checkout <tag>` no laboratório público).
> - [ ] **d.** Rodar `--version` das ferramentas citadas e anotar versões e data.
> - [ ] **e.** Verificar: `npm run build`; todos os prompts do capítulo são idênticos aos da fonte (`diff` ou conferência linha a linha); links internos só para o mesmo tutorial; sem dado pessoal (grep da Global Constraint).
> - [ ] **f.** Commit `docs: capítulo NN — <título>`.

### Task 7: Capítulo 01 — Do vibe coding ao SDD (e as fontes dos benchmarks)

**Files:** `…/sdd-na-pratica/01-do-vibe-coding-ao-sdd.mdx`, `…/sdd-na-pratica/fontes.md` (sem entrar na barra lateral).

**Interfaces:** Produces `fontes.md`, tabela `cifra | fonte primária (URL) | data | quem produziu | conferida em`. Os capítulos citam daqui.

- [ ] **Step 1: Abrir as fontes primárias** (WebFetch) e conferir cada cifra: anúncio do Kiro e números da Amazon, o caso Rackspace, o anúncio do GitHub Spec Kit, os dois preprints do arXiv (achar título e URL), e o estudo da METR (relatório original). Registrar em `fontes.md`; o que não for confirmado fica **fora**.
- [ ] **Step 2: Escrever o capítulo:** o que é SDD em poucas linhas (spec como fonte da verdade, código como consequência), o que muda em relação ao vibe coding, benefícios com as evidências conferidas e **a cautela explícita** (sem estudo independente sobre SDD; METR como contrapeso), a história da clarificação como gancho, o que o tutorial vai construir.
- [ ] **Step 3: Verificar** que toda cifra do texto está em `fontes.md` e que `fontes.md` não aparece na barra lateral. Gabarito itens e–f. Gancho: "por que dois frameworks".

### Task 8: Capítulo 02 — Dois frameworks, uma escolha (e o setup)

**Fonte:** `docs/diario/00`, `01`, `04`; `docs/decisoes/0001`, `0002`, `0004`, `0007`, `0008`, `docs/prompts/00-prompt-inicial.md`, `01-guia-e-github.md`. **Tag de chegada:** `fase-0-setup`.

- [ ] **Step 1:** Seguir o gabarito a–f. Conteúdo próprio: por que Spec Kit (o *quê*) e Superpowers (o *como*), alternativas citadas sem ranking, **a nota de que isto são meus estudos e não existe certo ou errado**, instalação passo a passo (Spec Kit `--integration claude`, Superpowers via `superpowers@superpowers-marketplace`), `CLAUDE.md` do projeto e a regra de registrar tudo.
- [ ] **Step 2:** Rodar de verdade os comandos de instalação e `--version` do dia; se algum comando do diário não funcionar mais, registrar no capítulo como "Atualização" e informar o autor. Gancho: "uma ideia solta ainda não é uma spec".

### Task 9: Capítulo 03 — Ideação

**Fonte:** `docs/diario/02`, `03`; `docs/ideacao/visao-do-produto.md`; `docs/prompts/02-iniciar-fase-1.md`, `03-decisoes-fase-1.md`. **Tag:** `fase-1-ideacao`.

- [ ] **Step 1:** Gabarito a–f. Conteúdo próprio: transformar a ideia em visão do produto; tratar texto de IA como rascunho de júnior; as lacunas deixadas **de propósito** para o clarify achar. Gancho: "a visão não tem regras; o próximo passo é escrever as que valem".

### Task 10: Capítulo 04 — Constituição e especificação

**Fonte:** `docs/diario/05`, `06`; `docs/prompts/04-constituicao.md`, `05-especificacao.md`; `.specify/memory/constitution.md`; `specs/001-gestao-contratos-clientes/spec.md`. **Tag:** `fase-2-especificacao` (observar que o capítulo 05 fecha a mesma fase).

- [ ] **Step 1:** Gabarito a–f. Conteúdo próprio: constituição como regras **testáveis** (o exemplo "apagar inclusive em caso de erro"), spec por histórias com "teste independente", limite de 3 perguntas e premissas, checklist de qualidade. Gancho: "a spec está pronta. Será que não ficou nada de fora?"

### Task 11: Capítulo 05 — O momento "não tinha pensado nisso"

**Fonte:** `docs/diario/07`; `specs/001-gestao-contratos-clientes/spec.md` (seção de esclarecimentos). **Tag:** `fase-2-especificacao`.

- [ ] **Step 1:** Gabarito a–f. Este é o capítulo-âncora do tutorial: mostrar as cinco perguntas reais do `/speckit-clarify`, as duas que não estavam no roteiro do autor, as duas recomendações em que ele discordou do agente, e o argumento "uma resposta errada aqui vira requisito, depois teste, depois código". Marcar com `⚠️ Erro encenado` qualquer trecho que o diário marque como encenado (ex.: os 100 MB). Gancho: "a spec fala em 100 MB. O que o plano vai achar disso?"

### Task 12: Capítulo 06 — O plano que pegou o bug antes do código

**Fonte:** `docs/diario/08`; `docs/decisoes/0005`, `0009`; `docs/prompts/06-plano-tecnico.md`; `specs/001-gestao-contratos-clientes/plan.md`, `research.md`. **Tag:** `fase-3-planejamento`.

- [ ] **Step 1:** Gabarito a–f. Conteúdo próprio: o que o `/speckit-plan` pesquisa, o conflito dos 50 MB do Gemini, por que a correção começa na spec e não no código, a história do ADR 0005 → 0009 (bug encenado que nunca aconteceu, com `⚠️ Erro encenado` onde couber). Gancho: "plano é texto; falta quebrar em tarefas".

### Task 13: Capítulo 07 — Tarefas e análise

**Fonte:** `docs/diario/09`, `10`; `specs/001-gestao-contratos-clientes/tasks.md`. **Tag:** `fase-4-tarefas`.

- [ ] **Step 1:** Gabarito a–f. Conteúdo próprio: tarefas por história (não por camada) e critério de pronto objetivo; o `/speckit-analyze` somente-leitura que achou uma falha de segurança e uma violação da constituição **antes de existir código**; rodar o analyze de novo após corrigir. Gancho: "tudo certo no papel; hora de deixar subagentes escreverem código".

### Task 14: Capítulo 08 — Implementar com subagentes

**Fonte:** `docs/diario/11`; `docs/decisoes/0010`, `0011`; `docs/prompts/07-implementacao-mvp.md`. **Tag:** `fase-5a-rodada-1`.

- [ ] **Step 1:** Gabarito a–f. Conteúdo próprio: `subagent-driven-development` sobre o `tasks.md`; worktree em `.worktrees/`; ledger e Rulings; TDD com teste vermelho; **custo em tokens e o que é opcional**; o subagente que fez estrago fora do projeto e o limite que passamos a dar. Gancho: "o primeiro MVP passou nos testes; quem vai ler tudo isso?"

### Task 15: Capítulos 09, 10 e 11 (um capítulo por commit)

**Fonte e tag por capítulo:**
- **09 — Revisão em camadas e Rulings:** `docs/diario/12` a `16`, `docs/prompts/08-implementacao-clientes.md`. Tag `fase-5-implementacao`. Os três achados que só a revisão final pegou (bloqueio de login, mensagens duplicadas, `EXDEV`+`PUT`); mock que esconde bug. Gancho: "testes verdes; e na tela, funciona?"
- **10 — Validação e dívidas:** `docs/diario/17`, `18`. Tag `fase-6-validacao`. Roteiro manual com Gemini real, o 503 que parecia bug nosso (ler o log antes de consertar), `.env` só lido na partida, as cinco dívidas, o filtro de segurança do modelo que cortou agentes. Gancho: "falta decidir onde isso roda".
- **11 — Deploy local e retrospectiva:** `docs/diario/19`, `20`; `docs/decisoes/0003`. Tag `fase-8-retrospectiva`. Deploy local como decisão, instalação limpa por clone novo, seção "Onde publicar" do README, a retrospectiva honesta (incluindo a extensão `bug` que não foi exercitada), o que faria diferente. Fecha com convite ao próximo tutorial da série, sem prometer data.

- [ ] **Step 1:** Para cada capítulo, seguir o gabarito a–f e commitar separado.

### Task 16: Verificação final do site

**Files:** nenhum novo; correções onde a verificação apontar.

**Interfaces:** Consumes Tasks 6–15.

- [ ] **Step 1: Varredura de dados pessoais** no conteúdo do site: `grep -rniE "leandropiga@gmail|C:\\\\Users|C:/Users|leand\b|API_KEY=[A-Za-z0-9]|AIza" src/ divulgacao/` devolve nada fora do que for aceito (o usuário GitHub `leandropiga` em URLs é esperado).
- [ ] **Step 2: Isolamento:** nenhum link em `sdd-na-pratica/` aponta para fora de `/ia-no-desenvolvimento/sdd-na-pratica/` exceto o laboratório e a página do assunto.
- [ ] **Step 3: Links e imagens:** `npm run build` e `npm run preview`; checar com um verificador de links (ex.: `linkinator` contra `http://localhost:4321/tutoriais/`) sem 404.
- [ ] **Step 4: Cada capítulo** tem as sete seções, tag de partida e de chegada existentes (`git ls-remote --tags` no laboratório) e gancho para o seguinte (o 11 aponta para a série).
- [ ] **Step 5: Leitura em celular e tema escuro:** abrir no preview, largura 390 px e modo escuro; blocos de código com botão de copiar e sem rolagem horizontal da página.
- [ ] **Step 6: Commit** das correções.

### Task 17: Publicar e ligar os dois repositórios

**Files:** `README.md` do laboratório; configuração do Pages.

**Interfaces:** Consumes Task 16. Produces o site no ar em `https://leandropiga.github.io/tutoriais/`.

- [ ] **Step 1: Pedir confirmação** para ativar o Pages e publicar.
- [ ] **Step 2: Ativar** `gh api -X POST repos/leandropiga/tutoriais/pages -f build_type=workflow` (ou pelo painel), dar push na `main` e acompanhar a Action até concluir (`gh run watch`).
- [ ] **Step 3: Conferir o site de verdade:** `curl -sI https://leandropiga.github.io/tutoriais/` devolve 200; abrir um capítulo, uma imagem e a busca no ar.
- [ ] **Step 4: README do laboratório** ganha, perto do topo, o link para o tutorial. Entrada de diário 22 (`docs/diario/22-publicando-o-tutorial.md`) com o que foi feito e os tropeços; índice atualizado. Commit e push: `diario(22): tutorial publicado`.
- [ ] **Step 5: Tag de fechamento** `tutorial-1-publicado` no laboratório (com confirmação).

### Task 18: Rascunho do post do LinkedIn

**Files:** `divulgacao/linkedin.md` no repositório `tutoriais`.

- [ ] **Step 1:** Escrever 2 versões curtas (até cerca de 1.300 caracteres cada) em primeira pessoa: abre com o gancho da clarificação, diz que é parte dos estudos do autor sem certo ou errado, dá o link real do site, uma linha honesta sobre benchmarks (sem promessa de multiplicador), pede feedback. Sem hashtags em excesso (máximo 3), sem emoji de enfeite.
- [ ] **Step 2:** Conferir que o link é o do site no ar (Task 17) e que nenhuma cifra do post está fora do `fontes.md`. Commit `docs: rascunho do post do LinkedIn`. O autor publica.

---

## Auto-revisão

- **Cobertura da spec:** §1–3 (intenção, leitor, objetivos) → Global Constraints e Tasks 6–15; §4 (decisões) → Tasks 4–5; §5 (estrutura) → Task 5 e Review Focus 4; §6 (esqueleto) → gabarito; §7 (capítulos) → Tasks 7–15; §8 (benchmarks) → Task 7 e Review Focus 5; §10 (preparação do laboratório) → Tasks 1–3; §11 (entregáveis) → Tasks 4–18; §15 (respostas) → ordem das tarefas e confirmações.
- **Consistência:** tags citadas nos capítulos (`fase-0-setup`, `fase-5a-rodada-1`, `fase-1…fase-8`) são as criadas na Task 2 ou já existentes. Capítulo 05 e 04 compartilham `fase-2-especificacao` de propósito.
- **Lacunas assumidas:** o nome exato da tag do marco da rodada 1 (`fase-5a-rodada-1`) é proposta minha a confirmar na Task 2; o comando de criação do projeto Starlight deve ser conferido na documentação vigente (Task 5, Step 2).
