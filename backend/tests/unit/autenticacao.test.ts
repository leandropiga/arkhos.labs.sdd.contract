import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assinarToken } from '../../src/lib/jwt.js';
import { ErroApp } from '../../src/http/erros.js';

// Interface fixada por este teste (a T022 implementa exatamente isto):
//   src/http/autenticacao.ts -> exigirSessao(req, res, next): Promise<void>
//     lê o cookie `sessao`, verifica o JWT, carrega o usuário e põe em req.usuario
//     (Perfil: { id, usuario, nome, fotoUrl, telefone }, sem senhaHash);
//     qualquer falha chama next(ErroApp 401 NAO_AUTENTICADO).
// O banco é mockado (vi.mock de src/lib/prisma.js): aqui só se testa a lógica do middleware.
// O caminho feliz com banco de verdade é coberto por tests/http/sessao.test.ts (T015/T023).

const SEGREDO = 'segredo-de-teste-com-pelo-menos-32-caracteres';
const buscarUsuario = vi.fn();

vi.mock('../../src/lib/prisma.js', () => ({ prisma: { usuario: { findUnique: buscarUsuario } } }));
vi.mock('../../src/config/env.js', () => ({ env: () => ({ JWT_SECRET: SEGREDO }) }));

const { exigirSessao } = await import('../../src/http/autenticacao.js');

async function executar(cookie?: string) {
  const req = { headers: cookie === undefined ? {} : { cookie } } as unknown as Request;
  const next = vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
  await exigirSessao(req, {} as Response, next);
  return { req, next, erro: (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as unknown };
}

function esperar401(erro: unknown) {
  expect(erro).toBeInstanceOf(ErroApp);
  expect(erro).toMatchObject({ status: 401, codigo: 'NAO_AUTENTICADO' });
}

describe('exigirSessao', () => {
  beforeEach(() => {
    buscarUsuario.mockReset();
  });

  it('sem cookie chama next com 401 NAO_AUTENTICADO', async () => {
    const { erro } = await executar();
    esperar401(erro);
    expect(buscarUsuario).not.toHaveBeenCalled();
  });

  it('com token inválido chama next com 401 NAO_AUTENTICADO', async () => {
    const { erro } = await executar('sessao=token.invalido.qualquer');
    esperar401(erro);
    expect(buscarUsuario).not.toHaveBeenCalled();
  });

  it('com token válido de usuário que não existe mais chama next com 401', async () => {
    buscarUsuario.mockResolvedValue(null);
    const token = await assinarToken('id-fantasma', SEGREDO);
    const { erro } = await executar(`sessao=${token}`);
    esperar401(erro);
  });

  it('com token válido põe o Perfil (sem senhaHash) em req.usuario e segue', async () => {
    const perfil = { id: 'u1', usuario: 'ana', nome: 'Ana', fotoUrl: null, telefone: null };
    buscarUsuario.mockResolvedValue(perfil);
    const token = await assinarToken('u1', SEGREDO);

    const { req, next } = await executar(`sessao=${token}`);

    expect(next).toHaveBeenCalledWith();
    expect(req.usuario).toEqual(perfil);
    const consulta = buscarUsuario.mock.calls[0]?.[0] as { where: unknown; select: Record<string, boolean> };
    expect(consulta.where).toEqual({ id: 'u1' });
    expect(consulta.select).not.toHaveProperty('senhaHash');
  });

  it('erro do banco vai para next (não derruba o processo)', async () => {
    buscarUsuario.mockRejectedValue(new Error('banco fora'));
    const token = await assinarToken('u1', SEGREDO);
    const { erro } = await executar(`sessao=${token}`);
    expect(erro).toBeInstanceOf(Error);
    expect(erro).not.toBeInstanceOf(ErroApp);
  });
});
