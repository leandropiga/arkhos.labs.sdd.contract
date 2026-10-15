import { Route, Routes } from 'react-router'
import { TelaLogin } from '@/features/auth/tela-login'
import { RotaProtegida } from '@/features/auth/rota-protegida'
import { LayoutApp } from '@/components/layout/layout-app'
import { ListaClientes } from '@/features/clientes/lista-clientes'
import { FormCliente } from '@/features/clientes/form-cliente'
import { DetalheCliente } from '@/features/clientes/detalhe-cliente'
import { ListaContratos } from '@/features/contratos/lista-contratos'
import { FormContrato } from '@/features/contratos/form-contrato'
import { DetalheContrato } from '@/features/contratos/detalhe-contrato'
import { Home } from '@/features/painel/home'
import { TelaPerfil } from '@/features/perfil/tela-perfil'

export function Rotas() {
  return (
    <Routes>
      <Route path="/login" element={<TelaLogin />} />
      <Route element={<RotaProtegida />}>
        <Route element={<LayoutApp />}>
          <Route path="/" element={<Home />} />
          <Route path="/clientes" element={<ListaClientes />} />
          <Route path="/clientes/novo" element={<FormCliente />} />
          <Route path="/clientes/:id" element={<DetalheCliente />} />
          <Route path="/clientes/:id/editar" element={<FormCliente />} />
          <Route path="/contratos" element={<ListaContratos />} />
          <Route path="/contratos/novo" element={<FormContrato />} />
          <Route path="/contratos/:id" element={<DetalheContrato />} />
          <Route path="/contratos/:id/editar" element={<FormContrato />} />
          <Route path="/perfil" element={<TelaPerfil />} />
        </Route>
      </Route>
    </Routes>
  )
}
