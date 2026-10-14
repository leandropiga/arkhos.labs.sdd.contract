import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Interfaces fixadas por este teste (T023 e T025 implementam exatamente isto):
//   src/app.ts            -> criarApp(): Express
//                            (fábrica: devolve um app Express NOVO a cada chamada, sem chamar listen;
//                             o teste usa request(criarApp()) do supertest)
//   tests/helpers/sessao.ts -> criarUsuarioELogar(): Promise<{ cookie: string; usuario: Perfil }>
//                            (cria um usuário no banco de teste e devolve o valor do cabeçalho
//                             Cookie já válido, ex.: "sessao=<jwt>", SEM chamar a rota de login;
//                             `usuario` é o Perfil esperado no corpo da resposta)
//   Perfil = { id, usuario, nome, fotoUrl: string | null, telefone: string | null } (nunca senhaHash)

describe('GET /api/auth/sessao', () => {
  it('sem cookie responde 401 NAO_AUTENTICADO no formato padronizado', async () => {
    const res = await request(criarApp()).get('/api/auth/sessao');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: expect.any(String) },
    });
  });

  it('com cookie de token inválido responde 401 NAO_AUTENTICADO', async () => {
    const res = await request(criarApp())
      .get('/api/auth/sessao')
      .set('Cookie', 'sessao=token.invalido.qualquer');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: expect.any(String) },
    });
  });

  it('com cookie válido responde 200 com o Perfil, sem senhaHash', async () => {
    const { cookie, usuario } = await criarUsuarioELogar();

    const res = await request(criarApp()).get('/api/auth/sessao').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ usuario });
    expect(Object.keys(res.body.usuario).sort()).toEqual(
      ['fotoUrl', 'id', 'nome', 'telefone', 'usuario'],
    );
    expect(JSON.stringify(res.body)).not.toMatch(/senha/i);
  });
});

describe('rota inexistente sob /api', () => {
  it('responde 404 NAO_ENCONTRADO no formato padronizado (com sessão válida)', async () => {
    const { cookie } = await criarUsuarioELogar();

    const res = await request(criarApp()).get('/api/rota-que-nao-existe').set('Cookie', cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      erro: { codigo: 'NAO_ENCONTRADO', mensagem: expect.any(String) },
    });
  });
});

describe('cabeçalhos da resposta', () => {
  it('não revelam a stack (sem X-Powered-By)', async () => {
    const res = await request(criarApp()).get('/api/auth/sessao');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
