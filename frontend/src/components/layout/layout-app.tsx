import { HomeIcon, FileTextIcon, UsersIcon } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import {
  Sidebar,
  SidebarContent,
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
