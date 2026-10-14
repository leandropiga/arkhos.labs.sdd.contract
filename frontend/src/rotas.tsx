import { Route, Routes } from 'react-router'
import { TelaLogin } from '@/features/auth/tela-login'
import { RotaProtegida } from '@/features/auth/rota-protegida'
import { LayoutApp } from '@/components/layout/layout-app'
import { ListaClientes } from '@/features/clientes/lista-clientes'
import { FormCliente } from '@/features/clientes/form-cliente'
import { DetalheCliente } from '@/features/clientes/detalhe-cliente'

// Placeholders: as telas reais chegam nas tarefas das histórias de usuário.
const Pagina = ({ titulo }: { titulo: string }) => <h1 className="text-2xl font-bold">{titulo}</h1>

export function Rotas() {
  return (
    <Routes>
      <Route path="/login" element={<TelaLogin />} />
      <Route element={<RotaProtegida />}>
        <Route element={<LayoutApp />}>
          <Route path="/" element={<Pagina titulo="Home" />} />
          <Route path="/clientes" element={<ListaClientes />} />
          <Route path="/clientes/novo" element={<FormCliente />} />
          <Route path="/clientes/:id" element={<DetalheCliente />} />
          <Route path="/clientes/:id/editar" element={<FormCliente />} />
          <Route path="/contratos/*" element={<Pagina titulo="Contratos" />} />
          <Route path="/perfil" element={<Pagina titulo="Perfil" />} />
        </Route>
      </Route>
    </Routes>
  )
}
