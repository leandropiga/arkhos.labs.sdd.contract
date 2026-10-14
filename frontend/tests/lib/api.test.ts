/*
 * Interface que a T026 deve implementar em `frontend/src/lib/api.ts`:
 *
 *   export class ErroApi extends Error {
 *     status: number; codigo: string; mensagem: string; campos?: { campo: string; mensagem: string }[]
 *     constructor(status, codigo, mensagem, campos?)   // message === mensagem
 *   }
 *   export async function api<T = unknown>(
 *     caminho: string,                                  // ex.: '/api/contratos'
 *     opcoes?: { metodo?: string; corpo?: unknown },    // metodo padrão 'GET'; corpo é serializado em JSON
 *   ): Promise<T>
 *
 * Regras: fetch(caminho, { method, credentials: 'same-origin', headers/body JSON });
 * 2xx devolve o JSON (204 devolve undefined); erro { erro: { codigo, mensagem, campos? } } vira ErroApi;
 * 401 em qualquer rota, exceto POST /api/auth/login, faz window.dispatchEvent(new Event('sessao-expirada')).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ErroApi } from '@/lib/api'

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

describe('cliente HTTP (api)', () => {
  const fetchMock = vi.fn()
  const aoExpirar = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    window.addEventListener('sessao-expirada', aoExpirar)
  })

  afterEach(() => {
    window.removeEventListener('sessao-expirada', aoExpirar)
  })

  it('devolve o JSON de uma resposta 2xx e envia credentials same-origin', async () => {
    fetchMock.mockResolvedValue(resposta(200, { id: 'c1', nome: 'Acme' }))

    const dados = await api<{ id: string; nome: string }>('/api/contratos/c1')

    expect(dados).toEqual({ id: 'c1', nome: 'Acme' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/contratos/c1')
    expect(init.credentials).toBe('same-origin')
    expect(init.method ?? 'GET').toBe('GET')
  })

  it('envia o corpo como JSON com o método informado', async () => {
    fetchMock.mockResolvedValue(resposta(201, { id: 'n1' }))

    await api('/api/clientes', { metodo: 'POST', corpo: { nome: 'Acme' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ nome: 'Acme' }))
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  })

  it('aceita resposta 204 sem corpo', async () => {
    fetchMock.mockResolvedValue(resposta(204))

    await expect(api('/api/auth/logout', { metodo: 'POST' })).resolves.toBeUndefined()
    expect(aoExpirar).not.toHaveBeenCalled()
  })

  it('lança ErroApi com status, codigo, mensagem e campos', async () => {
    fetchMock.mockResolvedValue(
      resposta(400, {
        erro: { codigo: 'VALIDACAO_INVALIDA', mensagem: 'Dados inválidos', campos: [{ campo: 'nome', mensagem: 'Obrigatório' }] },
      }),
    )

    const erro = await api('/api/clientes', { metodo: 'POST', corpo: {} }).catch((e) => e)

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro).toBeInstanceOf(Error)
    expect(erro.status).toBe(400)
    expect(erro.codigo).toBe('VALIDACAO_INVALIDA')
    expect(erro.mensagem).toBe('Dados inválidos')
    expect(erro.campos).toEqual([{ campo: 'nome', mensagem: 'Obrigatório' }])
    expect(aoExpirar).not.toHaveBeenCalled()
  })

  it('deixa campos indefinido quando o erro não traz campos', async () => {
    fetchMock.mockResolvedValue(
      resposta(404, { erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado' } }),
    )

    const erro = await api('/api/contratos/x').catch((e) => e)

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro.status).toBe(404)
    expect(erro.campos).toBeUndefined()
  })

  it('dispara sessao-expirada em 401 de rota que não é o login', async () => {
    fetchMock.mockResolvedValue(
      resposta(401, { erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Sessão inválida' } }),
    )

    const erro = await api('/api/contratos').catch((e) => e)

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro.status).toBe(401)
    expect(aoExpirar).toHaveBeenCalledTimes(1)
  })

  it('não dispara sessao-expirada no 401 do POST /api/auth/login', async () => {
    fetchMock.mockResolvedValue(
      resposta(401, { erro: { codigo: 'CREDENCIAIS_INVALIDAS', mensagem: 'E-mail ou senha inválidos' } }),
    )

    const erro = await api('/api/auth/login', { metodo: 'POST', corpo: { email: 'a', senha: 'b' } }).catch(
      (e) => e,
    )

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro.status).toBe(401)
    expect(erro.codigo).toBe('CREDENCIAIS_INVALIDAS')
    expect(aoExpirar).not.toHaveBeenCalled()
  })

  it('isola o mock de fetch entre testes', () => {
    expect(fetchMock).not.toHaveBeenCalled()
    expect(aoExpirar).not.toHaveBeenCalled()
  })
})
