// Códigos de erro da API (contracts/api.md, "Formato padronizado de erro").
export const CODIGOS_ERRO = [
  'VALIDACAO_INVALIDA',
  'ARQUIVO_INVALIDO',
  'NAO_AUTENTICADO',
  'CREDENCIAIS_INVALIDAS',
  'NAO_ENCONTRADO',
  'CPF_DUPLICADO',
  'CLIENTE_COM_CONTRATOS',
  'ANALISE_EM_ANDAMENTO',
  'ARQUIVO_MUITO_GRANDE',
  'PDF_NAO_ANALISAVEL',
  'LOGIN_BLOQUEADO',
  'ERRO_INTERNO',
  'IA_INDISPONIVEL',
] as const;

export type CodigoErro = (typeof CODIGOS_ERRO)[number];

export interface CampoInvalido {
  campo: string;
  mensagem: string;
}

/** Erro previsto da aplicação: vira `{ erro: { codigo, mensagem, campos? } }` com o status dado. */
export class ErroApp extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: CodigoErro,
    mensagem: string,
    public readonly campos?: CampoInvalido[],
  ) {
    super(mensagem);
    this.name = 'ErroApp';
  }
}
