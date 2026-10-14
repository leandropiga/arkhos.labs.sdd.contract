import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const TAMANHO_CHAVE = 64;
const TAMANHO_SAL = 16;

function derivar(senha: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, sal, TAMANHO_CHAVE, (erro, chave) => (erro ? reject(erro) : resolve(chave)));
  });
}

/** Gera um hash autodescritivo: `scrypt$<salHex>$<chaveHex>`. */
export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(TAMANHO_SAL);
  const chave = await derivar(senha, sal);
  return `scrypt$${sal.toString('hex')}$${chave.toString('hex')}`;
}

/** Confere a senha contra o hash. Hash malformado devolve false, nunca lança. */
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  const partes = hash.split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt') return false;
  const sal = Buffer.from(partes[1]!, 'hex');
  const esperada = Buffer.from(partes[2]!, 'hex');
  if (sal.length === 0 || esperada.length !== TAMANHO_CHAVE) return false;
  const obtida = await derivar(senha, sal);
  return timingSafeEqual(obtida, esperada);
}
