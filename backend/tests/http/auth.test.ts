import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { semearUsuario } from '../../src/lib/semear-usuario.js';

// Contrato (contracts/api.md): POST /api/auth/login é a única rota pública; as demais exigem sessão.
// Decisão: POST /api/auth/logout também exige sessão válida (regra geral do contrato), então os
// testes de logout chamam a rota já com o cookie do login. Como o JWT é sem estado, "depois do
// logout" é testado como o navegador faz: o Set-Cookie do logout é aplicado nas requisições
// seguintes (request.agent guarda os cookies). Não há lista negra de tokens no servidor.
//
// Cuidado: 5 falhas seguidas bloqueiam o usuário (429). Cada cenário de falha usa um usuário
// próprio e faz no máximo uma tentativa errada.

const SENHA = 'senha-correta-123';
const camposDoPerfil = ['fotoUrl', 'id', 'nome', 'telefone', 'usuario'];

function cookieSessao(res: request.Response): string {
  const lista = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  return lista.find((c) => c.startsWith('sessao=')) ?? '';
}

beforeAll(async () => {
  await semearUsuario(prisma, { usuario: 'admin', senha: SENHA });
  await semearUsuario(prisma, { usuario: 'senha-errada', senha: SENHA });
});

describe('POST /api/auth/login', () => {
  it('com credenciais corretas responde 200, cookie sessao HttpOnly e { usuario: Perfil }', async () => {
    const res = await request(criarApp())
      .post('/api/auth/login')
      .send({ usuario: 'admin', senha: SENHA });

    expect(res.status).toBe(200);
    const cookie = cookieSessao(res);
    expect(cookie).toMatch(/^sessao=[^;]+/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(Object.keys(res.body)).toEqual(['usuario']);
    expect(Object.keys(res.body.usuario).sort()).toEqual(camposDoPerfil);
    expect(res.body.usuario).toMatchObject({ usuario: 'admin', fotoUrl: null, telefone: null });
    expect(JSON.stringify(res.body)).not.toMatch(/senha|tentativas|bloqueado/i);
  });

  it('compara o usuário sem diferenciar maiúsculas', async () => {
    const res = await request(criarApp())
      .post('/api/auth/login')
      .send({ usuario: 'ADMIN', senha: SENHA });

    expect(res.status).toBe(200);
    expect(res.body.usuario.usuario).toBe('admin');
  });

  it('o cookie devolvido abre a sessão em GET /api/auth/sessao', async () => {
    const app = criarApp();
    const login = await request(app).post('/api/auth/login').send({ usuario: 'admin', senha: SENHA });
    expect(login.status).toBe(200);

    const res = await request(app).get('/api/auth/sessao').set('Cookie', cookieSessao(login));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ usuario: login.body.usuario });
  });

  it('senha errada e usuário inexistente respondem 401 CREDENCIAIS_INVALIDAS com a mesma mensagem', async () => {
    const app = criarApp();
    const senhaErrada = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'senha-errada', senha: 'outra-senha-999' });
    const inexistente = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'ninguem-com-esse-nome', senha: SENHA });

    for (const res of [senhaErrada, inexistente]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        erro: { codigo: 'CREDENCIAIS_INVALIDAS', mensagem: expect.any(String) },
      });
      expect(cookieSessao(res)).toBe('');
    }
    expect(senhaErrada.body.erro.mensagem).toBe(inexistente.body.erro.mensagem);
  });

  it('corpo sem usuario responde 400 VALIDACAO_INVALIDA apontando o campo usuario', async () => {
    const res = await request(criarApp()).post('/api/auth/login').send({ senha: SENHA });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos).toEqual(
      expect.arrayContaining([
        { campo: 'usuario', mensagem: expect.any(String) },
      ]),
    );
  });

  it('corpo sem senha responde 400 VALIDACAO_INVALIDA apontando o campo senha', async () => {
    const res = await request(criarApp()).post('/api/auth/login').send({ usuario: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos).toEqual(
      expect.arrayContaining([
        { campo: 'senha', mensagem: expect.any(String) },
      ]),
    );
  });
});

describe('POST /api/auth/logout', () => {
  it('com sessão responde 204 e expira o cookie sessao', async () => {
    const app = criarApp();
    const login = await request(app).post('/api/auth/login').send({ usuario: 'admin', senha: SENHA });
    expect(login.status).toBe(200);

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookieSessao(login));

    expect(res.status).toBe(204);
    const cookie = cookieSessao(res);
    expect(cookie).toMatch(/^sessao=(;|$)/);
    expect(cookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it('depois do logout, GET /api/auth/sessao responde 401 NAO_AUTENTICADO', async () => {
    // Cookies explícitos: o cookie é Secure fora de development e o jar do supertest (http) não o
    // reenviaria, o que um navegador em https faria. Aqui simulamos o navegador à mão.
    const app = criarApp();
    const login = await request(app).post('/api/auth/login').send({ usuario: 'admin', senha: SENHA });
    expect(login.status).toBe(200);
    const sessao = cookieSessao(login).split(';')[0];
    expect((await request(app).get('/api/auth/sessao').set('Cookie', sessao)).status).toBe(200);

    const logout = await request(app).post('/api/auth/logout').set('Cookie', sessao);
    expect(logout.status).toBe(204);

    // O navegador aplica o Set-Cookie do logout (valor vazio, expirado) e envia isso a seguir.
    const aposLogout = cookieSessao(logout).split(';')[0];
    expect(aposLogout).toBe('sessao=');
    const res = await request(app).get('/api/auth/sessao').set('Cookie', aposLogout);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: expect.any(String) },
    });
  });
});
