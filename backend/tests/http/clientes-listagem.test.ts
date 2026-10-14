import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { formatarCpf, gerarCpf, inserirCliente } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: GET /api/clientes?nome=&cpf=&pagina= (contracts/api.md) e Paginação.
// Dados: 25 clientes "Cliente 01".."Cliente 25" (série = número). O bloco de filtros
// acrescenta "José Almeida" e "Maria Josefina Souza" depois que a paginação já foi testada.

const app = criarApp();
let cookie: string;

const nomeDe = (n: number) => `Cliente ${String(n).padStart(2, '0')}`;
const nomes = (res: request.Response): string[] =>
  res.body.itens.map((c: { nomeCompleto: string }) => c.nomeCompleto);

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
  // Inseridos fora de ordem alfabética para provar que a API ordena.
  for (let n = 25; n >= 1; n--) {
    await inserirCliente(n, nomeDe(n));
  }
});

describe('GET /api/clientes (paginação)', () => {
  it('25 clientes: página 1 traz 20 itens em ordem alfabética e totalPaginas 2', async () => {
    const res = await request(app).get('/api/clientes').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pagina: 1, tamanhoPagina: 20, total: 25, totalPaginas: 2 });
    expect(res.body.itens).toHaveLength(20);
    expect(nomes(res)).toEqual(Array.from({ length: 20 }, (_, i) => nomeDe(i + 1)));
  });

  it('cada item é um Cliente com totalContratos', async () => {
    const res = await request(app).get('/api/clientes').set('Cookie', cookie);

    expect(Object.keys(res.body.itens[0]).sort()).toEqual([
      'cep', 'cidade', 'cpf', 'id', 'logradouro', 'nomeCompleto', 'numero', 'rg',
      'telefone', 'totalContratos', 'uf',
    ]);
    expect(res.body.itens[0]).toMatchObject({ nomeCompleto: 'Cliente 01', cpf: gerarCpf(1), totalContratos: 0 });
  });

  it('página 2 traz os 5 restantes', async () => {
    const res = await request(app).get('/api/clientes?pagina=2').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(2);
    expect(nomes(res)).toEqual([21, 22, 23, 24, 25].map(nomeDe));
  });

  it('pagina=99 devolve a última página válida', async () => {
    const res = await request(app).get('/api/clientes?pagina=99').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(2);
    expect(res.body.totalPaginas).toBe(2);
    expect(res.body.itens).toHaveLength(5);
    expect(res.body.itens[0].nomeCompleto).toBe('Cliente 21');
  });
});

describe('GET /api/clientes (filtros)', () => {
  beforeAll(async () => {
    await inserirCliente(90, 'José Almeida');
    await inserirCliente(91, 'Maria Josefina Souza');
  });

  it('nome=jose encontra "José" (sem acento, sem diferenciar maiúscula) e ignora os demais', async () => {
    const res = await request(app).get('/api/clientes?nome=jose').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(nomes(res)).toEqual(['José Almeida', 'Maria Josefina Souza']);
    expect(res.body.total).toBe(2);
    expect(res.body.totalPaginas).toBe(1);
  });

  it('nome com acento e maiúsculas também encontra', async () => {
    const res = await request(app)
      .get(`/api/clientes?nome=${encodeURIComponent('JOSÉ alm')}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(nomes(res)).toEqual(['José Almeida']);
  });

  it('cpf com pontuação encontra o cliente (busca exata)', async () => {
    const cpf = encodeURIComponent(formatarCpf(gerarCpf(90)));

    const res = await request(app).get(`/api/clientes?cpf=${cpf}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(1);
    expect(res.body.itens[0]).toMatchObject({ nomeCompleto: 'José Almeida', cpf: gerarCpf(90) });
  });

  it('cpf só com dígitos também encontra', async () => {
    const res = await request(app).get(`/api/clientes?cpf=${gerarCpf(91)}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(nomes(res)).toEqual(['Maria Josefina Souza']);
  });

  it('cpf parcial não encontra nada (a busca é exata)', async () => {
    const parcial = gerarCpf(90).slice(0, 6);

    const res = await request(app).get(`/api/clientes?cpf=${parcial}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.itens).toEqual([]);
  });

  it('filtro sem resultado devolve itens: [] com total 0 e totalPaginas 0', async () => {
    const res = await request(app).get('/api/clientes?nome=zzzinexistente').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ itens: [], pagina: 1, tamanhoPagina: 20, total: 0, totalPaginas: 0 });
  });

  it('sem sessão responde 401 NAO_AUTENTICADO', async () => {
    const res = await request(app).get('/api/clientes');

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});
