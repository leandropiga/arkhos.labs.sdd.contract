import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
// Este import vem antes do app: ele aponta UPLOAD_TMP_DIR e STORAGE_DIR para pastas de teste.
import {
  caminhoNoStorage, dirStorage, dirTmp, gravarNoStorage, listar, pdfFalso, pdfValido,
  prepararPastas, removerPastas,
} from '../helpers/arquivos.js';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { inserirCliente, inserirContrato } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: GET/PUT/DELETE /api/contratos/:id e GET /api/contratos/:id/arquivo (contracts/api.md).
// Decisão da rodada 3: ainda não existe análise, então o detalhe traz analise: null e
// analiseEmAndamento: false (a regra FR-031 de descartar a análise no PUT fica para a rodada 4).

const app = criarApp();
let cookie: string;
let clienteId: string;
let outroClienteId: string;

const INEXISTENTE = '00000000-0000-4000-8000-000000000000';
const ORIGINAL = pdfValido('original');
const NOME_ORIGINAL = 'contrato original.pdf';

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
  clienteId = (await inserirCliente(1, 'Cliente Dono')).id;
  outroClienteId = (await inserirCliente(2, 'Outro Cliente')).id;
});

beforeEach(async () => {
  await prepararPastas();
  await prisma.contrato.deleteMany();
});

afterAll(async () => {
  await removerPastas();
});

/** Contrato no banco com o PDF original já guardado em STORAGE_DIR/<id>.pdf. */
async function criarContratoComPdf() {
  const contrato = await inserirContrato(clienteId, 'Contrato Original', '2025-03-10', {
    nome: NOME_ORIGINAL,
    tamanho: ORIGINAL.length,
  });
  await gravarNoStorage(contrato.id, ORIGINAL);
  return contrato;
}

function editar(
  id: string,
  campos: Record<string, string> = {},
  arquivo?: { conteudo: Buffer; nome: string },
) {
  const dados = { titulo: 'Título Novo', dataAssinatura: '2025-04-20', clienteId, ...campos };
  let req = request(app).put(`/api/contratos/${id}`).set('Cookie', cookie);
  for (const [chave, valor] of Object.entries(dados)) req = req.field(chave, valor);
  if (arquivo) {
    req = req.attach('arquivo', arquivo.conteudo, { filename: arquivo.nome, contentType: 'application/pdf' });
  }
  return req;
}

describe('GET /api/contratos/:id', () => {
  it('traz o contrato com o cliente, os dados do arquivo e analise null', async () => {
    const contrato = await criarContratoComPdf();

    const res = await request(app).get(`/api/contratos/${contrato.id}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: contrato.id,
      titulo: 'Contrato Original',
      dataAssinatura: '2025-03-10',
      cliente: { id: clienteId, nomeCompleto: 'Cliente Dono' },
      arquivoNomeOriginal: NOME_ORIGINAL,
      arquivoTamanhoBytes: ORIGINAL.length,
      analiseEmAndamento: false,
      analise: null,
    });
  });

  it('id inexistente responde 404 NAO_ENCONTRADO', async () => {
    const res = await request(app).get(`/api/contratos/${INEXISTENTE}`).set('Cookie', cookie);

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });

  it('sem sessão responde 401 NAO_AUTENTICADO', async () => {
    const contrato = await criarContratoComPdf();

    const res = await request(app).get(`/api/contratos/${contrato.id}`);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});

describe('PUT /api/contratos/:id', () => {
  it('sem arquivo atualiza os campos e mantém o PDF como estava', async () => {
    const contrato = await criarContratoComPdf();

    const res = await editar(contrato.id, { clienteId: outroClienteId });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: contrato.id,
      titulo: 'Título Novo',
      dataAssinatura: '2025-04-20',
      cliente: { id: outroClienteId, nomeCompleto: 'Outro Cliente' },
      arquivoNomeOriginal: NOME_ORIGINAL,
      arquivoTamanhoBytes: ORIGINAL.length,
      analise: null,
    });
    const linha = await prisma.contrato.findUniqueOrThrow({ where: { id: contrato.id } });
    expect(linha).toMatchObject({ titulo: 'Título Novo', tituloBusca: 'titulo novo', clienteId: outroClienteId });
    expect(await listar(dirStorage())).toEqual([`${contrato.id}.pdf`]);
    expect((await readFile(caminhoNoStorage(contrato.id))).equals(ORIGINAL)).toBe(true);
    expect(await listar(dirTmp())).toEqual([]);
  });

  it('com arquivo substitui o PDF, atualiza nome e tamanho e não deixa o antigo para trás', async () => {
    const contrato = await criarContratoComPdf();
    const novo = pdfValido('versao nova, um pouco maior que a original');

    const res = await editar(contrato.id, {}, { conteudo: novo, nome: 'versao-nova.pdf' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: contrato.id,
      titulo: 'Título Novo',
      arquivoNomeOriginal: 'versao-nova.pdf',
      arquivoTamanhoBytes: novo.length,
    });
    expect(novo.length).not.toBe(ORIGINAL.length);
    expect(await listar(dirStorage())).toEqual([`${contrato.id}.pdf`]);
    const guardado = await readFile(caminhoNoStorage(contrato.id));
    expect(guardado.equals(novo)).toBe(true);
    expect(guardado.equals(ORIGINAL)).toBe(false);
    const linha = await prisma.contrato.findUniqueOrThrow({ where: { id: contrato.id } });
    expect(linha).toMatchObject({ arquivoNomeOriginal: 'versao-nova.pdf', arquivoTamanhoBytes: novo.length });
    expect(await listar(dirTmp())).toEqual([]);
  });

  it('com arquivo inválido responde 400 ARQUIVO_INVALIDO e mantém o PDF e os dados antigos', async () => {
    const contrato = await criarContratoComPdf();

    const res = await editar(contrato.id, {}, { conteudo: pdfFalso(), nome: 'falso.pdf' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('ARQUIVO_INVALIDO');
    expect(await listar(dirStorage())).toEqual([`${contrato.id}.pdf`]);
    expect((await readFile(caminhoNoStorage(contrato.id))).equals(ORIGINAL)).toBe(true);
    const linha = await prisma.contrato.findUniqueOrThrow({ where: { id: contrato.id } });
    expect(linha).toMatchObject({ titulo: 'Contrato Original', arquivoNomeOriginal: NOME_ORIGINAL });
    expect(await listar(dirTmp())).toEqual([]);
  });

  it('clienteId inexistente responde 400 VALIDACAO_INVALIDA citando clienteId e não altera nada', async () => {
    const contrato = await criarContratoComPdf();

    const res = await editar(contrato.id, { clienteId: INEXISTENTE });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos.map((c: { campo: string }) => c.campo)).toContain('clienteId');
    const linha = await prisma.contrato.findUniqueOrThrow({ where: { id: contrato.id } });
    expect(linha).toMatchObject({ titulo: 'Contrato Original', clienteId });
  });

  it('id inexistente responde 404 NAO_ENCONTRADO e não deixa arquivo no temporário nem no storage', async () => {
    const res = await editar(INEXISTENTE, {}, { conteudo: pdfValido('x'), nome: 'x.pdf' });

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
    expect(await listar(dirTmp())).toEqual([]);
    expect(await listar(dirStorage())).toEqual([]);
  });

  it('sem sessão responde 401 NAO_AUTENTICADO e não altera nada', async () => {
    const contrato = await criarContratoComPdf();

    const res = await request(app)
      .put(`/api/contratos/${contrato.id}`)
      .field('titulo', 'Invasor')
      .field('dataAssinatura', '2025-04-20')
      .field('clienteId', clienteId);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
    const linha = await prisma.contrato.findUniqueOrThrow({ where: { id: contrato.id } });
    expect(linha.titulo).toBe('Contrato Original');
  });
});

describe('DELETE /api/contratos/:id', () => {
  it('responde 204 sem corpo, apaga a linha e apaga o PDF do storage', async () => {
    const contrato = await criarContratoComPdf();
    expect(await listar(dirStorage())).toEqual([`${contrato.id}.pdf`]);

    const res = await request(app).delete(`/api/contratos/${contrato.id}`).set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await prisma.contrato.findUnique({ where: { id: contrato.id } })).toBeNull();
    expect(await listar(dirStorage())).toEqual([]);
  });

  it('só apaga o PDF do contrato excluído, não o dos outros', async () => {
    const alvo = await criarContratoComPdf();
    const outro = await inserirContrato(clienteId, 'Outro Contrato', '2025-01-01');
    await gravarNoStorage(outro.id, pdfValido('outro'));

    const res = await request(app).delete(`/api/contratos/${alvo.id}`).set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(await listar(dirStorage())).toEqual([`${outro.id}.pdf`]);
    expect(await prisma.contrato.findUnique({ where: { id: outro.id } })).not.toBeNull();
  });

  it('id inexistente responde 404 NAO_ENCONTRADO', async () => {
    const res = await request(app).delete(`/api/contratos/${INEXISTENTE}`).set('Cookie', cookie);

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });

  it('sem sessão responde 401 NAO_AUTENTICADO e não apaga', async () => {
    const contrato = await criarContratoComPdf();

    const res = await request(app).delete(`/api/contratos/${contrato.id}`);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
    expect(await prisma.contrato.findUnique({ where: { id: contrato.id } })).not.toBeNull();
    expect(await listar(dirStorage())).toEqual([`${contrato.id}.pdf`]);
  });
});

describe('GET /api/contratos/:id/arquivo', () => {
  it('responde 200 application/pdf, Content-Disposition inline com o nome original e os bytes do PDF', async () => {
    const contrato = await criarContratoComPdf();

    const res = await request(app)
      .get(`/api/contratos/${contrato.id}/arquivo`)
      .set('Cookie', cookie)
      .buffer(true)
      .parse((resposta, fim) => {
        const partes: Buffer[] = [];
        resposta.on('data', (parte: Buffer) => partes.push(parte));
        resposta.on('end', () => fim(null, Buffer.concat(partes)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^application\/pdf/);
    expect(res.headers['content-disposition']).toBe(`inline; filename="${NOME_ORIGINAL}"`);
    expect((res.body as Buffer).equals(ORIGINAL)).toBe(true);
  });

  it('id inexistente responde 404 NAO_ENCONTRADO em JSON', async () => {
    const res = await request(app).get(`/api/contratos/${INEXISTENTE}/arquivo`).set('Cookie', cookie);

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });

  it('sem sessão responde 401 NAO_AUTENTICADO', async () => {
    const contrato = await criarContratoComPdf();

    const res = await request(app).get(`/api/contratos/${contrato.id}/arquivo`);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});
