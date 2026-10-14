import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { verificarSenha } from '../../src/lib/senha.js';
import { semearUsuario } from '../../src/lib/semear-usuario.js';

describe('semearUsuario', () => {
  it('cria o usuário em minúsculas, com senha em hash e nome igual ao usuário', async () => {
    const criado = await semearUsuario(prisma, { usuario: 'Admin', senha: 'senha-segura-1' });

    expect(criado.usuario).toBe('admin');
    expect(criado.nome).toBe('admin');
    expect(criado.senhaHash).not.toContain('senha-segura-1');
    expect(await verificarSenha('senha-segura-1', criado.senhaHash)).toBe(true);
  });

  it('segunda execução com outra senha atualiza sem duplicar e destrava a conta', async () => {
    await semearUsuario(prisma, { usuario: 'admin', senha: 'senha-antiga-1' });
    await prisma.usuario.update({
      where: { usuario: 'admin' },
      data: { tentativasFalhas: 5, bloqueadoAte: new Date(Date.now() + 60_000) },
    });

    await semearUsuario(prisma, { usuario: 'ADMIN', senha: 'senha-nova-2' });

    const todos = await prisma.usuario.findMany();
    expect(todos).toHaveLength(1);
    expect(await verificarSenha('senha-nova-2', todos[0]!.senhaHash)).toBe(true);
    expect(await verificarSenha('senha-antiga-1', todos[0]!.senhaHash)).toBe(false);
    expect(todos[0]!.tentativasFalhas).toBe(0);
    expect(todos[0]!.bloqueadoAte).toBeNull();
  });
});
