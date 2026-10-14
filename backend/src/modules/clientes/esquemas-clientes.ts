import { z } from 'zod';
import { cpfValido, normalizarCpf } from '../../lib/cpf.js';

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB',
  'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

/** Texto obrigatório com limites (sem espaços nas pontas). */
function texto(rotulo: string, min: number, max: number) {
  const obrigatorio = `Informe ${rotulo}.`;
  return z
    .string({ error: obrigatorio })
    .trim()
    .min(1, obrigatorio)
    .min(min, `${rotulo[0]!.toUpperCase()}${rotulo.slice(1)} deve ter ao menos ${min} caracteres.`)
    .max(max, `${rotulo[0]!.toUpperCase()}${rotulo.slice(1)} deve ter no máximo ${max} caracteres.`);
}

/**
 * Valor numérico que pode vir com pontuação (. - / espaço e parênteses): guarda só os dígitos.
 * Letras e outros símbolos são recusados (não são pontuação).
 */
function somenteDigitos(mensagem: string, ehValido: (digitos: string) => boolean) {
  return z
    .string({ error: mensagem })
    .trim()
    .refine((valor) => /^[\d.\-/\s()]+$/.test(valor), mensagem)
    .transform((valor) => valor.replace(/\D/g, ''))
    .refine(ehValido, mensagem);
}

export const esquemaCliente = z.object({
  nomeCompleto: texto('o nome completo', 3, 150),
  telefone: somenteDigitos('Telefone inválido. Informe DDD e número (10 ou 11 dígitos).', (d) =>
    /^\d{10,11}$/.test(d),
  ),
  cpf: z
    .string({ error: 'Informe o CPF.' })
    .trim()
    .refine(cpfValido, 'CPF inválido.')
    .transform(normalizarCpf),
  rg: texto('o RG', 1, 20),
  logradouro: texto('o logradouro', 1, 200),
  numero: texto('o número', 1, 20),
  cep: somenteDigitos('CEP inválido. Informe os 8 dígitos.', (d) => /^\d{8}$/.test(d)),
  cidade: texto('a cidade', 1, 100),
  // Só as 27 siglas em maiúsculas; sem normalização implícita ("sp" é recusado).
  uf: z.enum(UFS, { error: 'UF inválida. Use uma das 27 siglas, em maiúsculas.' }),
});

export type DadosCliente = z.infer<typeof esquemaCliente>;

export const esquemaListagemClientes = z.object({
  nome: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  pagina: z.coerce
    .number({ error: 'Página inválida.' })
    .int('Página inválida.')
    .min(1, 'Página inválida.')
    .default(1),
});

export type ConsultaClientes = z.infer<typeof esquemaListagemClientes>;
