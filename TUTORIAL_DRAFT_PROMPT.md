Assuma o papel de um engenheiro de software senior, experiente em desenvovimento usando IA com SDD (Spec Driven Developement).

Faça uma pesquisa avançada sobre os frameworks Spec Kit + Superpowers e com base nessa pesquisa, elabore um tutorial handon para demonstrar ao uso desses frameworks em um desenvolvimento de uma aplicação.

O publico desse tutorial será desenvolvedores que não utilizam IA para desenvolver, mas querem conhecer SDD.  

# TUTORIAL
- deve simular situações reais de desenvolvimento, como mudança de escopo, bugs, mudança de arquietura, etc.  
- deve ter várias partes para facilitar a leitura e estudos.  
- deve ter instruções para preparar o ambiente no escopo do SDD, considerando que o publico já conhece ferramentas de desenvolvimento agenticas como Claude Code, Antigravity, Codex, etc
- Deve mostrar o "texto" das especificações que serão utilizadas pelo framework para que o leitor possa usar essas especificações no desenvolvimento
- Ao final do tutorial, o leitor terá criada uma aplicação "real" rodando em sua máquina
- A implementação da aplicação será somente após toda a especificação finalizar.
- Para a preparação do ambiente, considere instruções para que o leitor use o Claude Code ou Antigravity.  Deve ter instruções pra ambos
- Sugerir a inslação de skills mais baladas para a stack definida

# APLICAÇÃO
- Será uma aplicação de contrato de cliente
- Deve ter um cadastro de cliente com os campos: nome, telefone, endereço, cpf, rg
- Deve ter um cadastro de contratos de compra/venda com os campos: titulo do contrato, data, cliente, arquivo (pdf)
- Um cliente pode ter mais de um contrato
- Um cliente pode exigir sem contrato
- Um contrato não exite sem um cliente
- A tela de contrato deve ter um botão para solicitar uma analise do pdf através de um LLM (vamos usar o Gemini por API)
- Os cadastro devem ter sempre uma tela de listagem com opção de paginação e filtro.  Tanto para o cliente como para o contrato
- Deve ter uma tela de dashboard que irá exibir alguns dados sobre os cadastros como: grafico de clientes por estado, quantidade de contratos, quantidade de clientes
- O menu deve ser composto por: Home, Clientes e Contratos
- O login deve ser apenas de usuário/senha
- Teremos um menu de perfil para o usuário completar seus dados (nome, foto, telefone)

# STACK
- Usar NodeJS para backend
- Usar React para frontend
- Usar Postgress em um docker como banco de dados (deve ter instrução para preparar esse docker
- Usar design system shadn/ui