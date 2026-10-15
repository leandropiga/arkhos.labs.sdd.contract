import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { inserirCliente, inserirContrato } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: GET /api/painel (contracts/api.md, seção Painel).
// Os testes rodam em ordem: o primeiro com o banco vazio, depois os dados são inseridos.

const app = criarApp();
let cookie: string;

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
});

describe('GET /api/painel', () => {
  it('sem cookie responde 401 NAO_AUTENTICADO', async () => {
    const res = await request(app).get('/api/painel');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: expect.any(String) },
    });
  });

  it('banco vazio: totais zerados e clientesPorUf vazio', async () => {
    const res = await request(app).get('/api/painel').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalClientes: 0, totalContratos: 0, clientesPorUf: [] });
  });

  it('3 clientes em SP, 1 em MG e 2 contratos: totais corretos e só UFs com clientes', async () => {
    const c1 = await inserirCliente(1, 'Cliente Um');
    await inserirCliente(2, 'Cliente Dois');
    await inserirCliente(3, 'Cliente Três');
    const c4 = await inserirCliente(4, 'Cliente Quatro');
    await prisma.cliente.update({ where: { id: c4.id }, data: { uf: 'MG' } });
    await inserirContrato(c1.id, 'Contrato A', '2025-01-10');
    await inserirContrato(c4.id, 'Contrato B', '2025-02-20');

    const res = await request(app).get('/api/painel').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.totalClientes).toBe(4);
    expect(res.body.totalContratos).toBe(2);
    expect(res.body.clientesPorUf).toHaveLength(2);
    expect(res.body.clientesPorUf).toEqual(
      expect.arrayContaining([
        { uf: 'SP', total: 3 },
        { uf: 'MG', total: 1 },
      ]),
    );
  });
});
