import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { inserirCliente, inserirContrato } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: GET /api/contratos?titulo=&dataInicio=&dataFim=&pagina= (contracts/api.md) e Paginação.
// Bloco 1: 25 contratos "Contrato 01".."Contrato 25"; o de número N assina em 2025-01-01 + N dias
// (inseridos fora de ordem). Bloco 2 apaga tudo e semeia contratos com títulos e datas escolhidos.

const app = criarApp();
let cookie: string;
let clienteId: string;

const numero = (n: number) => String(n).padStart(2, '0');
const tituloDe = (n: number) => `Contrato ${numero(n)}`;
const dataDe = (n: number) => new Date(Date.UTC(2025, 0, 1 + n)).toISOString().slice(0, 10);
const titulos = (res: request.Response): string[] =>
  res.body.itens.map((c: { titulo: string }) => c.titulo);

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
  clienteId = (await inserirCliente(1, 'Cliente Dono')).id;
});

describe('GET /api/contratos (paginação e ordem)', () => {
  beforeAll(async () => {
    const ordem = Array.from({ length: 25 }, (_, i) => i + 1).sort(
      (a, b) => ((a * 7) % 25) - ((b * 7) % 25),
    );
    for (const n of ordem) await inserirContrato(clienteId, tituloDe(n), dataDe(n));
  });

  it('25 contratos: página 1 traz 20 itens, do mais recente para o mais antigo, e totalPaginas 2', async () => {
    const res = await request(app).get('/api/contratos').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pagina: 1, tamanhoPagina: 20, total: 25, totalPaginas: 2 });
    expect(res.body.itens).toHaveLength(20);
    expect(titulos(res)).toEqual(Array.from({ length: 20 }, (_, i) => tituloDe(25 - i)));
  });

  it('cada item é um ContratoResumo com a data AAAA-MM-DD e o cliente', async () => {
    const res = await request(app).get('/api/contratos').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.itens[0]).sort()).toEqual(['cliente', 'dataAssinatura', 'id', 'titulo']);
    expect(res.body.itens[0]).toEqual({
      id: expect.any(String),
      titulo: tituloDe(25),
      dataAssinatura: dataDe(25),
      cliente: { id: clienteId, nomeCompleto: 'Cliente Dono' },
    });
  });

  it('página 2 traz os 5 mais antigos', async () => {
    const res = await request(app).get('/api/contratos?pagina=2').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(2);
    expect(titulos(res)).toEqual([5, 4, 3, 2, 1].map(tituloDe));
  });

  it('pagina=99 devolve a última página válida', async () => {
    const res = await request(app).get('/api/contratos?pagina=99').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(2);
    expect(res.body.totalPaginas).toBe(2);
    expect(titulos(res)).toEqual([5, 4, 3, 2, 1].map(tituloDe));
  });

  it('tamanhoPagina na query é ignorado (fixo em 20)', async () => {
    const res = await request(app).get('/api/contratos?tamanhoPagina=5').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.tamanhoPagina).toBe(20);
    expect(res.body.itens).toHaveLength(20);
  });
});

describe('GET /api/contratos (filtros)', () => {
  beforeAll(async () => {
    await prisma.contrato.deleteMany();
    await inserirContrato(clienteId, 'Contrato de Compra', '2025-01-31');
    await inserirContrato(clienteId, 'Prestação de Serviços', '2025-02-10');
    await inserirContrato(clienteId, 'PRESTACAO DE SERVICOS TI', '2025-03-15');
    await inserirContrato(clienteId, 'Locação de Imóvel', '2025-03-31');
    await inserirContrato(clienteId, 'Aluguel', '2025-04-01');
  });

  const buscar = (query: string) => request(app).get(`/api/contratos?${query}`).set('Cookie', cookie);

  it('sem filtros traz todos, do mais recente para o mais antigo', async () => {
    const res = await buscar('');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual([
      'Aluguel', 'Locação de Imóvel', 'PRESTACAO DE SERVICOS TI', 'Prestação de Serviços', 'Contrato de Compra',
    ]);
  });

  it('titulo sem acento e em minúscula acha títulos com acento e maiúscula', async () => {
    const res = await buscar('titulo=prestacao');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['PRESTACAO DE SERVICOS TI', 'Prestação de Serviços']);
    expect(res.body.total).toBe(2);
  });

  it('titulo com acento e maiúscula acha o mesmo (a busca ignora acento e caixa dos dois lados)', async () => {
    const res = await buscar(`titulo=${encodeURIComponent('IMÓVEL')}`);

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['Locação de Imóvel']);
  });

  it('titulo é busca por trecho (contém)', async () => {
    const res = await buscar('titulo=ervico');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['PRESTACAO DE SERVICOS TI', 'Prestação de Serviços']);
  });

  it('titulo sem resultado devolve página vazia', async () => {
    const res = await buscar('titulo=inexistente');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ itens: [], pagina: 1, tamanhoPagina: 20, total: 0, totalPaginas: 0 });
  });

  it('dataInicio é inclusivo (traz o contrato assinado exatamente nessa data)', async () => {
    const res = await buscar('dataInicio=2025-03-15');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['Aluguel', 'Locação de Imóvel', 'PRESTACAO DE SERVICOS TI']);
  });

  it('dataFim é inclusivo (traz o contrato assinado exatamente nessa data)', async () => {
    const res = await buscar('dataFim=2025-03-15');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['PRESTACAO DE SERVICOS TI', 'Prestação de Serviços', 'Contrato de Compra']);
  });

  it('dataInicio e dataFim juntos são inclusivos nas duas pontas', async () => {
    const res = await buscar('dataInicio=2025-02-10&dataFim=2025-03-31');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['Locação de Imóvel', 'PRESTACAO DE SERVICOS TI', 'Prestação de Serviços']);
  });

  it('dataInicio igual a dataFim traz só o dia', async () => {
    const res = await buscar('dataInicio=2025-03-31&dataFim=2025-03-31');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['Locação de Imóvel']);
  });

  it('filtros combinados: título e período valem ao mesmo tempo', async () => {
    const res = await buscar('titulo=servicos&dataInicio=2025-03-01&dataFim=2025-03-31');

    expect(res.status).toBe(200);
    expect(titulos(res)).toEqual(['PRESTACAO DE SERVICOS TI']);
    expect(res.body.total).toBe(1);
  });

  it('dataInicio maior que dataFim responde 400 VALIDACAO_INVALIDA com a lista de campos', async () => {
    const res = await buscar('dataInicio=2025-04-01&dataFim=2025-03-31');

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos.length).toBeGreaterThan(0);
  });

  it('data fora do formato AAAA-MM-DD responde 400 VALIDACAO_INVALIDA', async () => {
    const res = await buscar('dataInicio=01/03/2025');

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
  });
});

describe('GET /api/contratos (sessão)', () => {
  it('sem sessão responde 401 NAO_AUTENTICADO', async () => {
    const res = await request(app).get('/api/contratos');

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});
