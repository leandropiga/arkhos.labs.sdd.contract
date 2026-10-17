import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazy, Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroBoundary } from '@/components/erro-boundary'

describe('ErroBoundary', () => {
  const originalLocation = window.location
  const reload = vi.fn()

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    reload.mockClear()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('renderiza os filhos quando não há erro', () => {
    render(
      <ErroBoundary>
        <p>tudo certo</p>
      </ErroBoundary>,
    )
    expect(screen.getByText('tudo certo')).toBeInTheDocument()
  })

  it('mostra aviso e recarrega a página quando a tela lazy falha ao carregar', async () => {
    const Quebrada = lazy(() => Promise.reject(new Error('chunk falhou')))
    render(
      <ErroBoundary>
        <Suspense fallback={<p>Carregando...</p>}>
          <Quebrada />
        </Suspense>
      </ErroBoundary>,
    )

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Não foi possível carregar esta tela.')

    await userEvent.click(
      screen.getByRole('button', { name: 'Recarregar a página' }),
    )
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
