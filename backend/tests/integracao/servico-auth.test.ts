import { beforeEach, describe, expect, it } from 'vitest';
import { ErroApp } from '../../src/http/erros.js';
import { prisma } from '../../src/lib/prisma.js';
import { semearUsuario } from '../../src/lib/semear-usuario.js';
import { entrar } from '../../src/modules/auth/servico-auth.js';

const USUARIO = 'servico';
const SENHA = 'senha-correta-123';
const ERRADA = 'senha-errada-999';
const QUINZE_MINUTOS = 15 * 60 * 1000;
const TOLERANCIA = 30 * 1000;

beforeEach(async () => {
  await semearUsuario(prisma, { usuario: USUARIO, senha: SENHA });
});

const estado = () =>
  prisma.usuario.findUniqueOrThrow({
    where: { usuario: USUARIO },
    select: { tentativasFalhas: true, bloqueadoAte: true },
  });

async function erroDe(promessa: Promise<unknown>): Promise<ErroApp> {
  try {
    await promessa;
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroApp);
    return erro as ErroApp;
  }
  throw new Error('era esperado um erro');
}

async function falhar(vezes: number) {
  for (let i = 0; i < vezes; i++) {
    const erro = await erroDe(entrar(USUARIO, ERRADA));
    expect(erro.status).toBe(401);
  }
}

describe('entrar (serviço de login)', () => {
  it('sucesso devolve o Perfil sem senhaHash, aceita usuário em maiúsculas e zera os contadores', async () => {
    await prisma.usuario.update({ where: { usuario: USUARIO }, data: { tentativasFalhas: 3 } });

    const perfil = await entrar('SERVICO', SENHA);

    expect(Object.keys(perfil).sort()).toEqual(['fotoUrl', 'id', 'nome', 'telefone', 'usuario']);
    expect(perfil.usuario).toBe(USUARIO);
    expect(await estado()).toEqual({ tentativasFalhas: 0, bloqueadoAte: null });
  });

  it('senha errada lança 401 CREDENCIAIS_INVALIDAS e incrementa tentativasFalhas', async () => {
    const erro = await erroDe(entrar(USUARIO, ERRADA));

    expect(erro.status).toBe(401);
    expect(erro.codigo).toBe('CREDENCIAIS_INVALIDAS');
    expect((await estado()).tentativasFalhas).toBe(1);
  });

  it('usuário inexistente lança o mesmo 401, com a mesma mensagem', async () => {
    const errada = await erroDe(entrar(USUARIO, ERRADA));
    const inexistente = await erroDe(entrar('ninguem', ERRADA));

    expect(inexistente.status).toBe(401);
    expect(inexistente.codigo).toBe('CREDENCIAIS_INVALIDAS');
    expect(inexistente.message).toBe(errada.message);
  });

  it('a 5ª falha bloqueia por 15 minutos (e ainda responde 401)', async () => {
    await falhar(5);

    const antes = Date.now();
    const noBanco = await estado();
    expect(noBanco.tentativasFalhas).toBe(5);
    const diferenca = noBanco.bloqueadoAte!.getTime() - antes;
    expect(diferenca).toBeGreaterThan(QUINZE_MINUTOS - TOLERANCIA);
    expect(diferenca).toBeLessThanOrEqual(QUINZE_MINUTOS + TOLERANCIA);
  });

  it('bloqueado lança 429 LOGIN_BLOQUEADO, mesmo com a senha certa, sem alterar os contadores', async () => {
    await falhar(5);
    const antes = await estado();

    const certa = await erroDe(entrar(USUARIO, SENHA));
    const errada = await erroDe(entrar(USUARIO, ERRADA));

    expect(certa.status).toBe(429);
    expect(certa.codigo).toBe('LOGIN_BLOQUEADO');
    expect(errada.status).toBe(429);
    expect(await estado()).toEqual(antes);
  });

  it('um sucesso antes da 5ª falha zera a contagem', async () => {
    await falhar(4);
    await entrar(USUARIO, SENHA);
    expect(await estado()).toEqual({ tentativasFalhas: 0, bloqueadoAte: null });
  });

  it('bloqueio expirado + senha certa entra e zera tudo', async () => {
    await prisma.usuario.update({
      where: { usuario: USUARIO },
      data: { tentativasFalhas: 5, bloqueadoAte: new Date(Date.now() - 60_000) },
    });

    await entrar(USUARIO, SENHA);

    expect(await estado()).toEqual({ tentativasFalhas: 0, bloqueadoAte: null });
  });

  it('bloqueio expirado + senha errada conta 1 falha (não 6), sem 429', async () => {
    await prisma.usuario.update({
      where: { usuario: USUARIO },
      data: { tentativasFalhas: 5, bloqueadoAte: new Date(Date.now() - 60_000) },
    });

    const erro = await erroDe(entrar(USUARIO, ERRADA));

    expect(erro.status).toBe(401);
    expect(await estado()).toEqual({ tentativasFalhas: 1, bloqueadoAte: null });

    // E 4 novas falhas (total 5 desde o desbloqueio) bloqueiam de novo.
    await falhar(4);
    expect((await estado()).bloqueadoAte).not.toBeNull();
  });
});
