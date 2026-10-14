# 0005 — Registrar bugs reais e também encenar um bug com o Gemini

- **Data:** 2026-10-14
- **Status:** aceita

## Contexto

O rascunho "simula" um bug: um PDF em base64 estoura a API do Gemini e a correção é usar a File API.
Na prática isso não acontece com o limite de 5 MB do rascunho. Conferimos a documentação do
Gemini em 2026-10-14:

- PDF: no máximo **50 MB** ou 1000 páginas, **tanto inline quanto pela File API**.
- Requisição com dados inline: no máximo **100 MB** no total. O base64 aumenta o arquivo em
  cerca de 33%.

## Opções consideradas

1. **Só bugs reais**: é o mais honesto, mas não garante a cena didática.
2. **Só bug encenado**: garante a cena, mas esconde os problemas reais do processo.
3. **Os dois**: registramos todo bug real e, além disso, forçamos um bug de propósito.

## Decisão

Opção 3.

- **Bugs reais:** todo bug que aparecer é tratado com a extensão `bug` do Spec Kit
  (`/speckit-bug-assess` → `/speckit-bug-fix` → `/speckit-bug-test`) e registrado no diário.
- **Bug encenado:** na etapa de clarificação, o limite do PDF passa de 5 MB para **100 MB**. Esse
  valor fica acima do teto de 50 MB por PDF do Gemini, e um PDF grande em base64 também passa do
  limite de 100 MB por requisição. **Não** vamos contar isso ao agente. Quando testarmos com um PDF
  entre 60 e 100 MB, a análise deve falhar. Aí seguimos o fluxo de bug do Spec Kit até a causa raiz:
  a spec contradiz uma restrição do fornecedor. A correção nasce na spec (limite ≤ 50 MB) e só
  depois chega ao código.

## Regra de transparência

O tutorial deve dizer **com todas as letras** que o erro foi provocado de propósito, com fins
didáticos, num aviso em destaque do tipo:

> ⚠️ **Erro encenado:** a gente aumentou o limite do PDF para 100 MB *de propósito*, sabendo que o
> Gemini aceita no máximo 50 MB por PDF. O objetivo é mostrar como o SDD trata um bug. Em um
> projeto real, você conferiria os limites da API antes de escrever a spec.

## Consequências

- O leitor precisa de um PDF entre 60 e 100 MB. Vamos fornecer um script que gera esse arquivo
  (a ser criado na fase de testes).
- A mensagem exata do erro e o caminho até a correção serão registrados como aconteceram, sem
  roteiro prévio. Se o agente tentar primeiro trocar para a File API e falhar de novo, isso também
  entra no tutorial.
- A instalação da extensão `bug` (`specify extension add bug`) entra no setup.
