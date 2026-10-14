import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { semearUsuario } from '../../src/lib/semear-usuario.js';

// FR-002 / História 1, cenário 5: 5 falhas seguidas bloqueiam o login por 15 minutos.
// Regras (data-model, transições): falha => tentativasFalhas += 1; ao chegar a 5 => bloqueadoAte =
// agora + 15 min; tentativa com bloqueadoAte > agora => 429 LOGIN_BLOQUEADO sem mexer nos contadores
// (mesmo com a senha certa); sucesso => tentativasFalhas = 0 e bloqueadoAte = null.

const USUARIO = 'bloqueio';
const SENHA = 'senha-correta-123';
const QUINZE_MINUTOS = 15 * 60 * 1000;
const TOLERANCIA = 30 * 1000;

beforeEach(async () => {
  // Cada teste começa com o usuário zerado (o seed também destrava).
  await semearUsuario(prisma, { usuario: USUARIO, senha: SENHA });
});

function entrar(app: ReturnType<typeof criarApp>, senha: string) {
  return request(app).post('/api/auth/login').send({ usuario: USUARIO, senha });
}

async function falhar(app: ReturnType<typeof criarApp>, vezes: number) {
  for (let i = 0; i < vezes; i++) {
    const res = await entrar(app, 'senha-errada-999');
    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('CREDENCIAIS_INVALIDAS');
  }
}

async function estado() {
  return prisma.usuario.findUniqueOrThrow({
    where: { usuario: USUARIO },
    select: { tentativasFalhas: true, bloqueadoAte: true },
  });
}

describe('bloqueio de login após 5 erros (FR-002)', () => {
  it('5 senhas erradas respondem 401 e a 6ª tentativa, mesmo com a senha certa, responde 429 LOGIN_BLOQUEADO', async () => {
    const app = criarApp();
    await falhar(app, 5);

    const antes = Date.now();
    const noBanco = await estado();
    expect(noBanco.tentativasFalhas).toBe(5);
    expect(noBanco.bloqueadoAte).not.toBeNull();
    const diferenca = noBanco.bloqueadoAte!.getTime() - antes;
    expect(diferenca).toBeGreaterThan(QUINZE_MINUTOS - TOLERANCIA);
    expect(diferenca).toBeLessThanOrEqual(QUINZE_MINUTOS + TOLERANCIA);

    const res = await entrar(app, SENHA);

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      erro: { codigo: 'LOGIN_BLOQUEADO', mensagem: expect.any(String) },
    });
    expect(res.body.erro.mensagem.length).toBeGreaterThan(0);
    expect(([] as string[]).concat(res.headers['set-cookie'] ?? [])).toEqual([]);
  });

  it('a tentativa bloqueada não altera tentativasFalhas nem bloqueadoAte', async () => {
    const app = criarApp();
    await falhar(app, 5);
    const antes = await estado();

    expect((await entrar(app, SENHA)).status).toBe(429);
    expect((await entrar(app, 'senha-errada-999')).status).toBe(429);

    expect(await estado()).toEqual(antes);
  });

  it('com bloqueadoAte no passado, a senha certa entra e zera tentativasFalhas e bloqueadoAte', async () => {
    await prisma.usuario.update({
      where: { usuario: USUARIO },
      data: { tentativasFalhas: 5, bloqueadoAte: new Date(Date.now() - 60 * 1000) },
    });

    const res = await entrar(criarApp(), SENHA);

    expect(res.status).toBe(200);
    expect(res.body.usuario.usuario).toBe(USUARIO);
    expect(await estado()).toEqual({ tentativasFalhas: 0, bloqueadoAte: null });
  });

  it('um login certo antes da 5ª falha zera a contagem', async () => {
    const app = criarApp();
    await falhar(app, 4);
    expect((await estado()).tentativasFalhas).toBe(4);

    expect((await entrar(app, SENHA)).status).toBe(200);
    expect(await estado()).toEqual({ tentativasFalhas: 0, bloqueadoAte: null });

    // Mais 4 falhas: se a contagem não tivesse zerado, a 1ª já bloquearia (429).
    await falhar(app, 4);
    expect((await estado()).bloqueadoAte).toBeNull();
  });

  it('o bloqueio está no banco: sobrevive a um novo app', async () => {
    await falhar(criarApp(), 5);

    const res = await entrar(criarApp(), SENHA);

    expect(res.status).toBe(429);
    expect(res.body.erro.codigo).toBe('LOGIN_BLOQUEADO');
  });
});
