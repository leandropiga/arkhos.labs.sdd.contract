import { prisma } from '../../lib/prisma.js';

export interface Painel {
  totalClientes: number;
  totalContratos: number;
  clientesPorUf: { uf: string; total: number }[];
}

/** Totais do painel: clientes, contratos e clientes por UF (só UFs com ao menos um cliente). */
export async function obterPainel(): Promise<Painel> {
  const [totalClientes, totalContratos, porUf] = await Promise.all([
    prisma.cliente.count(),
    prisma.contrato.count(),
    prisma.cliente.groupBy({ by: ['uf'], _count: { _all: true } }),
  ]);
  const clientesPorUf = porUf
    .map((g) => ({ uf: g.uf as string, total: g._count._all }))
    .sort((a, b) => b.total - a.total || a.uf.localeCompare(b.uf));
  return { totalClientes, totalContratos, clientesPorUf };
}
