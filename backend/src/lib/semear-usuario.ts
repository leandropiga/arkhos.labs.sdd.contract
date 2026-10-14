import type { PrismaClient, Usuario } from '../generated/prisma/client.js';
import { gerarHash } from './senha.js';

/**
 * Cria o usuário, ou atualiza se já existir (upsert por `usuario`, sempre em minúsculas).
 * No update também zera tentativasFalhas/bloqueadoAte: rodar o seed de novo serve para destravar o admin.
 */
export async function semearUsuario(
  prisma: PrismaClient,
  { usuario, senha }: { usuario: string; senha: string },
): Promise<Usuario> {
  const chave = usuario.toLowerCase();
  const senhaHash = await gerarHash(senha);
  return prisma.usuario.upsert({
    where: { usuario: chave },
    create: { usuario: chave, senhaHash, nome: chave },
    update: { senhaHash, tentativasFalhas: 0, bloqueadoAte: null },
  });
}
