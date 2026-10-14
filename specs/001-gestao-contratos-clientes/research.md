# Pesquisa (Fase 0): Gestão de Contratos de Clientes

**Data**: 2026-10-14 | **Plano**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

Cada item segue o formato **Decisão / Justificativa / Alternativas consideradas**. As versões
foram conferidas no registro do npm (`npm view <pacote> version` e `dist-tags`) em 2026-10-14.

## R-01. Versões dos pacotes

**Decisão**: fixar as versões abaixo (faixa `^` na mesma major).

| Pacote | Versão | Onde |
|--------|--------|------|
| Node.js | 24 LTS (24.14.0 na máquina do laboratório) | ambiente |
| typescript | 7.0.2 | backend, frontend |
| express | 5.3.0 | backend |
| @types/express | 5.0.6 | backend |
| prisma (CLI) | **7.10.0** | backend |
| @prisma/client | 7.10.0 | backend |
| @prisma/adapter-pg | 7.10.0 | backend |
| pg / @types/pg | 8.23.1 | backend |
| multer / @types/multer | 2.4.0 / 2.3.0 | backend |
| @google/genai | 2.29.1 (faixa `^2.29.1`, ou seja `< 3.0.0`) | backend |
| jose | 6.2.12 | backend |
| zod | 4.6.7 | backend, frontend |
| tsx | 4.23.15 | backend (execução em desenvolvimento) |
| vitest | 5.0.4 | backend, frontend |
| supertest / @types/supertest | 7.3.1 / 7.2.1 | backend |
| @types/node | 24.19.2 (linha 24, igual ao runtime) | backend |
| react / react-dom | 19.3.0 | frontend |
| @types/react / @types/react-dom | 19.3.0 | frontend |
| vite | 8.3.4 | frontend |
| @vitejs/plugin-react | 6.1.2 (exige vite ^8) | frontend |
| tailwindcss / @tailwindcss/vite | 4.3.3 | frontend |
| shadcn (CLI) | 4.21.4 | frontend (só na inicialização e ao adicionar componentes) |
| react-router | 8.4.0 | frontend |
| react-hook-form / @hookform/resolvers | 7.90.0 / 5.9.1 | frontend (exigidos pelo componente Form do shadcn/ui) |
| recharts | 3.10.1 | frontend (exigido pelo componente Chart do shadcn/ui) |
| sonner | 2.0.8 | frontend (exigido pelo componente Sonner/toast do shadcn/ui) |
| lucide-react | 1.57.0 | frontend (ícones padrão do shadcn/ui) |
| @testing-library/react / user-event / jest-dom | 16.3.3 / 14.6.8 / 7.0.1 | frontend |
| jsdom | 30.1.2 | frontend (ambiente de teste) |
| PostgreSQL (imagem Docker) | `postgres:18` | banco |

**Justificativa**: são as versões estáveis mais recentes, como pedido. Dois ajustes:

- **Prisma**: a tag `latest` do pacote `prisma` aponta para `8.0.0-rc.22`, uma *release
  candidate*, enquanto o `@prisma/client` estável é o 7.10.0. CLI e client precisam da mesma
  versão; usamos **7.10.0** nos dois. (Armadilha real: `npm install prisma` hoje instala uma RC.)
- **@types/node**: a `latest` é a 26.x, mas o runtime é o Node 24. Os tipos acompanham o runtime.

**Alternativas consideradas**: TypeScript 6.x. O 7.0 é a reescrita nativa do compilador; as
ferramentas usadas aqui (tsx, Vitest, Vite) transpilam sem depender da API JavaScript do
compilador. Se alguma ferramenta falhar com o 7.0, a saída é recuar para a 6.x mais recente e
registrar no diário.

## R-02. Hash de senha

**Decisão**: `scrypt` do módulo nativo `node:crypto`, com sal aleatório por senha e comparação
com `timingSafeEqual`.

**Justificativa**: Princípio II (preferir recurso nativo). O scrypt é um KDF adequado para senhas
e já vem no Node.

**Alternativas consideradas**: `bcrypt` (dependência nativa com compilação) e `argon2` (idem).
Ambos seriam pacotes a mais sem ganho relevante para um único usuário administrativo.

## R-03. JWT e cookie de sessão

**Decisão**: biblioteca `jose` para assinar e verificar o JWT (HS256, expiração de 8 h). Cookie
`sessao` com `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=28800` e `Secure` fora de
desenvolvimento. A leitura do cabeçalho `Cookie` é feita por uma função própria de poucas linhas.

**Justificativa**: implementar assinatura e verificação de JWT à mão é arriscado (comparações,
algoritmo `none`, expiração). `jose` não tem dependências e é mantida ativamente. Já o parsing
do cookie é trivial e não justifica o pacote `cookie-parser` (Princípio II).

**Alternativas consideradas**: `jsonwebtoken` (traz várias dependências transitivas); sessão
guardada no banco (contraria a constituição, que pede JWT).

## R-04. Bloqueio de login persistente

**Decisão**: dois campos no Usuário: `tentativasFalhas` e `bloqueadoAte`. Na 5ª falha seguida,
`bloqueadoAte = agora + 15 min`. Login com sucesso zera os dois. Enquanto `bloqueadoAte` estiver
no futuro, toda tentativa é recusada com `429 LOGIN_BLOQUEADO`, mesmo com a senha certa.

**Justificativa**: guardar no banco faz o bloqueio sobreviver a reinicializações (pedido do
prompt e de FR-002) sem infraestrutura extra.

**Alternativas consideradas**: contador em memória (zera ao reiniciar — brecha); Redis (serviço a
mais, contraria Princípio II).

## R-05. Validação de entrada

**Decisão**: `zod` nos dois lados. No backend, cada rota valida corpo e *query* com um schema; os
erros viram `VALIDACAO_INVALIDA` com a lista de campos. No frontend, os mesmos formatos são usados
pelo componente Form do shadcn/ui (react-hook-form + zod).

**Justificativa**: o componente Form do shadcn/ui já depende de zod; usar o mesmo validador no
backend evita uma segunda biblioteca. CPF, CEP e UF têm validadores próprios (funções puras,
testadas), sem pacote extra.

**Alternativas consideradas**: validação manual (repetitiva e sem lista de campos padronizada);
`express-validator` (mais um pacote, só backend).

## R-06. Armazenamento dos PDFs × arquivos temporários (Princípio IV)

**Decisão**: dois diretórios, configurados por variável de ambiente:

1. **Temporário** (`UPLOAD_TMP_DIR`, padrão `backend/tmp/uploads`): o multer grava aqui o arquivo
   recebido (`diskStorage`, limite de 50 MB). O arquivo é validado (assinatura `%PDF-` nos
   primeiros bytes). Se válido, é **movido** (`fs.rename`) para o armazenamento permanente. Em
   qualquer caso — sucesso, arquivo inválido ou erro no banco — um bloco `finally` garante que
   nada fica no diretório temporário.
2. **Permanente** (`STORAGE_DIR`, padrão `backend/storage/contratos`): cada PDF fica como
   `<id-do-contrato>.pdf`. É de onde sai o download (FR-024) e de onde a análise lê o arquivo.

Na **análise**, o PDF permanente é lido em memória e enviado ao Gemini; não é criada nenhuma cópia
temporária, então não sobra nada para apagar. Ao excluir um contrato ou substituir o PDF, o
arquivo permanente antigo é removido (FR-021, FR-031).

**Justificativa**: o Princípio IV fala do arquivo *recebido*, que existe só para o processamento
do upload. A spec exige guardar o PDF (FR-024). Separar os dois diretórios deixa as duas regras
verificáveis: os testes conferem que `UPLOAD_TMP_DIR` fica vazio após cada requisição, com e sem
erro.

**Alternativas consideradas**: guardar o PDF no banco (`bytea`) — incha o banco e os backups,
mas eliminaria o diretório permanente; armazenamento em nuvem — fora do escopo (só local).

## R-07. Integração com o Gemini

**Decisão**:

- SDK `@google/genai`, método `ai.models.generateContent` com o modelo `gemini-3.8-flash`. O PDF
  vai **inline** (`inlineData` com `mimeType: "application/pdf"` e o conteúdo em base64). O texto
  é lido pela propriedade `response.text` (é um *getter*, conferido nas definições de tipo do
  SDK 2.29.1).
- Saída estruturada: `responseMimeType: "application/json"` com um schema (`analisavel`,
  resumo, riscos com gravidade, cláusulas críticas), validado com zod antes de gravar. Se a IA
  responder `analisavel: false` (PDF só com imagens ilegíveis ou protegido), a API devolve
  `422 PDF_NAO_ANALISAVEL`.
- **Tempo-limite de 15 s** (FR-030): `config.abortSignal = AbortSignal.timeout(15_000)`, recurso
  nativo. Estouro do tempo ou erro do SDK viram `503 IA_INDISPONIVEL`.
- A chamada fica isolada em `backend/src/modules/analise/cliente-ia.ts`, com uma interface
  (`ClienteIA`). Os testes injetam um dublê; nenhum teste chama a API real.

**Justificativa**: `generateContent` + `response.text` é o caminho mostrado no README do SDK e
fixado no ADR 0004. O envio inline evita gerenciar arquivos no lado do Google (a File API guarda
uploads por 48 h). O README do SDK recomenda manter a faixa `< 3.0.0` para evitar mudanças
incompatíveis.

**Alternativas consideradas**:

- **Interactions API** (`ai.interactions.create`, resposta em `output_text`): é a que aparece
  nos exemplos atuais da documentação de PDFs. Não a adotamos porque o README do SDK não a
  identifica como estável e o ADR 0004 já fixou `generateContent`. Fica registrada como
  alternativa.
- **File API**: útil para reaproveitar o mesmo arquivo em várias requisições. Aqui cada análise é
  pontual.

**⚠️ Risco encontrado na pesquisa (afeta a spec)**: a documentação de processamento de documentos
do Gemini (ai.google.dev/gemini-api/docs/document-processing, consultada em 2026-10-14) diz que
o Gemini aceita PDFs de **até 50 MB ou 1.000 páginas**, e que esse limite vale **tanto para envio
inline quanto pela File API**. A spec (FR-017) aceita PDFs de até **100 MB**. Logo, contratos
entre 50 e 100 MB serão aceitos no cadastro, mas a análise deles vai falhar — e trocar de inline
para File API **não** resolve. O plano segue a spec como está (o upload aceita 100 MB) e registra
o conflito em [plan.md → Riscos](./plan.md#riscos). A correção, se desejada, nasce na spec.

> **Atualização (2026-10-14):** conflito resolvido na spec. FR-017 foi emendado para **50 MB**
> ([ADR 0009](../../docs/decisoes/0009-plano-pega-o-limite-do-gemini.md)) e o upload passa a
> aceitar no máximo 50 MB. Resta o limite de **1.000 páginas**, que não é conferido no upload:
> um PDF de até 50 MB com mais de 1.000 páginas é raro em contratos; se acontecer, a análise
> falha com `503 IA_INDISPONIVEL` (ver risco R1 no plano).

## R-08. Busca sem acento e sem diferenciar maiúsculas

**Decisão**: coluna derivada `nomeBusca` no Cliente (e `tituloBusca` no Contrato), preenchida pela
aplicação com `texto.normalize("NFD")`, remoção de diacríticos e `toLowerCase()`. O filtro usa
`contains` sobre essa coluna, com o termo normalizado do mesmo jeito. Índices nas duas colunas.

**Justificativa**: resolve FR-012 com recurso nativo do JavaScript, sem extensão do Postgres.

**Alternativas consideradas**: extensão `unaccent` do PostgreSQL (exige migração com SQL bruto e
função imutável para indexar); `ILIKE` puro (não ignora acentos).

## R-09. Concorrência da análise (FR-027)

**Decisão**: campo `analiseIniciadaEm` no Contrato. Para iniciar, o serviço faz um `updateMany`
condicional (só atualiza se o campo for nulo ou mais antigo que 60 s) e verifica se 1 linha foi
afetada. Se não, responde `409 ANALISE_EM_ANDAMENTO`. Ao terminar (sucesso ou falha), o campo
volta a nulo.

**Justificativa**: trava atômica no próprio banco, sem filas. A janela de 60 s cobre um servidor
que caiu no meio de uma análise (o campo não fica preso para sempre).

**Alternativas consideradas**: trava em memória (não sobrevive a reinicialização); só desabilitar
o botão no frontend (não protege contra duas abas).

## R-10. Banco de teste e execução dos testes

**Decisão**: um único serviço PostgreSQL no `docker-compose.yml`, com um script de inicialização
que cria dois bancos: `contratos` (desenvolvimento) e `contratos_test` (testes). O Vitest do
backend usa `.env.test`, aplica as migrações no `globalSetup` (`prisma migrate deploy`) e limpa
as tabelas antes de cada arquivo de teste. Arquivos de teste do backend rodam em sequência
(`fileParallelism: false`) para não disputarem o mesmo banco.

**Justificativa**: testes de rota com supertest contra banco real (pedido do prompt), sem
derrubar os dados de desenvolvimento.

**Alternativas consideradas**: dois containers (mais memória, mesmo resultado); banco em memória
ou mocks do Prisma (não testam as restrições reais, como CPF único e chave estrangeira).

## R-11. Variáveis de ambiente

**Decisão**: o Node 24 lê arquivos `.env` nativamente (`node --env-file` / `process.loadEnvFile`);
o Prisma 7 lê a URL do banco pelo `prisma.config.ts`. Não usamos `dotenv`. Cada pacote tem um
`.env.example`; os `.env` reais ficam no `.gitignore`.

**Justificativa**: Princípio II.

## R-12. Frontend: rotas, chamadas à API e testes

**Decisão**:

- `react-router` 8 com rotas protegidas: um componente de layout consulta `GET /api/auth/sessao`;
  sem sessão, redireciona para `/login`.
- Chamadas à API com `fetch` nativo, num módulo `lib/api.ts` que converte o erro padronizado em
  exceção tipada. Em desenvolvimento, o Vite faz proxy de `/api` para o backend (mesma origem,
  sem CORS).
- Toast com o componente Sonner do shadcn/ui; gráfico com o componente Chart do shadcn/ui.
- Testes com Vitest + React Testing Library em `jsdom`, com o `fetch` substituído por `vi.fn()`.

**Justificativa**: `fetch` nativo dispensa axios; mockar `fetch` com o próprio Vitest dispensa
MSW (Princípio II).

**Alternativas consideradas**: TanStack Query (cache e estados prontos, mas é mais uma
dependência para um app pequeno); MSW nos testes (mais realista, porém outro pacote).
