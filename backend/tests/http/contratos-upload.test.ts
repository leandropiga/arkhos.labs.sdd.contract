import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
// Este import vem antes do app: ele aponta UPLOAD_TMP_DIR e STORAGE_DIR para pastas de teste.
import {
  caminhoNoStorage, dirStorage, dirTmp, listar, pdfFalso, pdfGrande, pdfTruncado, pdfValido,
  prepararPastas, removerPastas,
} from '../helpers/arquivos.js';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { inserirCliente } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: POST /api/contratos (multipart) -> 201 | 400 VALIDACAO_INVALIDA | 400 ARQUIVO_INVALIDO
// | 413 ARQUIVO_MUITO_GRANDE (contracts/api.md). Princípio IV: o temporário é apagado SEMPRE.

const app = criarApp();
let cookie: string;
let clienteId: string;

const INEXISTENTE = '00000000-0000-4000-8000-000000000000';

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
  clienteId = (await inserirCliente(1, 'Cliente Dono')).id;
});

beforeEach(async () => {
  await prepararPastas();
  await prisma.contrato.deleteMany();
});

afterAll(async () => {
  await removerPastas();
});

function enviar(
  arquivo: { conteudo: Buffer; nome?: string } | null,
  campos: Record<string, string> = {},
) {
  const dados = { titulo: 'Contrato de Teste', dataAssinatura: '2025-03-10', clienteId, ...campos };
  let req = request(app).post('/api/contratos').set('Cookie', cookie);
  for (const [chave, valor] of Object.entries(dados)) req = req.field(chave, valor);
  if (arquivo) {
    req = req.attach('arquivo', arquivo.conteudo, {
      filename: arquivo.nome ?? 'contrato.pdf',
      contentType: 'application/pdf',
    });
  }
  return req;
}

/** Nada ficou no temporário e nada novo foi guardado nem gravado no banco. */
async function esperarNadaGuardado() {
  expect(await listar(dirTmp())).toEqual([]);
  expect(await listar(dirStorage())).toEqual([]);
  expect(await prisma.contrato.count()).toBe(0);
}

describe('POST /api/contratos (sucesso)', () => {
  it('PDF válido responde 201 com o Contrato e guarda o arquivo em STORAGE_DIR/<id>.pdf', async () => {
    const conteudo = pdfValido();

    const res = await enviar({ conteudo, nome: 'meu contrato.pdf' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      titulo: 'Contrato de Teste',
      dataAssinatura: '2025-03-10',
      cliente: { id: clienteId, nomeCompleto: 'Cliente Dono' },
      arquivoNomeOriginal: 'meu contrato.pdf',
      arquivoTamanhoBytes: conteudo.length,
      analiseEmAndamento: false,
      analise: null,
    });
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);

    expect(await listar(dirStorage())).toEqual([`${res.body.id}.pdf`]);
    expect((await readFile(caminhoNoStorage(res.body.id))).equals(conteudo)).toBe(true);
    expect(await listar(dirTmp())).toEqual([]);

    const linha = await prisma.contrato.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(linha).toMatchObject({
      titulo: 'Contrato de Teste',
      tituloBusca: 'contrato de teste',
      clienteId,
      arquivoNomeOriginal: 'meu contrato.pdf',
      arquivoTamanhoBytes: conteudo.length,
    });
  });
});

describe('POST /api/contratos (arquivo inválido)', () => {
  it('arquivo .pdf sem a assinatura %PDF- responde 400 ARQUIVO_INVALIDO', async () => {
    const res = await enviar({ conteudo: pdfFalso(), nome: 'falso.pdf' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('ARQUIVO_INVALIDO');
    await esperarNadaGuardado();
  });

  it('PDF truncado (sem %%EOF nos últimos 1024 bytes) responde 400 ARQUIVO_INVALIDO', async () => {
    const res = await enviar({ conteudo: pdfTruncado(), nome: 'cortado.pdf' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('ARQUIVO_INVALIDO');
    await esperarNadaGuardado();
  });

  it('sem arquivo responde 400 ARQUIVO_INVALIDO', async () => {
    const res = await enviar(null);

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('ARQUIVO_INVALIDO');
    await esperarNadaGuardado();
  });

  it('acima de 50 MB (52.428.800 bytes) responde 413 ARQUIVO_MUITO_GRANDE', async () => {
    const res = await enviar({ conteudo: pdfGrande(), nome: 'enorme.pdf' });

    expect(res.status).toBe(413);
    expect(res.body.erro.codigo).toBe('ARQUIVO_MUITO_GRANDE');
    await esperarNadaGuardado();
  });
});

describe('POST /api/contratos (campos inválidos)', () => {
  it('clienteId inexistente responde 400 VALIDACAO_INVALIDA citando clienteId', async () => {
    const res = await enviar({ conteudo: pdfValido() }, { clienteId: INEXISTENTE });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos.map((c: { campo: string }) => c.campo)).toContain('clienteId');
    await esperarNadaGuardado();
  });

  it('título vazio com PDF válido responde 400 VALIDACAO_INVALIDA citando titulo', async () => {
    const res = await enviar({ conteudo: pdfValido() }, { titulo: '' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos.map((c: { campo: string }) => c.campo)).toContain('titulo');
    await esperarNadaGuardado();
  });

  it('data de assinatura inválida com PDF válido responde 400 VALIDACAO_INVALIDA citando dataAssinatura', async () => {
    const res = await enviar({ conteudo: pdfValido() }, { dataAssinatura: '10/03/2025' });

    expect(res.status).toBe(400);
    expect(res.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(res.body.erro.campos.map((c: { campo: string }) => c.campo)).toContain('dataAssinatura');
    await esperarNadaGuardado();
  });
});

describe('POST /api/contratos (sessão)', () => {
  it('sem sessão responde 401 NAO_AUTENTICADO e não guarda nada', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .field('titulo', 'Sem Sessão')
      .field('dataAssinatura', '2025-03-10')
      .field('clienteId', clienteId)
      .attach('arquivo', pdfValido(), { filename: 'a.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
    await esperarNadaGuardado();
  });
});
