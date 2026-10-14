# Modelo de Dados: Gestão de Contratos de Clientes

**Data**: 2026-10-14 | **Plano**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

Nomes de entidades e campos em português, como na spec. Tipos descritos de forma lógica; o
mapeamento para o schema do Prisma é feito na implementação. Todos os `id` são UUID; todas as
entidades têm `criadoEm` e `atualizadoEm`.

## Diagrama

```text
Usuario (independente)

Cliente 1 ──── 0..N Contrato 1 ──── 0..1 AnaliseContrato
        (exclusão bloqueada            (excluída junto com o contrato
         se houver contratos)           ou ao substituir o PDF)
```

## Usuario

| Campo | Tipo | Regras |
|-------|------|--------|
| id | UUID | PK |
| usuario | texto | obrigatório, único, sem diferenciar maiúsculas (guardado em minúsculas) |
| senhaHash | texto | obrigatório; scrypt + sal ([R-02](./research.md#r-02-hash-de-senha)) |
| nome | texto | obrigatório, 1–120 caracteres |
| fotoUrl | texto | opcional; URL `http` ou `https` válida (FR-005) |
| telefone | texto | opcional; só dígitos, 10 ou 11 (DDD + número) |
| tentativasFalhas | inteiro | padrão 0 ([R-04](./research.md#r-04-bloqueio-de-login-persistente)) |
| bloqueadoAte | data/hora | opcional |

**Transições de login** (FR-002):

```text
falha de senha  → tentativasFalhas += 1
                  se tentativasFalhas == 5 → bloqueadoAte = agora + 15 min
tentativa com bloqueadoAte > agora → recusada (sem alterar contadores)
sucesso         → tentativasFalhas = 0, bloqueadoAte = nulo
```

Criado apenas pelo script de seed (não há cadastro pela interface).

## Cliente

| Campo | Tipo | Regras |
|-------|------|--------|
| id | UUID | PK |
| nomeCompleto | texto | obrigatório, 3–150 caracteres |
| nomeBusca | texto | derivado de `nomeCompleto` (sem acento, minúsculo); indexado ([R-08](./research.md#r-08-busca-sem-acento-e-sem-diferenciar-maiúsculas)) |
| telefone | texto | obrigatório; só dígitos, 10 ou 11 |
| cpf | texto | obrigatório, **único**; só dígitos (11), dígitos verificadores válidos (FR-008) |
| rg | texto | obrigatório, 1–20 caracteres, sem validação de formato (Premissas) |
| logradouro | texto | obrigatório, 1–200 caracteres |
| numero | texto | obrigatório, 1–20 caracteres (aceita "S/N") |
| cep | texto | obrigatório; só dígitos (8) |
| cidade | texto | obrigatório, 1–100 caracteres |
| uf | enum UF | obrigatório; uma das 27 UFs (AC … TO); indexado (gráfico FR-033) |

**Regras**:

- Entrada aceita CPF e CEP com ou sem pontuação; o valor é guardado só com dígitos.
- Exclusão permitida apenas se o cliente não tiver contratos; caso contrário,
  `409 CLIENTE_COM_CONTRATOS` com a quantidade (FR-010). No banco, a chave estrangeira usa
  `RESTRICT`, como segunda barreira.

## Contrato

| Campo | Tipo | Regras |
|-------|------|--------|
| id | UUID | PK |
| titulo | texto | obrigatório, 3–200 caracteres |
| tituloBusca | texto | derivado de `titulo`; indexado |
| dataAssinatura | data (sem hora) | obrigatória; indexada (filtro por período e ordenação) |
| clienteId | UUID | FK → Cliente, obrigatória, `ON DELETE RESTRICT`; indexada |
| arquivoNomeOriginal | texto | nome do arquivo enviado (exibição e download) |
| arquivoTamanhoBytes | inteiro | 1 a 52.428.800 (50 MB) (FR-017) |
| analiseIniciadaEm | data/hora | opcional; trava de análise ([R-09](./research.md#r-09-concorrência-da-análise-fr-027)) |

**Regras**:

- O arquivo fica em `STORAGE_DIR/<id>.pdf` ([R-06](./research.md#r-06-armazenamento-dos-pdfs--arquivos-temporários-princípio-iv)).
- Só é aceito arquivo cujo conteúdo começa com `%PDF-` e tem `%%EOF` nos últimos 1.024 bytes
  (FR-016); a extensão sozinha não basta.
- Substituir o PDF apaga a `AnaliseContrato` existente e o arquivo antigo (FR-031).
- Excluir o contrato apaga a análise e o arquivo (FR-021).

## AnaliseContrato

| Campo | Tipo | Regras |
|-------|------|--------|
| id | UUID | PK |
| contratoId | UUID | FK → Contrato, **única** (no máximo uma análise vigente), `ON DELETE CASCADE` |
| resumo | texto | resumo executivo dos riscos jurídicos |
| riscos | JSON | lista de `{ titulo, descricao, gravidade: "BAIXA" \| "MEDIA" \| "ALTA" }` |
| clausulasCriticas | JSON | lista de `{ clausula, motivo }` |
| geradaEm | data/hora | data de geração exibida no painel (cenário 3 da História 4) |

**Regras**:

- Uma nova análise bem-sucedida substitui a anterior (*upsert* por `contratoId`) (FR-029).
- Uma análise que falha não altera o registro existente (FR-029).
- O conteúdo vindo da IA é validado com zod antes de gravar; resposta fora do formato conta como
  falha (`503 IA_INDISPONIVEL`).

## Dados derivados (sem tabela)

**Painel da Home** (FR-033, FR-034), calculado a cada requisição:

- `totalClientes` = contagem de Cliente
- `totalContratos` = contagem de Contrato
- `clientesPorUf` = agrupamento de Cliente por `uf`, só UFs com ao menos um cliente
