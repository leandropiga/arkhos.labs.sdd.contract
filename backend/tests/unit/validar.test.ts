import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { middlewareErros } from '../../src/http/middleware-erros.js';
import { validar } from '../../src/http/validar.js';

const esquemaCorpo = z.object({ nome: z.string().min(2, 'Nome muito curto.'), idade: z.coerce.number() });
const esquemaConsulta = z.object({ pagina: z.coerce.number().int().min(1).default(1) });

function criarApp() {
  const app = express();
  app.use(express.json());
  app.post('/corpo', validar({ corpo: esquemaCorpo }), (_req, res) => {
    res.json({ recebido: res.locals.corpo });
  });
  app.get('/consulta', validar({ consulta: esquemaConsulta }), (_req, res) => {
    res.json({ recebido: res.locals.consulta });
  });
  app.use(middlewareErros);
  return app;
}

describe('validar', () => {
  it('segue com o corpo parseado em res.locals.corpo', async () => {
    const res = await request(criarApp()).post('/corpo').send({ nome: 'Ana', idade: '30' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ recebido: { nome: 'Ana', idade: 30 } });
  });

  it('corpo inválido vira 400 VALIDACAO_INVALIDA com campos', async () => {
    const silenciar = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(criarApp()).post('/corpo').send({ nome: 'A', idade: '1' });
    silenciar.mockRestore();
    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos).toEqual([{ campo: 'nome', mensagem: 'Nome muito curto.' }]);
  });

  it('segue com a query parseada em res.locals.consulta (com padrão aplicado)', async () => {
    const res = await request(criarApp()).get('/consulta');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ recebido: { pagina: 1 } });
  });

  it('query inválida vira 400 VALIDACAO_INVALIDA com campos', async () => {
    const res = await request(criarApp()).get('/consulta?pagina=0');
    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos[0].campo).toBe('pagina');
  });

  it('JSON malformado vira 400 VALIDACAO_INVALIDA genérico, sem campos nem eco da biblioteca', async () => {
    const silenciar = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(criarApp())
      .post('/corpo')
      .set('Content-Type', 'application/json')
      .send('{"nome": ');
    silenciar.mockRestore();
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      erro: { codigo: 'VALIDACAO_INVALIDA', mensagem: 'O corpo da requisição não é um JSON válido.' },
    });
  });
});
