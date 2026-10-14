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
import { PainelAnalise } from './painel-analise'
import { formatarData, type ContratoDetalhe } from './tipos'

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DetalheContrato() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [contrato, setContrato] = useState<ContratoDetalhe | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const excluindoRef = useRef(false) // trava síncrona contra cliques repetidos

  useEffect(() => {
    let ativo = true
    setContrato(null)
    setErro(null)
    setErroExclusao(null)
    api<ContratoDetalhe>(`/api/contratos/${id}`)
      .then((c) => {
        if (ativo) setContrato(c)
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar o contrato.')
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
      await api(`/api/contratos/${id}`, { metodo: 'DELETE' })
      navegar('/contratos')
    } catch (e) {
      setErroExclusao(e instanceof ErroApi ? e.mensagem : 'Não foi possível excluir o contrato.')
    } finally {
      excluindoRef.current = false
      setExcluindo(false)
    }
  }

  if (erro) return <FieldError>{erro}</FieldError>
  if (!contrato) return <p>Carregando...</p>

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{contrato.titulo}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/contratos/${contrato.id}/editar`}>Editar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={excluindo}>
                Excluir contrato
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir este contrato?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O PDF e a análise do contrato também serão apagados.
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

      <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
        <dt className="font-medium">Data de assinatura</dt>
        <dd>{formatarData(contrato.dataAssinatura)}</dd>
        <dt className="font-medium">Cliente</dt>
        <dd>
          <Link className="underline-offset-4 hover:underline" to={`/clientes/${contrato.cliente.id}`}>
            {contrato.cliente.nomeCompleto}
          </Link>
        </dd>
        <dt className="font-medium">Arquivo</dt>
        <dd>
          {contrato.arquivoNomeOriginal} ({formatarTamanho(contrato.arquivoTamanhoBytes)})
        </dd>
      </dl>

      <div>
        <Button asChild>
          <a href={`/api/contratos/${contrato.id}/arquivo`} target="_blank" rel="noopener noreferrer">
            Abrir PDF
          </a>
        </Button>
      </div>

      <PainelAnalise contratoId={contrato.id} analiseInicial={contrato.analise} />
    </section>
  )
}
