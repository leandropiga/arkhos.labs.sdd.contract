import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { gerarCpf } from '../helpers/clientes.js';
import { criarUsuarioELogar } from '../helpers/sessao.js';

// SC-004: com 10.000 clientes e 10.000 contratos, listagens e filtros respondem em até 2 s.
// Os dados entram em lote (createMany): inserir 20.000 linhas uma a uma deixaria o teste lento.

const LIMITE_MS = 2000;
const TOTAL = 10_000;
const LOTE = 2_000;

const app = criarApp();
let cookie: string;

const semAcento = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Faz a requisição, mede o tempo e confere o status 200. */
async function medir(caminho: string): Promise<{ ms: number; res: request.Response }> {
  const inicio = performance.now();
  const res = await request(app).get(caminho).set('Cookie', cookie);
  const ms = performance.now() - inicio;
  expect(res.status).toBe(200);
  return { ms, res };
}

beforeAll(async () => {
  ({ cookie } = await criarUsuarioELogar());

  // Cada centésimo cliente se chama "José ... Ração" (com acento) para o filtro por nome achar algo.
  const clientes = Array.from({ length: TOTAL }, (_, i) => {
    const nomeCompleto = i % 100 === 0 ? `José da Ração ${i}` : `Cliente Número ${i}`;
    return {
      nomeCompleto,
      nomeBusca: semAcento(nomeCompleto),
      telefone: '11987654321',
      cpf: gerarCpf(i + 1),
      rg: '123456789',
      logradouro: 'Rua das Flores',
      numero: '123',
      cep: '01310100',
      cidade: 'São Paulo',
      uf: i % 2 === 0 ? 'SP' : 'MG',
    };
  });
  for (let i = 0; i < clientes.length; i += LOTE) {
    await prisma.cliente.createMany({ data: clientes.slice(i, i + LOTE) });
  }

  const ids = (await prisma.cliente.findMany({ select: { id: true } })).map((c) => c.id);
  // Datas espalhadas ao longo de ~27 anos; cada centésimo contrato se chama "Locação Específica".
  const contratos = Array.from({ length: TOTAL }, (_, i) => {
    const titulo = i % 100 === 0 ? `Locação Específica ${i}` : `Contrato ${i}`;
    return {
      titulo,
      tituloBusca: semAcento(titulo),
      dataAssinatura: new Date(Date.UTC(2000, 0, 1 + i)),
      clienteId: ids[i % ids.length],
      arquivoNomeOriginal: `contrato-${i}.pdf`,
      arquivoTamanhoBytes: 1024,
    };
  });
  for (let i = 0; i < contratos.length; i += LOTE) {
    await prisma.contrato.createMany({ data: contratos.slice(i, i + LOTE) });
  }
}, 120_000);

describe('SC-004: desempenho com 10.000 clientes e 10.000 contratos', () => {
  it('a base tem mesmo 10.000 clientes e 10.000 contratos', async () => {
    expect(await prisma.cliente.count()).toBe(TOTAL);
    expect(await prisma.contrato.count()).toBe(TOTAL);
  });

  const casos: { nome: string; caminho: string; confere: (res: request.Response) => void }[] = [
    {
      nome: 'listagem de clientes (página 1)',
      caminho: '/api/clientes',
      confere: (res) => {
        expect(res.body.total).toBe(TOTAL);
        expect(res.body.itens).toHaveLength(20);
      },
    },
    {
      nome: 'listagem de clientes (última página)',
      caminho: '/api/clientes?pagina=500',
      confere: (res) => {
        expect(res.body.pagina).toBe(500);
        expect(res.body.itens).toHaveLength(20);
      },
    },
    {
      nome: 'clientes filtrados por nome, sem acento ("jose da racao")',
      caminho: '/api/clientes?nome=jose%20da%20racao',
      confere: (res) => expect(res.body.total).toBe(TOTAL / 100),
    },
    {
      nome: 'clientes filtrados por CPF (com pontuação)',
      caminho: `/api/clientes?cpf=${encodeURIComponent(
        gerarCpf(5001).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      )}`,
      confere: (res) => expect(res.body.total).toBe(1),
    },
    {
      nome: 'listagem de contratos (página 1)',
      caminho: '/api/contratos',
      confere: (res) => {
        expect(res.body.total).toBe(TOTAL);
        expect(res.body.itens).toHaveLength(20);
      },
    },
    {
      nome: 'listagem de contratos (última página)',
      caminho: '/api/contratos?pagina=500',
      confere: (res) => {
        expect(res.body.pagina).toBe(500);
        expect(res.body.itens).toHaveLength(20);
      },
    },
    {
      nome: 'contratos filtrados por título, sem acento ("locacao")',
      caminho: '/api/contratos?titulo=locacao',
      confere: (res) => expect(res.body.total).toBe(TOTAL / 100),
    },
    {
      nome: 'contratos filtrados por intervalo de datas',
      caminho: '/api/contratos?dataInicio=2005-01-01&dataFim=2010-12-31',
      confere: (res) => expect(res.body.total).toBeGreaterThan(0),
    },
    {
      nome: 'contratos com todos os filtros combinados',
      caminho: '/api/contratos?titulo=contrato&dataInicio=2005-01-01&dataFim=2010-12-31',
      confere: (res) => expect(res.body.total).toBeGreaterThan(0),
    },
    {
      nome: 'painel (totais e clientes por UF)',
      caminho: '/api/painel',
      confere: (res) => {
        expect(res.body.totalClientes).toBe(TOTAL);
        expect(res.body.totalContratos).toBe(TOTAL);
      },
    },
  ];

  it.each(casos)('$nome responde em até 2 s', async ({ caminho, confere }) => {
    const { ms, res } = await medir(caminho);

    confere(res);
    console.log(`[SC-004] ${caminho} -> ${Math.round(ms)} ms`);
    expect(ms).toBeLessThanOrEqual(LIMITE_MS);
  });
});
