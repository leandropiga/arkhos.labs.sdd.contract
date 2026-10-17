import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { TelaLogin } from "@/features/auth/tela-login";
import { RotaProtegida } from "@/features/auth/rota-protegida";
import { LayoutApp } from "@/components/layout/layout-app";

const ListaClientes = lazy(() =>
  import("@/features/clientes/lista-clientes").then((m) => ({
    default: m.ListaClientes,
  })),
);
const FormCliente = lazy(() =>
  import("@/features/clientes/form-cliente").then((m) => ({
    default: m.FormCliente,
  })),
);
const DetalheCliente = lazy(() =>
  import("@/features/clientes/detalhe-cliente").then((m) => ({
    default: m.DetalheCliente,
  })),
);
const ListaContratos = lazy(() =>
  import("@/features/contratos/lista-contratos").then((m) => ({
    default: m.ListaContratos,
  })),
);
const FormContrato = lazy(() =>
  import("@/features/contratos/form-contrato").then((m) => ({
    default: m.FormContrato,
  })),
);
const DetalheContrato = lazy(() =>
  import("@/features/contratos/detalhe-contrato").then((m) => ({
    default: m.DetalheContrato,
  })),
);
const Home = lazy(() =>
  import("@/features/painel/home").then((m) => ({ default: m.Home })),
);
const TelaPerfil = lazy(() =>
  import("@/features/perfil/tela-perfil").then((m) => ({
    default: m.TelaPerfil,
  })),
);

export function Rotas() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
      }
    >
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
    </Suspense>
  );
}
