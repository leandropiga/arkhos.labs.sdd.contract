/*
 * Telas de contratos (História 3). Interface que T055, T056 e T057 devem implementar:
 *
 *   ListaContratos  em src/features/contratos/lista-contratos.tsx   (rota /contratos)
 *   FormContrato    em src/features/contratos/form-contrato.tsx     (rotas /contratos/novo e /contratos/:id/editar)
 *   DetalheContrato em src/features/contratos/detalhe-contrato.tsx  (rota /contratos/:id)
 *
 * - Lista: GET /api/contratos?titulo=&dataInicio=&dataFim=&pagina=; filtros "Título", "Data inicial"
 *   e "Data final"; paginação; "Nenhum contrato encontrado." quando vazia.
 * - Formulário: "Título", "Data de assinatura", "Cliente" (select), "Arquivo PDF"; exige cliente e
 *   arquivo na criação; 413 mostra mensagem com o limite de 50 MB; envia multipart (FormData).
 * - Detalhe: título, data, cliente, link "Abrir PDF" para /api/contratos/:id/arquivo, exclusão com confirmação.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListaContratos } from '@/features/contratos/lista-contratos'
import { FormContrato } from '@/features/contratos/form-contrato'
import { DetalheContrato } from '@/features/contratos/detalhe-contrato'

const ana = { id: 'c1', nomeCompleto: 'Ana Souza' }
const bruno = { id: 'c2', nomeCompleto: 'Bruno Lima' }

const lote7 = { id: 'k1', titulo: 'Compra do lote 7', dataAssinatura: '2026-03-01', cliente: ana }
const lote8 = { id: 'k2', titulo: 'Compra do lote 8', dataAssinatura: '2026-04-01', cliente: bruno }

const detalhe = {
  ...lote7,
  arquivoNomeOriginal: 'lote7.pdf',
  arquivoTamanhoBytes: 2048,
  analiseEmAndamento: false,
  analise: null,
}

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

function pagina(itens: unknown[], extra: Record<string, unknown> = {}) {
  return { itens, pagina: 1, tamanhoPagina: 20, total: itens.length, totalPaginas: itens.length ? 1 : 0, ...extra }
}

function renderizar(caminho: string) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/contratos" element={<ListaContratos />} />
        <Route path="/contratos/novo" element={<FormContrato />} />
        <Route path="/contratos/:id" element={<DetalheContrato />} />
        <Route path="/contratos/:id/editar" element={<FormContrato />} />
      </Routes>
    </MemoryRouter>,
  )
}

function pdf(nome = 'contrato.pdf') {
  return new File(['%PDF-1.4 conteudo %%EOF'], nome, { type: 'application/pdf' })
}

describe('telas de contratos', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  describe('lista', () => {
    it('mostra os itens, o cliente e a data formatada', async () => {
      fetchMock.mockImplementation(async () => resposta(200, pagina([lote7, lote8])))
      renderizar('/contratos')

      expect(await screen.findByText('Compra do lote 7')).toBeInTheDocument()
      expect(screen.getByText('Ana Souza')).toBeInTheDocument()
      expect(screen.getByText('01/03/2026')).toBeInTheDocument()
      expect(fetchMock.mock.calls[0][0]).toContain('/api/contratos?')
    })

    it('filtra por título', async () => {
      fetchMock.mockImplementation(async (url: string) =>
        resposta(200, url.includes('titulo=lote+8') ? pagina([lote8]) : pagina([lote7, lote8])),
      )
      renderizar('/contratos')
      await screen.findByText('Compra do lote 7')

      await userEvent.setup().type(screen.getByLabelText('Título'), 'lote 8')

      await waitFor(() => expect(screen.queryByText('Compra do lote 7')).not.toBeInTheDocument())
      expect(screen.getByText('Compra do lote 8')).toBeInTheDocument()
    })

    it('filtra por período', async () => {
      fetchMock.mockImplementation(async (url: string) =>
        resposta(200, url.includes('dataInicio=2026-04-01') && url.includes('dataFim=2026-04-30')
          ? pagina([lote8])
          : pagina([lote7, lote8])),
      )
      renderizar('/contratos')
      await screen.findByText('Compra do lote 7')
      const u = userEvent.setup()

      await u.type(screen.getByLabelText('Data inicial'), '2026-04-01')
      await u.type(screen.getByLabelText('Data final'), '2026-04-30')

      await waitFor(() => expect(screen.queryByText('Compra do lote 7')).not.toBeInTheDocument())
      expect(screen.getByText('Compra do lote 8')).toBeInTheDocument()
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringMatching(/dataInicio=2026-04-01.*dataFim=2026-04-30|dataFim=2026-04-30.*dataInicio=2026-04-01/),
        expect.anything(),
      )
    })

    it('pagina', async () => {
      fetchMock.mockImplementation(async (url: string) =>
        resposta(200, url.includes('pagina=2')
          ? pagina([lote8], { pagina: 2, total: 21, totalPaginas: 2 })
          : pagina([lote7], { total: 21, totalPaginas: 2 })),
      )
      renderizar('/contratos')
      await screen.findByText('Compra do lote 7')

      await userEvent.setup().click(screen.getByRole('link', { name: 'Próxima página' }))

      expect(await screen.findByText('Compra do lote 8')).toBeInTheDocument()
      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('pagina=2'), expect.anything())
    })

    it('lista vazia mostra "Nenhum contrato encontrado."', async () => {
      fetchMock.mockImplementation(async () => resposta(200, pagina([])))
      renderizar('/contratos')

      expect(await screen.findByText('Nenhum contrato encontrado.')).toBeInTheDocument()
    })
  })

  describe('formulário', () => {
    function mockClientes(extra?: (url: string, init: RequestInit) => Response | undefined) {
      fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
        const especial = extra?.(url, init)
        if (especial) return especial
        if (url.startsWith('/api/clientes')) return resposta(200, pagina([ana, bruno]))
        return resposta(200, detalhe)
      })
    }

    async function abrirNovo() {
      renderizar('/contratos/novo')
      await screen.findByRole('option', { name: 'Ana Souza' })
      return userEvent.setup()
    }

    it('exige cliente e arquivo e não chama a API de contratos', async () => {
      mockClientes()
      const u = await abrirNovo()
      await u.type(screen.getByLabelText('Título'), 'Compra do lote 7')
      await u.type(screen.getByLabelText('Data de assinatura'), '2026-03-01')
      await u.click(screen.getByRole('button', { name: 'Salvar' }))

      expect(await screen.findByText('Cliente é obrigatório.')).toBeInTheDocument()
      expect(screen.getByText('Arquivo PDF é obrigatório.')).toBeInTheDocument()
      expect(fetchMock.mock.calls.some(([url]) => url === '/api/contratos')).toBe(false)
    })

    it('avisa o limite de 50 MB e restringe a PDF', async () => {
      mockClientes()
      await abrirNovo()

      expect(screen.getByText(/50 MB/)).toBeInTheDocument()
      expect(screen.getByLabelText('Arquivo PDF')).toHaveAttribute('accept', 'application/pdf')
    })

    it('mostra a mensagem do 413 com o limite', async () => {
      mockClientes((url, init) =>
        url === '/api/contratos' && init.method === 'POST'
          ? resposta(413, { erro: { codigo: 'ARQUIVO_MUITO_GRANDE', mensagem: 'Arquivo grande demais.' } })
          : undefined,
      )
      const u = await abrirNovo()
      await u.type(screen.getByLabelText('Título'), 'Compra do lote 7')
      await u.type(screen.getByLabelText('Data de assinatura'), '2026-03-01')
      await u.selectOptions(screen.getByLabelText('Cliente'), 'c1')
      await u.upload(screen.getByLabelText('Arquivo PDF'), pdf())
      await u.click(screen.getByRole('button', { name: 'Salvar' }))

      expect(await screen.findByText(/50 MB/, { selector: '[data-slot="field-error"], [role="alert"]' })).toBeInTheDocument()
    })

    it('ao criar, envia multipart e vai para o detalhe', async () => {
      mockClientes((url, init) =>
        url === '/api/contratos' && init.method === 'POST' ? resposta(201, detalhe) : undefined,
      )
      const u = await abrirNovo()
      await u.type(screen.getByLabelText('Título'), 'Compra do lote 7')
      await u.type(screen.getByLabelText('Data de assinatura'), '2026-03-01')
      await u.selectOptions(screen.getByLabelText('Cliente'), 'c1')
      await u.upload(screen.getByLabelText('Arquivo PDF'), pdf())
      await u.click(screen.getByRole('button', { name: 'Salvar' }))

      expect(await screen.findByRole('heading', { name: 'Compra do lote 7' })).toBeInTheDocument()
      const chamada = fetchMock.mock.calls.find(([url, init]) => url === '/api/contratos' && init.method === 'POST')!
      const corpo = chamada[1].body as FormData
      expect(corpo).toBeInstanceOf(FormData)
      expect(corpo.get('titulo')).toBe('Compra do lote 7')
      expect(corpo.get('dataAssinatura')).toBe('2026-03-01')
      expect(corpo.get('clienteId')).toBe('c1')
      expect((corpo.get('arquivo') as File).name).toBe('contrato.pdf')
      expect(chamada[1].headers).toBeUndefined()
    })

    it('na edição, carrega os dados e o arquivo é opcional', async () => {
      mockClientes((url, init) =>
        url === '/api/contratos/k1' && init.method === 'PUT' ? resposta(200, detalhe) : undefined,
      )
      renderizar('/contratos/k1/editar')

      expect(await screen.findByDisplayValue('Compra do lote 7')).toBeInTheDocument()
      expect(screen.getByLabelText('Data de assinatura')).toHaveValue('2026-03-01')
      await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar' }))

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith('/api/contratos/k1', expect.objectContaining({ method: 'PUT' })),
      )
      const chamada = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!
      expect((chamada[1].body as FormData).has('arquivo')).toBe(false)
      expect(await screen.findByRole('heading', { name: 'Compra do lote 7' })).toBeInTheDocument()
    })
  })

  describe('detalhe e exclusão', () => {
    it('mostra título, data, cliente e link para o PDF', async () => {
      fetchMock.mockImplementation(async () => resposta(200, detalhe))
      renderizar('/contratos/k1')

      expect(await screen.findByRole('heading', { name: 'Compra do lote 7' })).toBeInTheDocument()
      expect(screen.getByText('01/03/2026')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ana Souza' })).toHaveAttribute('href', '/clientes/c1')
      expect(screen.getByRole('link', { name: 'Abrir PDF' })).toHaveAttribute('href', '/api/contratos/k1/arquivo')
    })

    it('exclusão com sucesso volta para a lista', async () => {
      fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
        if (init.method === 'DELETE') return resposta(204)
        if (url.startsWith('/api/contratos?')) return resposta(200, pagina([]))
        return resposta(200, detalhe)
      })
      renderizar('/contratos/k1')
      const u = userEvent.setup()
      await u.click(await screen.findByRole('button', { name: 'Excluir contrato' }))
      const dialogo = await screen.findByRole('alertdialog')
      await u.click(within(dialogo).getByRole('button', { name: 'Confirmar exclusão' }))

      expect(await screen.findByText('Nenhum contrato encontrado.')).toBeInTheDocument()
    })

    it('contrato inexistente mostra a mensagem da API', async () => {
      fetchMock.mockImplementation(async () =>
        resposta(404, { erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'Contrato não encontrado.' } }),
      )
      renderizar('/contratos/zzz')

      expect(await screen.findByText('Contrato não encontrado.')).toBeInTheDocument()
    })
  })
})
