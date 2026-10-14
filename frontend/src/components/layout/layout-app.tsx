import { HomeIcon, FileTextIcon, LogOutIcon, UsersIcon } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { api } from '@/lib/api'

const itensMenu = [
  { titulo: 'Home', destino: '/', icone: HomeIcon },
  { titulo: 'Clientes', destino: '/clientes', icone: UsersIcon },
  { titulo: 'Contratos', destino: '/contratos', icone: FileTextIcon },
]

function ativo(pathname: string, destino: string) {
  return destino === '/' ? pathname === '/' : pathname === destino || pathname.startsWith(destino + '/')
}

export function LayoutApp() {
  const { pathname } = useLocation()
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
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Gestão de Contratos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {itensMenu.map((item) => (
                    <SidebarMenuItem key={item.destino}>
                      <SidebarMenuButton
                        asChild
                        isActive={ativo(pathname, item.destino)}
                        tooltip={item.titulo}
                      >
                        <Link to={item.destino}>
                          <item.icone />
                          <span>{item.titulo}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Button variant="ghost" className="w-full justify-start" onClick={sair}>
              <LogOutIcon />
              Sair
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
