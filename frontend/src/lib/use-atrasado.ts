import { useEffect, useState } from 'react'

/** Devolve `valor` só depois de `atrasoMs` sem mudanças (debounce), para não buscar a cada tecla. */
export function useAtrasado<T>(valor: T, atrasoMs: number): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(id)
  }, [valor, atrasoMs])
  return atrasado
}
