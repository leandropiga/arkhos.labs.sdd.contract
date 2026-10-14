/*
 * Painel de análise por IA (História 4), dentro do detalhe do contrato.
 * - Botão "Solicitar Análise de PDF": desabilitado e com carregamento durante o pedido.
 * - Sucesso: resumo, riscos com gravidade, cláusulas críticas e data da análise.
 * - 503: toast com a mensagem de indisponibilidade e a análise anterior continua na tela.
 * - 409: toast; 422: mensagem própria na tela.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { toast } from 'sonner'
import { DetalheContrato } from '@/features/contratos/detalhe-contrato'

const detalheBase = {
  id: 'k1',
  titulo: 'Compra do lote 7',
  dataAssinatura: '2026-03-01',
  cliente: { id: 'c1', nomeCompleto: 'Ana Souza' },
  arquivoNomeOriginal: 'lote7.pdf',
  arquivoTamanhoBytes: 2048,
  analiseEmAndamento: false,
  analise: null,
}

const analiseNova = {
  resumo: 'Contrato de compra com prazo de entrega curto.',
  riscos: [
    { titulo: 'Multa elevada', descricao: 'A multa por atraso é de 30%.', gravidade: 'ALTA' },
    { titulo: 'Prazo apertado', descricao: 'Entrega em 5 dias.', gravidade: 'BAIXA' },
  ],
  clausulasCriticas: [{ clausula: 'Cláusula 7', motivo: 'Rescisão unilateral sem aviso.' }],
  geradaEm: '2026-10-14T12:00:00.000Z',
}

const analiseAnterior = {
  resumo: 'Resumo da análise anterior.',
  riscos: [{ titulo: 'Risco antigo', descricao: 'Descrição antiga.', gravidade: 'MEDIA' }],
  clausulasCriticas: [],
  geradaEm: '2026-09-01T12:00:00.000Z',
}

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

function erro(status: number, codigo: string, mensagem: string) {
  return resposta(status, { erro: { codigo, mensagem } })
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/contratos/k1']}>
      <Routes>
        <Route path="/contratos/:id" element={<DetalheContrato />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('painel de análise', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.mocked(toast.error).mockClear()
    vi.stubGlobal('fetch', fetchMock)
  })

  function mockar(detalhe: unknown, analise: () => Promise<Response>) {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/contratos/k1/analise' && init?.method === 'POST') return analise()
      return resposta(200, detalhe)
    })
  }

  it('desabilita o botão e mostra carregamento durante o pedido', async () => {
    let liberar: (r: Response) => void = () => {}
    mockar(detalheBase, () => new Promise<Response>((r) => (liberar = r)))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar Análise de PDF' }))

    const botao = await screen.findByRole('button', { name: /Analisando/ })
    expect(botao).toBeDisabled()

    liberar(resposta(200, analiseNova))
    expect(await screen.findByRole('button', { name: 'Solicitar Análise de PDF' })).toBeEnabled()
  })

  it('mostra resumo, riscos com gravidade, cláusulas e data após o sucesso', async () => {
    mockar(detalheBase, async () => resposta(200, analiseNova))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar Análise de PDF' }))

    expect(await screen.findByText(analiseNova.resumo)).toBeInTheDocument()
    expect(screen.getByText('Multa elevada')).toBeInTheDocument()
    expect(screen.getByText('A multa por atraso é de 30%.')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getByText('Baixa')).toBeInTheDocument()
    expect(screen.getByText('Cláusula 7')).toBeInTheDocument()
    expect(screen.getByText('Rescisão unilateral sem aviso.')).toBeInTheDocument()
    expect(screen.getByText(/14\/10\/2026/)).toBeInTheDocument()
  })

  it('mostra a análise já existente ao abrir o contrato', async () => {
    mockar({ ...detalheBase, analise: analiseAnterior }, async () => resposta(200, analiseNova))
    renderizar()

    expect(await screen.findByText('Resumo da análise anterior.')).toBeInTheDocument()
    expect(screen.getByText('Média')).toBeInTheDocument()
    expect(screen.getByText(/01\/09\/2026/)).toBeInTheDocument()
  })

  it('503 mostra o toast e mantém a análise anterior na tela', async () => {
    mockar({ ...detalheBase, analise: analiseAnterior }, async () =>
      erro(503, 'IA_INDISPONIVEL', 'O serviço de análise está temporariamente indisponível. Tente novamente em instantes.'),
    )
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar Análise de PDF' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'O serviço de análise está temporariamente indisponível. Tente novamente em instantes.',
      ),
    )
    expect(screen.getByText('Resumo da análise anterior.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Solicitar Análise de PDF' })).toBeEnabled()
  })

  it('409 mostra toast com a mensagem da API', async () => {
    mockar(detalheBase, async () => erro(409, 'ANALISE_EM_ANDAMENTO', 'Já existe uma análise em andamento para este contrato.'))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar Análise de PDF' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Já existe uma análise em andamento para este contrato.'))
  })

  it('422 mostra mensagem própria na tela e não usa toast', async () => {
    mockar(detalheBase, async () => erro(422, 'PDF_NAO_ANALISAVEL', 'Não foi possível extrair texto deste PDF.'))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar Análise de PDF' }))

    expect(await screen.findByText('Não foi possível extrair texto deste PDF.')).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
