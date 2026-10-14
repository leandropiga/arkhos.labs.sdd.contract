export type CampoInvalido = { campo: string; mensagem: string }

export class ErroApi extends Error {
  status: number
  codigo: string
  mensagem: string
  campos?: CampoInvalido[]

  constructor(status: number, codigo: string, mensagem: string, campos?: CampoInvalido[]) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.codigo = codigo
    this.mensagem = mensagem
    this.campos = campos
  }
}

type Opcoes = { metodo?: string; corpo?: unknown }

const MENSAGEM_GENERICA = 'Não foi possível concluir a operação. Tente novamente.'
const MENSAGEM_REDE = 'Não foi possível conectar ao servidor. Verifique sua conexão.'

async function lerJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json()
  } catch {
    return undefined
  }
}

export async function api<T = unknown>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const metodo = opcoes.metodo ?? 'GET'
  const init: RequestInit = { method: metodo, credentials: 'same-origin' }
  if (opcoes.corpo !== undefined) {
    if (opcoes.corpo instanceof FormData) {
      // multipart: o navegador define o Content-Type (com o boundary).
      init.body = opcoes.corpo
    } else {
      init.headers = { 'Content-Type': 'application/json' }
      init.body = JSON.stringify(opcoes.corpo)
    }
  }

  let resposta: Response
  try {
    resposta = await fetch(caminho, init)
  } catch {
    throw new ErroApi(0, 'ERRO_DE_REDE', MENSAGEM_REDE)
  }

  if (resposta.ok) {
    if (resposta.status === 204) return undefined as T
    return (await resposta.json()) as T
  }

  if (resposta.status === 401 && !(metodo === 'POST' && caminho === '/api/auth/login')) {
    window.dispatchEvent(new Event('sessao-expirada'))
  }

  const dados = (await lerJson(resposta)) as { erro?: { codigo?: string; mensagem?: string; campos?: CampoInvalido[] } } | undefined
  const erro = dados?.erro
  if (erro && typeof erro.codigo === 'string' && typeof erro.mensagem === 'string') {
    throw new ErroApi(resposta.status, erro.codigo, erro.mensagem, erro.campos)
  }
  throw new ErroApi(resposta.status, 'ERRO_INTERNO', MENSAGEM_GENERICA)
}
