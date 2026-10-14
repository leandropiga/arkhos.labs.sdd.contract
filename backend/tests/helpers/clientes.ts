import { prisma } from '../../src/lib/prisma.js';

function digito(base: number[]): number {
  const soma = base.reduce((acc, d, i) => acc + d * (base.length + 1 - i), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** Gera um CPF válido (só dígitos) a partir de um número de série; séries diferentes dão CPFs diferentes. */
export function gerarCpf(serie: number): string {
  // 9 dígitos de base; o 1º vira 1..9 para nunca formar sequência repetida.
  const base = String(100_000_000 + serie * 7919)
    .padStart(9, '0')
    .slice(-9)
    .split('')
    .map(Number);
  const d1 = digito(base);
  const d2 = digito([...base, d1]);
  return [...base, d1, d2].join('');
}

export function formatarCpf(cpf: string): string {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

/** Corpo válido para POST/PUT /api/clientes (CPF só com dígitos). */
export function corpoCliente(serie = 1, extras: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    nomeCompleto: `Cliente Número ${serie}`,
    telefone: '11987654321',
    cpf: gerarCpf(serie),
    rg: '12.345.678-9',
    logradouro: 'Rua das Flores',
    numero: '123',
    cep: '01310100',
    cidade: 'São Paulo',
    uf: 'SP',
    ...extras,
  };
}

/** Insere um cliente direto pelo Prisma (sem passar pela API). */
export async function inserirCliente(serie: number, nomeCompleto: string, cpf = gerarCpf(serie)) {
  return prisma.cliente.create({
    data: {
      nomeCompleto,
      nomeBusca: nomeCompleto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase(),
      telefone: '11987654321',
      cpf,
      rg: '123456789',
      logradouro: 'Rua das Flores',
      numero: '123',
      cep: '01310100',
      cidade: 'São Paulo',
      uf: 'SP',
    },
  });
}

/** Insere um contrato direto pelo Prisma (sem arquivo real em disco). */
export async function inserirContrato(clienteId: string, titulo: string, dataAssinatura: string) {
  return prisma.contrato.create({
    data: {
      titulo,
      tituloBusca: titulo.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase(),
      dataAssinatura: new Date(`${dataAssinatura}T00:00:00.000Z`),
      clienteId,
      arquivoNomeOriginal: `${titulo}.pdf`,
      arquivoTamanhoBytes: 1024,
    },
  });
}
