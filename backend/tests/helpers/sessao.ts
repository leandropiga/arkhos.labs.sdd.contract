import { randomUUID } from 'node:crypto';
import { env } from '../../src/config/env.js';
import type { Perfil } from '../../src/http/autenticacao.js';
import { assinarToken } from '../../src/lib/jwt.js';
import { prisma } from '../../src/lib/prisma.js';
import { gerarHash } from '../../src/lib/senha.js';

/**
 * Cria um usuário no banco de teste e devolve o cabeçalho Cookie já válido para o supertest.
 * Não passa pela rota de login: assina o JWT direto.
 */
export async function criarUsuarioELogar(): Promise<{ cookie: string; usuario: Perfil }> {
  const criado = await prisma.usuario.create({
    data: {
      usuario: `teste-${randomUUID().slice(0, 8)}`,
      senhaHash: await gerarHash('senha-de-teste-123'),
      nome: 'Usuário de Teste',
      fotoUrl: null,
      telefone: null,
    },
  });
  const token = await assinarToken(criado.id, env().JWT_SECRET);
  const usuario: Perfil = {
    id: criado.id,
    usuario: criado.usuario,
    nome: criado.nome,
    fotoUrl: criado.fotoUrl,
    telefone: criado.telefone,
  };
  return { cookie: `sessao=${token}`, usuario };
}
