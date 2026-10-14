import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { semearUsuario } from '../src/lib/semear-usuario.js';

async function principal(): Promise<void> {
  const { SEED_USUARIO, SEED_SENHA } = env();
  if (!SEED_USUARIO || !SEED_SENHA) {
    throw new Error('Defina SEED_USUARIO e SEED_SENHA no backend/.env antes de rodar o seed.');
  }
  const criado = await semearUsuario(prisma, { usuario: SEED_USUARIO, senha: SEED_SENHA });
  console.log(`Usuário "${criado.usuario}" pronto.`);
}

principal()
  .catch((erro: unknown) => {
    console.error(erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
