/** Tipos e utilitários de cliente, como a API devolve (contracts/api.md). */
export type Cliente = {
  id: string
  nomeCompleto: string
  telefone: string
  cpf: string
  rg: string
  logradouro: string
  numero: string
  cep: string
  cidade: string
  uf: string
  totalContratos: number
}

export type ContratoResumo = {
  id: string
  titulo: string
  dataAssinatura: string
  cliente: { id: string; nomeCompleto: string }
}

export type ClienteDetalhe = Cliente & { contratos: ContratoResumo[] }

export type Pagina<T> = {
  itens: T[]
  pagina: number
  tamanhoPagina: number
  total: number
  totalPaginas: number
}

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export function formatarCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '')
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf
}
