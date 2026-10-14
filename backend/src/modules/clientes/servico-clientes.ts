import type { Prisma } from '../../generated/prisma/client.js';
import { ErroApp } from '../../http/erros.js';
import { normalizarCpf } from '../../lib/cpf.js';
import { prisma } from '../../lib/prisma.js';
import { normalizarParaBusca } from '../../lib/texto-busca.js';
import type { ConsultaClientes, DadosCliente } from './esquemas-clientes.js';

const TAMANHO_PAGINA = 20;

const incluirTotal = { _count: { select: { contratos: true } } } satisfies Prisma.ClienteInclude;
type ClienteComTotal = Prisma.ClienteGetPayload<{ include: typeof incluirTotal }>;

export interface ClienteDto {
  id: string;
  nomeCompleto: string;
  telefone: string;
  cpf: string;
  rg: string;
  logradouro: string;
  numero: string;
  cep: string;
  cidade: string;
  uf: string;
  totalContratos: number;
}

export interface ContratoResumoDto {
  id: string;
  titulo: string;
  dataAssinatura: string;
  cliente: { id: string; nomeCompleto: string };
}

export interface PaginaDto<T> {
  itens: T[];
  pagina: number;
  tamanhoPagina: number;
  total: number;
  totalPaginas: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const naoEncontrado = () => new ErroApp(404, 'NAO_ENCONTRADO', 'Cliente não encontrado.');
const cpfDuplicado = () => new ErroApp(409, 'CPF_DUPLICADO', 'Já existe um cliente cadastrado com este CPF.');

function codigoPrisma(erro: unknown): string | undefined {
  return typeof erro === 'object' && erro !== null ? (erro as { code?: string }).code : undefined;
}

function paraDto(c: ClienteComTotal): ClienteDto {
  return {
    id: c.id,
    nomeCompleto: c.nomeCompleto,
    telefone: c.telefone,
    cpf: c.cpf,
    rg: c.rg,
    logradouro: c.logradouro,
    numero: c.numero,
    cep: c.cep,
    cidade: c.cidade,
    uf: c.uf,
    totalContratos: c._count.contratos,
  };
}

function mensagemComContratos(quantidade: number): string {
  const contratos = quantidade === 1 ? '1 contrato' : `${quantidade} contratos`;
  return `Não é possível excluir: o cliente possui ${contratos}. Exclua os contratos antes.`;
}

function dadosParaBanco(dados: DadosCliente) {
  return { ...dados, nomeBusca: normalizarParaBusca(dados.nomeCompleto) };
}

export async function criarCliente(dados: DadosCliente): Promise<ClienteDto> {
  try {
    const criado = await prisma.cliente.create({ data: dadosParaBanco(dados), include: incluirTotal });
    return paraDto(criado);
  } catch (erro) {
    // Corrida entre dois cadastros do mesmo CPF: a unicidade do banco é a barreira final.
    if (codigoPrisma(erro) === 'P2002') throw cpfDuplicado();
    throw erro;
  }
}

export async function editarCliente(id: string, dados: DadosCliente): Promise<ClienteDto> {
  if (!UUID.test(id)) throw naoEncontrado();
  try {
    const atualizado = await prisma.cliente.update({
      where: { id },
      data: dadosParaBanco(dados),
      include: incluirTotal,
    });
    return paraDto(atualizado);
  } catch (erro) {
    const codigo = codigoPrisma(erro);
    if (codigo === 'P2002') throw cpfDuplicado();
    if (codigo === 'P2025') throw naoEncontrado();
    throw erro;
  }
}

export async function buscarCliente(id: string): Promise<ClienteDto & { contratos: ContratoResumoDto[] }> {
  if (!UUID.test(id)) throw naoEncontrado();
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      ...incluirTotal,
      contratos: {
        // Mais recente primeiro (FR-014); id como desempate para ordem estável.
        orderBy: [{ dataAssinatura: 'desc' }, { id: 'asc' }],
        select: { id: true, titulo: true, dataAssinatura: true },
      },
    },
  });
  if (!cliente) throw naoEncontrado();

  return {
    ...paraDto(cliente),
    contratos: cliente.contratos.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      dataAssinatura: c.dataAssinatura.toISOString().slice(0, 10),
      cliente: { id: cliente.id, nomeCompleto: cliente.nomeCompleto },
    })),
  };
}

export async function listarClientes({ nome, cpf, pagina }: ConsultaClientes): Promise<PaginaDto<ClienteDto>> {
  const where: Prisma.ClienteWhereInput = {};
  if (nome) where.nomeBusca = { contains: normalizarParaBusca(nome) };
  // Busca exata: com ou sem pontuação, compara só os dígitos.
  if (cpf) where.cpf = normalizarCpf(cpf);

  const total = await prisma.cliente.count({ where });
  const totalPaginas = Math.ceil(total / TAMANHO_PAGINA);
  // Página além da última devolve a última válida.
  const paginaAtual = Math.min(pagina, Math.max(totalPaginas, 1));

  const clientes = await prisma.cliente.findMany({
    where,
    include: incluirTotal,
    orderBy: [{ nomeBusca: 'asc' }, { id: 'asc' }],
    skip: (paginaAtual - 1) * TAMANHO_PAGINA,
    take: TAMANHO_PAGINA,
  });

  return {
    itens: clientes.map(paraDto),
    pagina: paginaAtual,
    tamanhoPagina: TAMANHO_PAGINA,
    total,
    totalPaginas,
  };
}

export async function excluirCliente(id: string): Promise<void> {
  if (!UUID.test(id)) throw naoEncontrado();
  const cliente = await prisma.cliente.findUnique({ where: { id }, include: incluirTotal });
  if (!cliente) throw naoEncontrado();
  if (cliente._count.contratos > 0) {
    throw new ErroApp(409, 'CLIENTE_COM_CONTRATOS', mensagemComContratos(cliente._count.contratos));
  }

  try {
    await prisma.cliente.delete({ where: { id } });
  } catch (erro) {
    const codigo = codigoPrisma(erro);
    // Um contrato surgiu entre a checagem e a exclusão: a FK (RESTRICT) barrou.
    if (codigo === 'P2003') {
      const quantidade = await prisma.contrato.count({ where: { clienteId: id } });
      throw new ErroApp(409, 'CLIENTE_COM_CONTRATOS', mensagemComContratos(Math.max(quantidade, 1)));
    }
    if (codigo === 'P2025') throw naoEncontrado();
    throw erro;
  }
}
