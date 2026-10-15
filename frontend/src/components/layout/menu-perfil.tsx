import { LogOutIcon, UserIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSessao } from '@/features/auth/rota-protegida'
import { api } from '@/lib/api'

/** Iniciais para o Avatar sem foto: primeira letra da primeira e da última palavra do nome. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

export function MenuPerfil() {
  const { usuario } = useSessao()
  const navegar = useNavigate()

  // Mesmo que o logout falhe (rede, 500), voltamos ao /login: a próxima consulta
  // da sessão decide se ainda há cookie válido.
  async function sair() {
    try {
      await api('/api/auth/logout', { metodo: 'POST' })
    } catch {
      // ignorado de propósito
    }
    navegar('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu do perfil"
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Avatar size="sm">
          {usuario.fotoUrl && <AvatarImage src={usuario.fotoUrl} alt="" />}
          <AvatarFallback>{iniciais(usuario.nome)}</AvatarFallback>
        </Avatar>
        <span>{usuario.nome}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{usuario.usuario}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">
            <UserIcon />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={sair}>
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
