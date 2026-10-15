import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Home } from '@/features/painel/home'

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

function renderizar() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home (painel)', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('mostra os dois totais e o gráfico de clientes por UF', async () => {
    fetchMock.mockImplementation(async () =>
      json({
        totalClientes: 7,
        totalContratos: 12,
        clientesPorUf: [
          { uf: 'SP', total: 4 },
          { uf: 'RJ', total: 3 },
        ],
      }),
    )
    renderizar()

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    const clientes = await screen.findByText('Total de clientes')
    expect(within(clientes.closest('[data-slot="card"]') as HTMLElement).getByText('7')).toBeInTheDocument()
    const contratos = screen.getByText('Total de contratos')
    expect(within(contratos.closest('[data-slot="card"]') as HTMLElement).getByText('12')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Gráfico de clientes por UF' })).toBeInTheDocument()
    expect(screen.queryByText(/nenhum cliente cadastrado/i)).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/painel', expect.anything())
  })

  it('com clientesPorUf vazio mostra totais zerados e o estado vazio explicativo', async () => {
    fetchMock.mockImplementation(async () => json({ totalClientes: 0, totalContratos: 0, clientesPorUf: [] }))
    renderizar()

    const clientes = await screen.findByText('Total de clientes')
    expect(within(clientes.closest('[data-slot="card"]') as HTMLElement).getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/nenhum cliente cadastrado ainda/i)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Gráfico de clientes por UF' })).not.toBeInTheDocument()
  })

  it('mostra mensagem de erro quando a API falha', async () => {
    fetchMock.mockImplementation(async () =>
      json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Falha no servidor.' } }, 500),
    )
    renderizar()
    expect(await screen.findByText('Falha no servidor.')).toBeInTheDocument()
  })
})
