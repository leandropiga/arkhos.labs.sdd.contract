import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { api, ErroApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const esquema = z.object({
  usuario: z.string().trim().min(1, 'Usuário é obrigatório.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
})

type DadosLogin = z.infer<typeof esquema>

const MENSAGEM_CREDENCIAIS = 'Usuário ou senha inválidos.'
const MENSAGEM_GENERICA = 'Não foi possível entrar. Tente novamente.'

export function TelaLogin() {
  const navegar = useNavigate()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosLogin>({
    resolver: zodResolver(esquema),
    defaultValues: { usuario: '', senha: '' },
  })

  async function enviar(dados: DadosLogin) {
    setErroGeral(null)
    try {
      await api('/api/auth/login', { metodo: 'POST', corpo: dados })
      navegar('/')
    } catch (erro) {
      if (erro instanceof ErroApi) {
        setErroGeral(erro.codigo === 'CREDENCIAIS_INVALIDAS' ? MENSAGEM_CREDENCIAIS : erro.mensagem || MENSAGEM_GENERICA)
      } else {
        setErroGeral(MENSAGEM_GENERICA)
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(enviar)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.usuario}>
                <FieldLabel htmlFor="usuario">Usuário</FieldLabel>
                <Input
                  id="usuario"
                  autoComplete="username"
                  aria-invalid={!!errors.usuario}
                  {...register('usuario')}
                />
                <FieldError errors={[errors.usuario]} />
              </Field>
              <Field data-invalid={!!errors.senha}>
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.senha}
                  {...register('senha')}
                />
                <FieldError errors={[errors.senha]} />
              </Field>
              {erroGeral && <FieldError>{erroGeral}</FieldError>}
              <Button type="submit" disabled={isSubmitting}>
                Entrar
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
