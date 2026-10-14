import { SignJWT, jwtVerify } from 'jose';

const chave = (segredo: string) => new TextEncoder().encode(segredo);

/** Assina um JWT HS256 que expira em 8 horas, com o id do usuário no claim `sub`. */
export function assinarToken(usuarioId: string, segredo: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(chave(segredo));
}

/** Devolve o id do usuário, ou null se o token for inválido, adulterado ou expirado. */
export async function verificarToken(token: string, segredo: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, chave(segredo), { algorithms: ['HS256'] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
