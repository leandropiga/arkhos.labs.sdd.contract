import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { api } from '@/lib/api'
import type { Perfil } from '@/features/auth/tipos'

type Estado = { situacao: 'carregando' } | { situacao: 'sem-sessao' } | { situacao: 'ok'; usuario: Perfil }

const SessaoContexto = createContext<{ usuario: Perfil } | null>(null)

export function useSessao(): { usuario: Perfil } {
  const sessao = useContext(SessaoContexto)
  if (!sessao) throw new Error('useSessao deve ser usado dentro de <RotaProtegida />.')
  return sessao
}

export function RotaProtegida() {
  const [estado, setEstado] = useState<Estado>({ situacao: 'carregando' })

  useEffect(() => {
    let ativo = true
    api<{ usuario: Perfil }>('/api/auth/sessao')
      .then(({ usuario }) => {
        if (ativo) setEstado({ situacao: 'ok', usuario })
      })
      // 401 ou qualquer outro erro (rede, 500): sem sessão confirmada, vai para o login.
      .catch(() => {
        if (ativo) setEstado({ situacao: 'sem-sessao' })
      })

    const aoExpirar = () => setEstado({ situacao: 'sem-sessao' })
    window.addEventListener('sessao-expirada', aoExpirar)
    return () => {
      ativo = false
      window.removeEventListener('sessao-expirada', aoExpirar)
    }
  }, [])

  if (estado.situacao === 'carregando') return null
  if (estado.situacao === 'sem-sessao') return <Navigate to="/login" replace />
  return (
    <SessaoContexto.Provider value={{ usuario: estado.usuario }}>
      <Outlet />
    </SessaoContexto.Provider>
  )
}
