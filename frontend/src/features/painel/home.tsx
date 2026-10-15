import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { api, ErroApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { FieldError } from '@/components/ui/field'

type Painel = {
  totalClientes: number
  totalContratos: number
  clientesPorUf: { uf: string; total: number }[]
}

const configGrafico = {
  total: { label: 'Clientes', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function Home() {
  const [painel, setPainel] = useState<Painel | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    api<Painel>('/api/painel')
      .then((resultado) => {
        if (ativo) setPainel(resultado)
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar o painel.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  return (
    <section className="flex flex-col gap-4" aria-busy={carregando}>
      <h1 className="text-2xl font-bold">Home</h1>

      {erro && <FieldError>{erro}</FieldError>}
      {carregando && <p role="status">Carregando...</p>}

      {painel && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Total de clientes</CardDescription>
                <CardTitle className="text-3xl">{painel.totalClientes}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total de contratos</CardDescription>
                <CardTitle className="text-3xl">{painel.totalContratos}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clientes por UF</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.clientesPorUf.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhum cliente cadastrado ainda. Cadastre clientes para ver aqui a distribuição por estado (UF).
                </p>
              ) : (
                <ChartContainer
                  config={configGrafico}
                  role="img"
                  aria-label="Gráfico de clientes por UF"
                  className="min-h-[200px] w-full"
                >
                  <BarChart data={painel.clientesPorUf} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="uf" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} width={32} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}
