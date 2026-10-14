import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Fuso fixo: os testes de data local (ex.: geradaEm) não podem depender da máquina.
process.env.TZ = 'America/Sao_Paulo'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// jsdom não implementa matchMedia, que o hook use-mobile (sidebar do shadcn) usa.
// Stub mínimo: função simples (não vi.fn) para não ser zerada por mockReset.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
