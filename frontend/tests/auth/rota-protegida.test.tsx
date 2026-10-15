/*
 * Interface que a T035 deve implementar em `frontend/src/features/auth/rota-protegida.tsx`:
 *
 *   export function RotaProtegida(): JSX.Element
 *   export function useSessao(): { usuario: Perfil }
 *
 * - Componente de rota de layout: consulta GET /api/auth/sessao (via api()).
 * - Enquanto carrega: não mostra o conteúdo protegido nem redireciona.
 * - 200: renderiza <Outlet /> e expõe o usuário por contexto (useSessao).
 * - 401: redireciona para /login.
 * - Evento 'sessao-expirada' em window (FR-004): redireciona para /login.
 *
 * O item "Sair" (T035, movido para o Menu de Perfil na T073) fica no LayoutApp: chama POST /api/auth/logout e navega para /login.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LayoutApp } from '@/components/layout/layout-app'
import { RotaProtegida } from '@/features/auth/rota-protegida'
import type { Perfil } from '@/features/auth/tipos'

const perfil: Perfil = {
  id: '0b6f8f9e-3c1a-4d2e-9f00-7a1b2c3d4e5f',
  usuario: 'admin',
  nome: 'Administrador',
  fotoUrl: null,
  telefone: null,
}

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route element={<RotaProtegida />}>
          <Route element={<LayoutApp />}>
            <Route path="/" element={<p>Página inicial</p>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RotaProtegida (História 1, FR-001, FR-003, FR-004)', () => {
  const fetchMock = vi.fn()

  function simular(sessao: boolean) {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const metodo = init?.method ?? 'GET'
      if (url === '/api/auth/sessao' && metodo === 'GET') {
        return sessao
          ? resposta(200, { usuario: perfil })
          : resposta(401, { erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Faça login para continuar.' } })
      }
      if (url === '/api/auth/logout' && metodo === 'POST') return resposta(204)
      throw new Error(`requisição inesperada: ${metodo} ${url}`)
    })
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  it('sem sessão (401) redireciona para /login e não mostra o conteúdo protegido', async () => {
    simular(false)
    renderizar()

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/sessao', expect.objectContaining({ method: 'GET' }))
  })

  it('com sessão renderiza o layout e o conteúdo, só depois da resposta', async () => {
    simular(true)
    renderizar()

    // Carregando: nem conteúdo protegido nem redirecionamento.
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument()

    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /clientes/i })).toHaveAttribute('href', '/clientes')
    expect(screen.getByRole('link', { name: /contratos/i })).toHaveAttribute('href', '/contratos')
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument()
  })

  it('o botão "Sair" chama POST /api/auth/logout e volta para /login', async () => {
    simular(true)
    renderizar()
    await screen.findByText('Página inicial')

    // "Sair" mora no Menu de Perfil (T073): abre o menu e escolhe o item.
    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: 'Menu do perfil' }))
    await usuario.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }))
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
  })

  it('ao receber "sessao-expirada" durante o uso, redireciona para /login (FR-004)', async () => {
    simular(true)
    renderizar()
    await screen.findByText('Página inicial')

    window.dispatchEvent(new Event('sessao-expirada'))

    await waitFor(() => expect(screen.getByText('Tela de login')).toBeInTheDocument())
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
  })
})
