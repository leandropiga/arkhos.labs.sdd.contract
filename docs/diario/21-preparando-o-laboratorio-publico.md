# 21 — Preparando o laboratório para ficar público

- **Data:** 2026-10-19
- **Fase:** Pós-8 — Tutorial
- **Status:** em andamento

## Objetivo

O tutorial manda o leitor fazer `git checkout fase-3-planejamento` e coisas assim. Para isso
funcionar, o repositório do laboratório precisa ser **público**. Antes de abrir, eu quis ter
certeza de que não tem nada ali que não deva ir para a rua.

## Parte 1 — Revisão de privacidade

### O que eu varri

Arquivos versionados (252) e todo o histórico (129 commits, todos do mesmo autor), procurando:

- e-mail pessoal e caminhos da máquina (`C:\Users`, `/c/Users`);
- chaves e tokens (`AIza…`, `ghp_…`, `sk-…`, `Bearer …`, `GEMINI_API_KEY=` com valor);
- senhas em arquivos de exemplo;
- nome do autor e de terceiros;
- arquivos sensíveis versionados por engano (`.env`, `.pem`, `.key`).

### O que achei

| Achado | Onde | Decisão |
|---|---|---|
| `AIzaSECRETA` | `backend/tests/http/analise.test.ts` | **Aceito.** É texto inventado de um teste que confere que a resposta da API **não** vaza chave. |
| `GEMINI_API_KEY=sua-chave-aqui`, `SEED_SENHA=troque-por-uma-senha` | `backend/.env.example` e `.env.test.example` | **Aceito.** São modelos, sem valor real. |
| E-mail do autor nos commits | metadados do Git | **Aceito.** Todo commit público carrega o e-mail do autor. Não reescrevi histórico. |
| `.claude/settings.json` versionado | raiz | **Aceito.** Só tem permissões de comando e o plugin do Superpowers, nada pessoal. |
| Padrões de e-mail e caminho aparecem em `docs/superpowers/` | plano e desenho do tutorial | **Aceito.** São as próprias listas de "o que procurar". |

Chaves reais, caminhos da máquina e senhas: **nenhum**. O `.env` com a chave do Gemini nunca foi
versionado (o `.gitignore` cobre desde a fase de setup), e a busca no histórico confirma.

### Aprendizado

Esta varredura só foi tranquila por causa de uma decisão lá do começo: o `.gitignore` do T002
bloqueia `.env` e `.env.*` e libera só os `*.example`. **Decida a regra do que não vai para o Git
antes do primeiro commit.** Limpar depois é bem mais caro, porque o segredo continua no histórico.

## Próximos passos desta entrada

- Tags `fase-0-setup` e `fase-5a-rodada-1` (partes 2 e 3, abaixo).
- Tornar o repositório público (parte 3).

## Parte 2 — Tags e publicação

- Criei duas tags que faltavam, a pedido do tutorial: `fase-0-setup` (commit `27b84c5`, fim do
  setup, depois de instalar Spec Kit e Superpowers) e `fase-5a-rodada-1` (commit `26d1f53`, rodada 1
  da implementação com o diário 11). Marcos como esses deixam o leitor começar um capítulo do ponto
  certo.
- Tornei o repositório **público** (`gh repo edit … --visibility public`). Conferi sem login: a URL
  responde 200.
- Registrei duas decisões: [ADR 0012](../decisoes/0012-publico-do-tutorial.md) (público do
  tutorial) e [ADR 0013](../decisoes/0013-site-em-repositorio-proprio.md) (site em repositório
  próprio).
