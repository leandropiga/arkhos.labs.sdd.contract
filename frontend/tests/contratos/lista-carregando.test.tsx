import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListaContratos } from '@/features/contratos/lista-contratos'
import { ListaClientes } from '@/features/clientes/lista-clientes'

const ana = { id: 'c1', nomeCompleto: 'Ana Souza' }
const pagina = (itens: unknown[]) => ({ itens, pagina: 1, tamanhoPagina: 20, total: itens.length, totalPaginas: 1 })
const json = (corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status: 200, headers: { 'Content-Type': 'application/json' } })

describe('indicador de carregamento nas listas', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('contratos: mostra "Carregando..." também ao refazer a busca com dados na tela', async () => {
    const lote = { id: 'k1', titulo: 'Compra do lote 7', dataAssinatura: '2026-03-01', cliente: ana }
    fetchMock.mockImplementationOnce(async () => json(pagina([lote])))
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}))
    render(
      <MemoryRouter>
        <ListaContratos />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Compra do lote 7')).toBeInTheDocument()
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()

    await userEvent.setup().type(screen.getByLabelText('Data inicial'), '2026-01-01')

    expect(await screen.findByText('Carregando...')).toBeInTheDocument()
  })

  it('clientes: mostra "Carregando..." também ao refazer a busca com dados na tela', async () => {
    const cliente = { ...ana, telefone: '', cpf: '', rg: '', logradouro: '', numero: '', cep: '', cidade: '', uf: 'SP', totalContratos: 0 }
    fetchMock.mockImplementationOnce(async () => json(pagina([cliente])))
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}))
    render(
      <MemoryRouter>
        <ListaClientes />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()

    await userEvent.setup().type(screen.getByLabelText('Nome'), 'B')

    expect(await screen.findByText('Carregando...')).toBeInTheDocument()
  })
})
