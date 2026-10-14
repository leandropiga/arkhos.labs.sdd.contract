import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { ErroIA, type ClienteIA, type ResultadoIA } from '../../src/modules/analise/cliente-ia.js';
import { gravarNoStorage, pdfValido, prepararPastas, removerPastas } from '../helpers/arquivos.js';
import { inserirCliente, inserirContrato } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// Contrato: POST /api/contratos/:id/analise (contracts/api.md, "Análise por IA") e a trava
// de análise simultânea (research.md R-09). O ClienteIA real nunca é chamado: entra um dublê.

const INEXISTENTE = '00000000-0000-4000-8000-000000000000';
const PDF = pdfValido('para analisar');

const sucesso = (resumo: string): ResultadoIA => ({
  analisavel: true,
  resumo,
  riscos: [{ titulo: 'Multa abusiva', descricao: 'A multa passa de 50%.', gravidade: 'ALTA' }],
  clausulasCriticas: [{ clausula: 'Cláusula 7', motivo: 'Rescisão unilateral.' }],
});

const analisarContrato = vi.fn<ClienteIA['analisarContrato']>();
// Tempo-limite curto nos testes: o dublê que nunca responde não faz o teste esperar 15 s.
const app = criarApp({ clienteIA: { analisarContrato }, tempoLimiteIaMs: 100 });
let cookie: string;
let clienteId: string;

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());
  clienteId = (await inserirCliente(1, 'Cliente Dono')).id;
});

beforeEach(async () => {
  await prepararPastas();
  await prisma.contrato.deleteMany();
  analisarContrato.mockReset();
});

afterAll(async () => {
  await removerPastas();
});

async function criarContratoComPdf() {
  const contrato = await inserirContrato(clienteId, 'Contrato Análise', '2025-03-10', {
    nome: 'contrato.pdf',
    tamanho: PDF.length,
  });
  await gravarNoStorage(contrato.id, PDF);
  return contrato;
}

const analisar = (id: string) => request(app).post(`/api/contratos/${id}/analise`).set('Cookie', cookie);
const detalhe = (id: string) => request(app).get(`/api/contratos/${id}`).set('Cookie', cookie);

describe('POST /api/contratos/:id/analise', () => {
  it('sucesso: 200 com a Analise, lê o PDF do storage e o GET passa a trazer a análise', async () => {
    const contrato = await criarContratoComPdf();
    analisarContrato.mockResolvedValue(sucesso('Resumo A'));

    const res = await analisar(contrato.id);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      resumo: 'Resumo A',
      riscos: [{ titulo: 'Multa abusiva', descricao: 'A multa passa de 50%.', gravidade: 'ALTA' }],
      clausulasCriticas: [{ clausula: 'Cláusula 7', motivo: 'Rescisão unilateral.' }],
      geradaEm: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(res.body.geradaEm))).toBe(false);
    expect(analisarContrato).toHaveBeenCalledTimes(1);
    expect((analisarContrato.mock.calls[0]![0] as Buffer).equals(PDF)).toBe(true);

    const get = await detalhe(contrato.id);
    expect(get.status).toBe(200);
    expect(get.body.analise).toEqual(res.body);
    expect(get.body.analiseEmAndamento).toBe(false);
  });

  it('nova análise substitui a anterior (uma só linha)', async () => {
    const contrato = await criarContratoComPdf();
    analisarContrato.mockResolvedValueOnce(sucesso('Primeira'));
    analisarContrato.mockResolvedValueOnce(sucesso('Segunda'));

    await analisar(contrato.id);
    const res = await analisar(contrato.id);

    expect(res.status).toBe(200);
    expect(res.body.resumo).toBe('Segunda');
    expect((await detalhe(contrato.id)).body.analise.resumo).toBe('Segunda');
    expect(await prisma.analiseContrato.count({ where: { contratoId: contrato.id } })).toBe(1);
  });

  it('IA que falha: 503 IA_INDISPONIVEL sem vazar detalhes, análise anterior intacta e trava liberada', async () => {
    const contrato = await criarContratoComPdf();
    analisarContrato.mockResolvedValueOnce(sucesso('Anterior'));
    await analisar(contrato.id);
    analisarContrato.mockRejectedValueOnce(
      new ErroIA('Falha ao consultar a IA', { cause: new Error('chave AIzaSECRETA em C:\\segredo\\x') }),
    );

    const res = await analisar(contrato.id);

    expect(res.status).toBe(503);
    expect(res.body.erro.codigo).toBe('IA_INDISPONIVEL');
    expect(JSON.stringify(res.body)).not.toMatch(/AIza|segredo|stack|Falha ao consultar/);
    const get = await detalhe(contrato.id);
    expect(get.body.analise.resumo).toBe('Anterior');
    expect(get.body.analiseEmAndamento).toBe(false);

    analisarContrato.mockResolvedValueOnce(sucesso('Depois da falha'));
    expect((await analisar(contrato.id)).status).toBe(200);
  });

  it('IA que demora além do tempo-limite: 503 IA_INDISPONIVEL e trava liberada', async () => {
    const contrato = await criarContratoComPdf();
    analisarContrato.mockImplementationOnce(() => new Promise<ResultadoIA>(() => undefined));

    const res = await analisar(contrato.id);

    expect(res.status).toBe(503);
    expect(res.body.erro.codigo).toBe('IA_INDISPONIVEL');
    expect(await prisma.analiseContrato.count({ where: { contratoId: contrato.id } })).toBe(0);
    expect((await detalhe(contrato.id)).body.analiseEmAndamento).toBe(false);
  });

  it('PDF sem texto analisável: 422 PDF_NAO_ANALISAVEL, nada gravado e trava liberada', async () => {
    const contrato = await criarContratoComPdf();
    analisarContrato.mockResolvedValue({ analisavel: false });

    const res = await analisar(contrato.id);

    expect(res.status).toBe(422);
    expect(res.body.erro.codigo).toBe('PDF_NAO_ANALISAVEL');
    const get = await detalhe(contrato.id);
    expect(get.body.analise).toBeNull();
    expect(get.body.analiseEmAndamento).toBe(false);
  });

  it('análise em andamento (trava recente): 409 ANALISE_EM_ANDAMENTO sem chamar a IA', async () => {
    const contrato = await criarContratoComPdf();
    await prisma.contrato.update({ where: { id: contrato.id }, data: { analiseIniciadaEm: new Date() } });

    const res = await analisar(contrato.id);

    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('ANALISE_EM_ANDAMENTO');
    expect(analisarContrato).not.toHaveBeenCalled();
    expect((await detalhe(contrato.id)).body.analiseEmAndamento).toBe(true);
  });

  it('duas chamadas simultâneas: uma roda (200) e a outra recebe 409', async () => {
    const contrato = await criarContratoComPdf();
    let liberar!: (r: ResultadoIA) => void;
    analisarContrato.mockImplementationOnce(
      () =>
        new Promise<ResultadoIA>((ok) => {
          liberar = ok;
        }),
    );

    const primeira = analisar(contrato.id).then((r) => r);
    await vi.waitFor(() => expect(analisarContrato).toHaveBeenCalledTimes(1));
    const segunda = await analisar(contrato.id);
    liberar(sucesso('Única'));

    expect(segunda.status).toBe(409);
    expect((await primeira).status).toBe(200);
    expect(analisarContrato).toHaveBeenCalledTimes(1);
  });

  it('trava antiga (mais de 60 s) não bloqueia: a análise roda', async () => {
    const contrato = await criarContratoComPdf();
    await prisma.contrato.update({
      where: { id: contrato.id },
      data: { analiseIniciadaEm: new Date(Date.now() - 61_000) },
    });
    analisarContrato.mockResolvedValue(sucesso('Destravada'));

    const res = await analisar(contrato.id);

    expect(res.status).toBe(200);
    expect(res.body.resumo).toBe('Destravada');
  });

  it('contrato inexistente ou id malformado: 404 NAO_ENCONTRADO', async () => {
    for (const id of [INEXISTENTE, 'nao-e-uuid']) {
      const res = await analisar(id);
      expect(res.status).toBe(404);
      expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
    }
    expect(analisarContrato).not.toHaveBeenCalled();
  });

  it('PDF sumido do storage: 404 sem vazar caminho e trava liberada', async () => {
    const contrato = await inserirContrato(clienteId, 'Sem arquivo', '2025-03-10');

    const res = await analisar(contrato.id);

    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('NAO_ENCONTRADO');
    expect(JSON.stringify(res.body)).not.toMatch(/ENOENT|storage|[\\/]/);
    expect((await detalhe(contrato.id)).body.analiseEmAndamento).toBe(false);
  });

  it('sem sessão: 401 NAO_AUTENTICADO', async () => {
    const contrato = await criarContratoComPdf();

    const res = await request(app).post(`/api/contratos/${contrato.id}/analise`);

    expect(res.status).toBe(401);
    expect(res.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});

describe('FR-031: substituir o PDF pelo PUT descarta a análise', () => {
  it('PUT com arquivo novo apaga a análise; PUT sem arquivo a mantém', async () => {
    const contrato = await criarContratoComPdf();
    analisarContrato.mockResolvedValue(sucesso('Velha'));
    await analisar(contrato.id);

    const campos = { titulo: 'Título Novo', dataAssinatura: '2025-04-20', clienteId };
    const semArquivo = request(app).put(`/api/contratos/${contrato.id}`).set('Cookie', cookie);
    for (const [k, v] of Object.entries(campos)) semArquivo.field(k, v);
    expect((await semArquivo).status).toBe(200);
    expect((await detalhe(contrato.id)).body.analise.resumo).toBe('Velha');

    const comArquivo = request(app).put(`/api/contratos/${contrato.id}`).set('Cookie', cookie);
    for (const [k, v] of Object.entries(campos)) comArquivo.field(k, v);
    comArquivo.attach('arquivo', pdfValido('novo'), { filename: 'novo.pdf', contentType: 'application/pdf' });
    const res = await comArquivo;

    expect(res.status).toBe(200);
    expect(res.body.analise).toBeNull();
    expect((await detalhe(contrato.id)).body.analise).toBeNull();
    expect(await prisma.analiseContrato.count({ where: { contratoId: contrato.id } })).toBe(0);
  });
});

describe('PUT com PDF novo durante a análise em curso', () => {
  // Tempo-limite folgado: aqui o dublê espera o teste, que faz um PUT no meio.
  const appLongo = criarApp({ clienteIA: { analisarContrato }, tempoLimiteIaMs: 10_000 });
  const analisar = (id: string) => request(appLongo).post(`/api/contratos/${id}/analise`).set('Cookie', cookie);

  function trocarPdf(id: string) {
    return request(appLongo)
      .put(`/api/contratos/${id}`)
      .set('Cookie', cookie)
      .field('titulo', 'Título Novo')
      .field('dataAssinatura', '2025-04-20')
      .field('clienteId', clienteId)
      .attach('arquivo', pdfValido('trocado'), { filename: 'novo.pdf', contentType: 'application/pdf' });
  }

  it('a análise do PDF antigo é descartada (409) e não é gravada', async () => {
    const contrato = await criarContratoComPdf();
    let liberar!: (r: ResultadoIA) => void;
    analisarContrato.mockImplementationOnce(
      () =>
        new Promise<ResultadoIA>((ok) => {
          liberar = ok;
        }),
    );

    const andamento = analisar(contrato.id).then((r) => r);
    await vi.waitFor(() => expect(analisarContrato).toHaveBeenCalledTimes(1));
    expect((await trocarPdf(contrato.id)).status).toBe(200);
    liberar(sucesso('Do PDF antigo'));
    const res = await andamento;

    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('ANALISE_EM_ANDAMENTO');
    expect(await prisma.analiseContrato.count({ where: { contratoId: contrato.id } })).toBe(0);
    expect((await detalhe(contrato.id)).body.analiseEmAndamento).toBe(false);
  });

  it('não libera a trava de uma segunda análise iniciada depois do PUT', async () => {
    const contrato = await criarContratoComPdf();
    let liberarPrimeira!: (r: ResultadoIA) => void;
    let liberarSegunda!: (r: ResultadoIA) => void;
    analisarContrato.mockImplementationOnce(
      () => new Promise<ResultadoIA>((ok) => { liberarPrimeira = ok; }),
    );
    analisarContrato.mockImplementationOnce(
      () => new Promise<ResultadoIA>((ok) => { liberarSegunda = ok; }),
    );

    const primeira = analisar(contrato.id).then((r) => r);
    await vi.waitFor(() => expect(analisarContrato).toHaveBeenCalledTimes(1));
    await trocarPdf(contrato.id);
    const segunda = analisar(contrato.id).then((r) => r);
    await vi.waitFor(() => expect(analisarContrato).toHaveBeenCalledTimes(2));

    liberarPrimeira(sucesso('Antiga'));
    expect((await primeira).status).toBe(409);
    // A trava da segunda continua de pé e nada foi gravado.
    expect((await detalhe(contrato.id)).body.analiseEmAndamento).toBe(true);
    expect(await prisma.analiseContrato.count({ where: { contratoId: contrato.id } })).toBe(0);

    liberarSegunda(sucesso('Do PDF novo'));
    const res = await segunda;
    expect(res.status).toBe(200);
    expect(res.body.resumo).toBe('Do PDF novo');
    expect((await detalhe(contrato.id)).body.analiseEmAndamento).toBe(false);
  });
});
