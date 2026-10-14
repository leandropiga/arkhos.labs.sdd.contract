import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../../config/env.js';

// Único lugar (junto com config/env.ts) que conhece a GEMINI_API_KEY.

export const MODELO_IA = 'gemini-3.8-flash';
export const TEMPO_LIMITE_IA_MS = 15_000;

const gravidade = z.enum(['BAIXA', 'MEDIA', 'ALTA']);

const risco = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  gravidade,
});

const clausulaCritica = z.object({
  clausula: z.string().min(1),
  motivo: z.string().min(1),
});

/** Formato exato que a IA deve devolver (também enviado ao Gemini como schema de saída). */
const respostaDaIA = z.discriminatedUnion('analisavel', [
  z.object({ analisavel: z.literal(false) }),
  z.object({
    analisavel: z.literal(true),
    resumo: z.string().min(1),
    riscos: z.array(risco),
    clausulasCriticas: z.array(clausulaCritica),
  }),
]);

/**
 * Resultado de ClienteIA.analisarContrato (consumido pelo serviço de análise, T063):
 * - `{ analisavel: false }`: o PDF não tem texto analisável (ex.: imagem escaneada) -> 422 PDF_NAO_ANALISAVEL.
 * - `{ analisavel: true, resumo, riscos, clausulasCriticas }`: análise pronta para gravar.
 * Qualquer falha (rede, tempo-limite de 15 s, resposta fora do formato) lança `ErroIA` -> 503 IA_INDISPONIVEL.
 */
export type ResultadoIA = z.infer<typeof respostaDaIA>;

export class ErroIA extends Error {
  constructor(mensagem: string, opcoes?: { cause?: unknown }) {
    super(mensagem, opcoes);
    this.name = 'ErroIA';
  }
}

/** Contrato injetável (T064): nos testes de rota entra um dublê no lugar da implementação real. */
export interface ClienteIA {
  analisarContrato(pdf: Buffer): Promise<ResultadoIA>;
}

const PROMPT = `Você é um assistente jurídico. Analise o contrato em PDF anexo e responda SEMPRE em português do Brasil.
Produza:
- "resumo": um resumo executivo dos riscos jurídicos do contrato, em poucos parágrafos curtos;
- "riscos": lista de riscos, cada um com "titulo", "descricao" e "gravidade" ("BAIXA", "MEDIA" ou "ALTA");
- "clausulasCriticas": lista de cláusulas que merecem atenção, cada uma com "clausula" (identificação ou trecho) e "motivo".
Se o PDF não tiver texto que permita uma análise (por exemplo, é só imagem, está ilegível ou não é um contrato), responda apenas { "analisavel": false }.
Caso contrário, use "analisavel": true e preencha todos os campos.`;

// Schema enviado ao Gemini: plano (sem união), pois a validação rigorosa é feita com zod na volta.
const SCHEMA_SAIDA = {
  type: 'object',
  properties: {
    analisavel: { type: 'boolean' },
    resumo: { type: 'string' },
    riscos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          descricao: { type: 'string' },
          gravidade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA'] },
        },
        required: ['titulo', 'descricao', 'gravidade'],
      },
    },
    clausulasCriticas: {
      type: 'array',
      items: {
        type: 'object',
        properties: { clausula: { type: 'string' }, motivo: { type: 'string' } },
        required: ['clausula', 'motivo'],
      },
    },
  },
  required: ['analisavel'],
};

/** Implementação real, com o SDK `@google/genai`. Sem argumento, lê a chave do env. */
export function criarClienteIA(apiKey: string = env().GEMINI_API_KEY): ClienteIA {
  const ia = new GoogleGenAI({ apiKey });

  return {
    async analisarContrato(pdf) {
      let texto: string | undefined;
      try {
        const resposta = await ia.models.generateContent({
          model: MODELO_IA,
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'application/pdf', data: pdf.toString('base64') } },
                { text: PROMPT },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: SCHEMA_SAIDA,
            abortSignal: AbortSignal.timeout(TEMPO_LIMITE_IA_MS),
          },
        });
        texto = resposta.text; // propriedade, não método
      } catch (erro) {
        throw new ErroIA('Falha ao consultar a IA (erro do serviço ou tempo-limite excedido).', { cause: erro });
      }

      if (!texto) throw new ErroIA('A IA devolveu uma resposta vazia.');

      let json: unknown;
      try {
        json = JSON.parse(texto);
      } catch (erro) {
        throw new ErroIA('A IA devolveu um texto que não é JSON.', { cause: erro });
      }

      const validada = respostaDaIA.safeParse(json);
      if (!validada.success) {
        throw new ErroIA('A resposta da IA está fora do formato esperado.', { cause: validada.error });
      }
      return validada.data;
    },
  };
}
