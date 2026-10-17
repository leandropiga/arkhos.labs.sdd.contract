import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// T081: a janela entre o commit do PUT e o rename do PDF novo. Um POST /analise que entre nela
// leria o PDF ANTIGO com a trava livre e gravaria a análise dele como se fosse do novo.
// O gancho abaixo roda exatamente quando o PUT move o PDF para o storage.
const gancho = vi.hoisted(() => ({ aoSalvar: undefined as undefined | (() => Promise<void>) }));

vi.mock('../../src/lib/armazenamento.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/lib/armazenamento.js')>();
  return {
    ...original,
    salvarDoTemporario: async (caminhoTmp: string, id: string) => {
      await gancho.aoSalvar?.();
      return original.salvarDoTemporario(caminhoTmp, id);
    },
  };
});

const { criarApp } = await import('../../src/app.js');
const { prisma } = await import('../../src/lib/prisma.js');
const { gravarNoStorage, caminhoNoStorage, pdfValido, prepararPastas, removerPastas } = await import(
  '../helpers/arquivos.js'
);
const { inserirCliente, inserirContrato } = await import('../helpers/clientes.js');
const { criarUsuarioELogar } = await import('../helpers/sessao.js');
const { readFile } = await import('node:fs/promises');
import type { ClienteIA, ResultadoIA } from '../../src/modules/analise/cliente-ia.js';

const ANTIGO = pdfValido('antigo');
const NOVO = pdfValido('novo');

const analisarContrato = vi.fn<ClienteIA['analisarContrato']>();
const app = criarApp({ clienteIA: { analisarContrato }, tempoLimiteIaMs: 10_000 });
let cookie: string;
let clienteId: string;

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
  clienteId = (await inserirCliente(1, 'Cliente Corrida')).id;
});

beforeEach(async () => {
  await prepararPastas();
  await prisma.contrato.deleteMany();
  analisarContrato.mockReset();
  gancho.aoSalvar = undefined;
});

afterAll(async () => {
  gancho.aoSalvar = undefined;
  await removerPastas();
});

describe('PUT com PDF novo x POST /analise no intervalo da troca do arquivo', () => {
  it('nunca grava a análise do PDF antigo como se fosse a do novo', async () => {
    const contrato = await inserirContrato(clienteId, 'Contrato Corrida', '2025-03-10', {
      nome: 'contrato.pdf',
      tamanho: ANTIGO.length,
    });
    await gravarNoStorage(contrato.id, ANTIGO);

    const resultado: ResultadoIA = { analisavel: true, resumo: 'R', riscos: [], clausulasCriticas: [] };
    analisarContrato.mockResolvedValue(resultado);

    let analise: Promise<unknown> = Promise.resolve();
    gancho.aoSalvar = async () => {
      // Dispara a análise no meio da troca e dá um tempo para ela avançar (se puder).
      analise = request(app)
        .post(`/api/contratos/${contrato.id}/analise`)
        .set('Cookie', cookie)
        .then((r) => r);
      await new Promise((r) => setTimeout(r, 400));
    };

    const put = await request(app)
      .put(`/api/contratos/${contrato.id}`)
      .set('Cookie', cookie)
      .field('titulo', 'Título Novo')
      .field('dataAssinatura', '2025-04-20')
      .field('clienteId', clienteId)
      .attach('arquivo', NOVO, { filename: 'novo.pdf', contentType: 'application/pdf' });
    expect(put.status).toBe(200);
    const respostaAnalise = (await analise) as { status: number };

    expect((await readFile(caminhoNoStorage(contrato.id))).equals(NOVO)).toBe(true);
    // O POST tem de ter chegado à IA e analisado o PDF novo.
    expect(respostaAnalise.status).toBe(200);
    expect(analisarContrato).toHaveBeenCalled();
    // Toda análise que chegou à IA tem de ter lido o PDF novo.
    for (const chamada of analisarContrato.mock.calls) {
      expect((chamada[0] as Buffer).equals(NOVO)).toBe(true);
    }
  });
});
