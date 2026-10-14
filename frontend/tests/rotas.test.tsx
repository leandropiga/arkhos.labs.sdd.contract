/*
 * Mapa de rotas real da aplicação (src/rotas.tsx): garante na interface o FR-001/SC-005 —
 * toda tela de negócio exige sessão; sem sessão, o usuário termina na tela de login.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Rotas } from '@/rotas'

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

function renderizar(caminho: string) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Rotas />
    </MemoryRouter>,
  )
}

async function esperarTelaLogin() {
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.getByLabelText('Usuário')).toBeInTheDocument()
  expect(screen.getByLabelText('Senha')).toBeInTheDocument()
}

describe('Rotas (FR-001, SC-005)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockImplementation(async (url: string) =>
      url === '/api/auth/sessao'
        ? resposta(401, { erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Faça login para continuar.' } })
        : resposta(404, { erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado.' } }),
    )
  })

  it.each(['/', '/clientes', '/clientes/novo', '/contratos', '/perfil'])(
    'sem sessão, %s termina na tela de login sem mostrar a página protegida',
    async (caminho) => {
      renderizar(caminho)

      await esperarTelaLogin()
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/sessao', expect.anything())
      expect(screen.queryByRole('heading', { name: /Home|Clientes|Contratos|Perfil/ })).not.toBeInTheDocument()
    },
  )

  it('/login renderiza a tela de login sem consultar a sessão', async () => {
    renderizar('/login')

    await esperarTelaLogin()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
