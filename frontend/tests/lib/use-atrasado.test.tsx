import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAtrasado } from '@/lib/use-atrasado'

describe('useAtrasado', () => {
  afterEach(() => vi.useRealTimers())

  it('só devolve o novo valor depois do atraso', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ v }) => useAtrasado(v, 300), { initialProps: { v: 'a' } })
    expect(result.current).toBe('a')

    rerender({ v: 'ab' })
    act(() => void vi.advanceTimersByTime(299))
    expect(result.current).toBe('a')

    act(() => void vi.advanceTimersByTime(1))
    expect(result.current).toBe('ab')
  })
})
