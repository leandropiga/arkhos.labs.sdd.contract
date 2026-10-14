import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAtrasado } from '@/lib/use-atrasado'
import { api, ErroApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatarData, type ContratoResumo, type Pagina } from './tipos'

const ATRASO_FILTRO_MS = 300

export function ListaContratos() {
  const [titulo, setTitulo] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [numeroPagina, setNumeroPagina] = useState(1)
  const [dados, setDados] = useState<Pagina<ContratoResumo> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const tituloBusca = useAtrasado(titulo.trim(), ATRASO_FILTRO_MS)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    const params = new URLSearchParams()
    if (tituloBusca) params.set('titulo', tituloBusca)
    if (dataInicio) params.set('dataInicio', dataInicio)
    if (dataFim) params.set('dataFim', dataFim)
    params.set('pagina', String(numeroPagina))
    api<Pagina<ContratoResumo>>(`/api/contratos?${params}`)
      .then((resultado) => {
        if (!ativo) return
        setDados(resultado)
        setErro(null)
      })
      .catch((e) => {
        if (!ativo) return
        setDados(null)
        setErro(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar os contratos.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [tituloBusca, dataInicio, dataFim, numeroPagina])

  const totalPaginas = dados?.totalPaginas ?? 0

  function irPara(alvo: number) {
    return (evento: React.MouseEvent) => {
      evento.preventDefault()
      if (alvo >= 1 && alvo <= totalPaginas) setNumeroPagina(alvo)
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-busy={carregando}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Button asChild>
          <Link to="/contratos/novo">Novo contrato</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="filtro-titulo">Título</FieldLabel>
          <Input
            id="filtro-titulo"
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value)
              setNumeroPagina(1)
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filtro-data-inicio">Data inicial</FieldLabel>
          <Input
            id="filtro-data-inicio"
            type="date"
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value)
              setNumeroPagina(1)
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filtro-data-fim">Data final</FieldLabel>
          <Input
            id="filtro-data-fim"
            type="date"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value)
              setNumeroPagina(1)
            }}
          />
        </Field>
      </div>

      {erro && <FieldError>{erro}</FieldError>}

      {!dados && !erro && <p>Carregando...</p>}

      {dados && dados.itens.length === 0 && <p>Nenhum contrato encontrado.</p>}

      {dados && dados.itens.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data de assinatura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link className="font-medium underline-offset-4 hover:underline" to={`/contratos/${c.id}`}>
                    {c.titulo}
                  </Link>
                </TableCell>
                <TableCell>{c.cliente.nomeCompleto}</TableCell>
                <TableCell>{formatarData(c.dataAssinatura)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {dados && totalPaginas > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Anterior"
                aria-label="Página anterior"
                aria-disabled={dados.pagina <= 1}
                onClick={irPara(dados.pagina - 1)}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm">
                Página {dados.pagina} de {totalPaginas}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Próxima"
                aria-label="Próxima página"
                aria-disabled={dados.pagina >= totalPaginas}
                onClick={irPara(dados.pagina + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  )
}
