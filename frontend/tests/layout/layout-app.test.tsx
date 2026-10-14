import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LayoutApp } from '@/components/layout/layout-app'

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<LayoutApp />}>
          <Route path="/" element={<p>conteúdo da rota filha</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('LayoutApp (FR-032)', () => {
  it('mostra o menu lateral com Home, Clientes e Contratos', () => {
    renderizar()
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /clientes/i })).toHaveAttribute('href', '/clientes')
    expect(screen.getByRole('link', { name: /contratos/i })).toHaveAttribute('href', '/contratos')
  })

  it('renderiza o conteúdo da rota filha', () => {
    renderizar()
    expect(screen.getByText('conteúdo da rota filha')).toBeInTheDocument()
  })

  it('mostra o botão de alternar o menu em português', () => {
    renderizar()
    expect(screen.getByRole('button', { name: 'Alternar menu lateral' })).toBeInTheDocument()
  })
})
