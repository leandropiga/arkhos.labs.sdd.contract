import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, ErroApi } from '@/lib/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatarCpf, type ClienteDetalhe } from './tipos'

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function DetalheCliente() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [cliente, setCliente] = useState<ClienteDetalhe | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const excluindoRef = useRef(false) // trava síncrona contra cliques repetidos

  useEffect(() => {
    let ativo = true
    setCliente(null)
    setErro(null)
    setErroExclusao(null)
    api<ClienteDetalhe>(`/api/clientes/${id}`)
      .then((c) => {
        if (ativo) setCliente(c)
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar o cliente.')
      })
    return () => {
      ativo = false
    }
  }, [id])

  async function excluir() {
    if (excluindoRef.current) return
    excluindoRef.current = true
    setExcluindo(true)
    setErroExclusao(null)
    try {
      await api(`/api/clientes/${id}`, { metodo: 'DELETE' })
      navegar('/clientes')
    } catch (e) {
      setErroExclusao(e instanceof ErroApi ? e.mensagem : 'Não foi possível excluir o cliente.')
    } finally {
      excluindoRef.current = false
      setExcluindo(false)
    }
  }

  if (erro) return <FieldError>{erro}</FieldError>
  if (!cliente) return <p>Carregando...</p>

  const dados: [string, string][] = [
    ['CPF', formatarCpf(cliente.cpf)],
    ['RG', cliente.rg],
    ['Telefone', cliente.telefone],
    ['Endereço', `${cliente.logradouro}, ${cliente.numero} - CEP ${cliente.cep} - ${cliente.cidade}/${cliente.uf}`],
  ]

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{cliente.nomeCompleto}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/clientes/${cliente.id}/editar`}>Editar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={excluindo}>
                Excluir cliente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir este cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Clientes com contratos não podem ser excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={excluir}>Confirmar exclusão</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {erroExclusao && <FieldError>{erroExclusao}</FieldError>}

      <dl className="grid gap-2 sm:grid-cols-[8rem_1fr]">
        {dados.map(([rotulo, valor]) => (
          <div key={rotulo} className="contents">
            <dt className="font-medium">{rotulo}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Contratos</h2>
        {cliente.contratos.length === 0 ? (
          <p>Este cliente ainda não tem contratos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data de assinatura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cliente.contratos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link className="font-medium underline-offset-4 hover:underline" to={`/contratos/${c.id}`}>
                      {c.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>{formatarData(c.dataAssinatura)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  )
}
