import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, ErroApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { type Analise, type Gravidade } from './tipos'

const ROTULO_GRAVIDADE: Record<Gravidade, string> = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' }
const VARIANTE_GRAVIDADE: Record<Gravidade, 'destructive' | 'secondary' | 'outline'> = {
  ALTA: 'destructive',
  MEDIA: 'secondary',
  BAIXA: 'outline',
}

const MENSAGEM_IA_INDISPONIVEL = 'O serviço de análise está temporariamente indisponível. Tente novamente em instantes.'

type Props = {
  contratoId: string
  analiseInicial: Analise | null
}

export function PainelAnalise({ contratoId, analiseInicial }: Props) {
  const [analise, setAnalise] = useState<Analise | null>(analiseInicial)
  const [enviando, setEnviando] = useState(false)
  const [erroPdf, setErroPdf] = useState<string | null>(null)

  // Se já houver análise em andamento (outra aba), a API responde 409 e o toast avisa;
  // o botão não fica travado para sempre caso a trava expire (60 s no backend).

  async function solicitar() {
    if (enviando) return
    setEnviando(true)
    setErroPdf(null)
    try {
      const nova = await api<Analise>(`/api/contratos/${contratoId}/analise`, { metodo: 'POST' })
      setAnalise(nova)
    } catch (e) {
      if (e instanceof ErroApi && e.status === 422) {
        setErroPdf(e.mensagem)
      } else {
        // 503, 409 e demais falhas: toast; a análise anterior continua na tela.
        const mensagem =
          e instanceof ErroApi
            ? e.status === 503 || e.codigo === 'IA_INDISPONIVEL'
              ? MENSAGEM_IA_INDISPONIVEL
              : e.mensagem
            : 'Não foi possível solicitar a análise.'
        toast.error(mensagem)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Análise de riscos</CardTitle>
        <Button onClick={solicitar} disabled={enviando}>
          {enviando ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> Analisando...
            </>
          ) : (
            'Solicitar Análise de PDF'
          )}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {erroPdf && <FieldError>{erroPdf}</FieldError>}
        {!analise ? (
          <p className="text-muted-foreground">Este contrato ainda não foi analisado.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Gerada em {new Date(analise.geradaEm).toLocaleDateString('pt-BR')}</p>
            <p>{analise.resumo}</p>
            <div>
              <h3 className="mb-2 font-medium">Riscos</h3>
              {analise.riscos.length === 0 ? (
                <p className="text-muted-foreground">Nenhum risco identificado.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {analise.riscos.map((r, i) => (
                    <li key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.titulo}</span>
                        <Badge variant={VARIANTE_GRAVIDADE[r.gravidade]}>{ROTULO_GRAVIDADE[r.gravidade]}</Badge>
                      </div>
                      <p className="text-sm">{r.descricao}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 font-medium">Cláusulas críticas</h3>
              {analise.clausulasCriticas.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma cláusula crítica identificada.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {analise.clausulasCriticas.map((c, i) => (
                    <li key={i} className="flex flex-col gap-1">
                      <span className="font-medium">{c.clausula}</span>
                      <p className="text-sm">{c.motivo}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
