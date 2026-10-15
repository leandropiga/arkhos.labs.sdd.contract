/*
 * Perfil (História 6, FR-005). Interface que a T073 deve implementar:
 *
 *   TelaPerfil  em src/features/perfil/tela-perfil.tsx          (rota /perfil)
 *   MenuPerfil  em src/components/layout/menu-perfil.tsx        (dentro do LayoutApp)
 *
 * - Tela: campos rotulados "Nome", "URL da foto" e "Telefone", botão "Salvar"; PUT /api/perfil
 *   sempre com os três campos; URL inválida mostra o erro no campo e não envia.
 * - Menu: botão "Menu do perfil" com Avatar + nome; ao salvar, nome e foto atualizam na hora.
 *   Sem foto (ou foto que não carrega), o Avatar mostra as iniciais. Itens "Meu perfil" e "Sair".
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LayoutApp } from '@/components/layout/layout-app'
import { RotaProtegida } from '@/features/auth/rota-protegida'
import { TelaPerfil } from '@/features/perfil/tela-perfil'
import type { Perfil } from '@/features/auth/tipos'

const perfil: Perfil = {
  id: '0b6f8f9e-3c1a-4d2e-9f00-7a1b2c3d4e5f',
  usuario: 'admin',
  nome: 'Ana Souza',
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
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route element={<RotaProtegida />}>
          <Route element={<LayoutApp />}>
            <Route path="/perfil" element={<TelaPerfil />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

// No jsdom nenhuma imagem carrega sozinha: simulamos o navegador para o Avatar do Radix.
function simularImagens(carrega: boolean) {
  class ImagemFalsa {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      queueMicrotask(() => (carrega ? this.onload?.() : this.onerror?.()))
    }
  }
  vi.stubGlobal('Image', ImagemFalsa)
}

describe('Perfil (História 6, FR-005)', () => {
  const fetchMock = vi.fn()
  let atual: Perfil

  beforeEach(() => {
    atual = perfil
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const metodo = init?.method ?? 'GET'
      if (url === '/api/auth/sessao') return resposta(200, { usuario: atual })
      if (url === '/api/perfil' && metodo === 'PUT') {
        const corpo = JSON.parse(String(init?.body))
        atual = { ...atual, ...corpo, telefone: corpo.telefone ? String(corpo.telefone).replace(/\D/g, '') : null }
        return resposta(200, atual)
      }
      throw new Error(`requisição inesperada: ${metodo} ${url}`)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const chamadasPut = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT')

  it('salvar atualiza nome e foto no menu de perfil', async () => {
    simularImagens(true)
    const usuario = userEvent.setup()
    renderizar()
    const nome = await screen.findByLabelText('Nome')
    expect(nome).toHaveValue('Ana Souza')
    expect(screen.getByRole('button', { name: 'Menu do perfil' })).toHaveTextContent('Ana Souza')

    await usuario.clear(nome)
    await usuario.type(nome, 'Maria Lima')
    await usuario.type(screen.getByLabelText('URL da foto'), 'https://exemplo.com/maria.png')
    await usuario.type(screen.getByLabelText('Telefone'), '(11) 98765-4321')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Perfil salvo.')).toBeInTheDocument()
    expect(chamadasPut()).toHaveLength(1)
    expect(JSON.parse(chamadasPut()[0][1].body)).toEqual({
      nome: 'Maria Lima',
      fotoUrl: 'https://exemplo.com/maria.png',
      telefone: '(11) 98765-4321',
    })
    const menu = screen.getByRole('button', { name: 'Menu do perfil' })
    expect(menu).toHaveTextContent('Maria Lima')
    await waitFor(() => expect(menu.querySelector('img')).toHaveAttribute('src', 'https://exemplo.com/maria.png'))
  })

  it('URL da foto inválida mostra o erro no campo e não envia', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.type(await screen.findByLabelText('URL da foto'), 'isto não é uma url')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/URL da foto inválida/)).toBeInTheDocument()
    expect(screen.getByLabelText('URL da foto')).toHaveAttribute('aria-invalid', 'true')
    expect(chamadasPut()).toHaveLength(0)
  })

  it('mostra o erro de campo devolvido pela API (400 VALIDACAO_INVALIDA)', async () => {
    const usuario = userEvent.setup()
    renderizar()
    const telefone = await screen.findByLabelText('Telefone')
    fetchMock.mockImplementation(async () =>
      resposta(400, {
        erro: {
          codigo: 'VALIDACAO_INVALIDA',
          mensagem: 'Dados inválidos.',
          campos: [{ campo: 'telefone', mensagem: 'Telefone inválido. Informe DDD e número (10 ou 11 dígitos).' }],
        },
      }),
    )
    await usuario.type(telefone, '11987654321')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/Telefone inválido/)).toBeInTheDocument()
    expect(screen.queryByText('Perfil salvo.')).not.toBeInTheDocument()
  })

  it('sem foto, o Avatar mostra as iniciais do nome', async () => {
    renderizar()
    const menu = await screen.findByRole('button', { name: 'Menu do perfil' })
    expect(menu).toHaveTextContent('AS')
    expect(menu.querySelector('img')).toBeNull()
  })

  it('foto que não carrega cai nas iniciais', async () => {
    simularImagens(false)
    atual = { ...perfil, fotoUrl: 'https://exemplo.com/quebrada.png' }
    renderizar()
    const menu = await screen.findByRole('button', { name: 'Menu do perfil' })
    await waitFor(() => expect(menu).toHaveTextContent('AS'))
    expect(menu.querySelector('img')).toBeNull()
  })

  it('o menu tem "Meu perfil" e "Sair"', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Menu do perfil' }))

    expect(await screen.findByRole('menuitem', { name: 'Meu perfil' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })
})
