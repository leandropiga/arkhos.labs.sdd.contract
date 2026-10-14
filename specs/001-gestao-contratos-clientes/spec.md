# Especificação da Funcionalidade: Gestão de Contratos de Clientes

**Branch da funcionalidade**: `001-gestao-contratos-clientes`

**Criada em**: 2026-10-14

**Status**: Rascunho

**Entrada**: Descrição do usuário: "Desenvolva a especificação funcional da Aplicação de Gestão de
Contratos de Clientes. O sistema tem dois domínios principais: Clientes e Contratos (de compra e
venda). Quem usa é um(a) operador(a) administrativo(a) de uma pequena empresa, que hoje guarda os
contratos em pastas e e-mails e tem dificuldade para encontrá-los, contá-los e lembrar dos riscos
de cada um." (texto completo em `docs/prompts/05-especificacao.md`)

## Cenários de Usuário e Testes *(obrigatório)*

### História de Usuário 1 - Entrar no sistema (Prioridade: P1)

O(a) operador(a) abre o sistema, informa usuário e senha e passa a ver o menu com Home, Clientes
e Contratos. Sem login, nenhuma informação de clientes ou contratos fica visível.

**Por que esta prioridade**: o sistema guarda dados pessoais (CPF, RG) e contratos. Nenhuma outra
história pode ser entregue com segurança sem controle de acesso.

**Teste independente**: tentar abrir qualquer tela sem login (deve ir para a tela de login),
entrar com credenciais válidas (deve ver o menu) e sair (deve voltar ao login).

**Cenários de aceitação**:

1. **Dado** um usuário cadastrado, **Quando** informa usuário e senha corretos, **Então** entra
   no sistema e vê o menu lateral com Home, Clientes e Contratos.
2. **Dado** um usuário cadastrado, **Quando** informa uma senha errada, **Então** continua na
   tela de login e vê uma mensagem genérica de credenciais inválidas, sem indicar qual dos dois
   campos está errado.
3. **Dado** uma pessoa sem login, **Quando** tenta abrir diretamente qualquer tela interna,
   **Então** é levada à tela de login.
4. **Dado** um usuário logado, **Quando** escolhe sair, **Então** a sessão termina e as telas
   internas deixam de ser acessíveis.

---

### História de Usuário 2 - Cadastrar e encontrar clientes (Prioridade: P1)

O(a) operador(a) cadastra os clientes da empresa com nome completo, telefone, endereço, CPF e RG,
e depois os encontra rapidamente numa lista paginada, filtrando por nome ou por CPF.

**Por que esta prioridade**: todo contrato depende de um cliente. Sem clientes cadastrados, o
restante do sistema não tem uso.

**Teste independente**: cadastrar alguns clientes, listar, paginar e filtrar por nome e por CPF,
sem cadastrar nenhum contrato.

**Cenários de aceitação**:

1. **Dado** o formulário de novo cliente, **Quando** todos os campos obrigatórios são
   preenchidos com dados válidos e o cadastro é salvo, **Então** o cliente aparece na listagem.
2. **Dado** o formulário de novo cliente, **Quando** algum campo obrigatório fica vazio,
   **Então** o cadastro não é salvo e o campo com problema é indicado.
3. **Dado** um cliente já cadastrado com um CPF, **Quando** se tenta cadastrar outro cliente com
   o mesmo CPF, **Então** o cadastro é recusado com uma mensagem clara.
4. **Dado** mais clientes do que cabem em uma página, **Quando** a listagem é aberta, **Então**
   ela mostra a primeira página e permite navegar entre as páginas.
5. **Dado** clientes cadastrados, **Quando** se filtra por parte do nome, **Então** aparecem
   apenas os clientes cujo nome contém o texto, sem diferenciar maiúsculas, minúsculas e acentos.
6. **Dado** clientes cadastrados, **Quando** se filtra por CPF (com ou sem pontuação), **Então**
   aparecem apenas os clientes com aquele CPF.
7. **Dado** um cliente sem contratos, **Quando** ele é consultado, **Então** o sistema o exibe
   normalmente, sem exigir contratos vinculados.

---

### História de Usuário 3 - Cadastrar contratos com PDF e encontrá-los (Prioridade: P2)

O(a) operador(a) registra um contrato com título, data de assinatura, cliente e o arquivo PDF.
Depois encontra os contratos numa lista paginada, filtrando por título e por período de datas, e
abre o detalhe de cada um para consultar os dados e o arquivo.

**Por que esta prioridade**: é o motivo de existir do sistema (tirar os contratos de pastas e
e-mails), mas depende de clientes já cadastrados.

**Teste independente**: com pelo menos um cliente cadastrado, cadastrar contratos, listar,
filtrar por título e por período, abrir o detalhe e baixar o PDF.

**Cenários de aceitação**:

1. **Dado** um cliente cadastrado, **Quando** um contrato é salvo com título, data de
   assinatura, esse cliente e um arquivo PDF, **Então** o contrato aparece na listagem e no
   detalhe do cliente.
2. **Dado** o formulário de novo contrato, **Quando** o arquivo enviado não é um PDF, **Então**
   o cadastro é recusado com uma mensagem explicando que apenas PDF é aceito.
3. **Dado** o formulário de novo contrato, **Quando** nenhum cliente é escolhido, **Então** o
   cadastro é recusado; não existe contrato sem cliente.
4. **Dado** um cliente com vários contratos, **Quando** o detalhe do cliente é aberto, **Então**
   todos os contratos dele são listados.
5. **Dado** contratos cadastrados, **Quando** se filtra por parte do título, **Então** aparecem
   apenas os contratos cujo título contém o texto.
6. **Dado** contratos cadastrados, **Quando** se filtra por um intervalo de datas, **Então**
   aparecem apenas os contratos com data de assinatura dentro do intervalo, incluindo as datas
   inicial e final.
7. **Dado** um contrato cadastrado, **Quando** seu detalhe é aberto, **Então** são exibidos
   título, data de assinatura, cliente e um meio de abrir ou baixar o PDF.

---

### História de Usuário 4 - Solicitar análise de riscos por IA (Prioridade: P3)

No detalhe de um contrato, o(a) operador(a) clica em "Solicitar Análise de PDF" e recebe um
resumo executivo dos riscos jurídicos e das cláusulas críticas, exibido em um painel na mesma
tela.

**Por que esta prioridade**: é o diferencial do produto (lembrar dos riscos de cada contrato),
mas só tem valor depois que os contratos existem no sistema.

**Teste independente**: com um contrato cadastrado, solicitar a análise, verificar que o painel
mostra o resumo, sair da tela, voltar e verificar que o resumo continua lá.

**Cenários de aceitação**:

1. **Dado** o detalhe de um contrato, **Quando** o botão "Solicitar Análise de PDF" é
   acionado, **Então** o sistema indica que a análise está em andamento e impede um segundo
   pedido simultâneo para o mesmo contrato.
2. **Dado** uma análise em andamento, **Quando** ela termina com sucesso, **Então** um painel na
   mesma tela mostra o resumo executivo dos riscos jurídicos e das cláusulas críticas.
3. **Dado** um contrato já analisado, **Quando** seu detalhe é aberto novamente, **Então** o
   último resultado da análise continua visível, com a data em que foi gerado.
4. **Dado** um contrato já analisado, **Quando** uma nova análise é solicitada e conclui com
   sucesso, **Então** o novo resultado substitui o anterior no painel.
5. **Dado** uma análise em andamento, **Quando** o serviço de IA falha, **Então** o(a)
   operador(a) vê uma mensagem amigável, sem detalhes técnicos, e pode tentar de novo; um
   resultado anterior, se existir, continua visível.

---

### História de Usuário 5 - Ver o painel da Home (Prioridade: P4)

Ao entrar, o(a) operador(a) vê na Home um gráfico com a distribuição dos clientes por estado
(UF), o total de contratos cadastrados e o total de clientes cadastrados.

**Por que esta prioridade**: dá uma visão rápida do negócio ("quantos contratos temos?"), mas é
um resumo de dados que as outras histórias produzem.

**Teste independente**: com clientes em estados diferentes e alguns contratos, abrir a Home e
conferir o gráfico e os dois totais com os dados cadastrados.

**Cenários de aceitação**:

1. **Dado** clientes cadastrados em estados diferentes, **Quando** a Home é aberta, **Então** o
   gráfico mostra, para cada UF com clientes, a quantidade de clientes daquela UF.
2. **Dado** contratos e clientes cadastrados, **Quando** a Home é aberta, **Então** os totais de
   contratos e de clientes batem com a quantidade cadastrada no momento.
3. **Dado** um sistema sem nenhum cliente nem contrato, **Quando** a Home é aberta, **Então** os
   totais mostram zero e o gráfico mostra um estado vazio explicativo, sem erro.

---

### História de Usuário 6 - Editar o próprio perfil (Prioridade: P5)

Pelo Menu de Perfil, a pessoa logada atualiza seu nome, a URL da sua foto de perfil e seu
telefone.

**Por que esta prioridade**: melhora a experiência, mas não afeta a gestão de contratos.

**Teste independente**: logado, abrir o perfil, alterar os três campos, salvar e conferir que os
novos dados aparecem (nome e foto no menu).

**Cenários de aceitação**:

1. **Dado** um usuário logado, **Quando** altera nome, URL da foto e telefone e salva, **Então**
   os novos dados ficam gravados e o nome e a foto aparecem no Menu de Perfil.
2. **Dado** o formulário de perfil, **Quando** a URL da foto não é um endereço web válido,
   **Então** o perfil não é salvo e o campo é indicado.
3. **Dado** uma URL de foto que não carrega, **Quando** o menu é exibido, **Então** aparece um
   avatar padrão (por exemplo, as iniciais do nome) no lugar da foto.

---

### Casos Extremos

- O que acontece com os contratos de um cliente quando esse cliente é excluído? (ver FR-010)
- Qual é o tamanho máximo aceito para o arquivo PDF do contrato? (ver FR-017)
- Como saber o estado (UF) de um cliente, se o endereço é um campo único? (ver FR-007)
- Um arquivo com extensão `.pdf` que não é de fato um PDF (ou está corrompido) é recusado no
  cadastro, como qualquer outro formato inválido.
- Um PDF sem texto extraível (por exemplo, só imagens escaneadas) ou protegido por senha: a
  análise pode não ser possível; nesse caso o(a) operador(a) vê uma mensagem amigável dizendo
  que o documento não pôde ser analisado.
- O serviço de IA demora muito para responder: depois do tempo-limite (FR-030), a espera é
  encerrada e tratada como falha da análise (cenário 5 da História 4).
- Filtro de datas com data inicial maior que a final: o sistema avisa e não aplica o filtro.
- Filtros que não encontram nada: a listagem mostra uma mensagem de "nenhum resultado", não uma
  tela em branco.
- CPF com dígitos verificadores inválidos é recusado no cadastro.
- Página pedida além da última (por exemplo, depois de aplicar um filtro): o sistema mostra a
  última página válida.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

**Acesso e perfil**

- **FR-001**: O sistema DEVE exigir login com usuário e senha para acessar qualquer tela ou dado,
  exceto a própria tela de login.
- **FR-002**: O sistema DEVE recusar credenciais inválidas com uma mensagem genérica, sem revelar
  se o usuário existe.
- **FR-003**: O sistema DEVE permitir que a pessoa logada saia (encerre a sessão).
- **FR-004**: O sistema DEVE encerrar a sessão automaticamente após 8 horas, exigindo novo login.
- **FR-005**: O sistema DEVE oferecer um Menu de Perfil em que a pessoa logada edita Nome, URL da
  foto de perfil e Telefone.
- **FR-006**: O sistema DEVE exibir um avatar padrão quando a pessoa não tiver foto ou quando a
  URL da foto não carregar.

**Clientes**

- **FR-007**: O sistema DEVE permitir cadastrar clientes com os campos obrigatórios Nome Completo,
  Telefone, Endereço, CPF e RG. [NEEDS CLARIFICATION: o Endereço é um campo de texto único,
  mas o gráfico da Home (FR-033) precisa da UF de cada cliente. O endereço deve ser dividido em
  partes (com a UF como campo próprio) ou a UF deve ser um campo adicional?]
- **FR-008**: O sistema DEVE validar o CPF (formato e dígitos verificadores) e impedir dois
  clientes com o mesmo CPF.
- **FR-009**: O sistema DEVE permitir editar os dados de um cliente, com as mesmas validações do
  cadastro.
- **FR-010**: O sistema DEVE permitir excluir clientes, seguindo a regra definida para clientes
  com contratos. [NEEDS CLARIFICATION: a exclusão de um cliente que tem contratos deve ser
  bloqueada, deve apagar os contratos junto, ou clientes nunca podem ser excluídos?]
- **FR-011**: O sistema DEVE listar clientes com paginação (20 itens por página) e ordenação
  alfabética por nome.
- **FR-012**: O sistema DEVE filtrar clientes por nome (trecho do nome, sem diferenciar
  maiúsculas, minúsculas e acentos) e por CPF (com ou sem pontuação).
- **FR-013**: O sistema DEVE permitir que um cliente exista sem contratos.
- **FR-014**: O sistema DEVE exibir, no detalhe do cliente, a lista de contratos vinculados a
  ele.

**Contratos**

- **FR-015**: O sistema DEVE permitir cadastrar contratos com Título, Data de Assinatura, Cliente
  (escolhido entre os cadastrados) e arquivo, todos obrigatórios.
- **FR-016**: O sistema DEVE aceitar somente arquivos PDF válidos, recusando outros formatos e
  arquivos corrompidos.
- **FR-017**: O sistema DEVE recusar arquivos PDF acima do tamanho máximo permitido.
  [NEEDS CLARIFICATION: nenhum limite de tamanho foi informado para o PDF. Qual é o máximo?]
- **FR-018**: O sistema DEVE impedir a existência de contratos sem cliente válido.
- **FR-019**: O sistema DEVE permitir que um cliente tenha vários contratos.
- **FR-020**: O sistema DEVE permitir editar título, data de assinatura e cliente de um
  contrato, e substituir o arquivo PDF.
- **FR-021**: O sistema DEVE permitir excluir contratos, removendo também o arquivo e a análise
  associados.
- **FR-022**: O sistema DEVE listar contratos com paginação (20 itens por página), do mais
  recente para o mais antigo pela data de assinatura.
- **FR-023**: O sistema DEVE filtrar contratos por título (trecho do título) e por intervalo de
  datas de assinatura (inclusivo), podendo combinar os dois filtros.
- **FR-024**: O sistema DEVE permitir abrir ou baixar o PDF a partir do detalhe do contrato.

**Análise por IA**

- **FR-025**: O sistema DEVE exibir, no detalhe do contrato, o botão "Solicitar Análise de PDF".
- **FR-026**: Ao acionar o botão, o sistema DEVE enviar o PDF do contrato a um serviço de IA e
  obter um resumo executivo, em português, dos riscos jurídicos e das cláusulas críticas.
- **FR-027**: O sistema DEVE indicar que a análise está em andamento e impedir pedidos
  simultâneos para o mesmo contrato.
- **FR-028**: O sistema DEVE guardar o resultado mais recente da análise de cada contrato, com a
  data de geração, e exibi-lo em um painel no detalhe do contrato sempre que a tela for aberta.
- **FR-029**: Uma nova análise bem-sucedida DEVE substituir a anterior; uma análise que falhar
  NÃO DEVE apagar o resultado anterior.
- **FR-030**: Se o serviço de IA falhar ou não responder em até 60 segundos, o sistema DEVE
  encerrar a espera, mostrar uma mensagem amigável, sem detalhes técnicos, e permitir tentar de
  novo.
- **FR-031**: Ao substituir o PDF de um contrato, o sistema DEVE descartar a análise anterior,
  pois ela se refere ao arquivo antigo.

**Navegação e painel**

- **FR-032**: O sistema DEVE oferecer um menu lateral com as áreas Home, Clientes e Contratos.
- **FR-033**: A Home DEVE mostrar um gráfico com a quantidade de clientes por estado (UF).
- **FR-034**: A Home DEVE mostrar o total de contratos cadastrados e o total de clientes
  cadastrados, refletindo os dados atuais.

### Entidades-Chave

- **Usuário**: pessoa que acessa o sistema. Tem credenciais (usuário e senha) e dados de perfil:
  Nome, URL da foto de perfil e Telefone.
- **Cliente**: pessoa física com quem a empresa faz contratos. Atributos: Nome Completo,
  Telefone, Endereço, CPF (único) e RG. Pode ter zero ou mais contratos.
- **Contrato**: acordo de compra e venda. Atributos: Título, Data de Assinatura e arquivo PDF.
  Pertence a exatamente um cliente.
- **Análise de Contrato**: resultado da leitura do PDF pela IA. Atributos: resumo executivo dos
  riscos jurídicos, cláusulas críticas e data de geração. Cada contrato tem no máximo uma análise
  vigente (a mais recente).

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: O(a) operador(a) encontra um contrato específico (por título ou período) em menos
  de 30 segundos a partir da Home.
- **SC-002**: O cadastro completo de um cliente leva menos de 2 minutos.
- **SC-003**: O cadastro de um contrato com PDF leva menos de 1 minuto, com o cliente já
  cadastrado.
- **SC-004**: Com até 10.000 clientes e 10.000 contratos, as listagens e filtros mostram o
  resultado em até 2 segundos.
- **SC-005**: Em 100% das tentativas, nenhuma tela interna ou dado de cliente fica acessível sem
  login.
- **SC-006**: 100% dos contratos cadastrados têm um cliente válido vinculado.
- **SC-007**: Os totais e o gráfico da Home batem com os dados cadastrados em 100% das
  conferências.
- **SC-008**: Um resultado de análise, depois de gerado, continua disponível em 100% das vezes
  em que o detalhe do contrato é reaberto.
- **SC-009**: Nenhuma mensagem de erro exibida ao usuário contém detalhes técnicos internos.

## Premissas

- Há um único tipo de usuário (operador administrativo), sem perfis de acesso diferentes.
- O primeiro usuário é criado durante a instalação do sistema, por quem o instala; não há tela de
  cadastro de usuários (cadastro público está fora do escopo).
- Clientes são pessoas físicas brasileiras (por isso CPF e RG); não há cadastro de pessoa
  jurídica nesta versão.
- O RG é obrigatório, mas não tem validação de formato, porque o formato varia entre estados.
- O telefone segue o formato brasileiro (DDD + número, fixo ou celular).
- O sistema é usado em navegador de computador; uso otimizado para celular não é obrigatório
  nesta versão.
- A análise por IA é feita sob demanda (só quando o botão é acionado) e o texto é sempre em
  português.
- Recuperação de senha, cadastro público de usuários, perfis de acesso diferentes, assinatura
  digital, versionamento de contratos e alertas de vencimento estão fora do escopo desta versão.
- Os valores de paginação (20 por página), de expiração de sessão (8 horas) e de tempo-limite da
  análise por IA (60 segundos) são padrões de mercado escolhidos na falta de indicação do
  usuário; podem ser revistos na clarificação.
