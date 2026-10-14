import { useEffect, useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router'
import { useAtrasado } from '@/lib/use-atrasado'
import { api, ErroApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Cliente, Pagina } from '@/features/clientes/tipos'
import type { ContratoDetalhe } from './tipos'

const LIMITE_MB = 50
const MENSAGEM_GENERICA = 'Não foi possível salvar o contrato. Tente novamente.'
const MENSAGEM_413 = `O arquivo é muito grande. O limite é de ${LIMITE_MB} MB.`
const ATRASO_BUSCA_MS = 300

type DadosContrato = {
  titulo: string
  dataAssinatura: string
  clienteId: string
  arquivo: FileList | undefined
}

type ClienteOpcao = { id: string; nomeCompleto: string }

function criarEsquema(edicao: boolean) {
  return z.object({
    titulo: z.string().trim().min(1, 'Título é obrigatório.'),
    dataAssinatura: z.string().min(1, 'Data de assinatura é obrigatória.'),
    clienteId: z.string().min(1, 'Cliente é obrigatório.'),
    arquivo: z.custom<FileList | undefined>().refine((f) => edicao || (!!f && f.length > 0), 'Arquivo PDF é obrigatório.'),
  })
}

const CAMPOS_CONHECIDOS = ['titulo', 'dataAssinatura', 'clienteId', 'arquivo']

function Formulario({ id, inicial }: { id?: string; inicial: ContratoDetalhe | null }) {
  const navegar = useNavigate()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const buscaAtrasada = useAtrasado(busca.trim(), ATRASO_BUSCA_MS)
  const [encontrados, setEncontrados] = useState<ClienteOpcao[]>([])
  const [erroClientes, setErroClientes] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosContrato>({
    resolver: zodResolver(criarEsquema(!!id)),
    defaultValues: {
      titulo: inicial?.titulo ?? '',
      dataAssinatura: inicial?.dataAssinatura.slice(0, 10) ?? '',
      clienteId: inicial?.cliente.id ?? '',
    },
  })

  useEffect(() => {
    let ativo = true
    const params = new URLSearchParams()
    if (buscaAtrasada) params.set('nome', buscaAtrasada)
    params.set('pagina', '1')
    api<Pagina<Cliente>>(`/api/clientes?${params}`)
      .then((r) => {
        if (!ativo) return
        setEncontrados(r.itens.map((c) => ({ id: c.id, nomeCompleto: c.nomeCompleto })))
        setErroClientes(null)
      })
      .catch((e) => {
        if (ativo) setErroClientes(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar os clientes.')
      })
    return () => {
      ativo = false
    }
  }, [buscaAtrasada])

  // O cliente atual do contrato continua como opção mesmo fora do resultado da busca.
  const opcoes = [...encontrados]
  const atual = inicial?.cliente
  if (atual && !opcoes.some((c) => c.id === atual.id)) opcoes.unshift(atual)

  async function enviar(dados: DadosContrato) {
    setErroGeral(null)
    const corpo = new FormData()
    corpo.append('titulo', dados.titulo.trim())
    corpo.append('dataAssinatura', dados.dataAssinatura)
    corpo.append('clienteId', dados.clienteId)
    if (dados.arquivo && dados.arquivo.length > 0) corpo.append('arquivo', dados.arquivo[0])
    try {
      const salvo = await api<ContratoDetalhe>(id ? `/api/contratos/${id}` : '/api/contratos', {
        metodo: id ? 'PUT' : 'POST',
        corpo,
      })
      navegar(`/contratos/${salvo.id}`)
    } catch (erro) {
      if (!(erro instanceof ErroApi)) {
        setErroGeral(MENSAGEM_GENERICA)
        return
      }
      if (erro.status === 413 || erro.codigo === 'ARQUIVO_MUITO_GRANDE') {
        setErroGeral(MENSAGEM_413)
        return
      }
      const conhecidos = (erro.campos ?? []).filter((c) => CAMPOS_CONHECIDOS.includes(c.campo))
      conhecidos.forEach((c) => setError(c.campo as Path<DadosContrato>, { message: c.mensagem }))
      if (erro.codigo === 'ARQUIVO_INVALIDO') {
        setError('arquivo', { message: erro.mensagem })
      } else if (conhecidos.length === 0) {
        setErroGeral(erro.mensagem || MENSAGEM_GENERICA)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.titulo}>
          <FieldLabel htmlFor="titulo">Título</FieldLabel>
          <Input id="titulo" autoComplete="off" aria-invalid={!!errors.titulo} {...register('titulo')} />
          <FieldError errors={[errors.titulo]} />
        </Field>
        <Field data-invalid={!!errors.dataAssinatura}>
          <FieldLabel htmlFor="dataAssinatura">Data de assinatura</FieldLabel>
          <Input id="dataAssinatura" type="date" aria-invalid={!!errors.dataAssinatura} {...register('dataAssinatura')} />
          <FieldError errors={[errors.dataAssinatura]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="busca-cliente">Buscar cliente</FieldLabel>
          <Input
            id="busca-cliente"
            autoComplete="off"
            placeholder="Digite parte do nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
        <Field data-invalid={!!errors.clienteId}>
          <FieldLabel htmlFor="clienteId">Cliente</FieldLabel>
          <select
            id="clienteId"
            aria-invalid={!!errors.clienteId}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
            {...register('clienteId')}
          >
            <option value="">Selecione</option>
            {opcoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeCompleto}
              </option>
            ))}
          </select>
          {erroClientes && <FieldError>{erroClientes}</FieldError>}
          <FieldError errors={[errors.clienteId]} />
        </Field>
        <Field data-invalid={!!errors.arquivo}>
          <FieldLabel htmlFor="arquivo">Arquivo PDF</FieldLabel>
          <Input
            id="arquivo"
            type="file"
            accept="application/pdf"
            aria-invalid={!!errors.arquivo}
            {...register('arquivo')}
          />
          <FieldDescription>
            Somente PDF, até {LIMITE_MB} MB.
            {id && ' Deixe em branco para manter o arquivo atual; um novo arquivo descarta a análise existente.'}
          </FieldDescription>
          <FieldError errors={[errors.arquivo as { message?: string } | undefined]} />
        </Field>
        {erroGeral && <FieldError>{erroGeral}</FieldError>}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
          <Button asChild variant="outline">
            <Link to={id ? `/contratos/${id}` : '/contratos'}>Cancelar</Link>
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

/** Serve para criar (/contratos/novo) e editar (/contratos/:id/editar). */
export function FormContrato() {
  const { id } = useParams()
  // key: ao trocar de rota o estado interno nasce do zero.
  return <FormContratoRota key={id ?? 'novo'} />
}

function FormContratoRota() {
  const { id } = useParams()
  const [inicial, setInicial] = useState<ContratoDetalhe | null>(null)
  const [pronto, setPronto] = useState(!id)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let ativo = true
    api<ContratoDetalhe>(`/api/contratos/${id}`)
      .then((c) => {
        if (!ativo) return
        setInicial(c)
        setPronto(true)
      })
      .catch((e) => {
        if (ativo) setErroCarga(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar o contrato.')
      })
    return () => {
      ativo = false
    }
  }, [id])

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{id ? 'Editar contrato' : 'Novo contrato'}</h1>
      {erroCarga && <FieldError>{erroCarga}</FieldError>}
      {pronto && <Formulario key={id ?? 'novo'} id={id} inicial={inicial} />}
    </section>
  )
}
