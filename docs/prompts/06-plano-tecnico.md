# 06 — Plano técnico

- **Data:** 2026-10-14
- **Destino:** `/speckit-plan` (Claude Code)
- **Base:** o rascunho só diz "rode `/speckit-plan`" e não traz texto para o comando. Este prompt
  foi escrito do zero, a partir da constituição, da spec esclarecida e dos ADRs 0003 (deploy
  local), 0004 (versões e API do SDK) e 0006 (Vitest).

## Como usar

No Claude Code, digite `/speckit-plan` seguido do texto abaixo (tudo numa mensagem só).

## Texto

```text
Escreva o plano e todos os artefatos em português do Brasil.

A stack e as regras de qualidade estão na constituição; siga-as e preencha a verificação de
conformidade (Constitution Check) do plano. Abaixo vão os detalhes técnicos que a constituição
não cobre.

## Ambiente

- Node.js 24 LTS e npm. Docker com Docker Compose v2 ou superior: o docker-compose.yml NÃO usa
  o campo `version`, que é obsoleto.
- A aplicação roda somente na máquina local (sem deploy em nuvem nesta versão). Backend,
  frontend e banco sobem com comandos documentados no quickstart.
- Use as versões estáveis mais recentes de cada pacote, conferidas no registro do npm no momento
  do planejamento, e registre as versões escolhidas no research.md.
- Configuração por variáveis de ambiente, com um `.env.example` para cada pacote que precisar.
  Nenhum segredo vai para o Git.

## Backend

- API REST em JSON, sob o prefixo `/api`.
- O formato padronizado de erro (constituição, Princípio III) deve ser definido no contrato da
  API e usado por todas as rotas, incluindo erros de validação com indicação do campo.
- O primeiro usuário é criado por um script de seed, com usuário e senha lidos de variáveis de
  ambiente. Senhas são guardadas apenas como hash.
- Sessão: JWT em cookie HttpOnly (constituição), com validade de 8 horas, SameSite=Lax e Secure
  quando não estiver em desenvolvimento.
- O bloqueio de login após 5 erros (FR-002) precisa sobreviver a uma reinicialização do
  servidor.
- Arquivos dos contratos: a spec exige guardar o PDF para consulta e download (FR-024). Defina
  onde os PDFs ficam guardados de forma permanente e deixe claro como isso convive com a regra
  da constituição de arquivos temporários (Princípio IV), que vale para o upload e para o envio
  à IA.
- Gemini: no SDK @google/genai, o texto da resposta é lido pela propriedade `response.text`
  (não é um método). A chamada ao Gemini fica isolada em um módulo próprio, para que os testes
  usem um dublê e nunca chamem a API real.
- O tempo-limite de 15 segundos da análise (FR-030) é aplicado no servidor; o frontend mostra o
  toast quando recebe o erro correspondente.

## Frontend

- Aplicação de página única com rotas protegidas: sem sessão válida, redireciona para o login.
- Em desenvolvimento, o frontend acessa a API pelo proxy do Vite, para que o cookie de sessão
  funcione na mesma origem, sem configurar CORS com credenciais.
- O shadcn/ui é inicializado com o CLI oficial (`npx shadcn@latest init`) na configuração para
  Vite com Tailwind CSS v4. Toasts, formulários, tabelas, paginação e o gráfico da Home usam
  componentes do shadcn/ui.

## Testes

- Backend: Vitest + supertest contra um banco PostgreSQL de teste separado do de
  desenvolvimento.
- Frontend: Vitest com React Testing Library.
- Cada história de usuário da spec deve ter testes que cubram seus cenários de aceitação.
```

## Por que este texto

| Item | Por quê |
|------|---------|
| Node 24 LTS, Compose sem `version` | versões da máquina do laboratório; `version` obsoleto pelo [ADR 0004](../decisoes/0004-atualizacoes-tecnicas-do-rascunho.md) |
| "Só local" | [ADR 0003](../decisoes/0003-deploy-local-com-sugestoes.md) |
| Versões registradas no research.md | o leitor do futuro sabe exatamente o que foi usado |
| Seed com variáveis de ambiente | responde a premissa da spec "o primeiro usuário é criado na instalação" |
| Bloqueio de login persistente | sem isso, reiniciar o servidor zeraria o bloqueio (brecha de segurança) |
| PDFs permanentes × temporários | a constituição manda apagar o arquivo temporário, mas a spec manda guardar o PDF para download. Pedimos que o plano resolva a tensão em vez de ignorá-la |
| `response.text` | o rascunho usava `response.text()`, que não existe mais ([ADR 0004](../decisoes/0004-atualizacoes-tecnicas-do-rascunho.md)) |
| Gemini isolado + dublê nos testes | testes rápidos, de graça e sem depender da internet |
| Proxy do Vite | cookie HttpOnly entre portas diferentes daria dor de cabeça com CORS |
| `npx shadcn@latest init` | é o comando que o rascunho cita na Tarefa 4 |

## O que **não** está no texto, de propósito

- **Nenhuma menção ao limite de 50 MB do Gemini.** A spec diz 100 MB e o plano deve seguir a
  spec.
  > ⚠️ **Erro encenado:** é esse silêncio que vai fazer a análise falhar com PDFs grandes mais
  > tarde ([ADR 0005](../decisoes/0005-bugs-reais-e-bug-encenado.md)).

  > **Atualização (2026-10-14):** não fez. Na pesquisa, o próprio `/speckit-plan` consultou a
  > documentação do Gemini e apontou o conflito. Corrigimos a spec para 50 MB
  > ([ADR 0009](../decisoes/0009-plano-pega-o-limite-do-gemini.md)).
- **Nada sobre o histórico de análises.** Hoje a spec guarda só a análise mais recente. O
  "total de análises nos últimos 30 dias" é uma mudança planejada para depois da implementação.
