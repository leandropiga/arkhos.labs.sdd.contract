# 0003 — App roda localmente; deploy em nuvem fica só como sugestão

- **Data:** 2026-10-14
- **Status:** aceita

## Contexto

O rascunho termina com a aplicação rodando na máquina do leitor e não fala de deploy. O objetivo
do laboratório citava "até o deploy", então precisamos decidir até onde vamos.

## Opções consideradas

1. **Só local**: tudo roda com Docker na máquina do leitor. Zero custo, zero conta extra.
2. **PaaS (Render / Railway)**: deploy a partir do GitHub, com Postgres gerenciado.
3. **VPS com Docker Compose**: mais controle e mais didático sobre infraestrutura, mas exige
   servidor, domínio e HTTPS.

## Decisão

Opção 1. A "Fase 7 — Deploy" vira **rodar a aplicação completa localmente**. O tutorial termina
com uma seção curta de **sugestões** de onde publicar (Render, Railway ou VPS com Docker Compose),
explicando em poucas linhas o perfil de cada uma, **sem passo a passo**.

## Consequências

- O tutorial fica mais curto e qualquer pessoa consegue terminar sem cartão de crédito.
- Não vamos validar a app em ambiente de nuvem (variáveis de ambiente, CORS, cookies em domínio
  real). A seção de sugestões deve avisar sobre esses pontos.
