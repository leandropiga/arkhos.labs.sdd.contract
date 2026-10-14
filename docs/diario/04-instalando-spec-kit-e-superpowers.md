# 04 — Instalando o Spec Kit e o Superpowers

- **Data:** 2026-10-14
- **Fase:** 2 — Especificação
- **Status:** concluída

## Objetivo

Instalar as duas ferramentas do nosso fluxo SDD:

- **Spec Kit:** cuida do *o quê*. Gera constituição, spec, plano e tarefas.
- **Superpowers:** cuida do *como*. Faz o agente seguir TDD, worktrees, subagentes e code review.

## Contexto / pré-requisitos

- `uv` instalado (gerenciador de pacotes Python). Instalação: https://docs.astral.sh/uv/
- Claude Code instalado.

## Passo a passo

### 1. Instalar o Spec Kit

```bash
uv tool install specify-cli
specify --version
```

> **Armadilha que pegou a gente:** a saída mostrou `specify 0.15.2.dev0`, uma versão velha que
> já estava instalada na máquina. O `uv tool install` **não atualiza** uma ferramenta que já existe.
> Se você já usou o Spec Kit antes, rode:
>
> ```bash
> uv tool upgrade specify-cli
> specify --version   # specify 1.2.0
> ```

### 2. Inicializar o Spec Kit no repositório

```bash
specify init --here --integration claude --force --non-interactive
```

O que cada opção faz:

| Opção | Para quê |
|-------|----------|
| `--here` | Usa a pasta atual em vez de criar uma nova |
| `--integration claude` | Instala os comandos como *skills* do Claude Code em `.claude/skills/` |
| `--force` | Não pergunta "a pasta não está vazia, continuar?" (a nossa já tinha `docs/`) |
| `--non-interactive` | Não abre menus; útil quando é o próprio Claude quem roda o comando |

O script foi escolhido sozinho: `ps` (PowerShell) no Windows. No macOS/Linux ele usa `sh`.

O que apareceu no projeto:

```text
.specify/
├── memory/constitution.md     # a constituição (por enquanto, um modelo vazio)
├── templates/                 # modelos de spec, plano, tarefas e checklist
├── scripts/powershell/        # scripts que os comandos usam por baixo dos panos
└── workflows/                 # o fluxo padrão do Spec Kit
.claude/skills/
├── speckit-constitution/  speckit-specify/  speckit-clarify/
├── speckit-plan/  speckit-checklist/  speckit-tasks/  speckit-analyze/
├── speckit-implement/  speckit-converge/  speckit-taskstoissues/
```

O `init` também mexeu no nosso `.claude/settings.json`, mas só trocou as quebras de linha (CRLF).
O conteúdo continuou o mesmo. Conferimos com `git diff --ignore-all-space`.

### 3. Instalar a extensão de bugs

Os comandos `/speckit-bug-*` não vêm no pacote padrão. Vamos precisar deles para os bugs reais e
para o bug encenado ([ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md)).

```bash
specify extension info bug   # ver o que é antes de instalar
specify extension add bug
```

Resultado: três novas skills, `/speckit-bug-assess`, `/speckit-bug-fix` e `/speckit-bug-test`.
Cada bug ganha um relatório em `.specify/bugs/<nome-do-bug>/`.

### 4. Instalar o Superpowers

O rascunho manda usar o marketplace oficial. Fizemos isso primeiro:

```bash
claude plugin install superpowers@claude-plugins-official --scope project
```

Veio a versão **6.4.1**, mas a mais nova no GitHub é a **7.0.0**. Lendo as notas de versão,
vimos que entre elas há correções para **Windows** e para o **Opus 5.5**, exatamente o nosso
ambiente. Então trocamos para o marketplace do autor
([ADR 0008](../decisoes/0008-superpowers-pelo-marketplace-do-autor.md)):

```bash
claude plugin uninstall superpowers@claude-plugins-official --scope project
claude plugin marketplace add obra/superpowers-marketplace
claude plugin install superpowers@superpowers-marketplace --scope project
claude plugin list   # superpowers@superpowers-marketplace  Version: 7.0.0
```

> Dá para fazer o mesmo dentro do Claude Code com `/plugin marketplace add ...` e
> `/plugin install ...`. A versão `claude plugin ...` no terminal tem a vantagem de poder ser
> executada pelo próprio Claude.

**Por que `--scope project`?** O plugin fica registrado no `.claude/settings.json`, que vai para
o Git. Quem clonar o repositório recebe a oferta de instalar o mesmo plugin. Para isso também
declaramos o marketplace no arquivo:

```json
{
  "enabledPlugins": {
    "superpowers@superpowers-marketplace": true
  },
  "extraKnownMarketplaces": {
    "superpowers-marketplace": {
      "source": { "source": "github", "repo": "obra/superpowers-marketplace" }
    }
  }
}
```

### 5. Reiniciar o Claude Code

Skills e plugins são carregados quando a sessão começa. Depois de instalar, saia (`/exit`) e
abra de novo (`claude`, ou `claude --continue` para retomar a conversa). Digite `/speckit` e
confira se os comandos aparecem.

## Prompts utilizados

Nenhum prompt especial: esta etapa é feita com comandos de terminal. No laboratório, o pedido ao
Claude foi apenas "sim, vamos começar a Fase 2", e ele executou os comandos acima.

## Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `.specify/` | Infraestrutura do Spec Kit (templates, scripts, constituição vazia) |
| `.specify/extensions/bug/` | Extensão de triagem de bugs |
| `.claude/skills/speckit-*` | Comandos do Spec Kit como skills |
| `.claude/settings.json` | Plugin Superpowers e marketplace declarados |
| `docs/decisoes/0008-superpowers-pelo-marketplace-do-autor.md` | Por que v7 |

## Problemas e soluções

- **Problema:** `uv tool install` manteve uma versão antiga (0.15.2.dev0).
  **Solução:** `uv tool upgrade specify-cli`.
- **Problema:** o marketplace oficial entrega o Superpowers 6.4.1, sem correções importantes.
  **Solução:** marketplace do autor, com a versão 7.0.0.
- **Observação:** o `specify init` mostra um aviso para considerar colocar `.claude/` no
  `.gitignore`, porque alguns agentes guardam credenciais ali. No nosso caso **versionamos**
  `.claude/settings.json` e `.claude/skills/`, que fazem parte do tutorial. O que é pessoal
  (`.claude/settings.local.json`) já está no `.gitignore`.

## Aprendizados

- Sempre confira a versão depois de instalar (`--version`, `plugin list`).
- Leia as notas de versão: foi lá que descobrimos as correções para o nosso ambiente.

## Próximo passo

- Reiniciar o Claude Code e rodar `/speckit-constitution` com o texto de
  [`docs/prompts/04-constituicao.md`](../prompts/04-constituicao.md).
