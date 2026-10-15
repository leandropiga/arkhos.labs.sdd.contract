import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: GET/PUT /api/perfil (contracts/api.md, seção Autenticação e perfil).

const app = criarApp();
let cookie: string;
let usuario: Awaited<ReturnType<typeof criarUsuarioELogar>>['usuario'];

const corpoValido = {
  nome: 'Maria Souza',
  fotoUrl: 'https://exemplo.com/maria.png',
  telefone: '11987654321',
};

const camposInvalidos = (res: request.Response): string[] =>
  res.body.erro.campos.map((c: { campo: string }) => c.campo);

beforeAll(async () => {
  ({ cookie, usuario } = await criarUsuarioELogar());
});

describe('GET /api/perfil', () => {
  it('sem cookie responde 401 NAO_AUTENTICADO', async () => {
    const res = await request(app).get('/api/perfil');

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });

  it('devolve o Perfil, sem senhaHash', async () => {
    const res = await request(app).get('/api/perfil').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(usuario);
    expect(Object.keys(res.body).sort()).toEqual(['fotoUrl', 'id', 'nome', 'telefone', 'usuario']);
    expect(JSON.stringify(res.body)).not.toMatch(/senha/i);
  });
});

describe('PUT /api/perfil', () => {
  it('sem cookie responde 401 NAO_AUTENTICADO', async () => {
    const res = await request(app).put('/api/perfil').send(corpoValido);

    expect(res.status).toBe(401);
  });

  it('corpo válido responde 200 com o Perfil atualizado, sem senhaHash, e grava', async () => {
    const res = await request(app).put('/api/perfil').set('Cookie', cookie).send(corpoValido);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...usuario, ...corpoValido });
    expect(JSON.stringify(res.body)).not.toMatch(/senha/i);

    const depois = await request(app).get('/api/perfil').set('Cookie', cookie);
    expect(depois.body).toEqual({ ...usuario, ...corpoValido });
  });

  it('aceita fotoUrl http e telefone de 10 dígitos', async () => {
    const res = await request(app)
      .put('/api/perfil')
      .set('Cookie', cookie)
      .send({ nome: 'Maria', fotoUrl: 'http://exemplo.com/a.jpg', telefone: '1133334444' });

    expect(res.status).toBe(200);
    expect(res.body.fotoUrl).toBe('http://exemplo.com/a.jpg');
    expect(res.body.telefone).toBe('1133334444');
  });

  it('fotoUrl e telefone nulos ou vazios limpam os campos (null)', async () => {
    const nulos = await request(app)
      .put('/api/perfil')
      .set('Cookie', cookie)
      .send({ nome: 'Maria', fotoUrl: null, telefone: null });
    expect(nulos.status).toBe(200);
    expect(nulos.body).toMatchObject({ fotoUrl: null, telefone: null });

    const vazios = await request(app)
      .put('/api/perfil')
      .set('Cookie', cookie)
      .send({ nome: 'Maria', fotoUrl: '', telefone: '' });
    expect(vazios.status).toBe(200);
    expect(vazios.body).toMatchObject({ fotoUrl: null, telefone: null });
  });

  it.each([
    ['ftp', 'ftp://exemplo.com/a.png'],
    ['javascript', 'javascript:alert(1)'],
    ['texto solto', 'minha foto'],
    ['sem protocolo', 'exemplo.com/a.png'],
  ])('fotoUrl inválida (%s) responde 400 VALIDACAO_INVALIDA no campo fotoUrl', async (_r, fotoUrl) => {
    const res = await request(app)
      .put('/api/perfil')
      .set('Cookie', cookie)
      .send({ ...corpoValido, fotoUrl });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(camposInvalidos(res)).toEqual(['fotoUrl']);
  });

  it.each([['vazio', ''], ['só espaços', '   ']])(
    'nome %s responde 400 VALIDACAO_INVALIDA no campo nome',
    async (_r, nome) => {
      const res = await request(app)
        .put('/api/perfil')
        .set('Cookie', cookie)
        .send({ ...corpoValido, nome });

      expect(res.status).toBe(400);
      expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
      expect(camposInvalidos(res)).toEqual(['nome']);
    },
  );

  it('nome ausente responde 400 no campo nome', async () => {
    const res = await request(app)
      .put('/api/perfil')
      .set('Cookie', cookie)
      .send({ fotoUrl: null, telefone: null });

    expect(res.status).toBe(400);
    expect(camposInvalidos(res)).toEqual(['nome']);
  });

  it.each([
    ['9 dígitos', '119876543'],
    ['12 dígitos', '119876543210'],
    ['com letras', '11abcde4321'],
  ])('telefone inválido (%s) responde 400 VALIDACAO_INVALIDA no campo telefone', async (_r, telefone) => {
    const res = await request(app)
      .put('/api/perfil')
      .set('Cookie', cookie)
      .send({ ...corpoValido, telefone });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(camposInvalidos(res)).toEqual(['telefone']);
  });

  it('entrada inválida não altera o perfil gravado', async () => {
    const antes = await request(app).get('/api/perfil').set('Cookie', cookie);
    await request(app)
      .put('/api/perfil')
      .set('Cookie', cookie)
      .send({ nome: 'Outro Nome', fotoUrl: 'ftp://x.com/a', telefone: '11987654321' });
    const depois = await request(app).get('/api/perfil').set('Cookie', cookie);

    expect(depois.body).toEqual(antes.body);
  });
});
