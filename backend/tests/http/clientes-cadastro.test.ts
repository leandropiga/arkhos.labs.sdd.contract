import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { corpoCliente, formatarCpf, gerarCpf, inserirCliente, inserirContrato } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: contracts/api.md (Clientes) e data-model.md (Cliente).
// Cada teste usa séries de CPF próprias para não colidir com os outros do arquivo.

const app = criarApp();
let cookie: string;

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
});

const CAMPOS_OBRIGATORIOS = [
  'nomeCompleto',
  'telefone',
  'cpf',
  'rg',
  'logradouro',
  'numero',
  'cep',
  'cidade',
  'uf',
] as const;

const TODAS_AS_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB',
  'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

function campoComErro(res: request.Response, campo: string) {
  expect(res.status).toBe(400);
  expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
  expect(res.body.erro.campos).toEqual(
    expect.arrayContaining([{ campo, mensagem: expect.any(String) }]),
  );
}

describe('POST /api/clientes', () => {
  it('cadastro válido responde 201 com o Cliente, CPF e CEP só com dígitos e totalContratos 0', async () => {
    const corpo = corpoCliente(1, { cpf: formatarCpf(gerarCpf(1)), cep: '01310-100' });

    const res = await request(app).post('/api/clientes').set('Cookie', cookie).send(corpo);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      nomeCompleto: 'Cliente Número 1',
      telefone: '11987654321',
      cpf: gerarCpf(1),
      rg: '12.345.678-9',
      logradouro: 'Rua das Flores',
      numero: '123',
      cep: '01310100',
      cidade: 'São Paulo',
      uf: 'SP',
      totalContratos: 0,
    });
    const gravado = await prisma.cliente.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(gravado.cpf).toBe(gerarCpf(1));
    expect(gravado.cep).toBe('01310100');
    expect(gravado.nomeBusca).toBe('cliente numero 1');
  });

  it.each(CAMPOS_OBRIGATORIOS)('campo %s vazio responde 400 VALIDACAO_INVALIDA apontando o campo', async (campo) => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Cookie', cookie)
      .send(corpoCliente(2, { [campo]: '' }));

    campoComErro(res, campo);
  });

  it.each(CAMPOS_OBRIGATORIOS)('campo %s ausente responde 400 VALIDACAO_INVALIDA apontando o campo', async (campo) => {
    const corpo = corpoCliente(2);
    delete corpo[campo];

    const res = await request(app).post('/api/clientes').set('Cookie', cookie).send(corpo);

    campoComErro(res, campo);
  });

  it('CPF com dígitos verificadores errados responde 400 apontando cpf', async () => {
    const valido = gerarCpf(3);
    const errado = valido.slice(0, 10) + String((Number(valido[10]) + 1) % 10);

    const res = await request(app)
      .post('/api/clientes')
      .set('Cookie', cookie)
      .send(corpoCliente(3, { cpf: errado }));

    campoComErro(res, 'cpf');
  });

  it('CPF de sequência repetida responde 400 apontando cpf', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Cookie', cookie)
      .send(corpoCliente(3, { cpf: '111.111.111-11' }));

    campoComErro(res, 'cpf');
  });

  it.each(['1234567', '123456789', '0131010a'])('CEP "%s" (sem 8 dígitos) responde 400 apontando cep', async (cep) => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Cookie', cookie)
      .send(corpoCliente(4, { cep }));

    campoComErro(res, 'cep');
  });

  it.each(['XX', 'sp', 'São Paulo', ''])('UF "%s" fora das 27 responde 400 apontando uf', async (uf) => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Cookie', cookie)
      .send(corpoCliente(5, { uf }));

    campoComErro(res, 'uf');
  });

  it('aceita as 27 UFs válidas', async () => {
    expect(TODAS_AS_UFS).toHaveLength(27);
    for (const [i, uf] of TODAS_AS_UFS.entries()) {
      const res = await request(app)
        .post('/api/clientes')
        .set('Cookie', cookie)
        .send(corpoCliente(100 + i, { uf }));
      expect(res.status, `UF ${uf}`).toBe(201);
      expect(res.body.uf).toBe(uf);
    }
  });

  it('CPF já cadastrado responde 409 CPF_DUPLICADO (também quando vem com pontuação)', async () => {
    await inserirCliente(6, 'Primeiro Dono do CPF');

    const igual = await request(app)
      .post('/api/clientes')
      .set('Cookie', cookie)
      .send(corpoCliente(6));
    const pontuado = await request(app)
      .post('/api/clientes')
      .set('Cookie', cookie)
      .send(corpoCliente(6, { cpf: formatarCpf(gerarCpf(6)) }));

    for (const res of [igual, pontuado]) {
      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        erro: { codigo: 'CPF_DUPLICADO', mensagem: expect.any(String) },
      });
    }
  });

  it('sem sessão responde 401 NAO_AUTENTICADO', async () => {
    const res = await request(app).post('/api/clientes').send(corpoCliente(7));

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});

describe('PUT /api/clientes/:id', () => {
  it('edição válida responde 200 com o Cliente atualizado', async () => {
    const existente = await inserirCliente(10, 'Maria Antiga');

    const res = await request(app)
      .put(`/api/clientes/${existente.id}`)
      .set('Cookie', cookie)
      .send(corpoCliente(10, { nomeCompleto: 'Maria Nova', cidade: 'Campinas', uf: 'RJ' }));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: existente.id,
      nomeCompleto: 'Maria Nova',
      cpf: gerarCpf(10),
      cidade: 'Campinas',
      uf: 'RJ',
      totalContratos: 0,
    });
    const gravado = await prisma.cliente.findUniqueOrThrow({ where: { id: existente.id } });
    expect(gravado.nomeCompleto).toBe('Maria Nova');
    expect(gravado.nomeBusca).toBe('maria nova');
  });

  it('manter o próprio CPF na edição não conta como duplicado', async () => {
    const existente = await inserirCliente(11, 'Pedro Mesmo CPF');

    const res = await request(app)
      .put(`/api/clientes/${existente.id}`)
      .set('Cookie', cookie)
      .send(corpoCliente(11, { cpf: formatarCpf(gerarCpf(11)) }));

    expect(res.status).toBe(200);
  });

  it.each(CAMPOS_OBRIGATORIOS)('campo %s vazio responde 400 VALIDACAO_INVALIDA apontando o campo', async (campo) => {
    const existente = await inserirCliente(200 + CAMPOS_OBRIGATORIOS.indexOf(campo), 'Ana Para Validar');

    const res = await request(app)
      .put(`/api/clientes/${existente.id}`)
      .set('Cookie', cookie)
      .send(corpoCliente(200 + CAMPOS_OBRIGATORIOS.indexOf(campo), { [campo]: '' }));

    campoComErro(res, campo);
  });

  it('CPF inválido, CEP sem 8 dígitos e UF fora das 27 respondem 400', async () => {
    const existente = await inserirCliente(13, 'Ana Para Validar 2');
    const put = (extras: Record<string, unknown>) =>
      request(app)
        .put(`/api/clientes/${existente.id}`)
        .set('Cookie', cookie)
        .send(corpoCliente(13, extras));

    campoComErro(await put({ cpf: '529.982.247-26' }), 'cpf');
    campoComErro(await put({ cep: '1234' }), 'cep');
    campoComErro(await put({ uf: 'ZZ' }), 'uf');
  });

  it('CPF de outro cliente responde 409 CPF_DUPLICADO', async () => {
    await inserirCliente(14, 'Dono do CPF 14');
    const outro = await inserirCliente(15, 'Outro Cliente 15');

    const res = await request(app)
      .put(`/api/clientes/${outro.id}`)
      .set('Cookie', cookie)
      .send(corpoCliente(15, { cpf: gerarCpf(14) }));

    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('CPF_DUPLICADO');
  });

  it('id inexistente responde 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .put('/api/clientes/00000000-0000-4000-8000-000000000000')
      .set('Cookie', cookie)
      .send(corpoCliente(16));

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });

  it('sem sessão responde 401 NAO_AUTENTICADO', async () => {
    const existente = await inserirCliente(17, 'Cliente Sem Sessao');

    const res = await request(app).put(`/api/clientes/${existente.id}`).send(corpoCliente(17));

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});

describe('GET /api/clientes/:id', () => {
  it('devolve o Cliente com os contratos (ContratoResumo), do mais recente para o mais antigo', async () => {
    const cliente = await inserirCliente(20, 'Carlos Com Contratos');
    // Inseridos de propósito com a data mais recente primeiro; a ordem exigida é por dataAssinatura decrescente.
    const novo = await inserirContrato(cliente.id, 'Contrato Novo', '2026-03-15');
    const antigo = await inserirContrato(cliente.id, 'Contrato Antigo', '2024-01-10');

    const res = await request(app).get(`/api/clientes/${cliente.id}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: cliente.id,
      nomeCompleto: 'Carlos Com Contratos',
      cpf: gerarCpf(20),
      totalContratos: 2,
    });
    expect(res.body.contratos).toEqual([
      {
        id: novo.id,
        titulo: 'Contrato Novo',
        dataAssinatura: '2026-03-15',
        cliente: { id: cliente.id, nomeCompleto: 'Carlos Com Contratos' },
      },
      {
        id: antigo.id,
        titulo: 'Contrato Antigo',
        dataAssinatura: '2024-01-10',
        cliente: { id: cliente.id, nomeCompleto: 'Carlos Com Contratos' },
      },
    ]);
  });

  it('cliente sem contratos traz contratos: []', async () => {
    const cliente = await inserirCliente(21, 'Sem Contratos');

    const res = await request(app).get(`/api/clientes/${cliente.id}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.contratos).toEqual([]);
    expect(res.body.totalContratos).toBe(0);
  });

  it('id inexistente responde 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .get('/api/clientes/00000000-0000-4000-8000-000000000000')
      .set('Cookie', cookie);

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });

  it('sem sessão responde 401 NAO_AUTENTICADO', async () => {
    const cliente = await inserirCliente(22, 'Cliente Sem Sessao GET');

    const res = await request(app).get(`/api/clientes/${cliente.id}`);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});
