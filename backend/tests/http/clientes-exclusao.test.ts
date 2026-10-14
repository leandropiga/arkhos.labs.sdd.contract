import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { inserirCliente, inserirContrato } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: DELETE /api/clientes/:id -> 204 | 404 | 409 CLIENTE_COM_CONTRATOS (FR-010).

const app = criarApp();
let cookie: string;

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
});

describe('DELETE /api/clientes/:id', () => {
  it('cliente sem contratos responde 204 sem corpo e some do banco', async () => {
    const cliente = await inserirCliente(1, 'Cliente Descartável');

    const res = await request(app).delete(`/api/clientes/${cliente.id}`).set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await prisma.cliente.findUnique({ where: { id: cliente.id } })).toBeNull();
  });

  it('cliente com 2 contratos responde 409 CLIENTE_COM_CONTRATOS citando "2 contratos" e continua no banco', async () => {
    const cliente = await inserirCliente(2, 'Cliente Com Contratos');
    await inserirContrato(cliente.id, 'Contrato Um', '2025-05-01');
    await inserirContrato(cliente.id, 'Contrato Dois', '2025-06-01');

    const res = await request(app).delete(`/api/clientes/${cliente.id}`).set('Cookie', cookie);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      erro: { codigo: 'CLIENTE_COM_CONTRATOS', mensagem: expect.stringContaining('2 contratos') },
    });
    expect(await prisma.cliente.findUnique({ where: { id: cliente.id } })).not.toBeNull();
    expect(await prisma.contrato.count({ where: { clienteId: cliente.id } })).toBe(2);
  });

  it('id inexistente responde 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .delete('/api/clientes/00000000-0000-4000-8000-000000000000')
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });

  it('sem sessão responde 401 NAO_AUTENTICADO e não apaga', async () => {
    const cliente = await inserirCliente(3, 'Cliente Sem Sessao');

    const res = await request(app).delete(`/api/clientes/${cliente.id}`);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
    expect(await prisma.cliente.findUnique({ where: { id: cliente.id } })).not.toBeNull();
  });
});
