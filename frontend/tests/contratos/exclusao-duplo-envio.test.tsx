import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DetalheContrato } from '@/features/contratos/detalhe-contrato'
import { DetalheCliente } from '@/features/clientes/detalhe-cliente'

const ana = { id: 'c1', nomeCompleto: 'Ana Souza' }
const contrato = {
  id: 'k1',
  titulo: 'Compra do lote 7',
  dataAssinatura: '2026-03-01',
  cliente: ana,
  arquivoNomeOriginal: 'lote7.pdf',
  arquivoTamanhoBytes: 2048,
  analiseEmAndamento: false,
  analise: null,
}
const cliente = {
  ...ana, telefone: '11999999999', cpf: '52998224725', rg: '1', logradouro: 'Rua A', numero: '1',
  cep: '01001000', cidade: 'São Paulo', uf: 'SP', totalContratos: 0, contratos: [],
}
const json = (corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status: 200, headers: { 'Content-Type': 'application/json' } })

describe('exclusão sem duplo envio', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it.each([
    ['contrato', '/contratos/k1', '/contratos/:id', <DetalheContrato />, contrato, 'Excluir contrato'],
    ['cliente', '/clientes/c1', '/clientes/:id', <DetalheCliente />, cliente, 'Excluir cliente'],
  ])('%s: enquanto o DELETE está em andamento o botão fica desabilitado e só há um DELETE', async (_n, caminho, rota, elemento, dados, rotulo) => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) =>
      init.method === 'DELETE' ? new Promise<Response>(() => {}) : Promise.resolve(json(dados)),
    )
    render(
      <MemoryRouter initialEntries={[caminho]}>
        <Routes>
          <Route path={rota} element={elemento} />
        </Routes>
      </MemoryRouter>,
    )
    const u = userEvent.setup()
    await u.click(await screen.findByRole('button', { name: rotulo }))
    await u.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Confirmar exclusão' }))

    expect(await screen.findByRole('button', { name: rotulo })).toBeDisabled()
    const deletes = fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')
    expect(deletes).toHaveLength(1)
  })
})
