import { useEffect, useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router'
import { api, ErroApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { UFS, type Cliente, type ClienteDetalhe } from './tipos'

const esquema = z.object({
  nomeCompleto: z.string().trim().min(1, 'Nome completo é obrigatório.'),
  telefone: z.string().trim().min(1, 'Telefone é obrigatório.'),
  cpf: z.string().trim().min(1, 'CPF é obrigatório.'),
  rg: z.string().trim().min(1, 'RG é obrigatório.'),
  logradouro: z.string().trim().min(1, 'Logradouro é obrigatório.'),
  numero: z.string().trim().min(1, 'Número é obrigatório.'),
  cep: z.string().trim().min(1, 'CEP é obrigatório.'),
  cidade: z.string().trim().min(1, 'Cidade é obrigatória.'),
  uf: z.string().min(1, 'UF é obrigatória.'),
})

type DadosCliente = z.infer<typeof esquema>

const VAZIO: DadosCliente = {
  nomeCompleto: '', telefone: '', cpf: '', rg: '', logradouro: '', numero: '', cep: '', cidade: '', uf: '',
}

const MENSAGEM_GENERICA = 'Não foi possível salvar o cliente. Tente novamente.'

const CAMPOS_DE_TEXTO: { nome: Exclude<keyof DadosCliente, 'uf'>; rotulo: string; autoComplete?: string }[] = [
  { nome: 'nomeCompleto', rotulo: 'Nome Completo', autoComplete: 'off' },
  { nome: 'telefone', rotulo: 'Telefone' },
  { nome: 'cpf', rotulo: 'CPF' },
  { nome: 'rg', rotulo: 'RG' },
  { nome: 'logradouro', rotulo: 'Logradouro' },
  { nome: 'numero', rotulo: 'Número' },
  { nome: 'cep', rotulo: 'CEP' },
  { nome: 'cidade', rotulo: 'Cidade' },
]

function Formulario({ id, inicial }: { id?: string; inicial: DadosCliente }) {
  const navegar = useNavigate()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosCliente>({ resolver: zodResolver(esquema), defaultValues: inicial })

  async function enviar(dados: DadosCliente) {
    setErroGeral(null)
    try {
      const salvo = await api<Cliente>(id ? `/api/clientes/${id}` : '/api/clientes', {
        metodo: id ? 'PUT' : 'POST',
        corpo: dados,
      })
      navegar(`/clientes/${salvo.id}`)
    } catch (erro) {
      if (!(erro instanceof ErroApi)) {
        setErroGeral(MENSAGEM_GENERICA)
        return
      }
      const conhecidos = (erro.campos ?? []).filter((c) => c.campo in esquema.shape)
      conhecidos.forEach((c) => setError(c.campo as Path<DadosCliente>, { message: c.mensagem }))
      if (erro.codigo === 'CPF_DUPLICADO') {
        setError('cpf', { message: erro.mensagem })
      } else if (conhecidos.length === 0) {
        setErroGeral(erro.mensagem || MENSAGEM_GENERICA)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <FieldGroup>
        {CAMPOS_DE_TEXTO.map(({ nome, rotulo, autoComplete }) => (
          <Field key={nome} data-invalid={!!errors[nome]}>
            <FieldLabel htmlFor={nome}>{rotulo}</FieldLabel>
            <Input id={nome} autoComplete={autoComplete} aria-invalid={!!errors[nome]} {...register(nome)} />
            <FieldError errors={[errors[nome]]} />
          </Field>
        ))}
        <Field data-invalid={!!errors.uf}>
          <FieldLabel htmlFor="uf">UF</FieldLabel>
          <select
            id="uf"
            aria-invalid={!!errors.uf}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
            {...register('uf')}
          >
            <option value="">Selecione</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
          <FieldError errors={[errors.uf]} />
        </Field>
        {erroGeral && <FieldError>{erroGeral}</FieldError>}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
          <Button asChild variant="outline">
            <Link to={id ? `/clientes/${id}` : '/clientes'}>Cancelar</Link>
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

/** Serve para criar (/clientes/novo) e editar (/clientes/:id/editar). */
export function FormCliente() {
  const { id } = useParams()
  const [inicial, setInicial] = useState<DadosCliente | null>(id ? null : VAZIO)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let ativo = true
    api<ClienteDetalhe>(`/api/clientes/${id}`)
      .then((c) => {
        if (!ativo) return
        setInicial({
          nomeCompleto: c.nomeCompleto, telefone: c.telefone, cpf: c.cpf, rg: c.rg, logradouro: c.logradouro,
          numero: c.numero, cep: c.cep, cidade: c.cidade, uf: c.uf,
        })
      })
      .catch((e) => {
        if (ativo) setErroCarga(e instanceof ErroApi ? e.mensagem : 'Não foi possível carregar o cliente.')
      })
    return () => {
      ativo = false
    }
  }, [id])

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{id ? 'Editar cliente' : 'Novo cliente'}</h1>
      {erroCarga && <FieldError>{erroCarga}</FieldError>}
      {inicial && <Formulario id={id} inicial={inicial} />}
    </section>
  )
}
