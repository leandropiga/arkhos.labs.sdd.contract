import { useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ErroApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useSessao } from '@/features/auth/rota-protegida'
import type { Perfil } from '@/features/auth/tipos'

const MSG_FOTO = 'URL da foto inválida. Use um endereço http ou https.'
const MSG_TELEFONE = 'Telefone inválido. Informe DDD e número (10 ou 11 dígitos).'

function ehUrlHttp(valor: string): boolean {
  try {
    const { protocol } = new URL(valor)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(120, 'O nome deve ter no máximo 120 caracteres.'),
  fotoUrl: z.string().trim().refine((v) => v === '' || ehUrlHttp(v), MSG_FOTO),
  telefone: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^[\d\s()\-.]+$/.test(v) && /^\d{10,11}$/.test(v.replace(/\D/g, ''))), MSG_TELEFONE),
})

type DadosPerfil = z.infer<typeof esquema>

const MENSAGEM_GENERICA = 'Não foi possível salvar o perfil. Tente novamente.'

export function TelaPerfil() {
  const { usuario, atualizarUsuario } = useSessao()
  const [salvo, setSalvo] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DadosPerfil>({
    resolver: zodResolver(esquema),
    defaultValues: { nome: usuario.nome, fotoUrl: usuario.fotoUrl ?? '', telefone: usuario.telefone ?? '' },
  })

  async function enviar(dados: DadosPerfil) {
    setSalvo(false)
    setErroGeral(null)
    try {
      // PUT substitui o perfil inteiro: os três campos vão sempre (vazio vira null).
      const atualizado = await api<Perfil>('/api/perfil', {
        metodo: 'PUT',
        corpo: { nome: dados.nome, fotoUrl: dados.fotoUrl || null, telefone: dados.telefone || null },
      })
      atualizarUsuario(atualizado)
      reset({ nome: atualizado.nome, fotoUrl: atualizado.fotoUrl ?? '', telefone: atualizado.telefone ?? '' })
      setSalvo(true)
    } catch (erro) {
      if (!(erro instanceof ErroApi)) {
        setErroGeral(MENSAGEM_GENERICA)
        return
      }
      const conhecidos = (erro.campos ?? []).filter((c) => c.campo in esquema.shape)
      conhecidos.forEach((c) => setError(c.campo as Path<DadosPerfil>, { message: c.mensagem }))
      if (conhecidos.length === 0) setErroGeral(erro.mensagem || MENSAGEM_GENERICA)
    }
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <form onSubmit={handleSubmit(enviar)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.nome}>
            <FieldLabel htmlFor="nome">Nome</FieldLabel>
            <Input id="nome" autoComplete="name" aria-invalid={!!errors.nome} {...register('nome')} />
            <FieldError errors={[errors.nome]} />
          </Field>
          <Field data-invalid={!!errors.fotoUrl}>
            <FieldLabel htmlFor="fotoUrl">URL da foto</FieldLabel>
            <Input id="fotoUrl" inputMode="url" aria-invalid={!!errors.fotoUrl} {...register('fotoUrl')} />
            <FieldError errors={[errors.fotoUrl]} />
          </Field>
          <Field data-invalid={!!errors.telefone}>
            <FieldLabel htmlFor="telefone">Telefone</FieldLabel>
            <Input id="telefone" type="tel" autoComplete="tel" aria-invalid={!!errors.telefone} {...register('telefone')} />
            <FieldError errors={[errors.telefone]} />
          </Field>
          {erroGeral && <FieldError>{erroGeral}</FieldError>}
          {salvo && (
            <p role="status" className="text-sm text-muted-foreground">
              Perfil salvo.
            </p>
          )}
          <div>
            <Button type="submit" disabled={isSubmitting}>
              Salvar
            </Button>
          </div>
        </FieldGroup>
      </form>
    </section>
  )
}
