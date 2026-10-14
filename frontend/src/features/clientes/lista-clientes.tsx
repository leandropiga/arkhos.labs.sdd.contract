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
import { formatarCpf, type Cliente, type Pagina } from './tipos'

const ATRASO_FILTRO_MS = 300

export function ListaClientes() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [numeroPagina, setNumeroPagina] = useState(1)
  const [dados, setDados] = useState<Pagina<Cliente> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const nomeBusca = useAtrasado(nome.trim(), ATRASO_FILTRO_MS)
  const cpfBusca = useAtrasado(cpf.trim(), ATRASO_FILTRO_MS)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    const params = new URLSearchParams()
    if (nomeBusca) params.set('nome', nomeBusca)
    if (cpfBusca) params.set('cpf', cpfBusca)
    params.set('pagina', String(numeroPagina))
    api<Pagina<Cliente>>(`/api/clientes?${params}`)
      .then((resultado) => {
        if (!ativo) return
        setDados(resultado)
        setErro(null)
      })
      .catch((e) => {
        if (!ativo) return
        setDados(null)
        setErro(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar os clientes.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [nomeBusca, cpfBusca, numeroPagina])

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
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button asChild>
          <Link to="/clientes/novo">Novo cliente</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="filtro-nome">Nome</FieldLabel>
          <Input
            id="filtro-nome"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              setNumeroPagina(1)
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filtro-cpf">CPF</FieldLabel>
          <Input
            id="filtro-cpf"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => {
              setCpf(e.target.value)
              setNumeroPagina(1)
            }}
          />
        </Field>
      </div>

      {erro && <FieldError>{erro}</FieldError>}

      {carregando && <p role="status">Carregando...</p>}

      {dados && dados.itens.length === 0 && <p>Nenhum cliente encontrado.</p>}

      {dados && dados.itens.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Contratos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.itens.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link className="font-medium underline-offset-4 hover:underline" to={`/clientes/${c.id}`}>
                    {c.nomeCompleto}
                  </Link>
                </TableCell>
                <TableCell>{formatarCpf(c.cpf)}</TableCell>
                <TableCell>{c.cidade}</TableCell>
                <TableCell>{c.uf}</TableCell>
                <TableCell>{c.totalContratos}</TableCell>
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
