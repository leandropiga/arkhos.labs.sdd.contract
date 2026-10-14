/** Tipos e utilitários de contrato, como a API devolve (contracts/api.md). */
import type { ContratoResumo } from '@/features/clientes/tipos'

export type { ContratoResumo, Pagina } from '@/features/clientes/tipos'

export type Gravidade = 'BAIXA' | 'MEDIA' | 'ALTA'

export type Analise = {
  resumo: string
  riscos: { titulo: string; descricao: string; gravidade: Gravidade }[]
  clausulasCriticas: { clausula: string; motivo: string }[]
  geradaEm: string
}

export type ContratoDetalhe = ContratoResumo & {
  arquivoNomeOriginal: string
  arquivoTamanhoBytes: number
  analiseEmAndamento: boolean
  analise: Analise | null
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
