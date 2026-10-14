import { z } from 'zod';

/** Data no formato AAAA-MM-DD que existe de verdade no calendário (recusa 2025-02-30). */
function dataIso(mensagem: string) {
  return z
    .string({ error: mensagem })
    .trim()
    .refine((valor) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
      const data = new Date(`${valor}T00:00:00.000Z`);
      return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
    }, mensagem);
}

const MENSAGEM_DATA = 'Data inválida. Use o formato AAAA-MM-DD.';

/** Campos de texto do formulário multipart (o arquivo é tratado à parte, em http/upload.ts). */
export const esquemaContrato = z.object({
  titulo: z
    .string({ error: 'Informe o título.' })
    .trim()
    .superRefine((valor, ctx) => {
      let mensagem: string | null = null;
      if (valor.length === 0) mensagem = 'Informe o título.';
      else if (valor.includes('\u0000')) mensagem = 'Título contém caractere inválido.';
      else if (valor.length < 3) mensagem = 'Título deve ter ao menos 3 caracteres.';
      else if (valor.length > 200) mensagem = 'Título deve ter no máximo 200 caracteres.';
      if (mensagem) ctx.addIssue({ code: 'custom', message: mensagem });
    }),
  dataAssinatura: dataIso(MENSAGEM_DATA),
  clienteId: z
    .string({ error: 'Informe o cliente.' })
    .trim()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Cliente inválido.'),
});

export type DadosContrato = z.infer<typeof esquemaContrato>;

export const esquemaListagemContratos = z
  .object({
    titulo: z.string().trim().optional(),
    dataInicio: dataIso(MENSAGEM_DATA).optional(),
    dataFim: dataIso(MENSAGEM_DATA).optional(),
    pagina: z.coerce
      .number({ error: 'Página inválida.' })
      .int('Página inválida.')
      .min(1, 'Página inválida.')
      .default(1),
  })
  .superRefine((valor, ctx) => {
    // AAAA-MM-DD compara certo como texto.
    if (valor.dataInicio && valor.dataFim && valor.dataInicio > valor.dataFim) {
      ctx.addIssue({
        code: 'custom',
        path: ['dataInicio'],
        message: 'A data inicial não pode ser depois da data final.',
      });
    }
  });

export type ConsultaContratos = z.infer<typeof esquemaListagemContratos>;
