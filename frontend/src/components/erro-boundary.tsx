import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type Props = { children: ReactNode }
type Estado = { falhou: boolean }

export class ErroBoundary extends Component<Props, Estado> {
  state: Estado = { falhou: false }

  static getDerivedStateFromError(): Estado {
    return { falhou: true }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Falha ao renderizar a tela:', erro, info.componentStack)
  }

  render() {
    if (!this.state.falhou) return this.props.children
    return (
      <div role="alert" className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm">
          Não foi possível carregar esta tela. Verifique sua conexão e tente
          novamente.
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Recarregar a página
        </Button>
      </div>
    )
  }
}
