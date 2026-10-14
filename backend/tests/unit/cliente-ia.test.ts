import { beforeEach, describe, expect, it, vi } from 'vitest';

// O SDK real nunca é chamado: `GoogleGenAI` vira um dublê cujo `models.generateContent` controlamos.
const generateContent = vi.hoisted(() => vi.fn());
const construtor = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
    constructor(opcoes: unknown) {
      construtor(opcoes);
    }
  },
}));

import { ErroIA, criarClienteIA } from '../../src/modules/analise/cliente-ia.js';

const pdf = Buffer.from('%PDF-1.4\nconteudo\n%%EOF\n', 'latin1');

const analiseValida = {
  analisavel: true,
  resumo: 'Contrato com riscos moderados.',
  riscos: [{ titulo: 'Multa alta', descricao: 'Multa de 50% do valor.', gravidade: 'ALTA' }],
  clausulasCriticas: [{ clausula: 'Cláusula 7', motivo: 'Rescisão unilateral.' }],
};

beforeEach(() => {
  generateContent.mockReset();
  construtor.mockReset();
});

describe('criarClienteIA', () => {
  it('chama generateContent com modelo, PDF inline em base64, JSON e abortSignal', async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(analiseValida) });

    const resultado = await criarClienteIA('chave-x').analisarContrato(pdf);

    expect(construtor).toHaveBeenCalledWith({ apiKey: 'chave-x' });
    expect(generateContent).toHaveBeenCalledTimes(1);
    const arg = generateContent.mock.calls[0][0];
    expect(arg.model).toBe('gemini-3.8-flash');
    const partes = arg.contents[0].parts;
    const inline = partes.find((p: { inlineData?: unknown }) => p.inlineData)?.inlineData;
    expect(inline).toEqual({ mimeType: 'application/pdf', data: pdf.toString('base64') });
    expect(partes.some((p: { text?: string }) => typeof p.text === 'string' && p.text.length > 0)).toBe(true);
    expect(arg.config.responseMimeType).toBe('application/json');
    expect(arg.config.abortSignal).toBeInstanceOf(AbortSignal);
    expect(resultado).toEqual(analiseValida);
  });

  it('pede o tempo-limite de 15 s ao AbortSignal.timeout', async () => {
    const espiao = vi.spyOn(AbortSignal, 'timeout');
    generateContent.mockResolvedValue({ text: JSON.stringify(analiseValida) });
    await criarClienteIA('k').analisarContrato(pdf);
    expect(espiao).toHaveBeenCalledWith(15_000);
    espiao.mockRestore();
  });

  it('devolve { analisavel: false } quando a IA diz que o PDF não é analisável', async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify({ analisavel: false }) });
    await expect(criarClienteIA('k').analisarContrato(pdf)).resolves.toEqual({ analisavel: false });
  });

  it('lê response.text como propriedade (não como função)', async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify({ analisavel: false }) });
    await expect(criarClienteIA('k').analisarContrato(pdf)).resolves.toEqual({ analisavel: false });
  });

  it('falha com ErroIA quando o JSON está fora do schema', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({ ...analiseValida, riscos: [{ titulo: 'x', descricao: 'y', gravidade: 'ENORME' }] }),
    });
    await expect(criarClienteIA('k').analisarContrato(pdf)).rejects.toBeInstanceOf(ErroIA);
  });

  it('falha com ErroIA quando o texto não é JSON ou vem vazio', async () => {
    generateContent.mockResolvedValue({ text: 'isto não é json' });
    await expect(criarClienteIA('k').analisarContrato(pdf)).rejects.toBeInstanceOf(ErroIA);
    generateContent.mockResolvedValue({ text: undefined });
    await expect(criarClienteIA('k').analisarContrato(pdf)).rejects.toBeInstanceOf(ErroIA);
  });

  it('falha com ErroIA quando o tempo-limite aborta a chamada', async () => {
    const espiao = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());
    generateContent.mockImplementation(({ config }: { config: { abortSignal: AbortSignal } }) =>
      config.abortSignal.aborted
        ? Promise.reject(new DOMException('The operation was aborted.', 'AbortError'))
        : Promise.resolve({ text: JSON.stringify(analiseValida) }),
    );
    await expect(criarClienteIA('k').analisarContrato(pdf)).rejects.toBeInstanceOf(ErroIA);
    espiao.mockRestore();
  });

  it('embrulha qualquer erro do SDK em ErroIA', async () => {
    generateContent.mockRejectedValue(new Error('503 do Gemini'));
    await expect(criarClienteIA('k').analisarContrato(pdf)).rejects.toBeInstanceOf(ErroIA);
  });
});
