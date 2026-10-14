/** Perfil do usuário logado, como a API devolve (contracts/api.md). O id é um UUID. */
export type Perfil = {
  id: string
  usuario: string
  nome: string
  fotoUrl: string | null
  telefone: string | null
}
