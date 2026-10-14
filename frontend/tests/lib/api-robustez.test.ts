import { describe, expect, it, vi } from 'vitest'
import { api, ErroApi } from '@/lib/api'

describe('cliente HTTP (api): respostas fora do padrão', () => {
  const fetchMock = vi.fn()

  it('vira ErroApi genérico quando o erro não é o JSON padronizado (ex.: 502 em HTML)', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))

    const erro = (await api('/api/contratos').catch((e) => e)) as ErroApi

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro.status).toBe(502)
    expect(erro.codigo).toBe('ERRO_INTERNO')
    expect(erro.mensagem).toBe('Não foi possível concluir a operação. Tente novamente.')
  })

  it('vira ErroApi genérico quando o fetch rejeita (falha de rede)', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const erro = (await api('/api/contratos').catch((e) => e)) as ErroApi

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro.status).toBe(0)
    expect(erro.codigo).toBe('ERRO_DE_REDE')
    expect(erro.mensagem).toBe('Não foi possível conectar ao servidor. Verifique sua conexão.')
  })
})
