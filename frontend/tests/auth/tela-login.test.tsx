/*
 * Interface que a T034 deve implementar em `frontend/src/features/auth/tela-login.tsx`:
 *
 *   export function TelaLogin(): JSX.Element
 *
 * - Campos com rótulo acessível "Usuário" e "Senha" e botão "Entrar".
 * - Envia via api('/api/auth/login', { metodo: 'POST', corpo: { usuario, senha } }).
 * - Sucesso (200): navega para '/'.
 * - Erro 401: mostra exatamente "Usuário ou senha inválidos." e continua em /login.
 * - Erro 429: mostra a mensagem vinda da API (já em português) e continua em /login.
 * - Campos vazios: mostra erro de campo obrigatório (validação zod) e NÃO chama o fetch.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TelaLogin } from '@/features/auth/tela-login'

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<TelaLogin />} />
        <Route path="/" element={<p>Página inicial</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function preencherEEnviar(usuario: string, senha: string) {
  const u = userEvent.setup()
  await u.type(screen.getByLabelText('Usuário'), usuario)
  await u.type(screen.getByLabelText('Senha'), senha)
  await u.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('TelaLogin (História 1)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  it('envia usuário e senha e, em sucesso, navega para a página inicial', async () => {
    fetchMock.mockResolvedValue(resposta(200, { usuario: { id: 1, usuario: 'admin' } }))
    renderizar()

    await preencherEEnviar('admin', 'segredo123')

    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ usuario: 'admin', senha: 'segredo123' })
  })

  it('em 401 mostra "Usuário ou senha inválidos." e continua na tela de login', async () => {
    fetchMock.mockResolvedValue(
      resposta(401, { erro: { codigo: 'CREDENCIAIS_INVALIDAS', mensagem: 'Credenciais inválidas.' } }),
    )
    renderizar()

    await preencherEEnviar('admin', 'errada')

    expect(await screen.findByText('Usuário ou senha inválidos.')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toBeInTheDocument()
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
  })

  it('em 429 mostra o aviso de bloqueio temporário vindo da API', async () => {
    const mensagem = 'Muitas tentativas. Tente novamente em 15 minutos.'
    fetchMock.mockResolvedValue(resposta(429, { erro: { codigo: 'LOGIN_BLOQUEADO', mensagem } }))
    renderizar()

    await preencherEEnviar('admin', 'segredo123')

    expect(await screen.findByText(mensagem)).toBeInTheDocument()
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
  })

  it('com campos vazios mostra erro de campo obrigatório e não chama o servidor', async () => {
    renderizar()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Entrar' }))

    expect((await screen.findAllByText(/obrigatório/i)).length).toBeGreaterThan(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
