import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { criarApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { prisma } from '../../src/lib/prisma.js';
import type { ClienteIA } from '../../src/modules/analise/cliente-ia.js';
import { gravarNoStorage, pdfFalso, pdfValido, prepararPastas, removerPastas } from '../helpers/arquivos.js';
import { corpoCliente, inserirCliente, inserirContrato } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Testes transversais: SC-005 (nada acessível sem sessão) e SC-009 (erros sem detalhe técnico).
// A lista de rotas é a de contracts/api.md; se uma rota nova nascer, ela entra aqui.

const ID = '00000000-0000-4000-8000-000000000000';

type Rota = { metodo: 'get' | 'post' | 'put' | 'delete'; caminho: string };

// Todas as rotas do contrato, exceto POST /api/auth/login (a única pública).
const ROTAS_PROTEGIDAS: Rota[] = [
  { metodo: 'post', caminho: '/api/auth/logout' },
  { metodo: 'get', caminho: '/api/auth/sessao' },
  { metodo: 'get', caminho: '/api/perfil' },
  { metodo: 'put', caminho: '/api/perfil' },
  { metodo: 'get', caminho: '/api/clientes' },
  { metodo: 'post', caminho: '/api/clientes' },
  { metodo: 'get', caminho: `/api/clientes/${ID}` },
  { metodo: 'put', caminho: `/api/clientes/${ID}` },
  { metodo: 'delete', caminho: `/api/clientes/${ID}` },
  { metodo: 'get', caminho: '/api/contratos' },
  { metodo: 'post', caminho: '/api/contratos' },
  { metodo: 'get', caminho: `/api/contratos/${ID}` },
  { metodo: 'put', caminho: `/api/contratos/${ID}` },
  { metodo: 'delete', caminho: `/api/contratos/${ID}` },
  { metodo: 'get', caminho: `/api/contratos/${ID}/arquivo` },
  { metodo: 'post', caminho: `/api/contratos/${ID}/analise` },
  { metodo: 'get', caminho: '/api/painel' },
];

// Dublê da IA: nas falhas, a mensagem do erro vem cheia de segredos que não podem chegar ao cliente.
const analisarContrato = vi.fn<ClienteIA['analisarContrato']>();
const app = criarApp({ clienteIA: { analisarContrato }, tempoLimiteIaMs: 100 });
let cookie: string;
let clienteId: string;
let contratoId: string;

beforeAll(async () => {
  await prepararPastas();
  ({ cookie } = await criarUsuarioELogar());
  clienteId = (await inserirCliente(1, 'Cliente Dono')).id;
  contratoId = (await inserirContrato(clienteId, 'Contrato Seguro', '2025-01-10')).id;
  await gravarNoStorage(contratoId, pdfValido('seguranca'));
});

afterAll(async () => {
  await removerPastas();
});

describe('SC-005: rotas protegidas sem sessão', () => {
  it.each(ROTAS_PROTEGIDAS)('$metodo $caminho sem cookie responde 401 NAO_AUTENTICADO', async ({ metodo, caminho }) => {
    const res = await request(app)[metodo](caminho);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: expect.any(String) },
    });
  });

  it.each(ROTAS_PROTEGIDAS)('$metodo $caminho com token inválido responde 401', async ({ metodo, caminho }) => {
    const res = await request(app)[metodo](caminho).set('Cookie', 'sessao=token.invalido.qualquer');

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });

  it('rota inexistente sob /api também exige sessão (nada vaza sobre o que existe)', async () => {
    const res = await request(app).get('/api/nao-existe');

    expect(res.status).toBe(401);
  });
});

describe('SC-009: respostas de erro sem detalhes técnicos', () => {
  const segredo = env().GEMINI_API_KEY;

  /** Falha o teste se o corpo da resposta tiver qualquer detalhe técnico. */
  function semDetalhes(res: request.Response): void {
    const texto = JSON.stringify(res.body) + (res.text ?? '');
    expect(texto).not.toMatch(/stack/i);
    expect(texto).not.toMatch(/prisma/i);
    expect(texto).not.toContain(segredo);
    // Caminhos de arquivo (Windows ou POSIX) e frames de stack ("at x (arquivo:linha)").
    expect(texto).not.toMatch(/[A-Za-z]:\\/);
    expect(texto).not.toMatch(/\/(src|node_modules|backend|home|usr)\//);
    expect(texto).not.toMatch(/\.(ts|js):\d+/);
    expect(texto).not.toMatch(/\bat .+\(.+\)/);
    // Toda resposta de erro tem só a chave "erro".
    expect(Object.keys(res.body)).toEqual(['erro']);
  }

  it('erros previstos (400, 401, 404, 409) não trazem detalhes técnicos', async () => {
    const respostas = [
      await request(app).get('/api/nao-existe').set('Cookie', cookie),
      await request(app).get('/api/clientes/nao-e-uuid').set('Cookie', cookie),
      await request(app).get(`/api/clientes/${ID}`).set('Cookie', cookie),
      await request(app).post('/api/clientes').set('Cookie', cookie).send({ nomeCompleto: '' }),
      await request(app)
        .post('/api/clientes')
        .set('Cookie', cookie)
        .set('Content-Type', 'application/json')
        .send('{quebrado'),
      await request(app).get('/api/contratos?dataInicio=2025-02-01&dataFim=2025-01-01').set('Cookie', cookie),
      await request(app).get(`/api/contratos/${ID}`).set('Cookie', cookie),
      await request(app).delete(`/api/clientes/${clienteId}`).set('Cookie', cookie), // 409: tem contrato
      await request(app).post('/api/auth/login').send({ usuario: 'ninguem', senha: 'errada' }),
      await request(app).post('/api/auth/login').send({}),
    ];
    const status = respostas.map((r) => r.status);
    expect(status).toEqual([404, 404, 404, 400, 400, 400, 404, 409, 401, 400]);
    respostas.forEach(semDetalhes);
  });

  it('CPF duplicado (409) não traz detalhes técnicos', async () => {
    const corpo = corpoCliente(2);
    await request(app).post('/api/clientes').set('Cookie', cookie).send(corpo).expect(201);
    const res = await request(app).post('/api/clientes').set('Cookie', cookie).send(corpo);

    expect(res.status).toBe(409);
    semDetalhes(res);
  });

  it('uploads inválidos (arquivo falso, arquivo ausente) não trazem detalhes técnicos', async () => {
    const falso = await request(app)
      .post('/api/contratos')
      .set('Cookie', cookie)
      .field('titulo', 'X')
      .field('dataAssinatura', '2025-01-01')
      .field('clienteId', clienteId)
      .attach('arquivo', pdfFalso(), { filename: 'falso.pdf', contentType: 'application/pdf' });
    const ausente = await request(app).post('/api/contratos').set('Cookie', cookie).field('titulo', 'X');

    expect(falso.status).toBe(400);
    expect(ausente.status).toBe(400);
    [falso, ausente].forEach(semDetalhes);
  });

  it('falha da IA com mensagem cheia de segredos: 503 genérico', async () => {
    analisarContrato.mockRejectedValueOnce(
      new Error(`PrismaClientKnownRequestError em C:\\app\\src\\x.ts:10 chave=${segredo}`),
    );
    const res = await request(app).post(`/api/contratos/${contratoId}/analise`).set('Cookie', cookie);

    expect(res.status).toBe(503);
    semDetalhes(res);
  });

  it('erro inesperado (500) vira ERRO_INTERNO genérico, sem o erro original', async () => {
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const falha = vi
      .spyOn(prisma.cliente, 'findMany')
      .mockRejectedValue(new Error(`Prisma: conexão recusada em C:\\app\\src\\db.ts:42 chave=${segredo}`));
    try {
      const res = await request(app).get('/api/clientes').set('Cookie', cookie);

      expect(res.status).toBe(500);
      expect(res.body.erro.codigo).toBe('ERRO_INTERNO');
      semDetalhes(res);
    } finally {
      falha.mockRestore();
      silencio.mockRestore();
    }
  });
});
