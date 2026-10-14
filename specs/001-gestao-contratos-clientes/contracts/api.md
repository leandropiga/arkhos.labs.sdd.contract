# Contrato da API REST

**Data**: 2026-10-14 | **Plano**: [../plan.md](../plan.md) | **Modelo**: [../data-model.md](../data-model.md)

- Prefixo: `/api`. Corpo das requisições e respostas em JSON, exceto upload (`multipart/form-data`)
  e download (`application/pdf`).
- Autenticação: cookie `sessao` (JWT, HttpOnly). Todas as rotas exigem sessão válida, **exceto**
  `POST /api/auth/login`. Sem sessão válida: `401 NAO_AUTENTICADO`.
- Datas: `dataAssinatura` como `AAAA-MM-DD`; datas/horas em ISO 8601 (UTC).

## Formato padronizado de erro (Princípio III)

Toda resposta de erro, de qualquer rota, tem este formato e nada além dele:

```json
{
  "erro": {
    "codigo": "VALIDACAO_INVALIDA",
    "mensagem": "Alguns campos estão inválidos.",
    "campos": [
      { "campo": "cpf", "mensagem": "CPF inválido." }
    ]
  }
}
```

- `codigo`: um dos códigos da tabela abaixo (estável, para o frontend decidir o que fazer).
- `mensagem`: texto em português, pronto para exibir. Nunca contém stack trace, SQL, caminhos de
  arquivo ou mensagens de bibliotecas.
- `campos`: presente só em `VALIDACAO_INVALIDA`.

| HTTP | codigo | Quando |
|------|--------|--------|
| 400 | `VALIDACAO_INVALIDA` | corpo ou query fora das regras (lista em `campos`) |
| 400 | `ARQUIVO_INVALIDO` | arquivo ausente, não é PDF ou está corrompido |
| 401 | `NAO_AUTENTICADO` | sem cookie, token inválido ou expirado |
| 401 | `CREDENCIAIS_INVALIDAS` | usuário ou senha errados (mensagem genérica) |
| 404 | `NAO_ENCONTRADO` | recurso inexistente |
| 409 | `CPF_DUPLICADO` | CPF já cadastrado em outro cliente |
| 409 | `CLIENTE_COM_CONTRATOS` | exclusão de cliente com contratos; `mensagem` informa a quantidade |
| 409 | `ANALISE_EM_ANDAMENTO` | já existe análise em curso para o contrato |
| 413 | `ARQUIVO_MUITO_GRANDE` | PDF acima de 50 MB |
| 422 | `PDF_NAO_ANALISAVEL` | PDF sem texto extraível ou protegido por senha, segundo a IA |
| 429 | `LOGIN_BLOQUEADO` | 5 falhas seguidas; bloqueio de 15 min (só para usuário existente; risco aceito, ver Premissas da spec) |
| 500 | `ERRO_INTERNO` | qualquer erro não previsto |
| 503 | `IA_INDISPONIVEL` | IA falhou, estourou 15 s ou respondeu fora do formato |

## Paginação (listagens)

Query: `pagina` (padrão 1, mínimo 1) e `tamanhoPagina` (fixo em 20; outros valores são
ignorados). Se `pagina` passar da última, a resposta traz a última página válida.

```json
{ "itens": [], "pagina": 1, "tamanhoPagina": 20, "total": 0, "totalPaginas": 0 }
```

## Autenticação e perfil

### `POST /api/auth/login`

Corpo: `{ "usuario": "admin", "senha": "..." }`

- `200`: define o cookie `sessao` e devolve `{ "usuario": Perfil }`.
- `401 CREDENCIAIS_INVALIDAS` | `429 LOGIN_BLOQUEADO` | `400 VALIDACAO_INVALIDA`.

### `POST /api/auth/logout`

`204`: apaga o cookie `sessao`.

### `GET /api/auth/sessao`

`200 { "usuario": Perfil }` | `401 NAO_AUTENTICADO`. Usado pelo frontend para proteger rotas.

### `GET /api/perfil` · `PUT /api/perfil`

`Perfil = { "id", "usuario", "nome", "fotoUrl": string | null, "telefone": string | null }`

PUT recebe `{ "nome", "fotoUrl", "telefone" }` e devolve o `Perfil` atualizado.
Erros: `400 VALIDACAO_INVALIDA` (ex.: `fotoUrl` não é URL http/https).

## Clientes

`Cliente = { "id", "nomeCompleto", "telefone", "cpf", "rg", "logradouro", "numero", "cep",
"cidade", "uf", "totalContratos" }`

### `GET /api/clientes?nome=&cpf=&pagina=`

Lista paginada, ordem alfabética por nome. `nome`: trecho, sem diferenciar acento/maiúscula.
`cpf`: com ou sem pontuação, busca exata. `200 Pagina<Cliente>`.

### `POST /api/clientes`

Corpo: todos os campos de `Cliente` exceto `id` e `totalContratos`.
`201 Cliente` | `400 VALIDACAO_INVALIDA` | `409 CPF_DUPLICADO`.

### `GET /api/clientes/:id`

`200 Cliente & { "contratos": ContratoResumo[] }` | `404`.

### `PUT /api/clientes/:id`

Mesmo corpo e erros do POST, mais `404`. `200 Cliente`.

### `DELETE /api/clientes/:id`

`204` | `404` | `409 CLIENTE_COM_CONTRATOS`.

## Contratos

`ContratoResumo = { "id", "titulo", "dataAssinatura", "cliente": { "id", "nomeCompleto" } }`

`Contrato = ContratoResumo & { "arquivoNomeOriginal", "arquivoTamanhoBytes",
"analiseEmAndamento": boolean, "analise": Analise | null }`

### `GET /api/contratos?titulo=&dataInicio=&dataFim=&pagina=`

Lista paginada, da `dataAssinatura` mais recente para a mais antiga. Filtros combináveis;
intervalo inclusivo. `dataInicio > dataFim` → `400 VALIDACAO_INVALIDA`. `200 Pagina<ContratoResumo>`.

### `POST /api/contratos` (`multipart/form-data`)

Campos: `titulo`, `dataAssinatura`, `clienteId`, `arquivo` (PDF, até 50 MB).
`201 Contrato` | `400 VALIDACAO_INVALIDA` (inclui `clienteId` inexistente) |
`400 ARQUIVO_INVALIDO` | `413 ARQUIVO_MUITO_GRANDE`.

### `GET /api/contratos/:id`

`200 Contrato` | `404`.

### `PUT /api/contratos/:id` (`multipart/form-data`)

Campos `titulo`, `dataAssinatura`, `clienteId`; `arquivo` opcional. Se vier arquivo, substitui o
PDF e descarta a análise (FR-031). Mesmos erros do POST, mais `404`. `200 Contrato`.

### `DELETE /api/contratos/:id`

`204` | `404`. Apaga também a análise e o arquivo.

### `GET /api/contratos/:id/arquivo`

`200 application/pdf` com `Content-Disposition: inline; filename="<arquivoNomeOriginal>"` | `404`.

## Análise por IA

`Analise = { "resumo", "riscos": [{ "titulo", "descricao", "gravidade" }],
"clausulasCriticas": [{ "clausula", "motivo" }], "geradaEm" }`

### `POST /api/contratos/:id/analise`

Síncrono: responde quando a análise termina ou falha (no máximo ~15 s de espera pela IA).

- `200 Analise`: nova análise gravada, substituindo a anterior.
- `404` | `409 ANALISE_EM_ANDAMENTO` | `422 PDF_NAO_ANALISAVEL` | `503 IA_INDISPONIVEL`
  (falha, tempo-limite de 15 s ou resposta fora do formato). Em erro, a análise anterior continua
  intacta.

## Painel

### `GET /api/painel`

```json
{
  "totalClientes": 42,
  "totalContratos": 57,
  "clientesPorUf": [{ "uf": "SP", "total": 20 }, { "uf": "MG", "total": 9 }]
}
```
