/*
 * Telas de clientes (História 2). Interface que T044, T045 e T046 devem implementar:
 *
 *   ListaClientes  em src/features/clientes/lista-clientes.tsx   (rota /clientes)
 *   FormCliente    em src/features/clientes/form-cliente.tsx     (rotas /clientes/novo e /clientes/:id/editar)
 *   DetalheCliente em src/features/clientes/detalhe-cliente.tsx  (rota /clientes/:id)
 *
 * - Lista: GET /api/clientes?nome=&cpf=&pagina=; tabela com os itens, paginação ("Próxima página"),
 *   filtros rotulados "Nome" e "CPF" (nome com debounce) e "Nenhum cliente encontrado." quando vazia.
 * - Formulário: campos rotulados, botão "Salvar"; mostra o erro de cada campo vindo de `campos`;
 *   após salvar navega para /clientes/:id.
 * - Detalhe: dados, contratos vinculados, botão "Excluir cliente" + confirmação "Confirmar exclusão";
 *   409 mostra a mensagem da API; sucesso volta para /clientes.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListaClientes } from '@/features/clientes/lista-clientes'
import { FormCliente } from '@/features/clientes/form-cliente'
import { DetalheCliente } from '@/features/clientes/detalhe-cliente'

const ana = {
  id: 'c1', nomeCompleto: 'Ana Souza', telefone: '11999990000', cpf: '52998224725', rg: '123456789',
  logradouro: 'Rua A', numero: '10', cep: '01001000', cidade: 'São Paulo', uf: 'SP', totalContratos: 0,
}
const bruno = { ...ana, id: 'c2', nomeCompleto: 'Bruno Lima', cpf: '11144477735' }

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
        <Route path="/clientes" element={<ListaClientes />} />
        <Route path="/clientes/novo" element={<FormCliente />} />
        <Route path="/clientes/:id" element={<DetalheCliente />} />
        <Route path="/clientes/:id/editar" element={<FormCliente />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderizarComLinks(caminho: string, destino: string) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Link to={destino}>ir para outro</Link>
      <Routes>
        <Route path="/clientes/novo" element={<FormCliente />} />
        <Route path="/clientes/:id" element={<DetalheCliente />} />
        <Route path="/clientes/:id/editar" element={<FormCliente />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('telas de clientes', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  describe('lista', () => {
    it('mostra os itens e pagina', async () => {
      fetchMock.mockImplementation(async (url: string) =>
        resposta(200, url.includes('pagina=2')
          ? pagina([bruno], { pagina: 2, total: 21, totalPaginas: 2 })
          : pagina([ana], { total: 21, totalPaginas: 2 })),
      )
      renderizar('/clientes')

      expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
      expect(fetchMock.mock.calls[0][0]).toContain('/api/clientes?')
      await userEvent.setup().click(screen.getByRole('link', { name: 'Próxima página' }))

      expect(await screen.findByText('Bruno Lima')).toBeInTheDocument()
      expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('pagina=2'), expect.anything())
    })

    it('digitar no filtro de nome refaz a busca', async () => {
      fetchMock.mockImplementation(async (url: string) =>
        resposta(200, url.includes('nome=Bruno') ? pagina([bruno]) : pagina([ana, bruno])),
      )
      renderizar('/clientes')
      await screen.findByText('Ana Souza')

      await userEvent.setup().type(screen.getByLabelText('Nome'), 'Bruno')

      await waitFor(() => expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument())
      expect(screen.getByText('Bruno Lima')).toBeInTheDocument()
      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('nome=Bruno'), expect.anything())
    })

    it('lista vazia mostra "Nenhum cliente encontrado."', async () => {
      fetchMock.mockImplementation(async () => resposta(200, pagina([])))
      renderizar('/clientes')

      expect(await screen.findByText('Nenhum cliente encontrado.')).toBeInTheDocument()
    })

    it('mostra "Carregando..." na primeira carga', async () => {
      fetchMock.mockImplementation(async () => resposta(200, pagina([ana])))
      renderizar('/clientes')

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
      expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })

    it('se a busca falha, mostra o erro e não mantém as linhas antigas', async () => {
      fetchMock.mockImplementation(async (url: string) =>
        url.includes('nome=Bruno')
          ? resposta(500, { erro: { codigo: 'ERRO_INTERNO', mensagem: 'Falha ao buscar.' } })
          : resposta(200, pagina([ana])),
      )
      renderizar('/clientes')
      await screen.findByText('Ana Souza')

      await userEvent.setup().type(screen.getByLabelText('Nome'), 'Bruno')

      expect(await screen.findByText('Falha ao buscar.')).toBeInTheDocument()
      expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
    })
  })

  describe('formulário', () => {
    async function preencher(u: ReturnType<typeof userEvent.setup>) {
      await u.type(screen.getByLabelText('Nome Completo'), 'Ana Souza')
      await u.type(screen.getByLabelText('Telefone'), '11999990000')
      await u.type(screen.getByLabelText('CPF'), '11111111111')
      await u.type(screen.getByLabelText('RG'), '123456789')
      await u.type(screen.getByLabelText('Logradouro'), 'Rua A')
      await u.type(screen.getByLabelText('Número'), '10')
      await u.type(screen.getByLabelText('CEP'), '01001000')
      await u.type(screen.getByLabelText('Cidade'), 'São Paulo')
      await u.selectOptions(screen.getByLabelText('UF'), 'SP')
    }

    it('mostra o erro do campo vindo de `campos` e não navega', async () => {
      fetchMock.mockImplementation(async () =>
        resposta(400, { erro: { codigo: 'VALIDACAO_INVALIDA', mensagem: 'Dados inválidos.', campos: [{ campo: 'cpf', mensagem: 'CPF inválido.' }] } }),
      )
      renderizar('/clientes/novo')
      const u = userEvent.setup()
      await preencher(u)
      await u.click(screen.getByRole('button', { name: 'Salvar' }))

      expect(await screen.findByText('CPF inválido.')).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledWith('/api/clientes', expect.objectContaining({ method: 'POST' }))
      expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true')
    })

    it('campos vazios mostram obrigatoriedade e não chamam a API', async () => {
      renderizar('/clientes/novo')
      await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar' }))

      expect(await screen.findByText('Nome completo é obrigatório.')).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('ao criar, vai para o detalhe do cliente', async () => {
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
        init.method === 'POST' ? resposta(201, ana) : resposta(200, { ...ana, contratos: [] }),
      )
      renderizar('/clientes/novo')
      const u = userEvent.setup()
      await preencher(u)
      await u.click(screen.getByRole('button', { name: 'Salvar' }))

      expect(await screen.findByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledWith('/api/clientes/c1', expect.anything())
    })

    it('na edição, carrega os dados e envia PUT', async () => {
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
        init.method === 'PUT' ? resposta(200, ana) : resposta(200, { ...ana, contratos: [] }),
      )
      renderizar('/clientes/c1/editar')

      expect(await screen.findByDisplayValue('Ana Souza')).toBeInTheDocument()
      await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar' }))

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith('/api/clientes/c1', expect.objectContaining({ method: 'PUT' })),
      )
      expect(await screen.findByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument()
    })
  })

  describe('troca de rota com a tela montada', () => {
    it('detalhe: ao trocar de id não mostra o cliente anterior nem o erro anterior', async () => {
      fetchMock.mockImplementation(async (url: string) =>
        url.endsWith('/c1')
          ? resposta(200, { ...ana, contratos: [] })
          : new Promise<Response>(() => {}),
      )
      renderizarComLinks('/clientes/c1', '/clientes/c2')
      expect(await screen.findByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument()

      await userEvent.setup().click(screen.getByRole('link', { name: 'ir para outro' }))

      expect(await screen.findByText('Carregando...')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Ana Souza' })).not.toBeInTheDocument()
    })

    it('formulário: ir da edição para "novo" traz os campos vazios', async () => {
      fetchMock.mockImplementation(async () => resposta(200, { ...ana, contratos: [] }))
      renderizarComLinks('/clientes/c1/editar', '/clientes/novo')
      expect(await screen.findByDisplayValue('Ana Souza')).toBeInTheDocument()

      await userEvent.setup().click(screen.getByRole('link', { name: 'ir para outro' }))

      expect(await screen.findByRole('heading', { name: 'Novo cliente' })).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Ana Souza')).not.toBeInTheDocument()
    })
  })

  describe('detalhe e exclusão', () => {
    const comContratos = {
      ...ana,
      totalContratos: 2,
      contratos: [
        { id: 'k1', titulo: 'Compra do lote 7', dataAssinatura: '2026-03-01', cliente: { id: 'c1', nomeCompleto: 'Ana Souza' } },
        { id: 'k2', titulo: 'Compra do lote 8', dataAssinatura: '2026-04-01', cliente: { id: 'c1', nomeCompleto: 'Ana Souza' } },
      ],
    }

    async function confirmarExclusao() {
      const u = userEvent.setup()
      await u.click(await screen.findByRole('button', { name: 'Excluir cliente' }))
      const dialogo = await screen.findByRole('alertdialog')
      await u.click(within(dialogo).getByRole('button', { name: 'Confirmar exclusão' }))
    }

    it('lista os contratos vinculados', async () => {
      fetchMock.mockImplementation(async () => resposta(200, comContratos))
      renderizar('/clientes/c1')

      expect(await screen.findByText('Compra do lote 7')).toBeInTheDocument()
      expect(screen.getByText('Compra do lote 8')).toBeInTheDocument()
    })

    it('exclusão bloqueada mostra a mensagem da API', async () => {
      const mensagem = 'Este cliente tem 2 contratos vinculados. Exclua os contratos antes.'
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
        init.method === 'DELETE'
          ? resposta(409, { erro: { codigo: 'CLIENTE_COM_CONTRATOS', mensagem } })
          : resposta(200, comContratos),
      )
      renderizar('/clientes/c1')
      await confirmarExclusao()

      expect(await screen.findByText(mensagem)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument()
    })

    it('exclusão com sucesso volta para a lista', async () => {
      fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
        if (init.method === 'DELETE') return resposta(204)
        if (url.startsWith('/api/clientes?')) return resposta(200, pagina([]))
        return resposta(200, { ...ana, contratos: [] })
      })
      renderizar('/clientes/c1')
      await confirmarExclusao()

      expect(await screen.findByText('Nenhum cliente encontrado.')).toBeInTheDocument()
    })
  })
})
