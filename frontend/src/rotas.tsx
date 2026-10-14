import { Route, Routes } from 'react-router'
import { LayoutApp } from '@/components/layout/layout-app'

// Placeholders: as telas reais chegam nas tarefas das histórias de usuário.
const Pagina = ({ titulo }: { titulo: string }) => <h1 className="text-2xl font-bold">{titulo}</h1>

export function Rotas() {
  return (
    <Routes>
      <Route path="/login" element={<Pagina titulo="Entrar" />} />
      <Route element={<LayoutApp />}>
        <Route path="/" element={<Pagina titulo="Home" />} />
        <Route path="/clientes/*" element={<Pagina titulo="Clientes" />} />
        <Route path="/contratos/*" element={<Pagina titulo="Contratos" />} />
        <Route path="/perfil" element={<Pagina titulo="Perfil" />} />
      </Route>
    </Routes>
  )
}
