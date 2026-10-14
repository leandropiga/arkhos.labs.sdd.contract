import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client.js';
import type { ArquivoRecebido } from '../../http/upload.js';
import { ErroApp } from '../../http/erros.js';
import { caminhoDoPdf, removerPdf, salvarDoTemporario } from '../../lib/armazenamento.js';
import { prisma } from '../../lib/prisma.js';
import { normalizarParaBusca } from '../../lib/texto-busca.js';
import type { ContratoResumoDto, PaginaDto } from '../clientes/servico-clientes.js';
import type { ConsultaContratos, DadosContrato } from './esquemas-contratos.js';

const TAMANHO_PAGINA = 20;

const incluirCliente = {
  cliente: { select: { id: true, nomeCompleto: true } },
} satisfies Prisma.ContratoInclude;
type ContratoComCliente = Prisma.ContratoGetPayload<{ include: typeof incluirCliente }>;

export interface ContratoDto extends ContratoResumoDto {
  arquivoNomeOriginal: string;
  arquivoTamanhoBytes: number;
  analiseEmAndamento: boolean;
  /** A análise por IA chega na rodada 4; até lá o detalhe sempre traz null. */
  analise: null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const naoEncontrado = () => new ErroApp(404, 'NAO_ENCONTRADO', 'Contrato não encontrado.');
const clienteInexistente = () =>
  new ErroApp(400, 'VALIDACAO_INVALIDA', 'Alguns campos estão inválidos.', [
    { campo: 'clienteId', mensagem: 'Cliente não encontrado.' },
  ]);

function codigoPrisma(erro: unknown): string | undefined {
  return typeof erro === 'object' && erro !== null ? (erro as { code?: string }).code : undefined;
}

function dataParaTexto(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function paraResumo(c: ContratoComCliente): ContratoResumoDto {
  return {
    id: c.id,
    titulo: c.titulo,
    dataAssinatura: dataParaTexto(c.dataAssinatura),
    cliente: { id: c.cliente.id, nomeCompleto: c.cliente.nomeCompleto },
  };
}

function paraDto(c: ContratoComCliente): ContratoDto {
  return {
    ...paraResumo(c),
    arquivoNomeOriginal: c.arquivoNomeOriginal,
    arquivoTamanhoBytes: c.arquivoTamanhoBytes,
    analiseEmAndamento: c.analiseIniciadaEm !== null,
    analise: null,
  };
}

async function garantirCliente(clienteId: string): Promise<void> {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
  if (!cliente) throw clienteInexistente();
}

function dadosParaBanco(dados: DadosContrato) {
  return {
    titulo: dados.titulo,
    tituloBusca: normalizarParaBusca(dados.titulo),
    dataAssinatura: new Date(`${dados.dataAssinatura}T00:00:00.000Z`),
    clienteId: dados.clienteId,
  };
}

export async function criarContrato(dados: DadosContrato, arquivo: ArquivoRecebido): Promise<ContratoDto> {
  await garantirCliente(dados.clienteId);
  const id = randomUUID();

  let criado: ContratoComCliente;
  try {
    criado = await prisma.contrato.create({
      data: {
        id,
        ...dadosParaBanco(dados),
        arquivoNomeOriginal: arquivo.nomeOriginal,
        arquivoTamanhoBytes: arquivo.tamanhoBytes,
      },
      include: incluirCliente,
    });
  } catch (erro) {
    // O cliente foi excluído entre a checagem e a gravação: a FK barrou.
    if (codigoPrisma(erro) === 'P2003') throw clienteInexistente();
    throw erro;
  }

  try {
    await salvarDoTemporario(arquivo.caminhoTmp, id);
  } catch (erro) {
    // Sem o PDF não pode existir contrato: desfaz a linha para não deixar registro órfão.
    await prisma.contrato.delete({ where: { id } }).catch(() => undefined);
    throw erro;
  }
  return paraDto(criado);
}

export async function editarContrato(
  id: string,
  dados: DadosContrato,
  arquivo?: ArquivoRecebido,
): Promise<ContratoDto> {
  if (!UUID.test(id)) throw naoEncontrado();
  await garantirCliente(dados.clienteId);

  let atualizado: ContratoComCliente;
  try {
    atualizado = await prisma.contrato.update({
      where: { id },
      data: {
        ...dadosParaBanco(dados),
        ...(arquivo
          ? {
              arquivoNomeOriginal: arquivo.nomeOriginal,
              arquivoTamanhoBytes: arquivo.tamanhoBytes,
              // FR-031: PDF novo invalida a análise anterior. O modelo de análise chega na
              // rodada 4; lá, apagar a AnaliseContrato deste contrato entra aqui.
              analiseIniciadaEm: null,
            }
          : {}),
      },
      include: incluirCliente,
    });
  } catch (erro) {
    const codigo = codigoPrisma(erro);
    if (codigo === 'P2025') throw naoEncontrado();
    if (codigo === 'P2003') throw clienteInexistente();
    throw erro;
  }

  // O rename sobrescreve o PDF antigo (mesmo id): não sobra arquivo velho no storage.
  if (arquivo) await salvarDoTemporario(arquivo.caminhoTmp, id);
  return paraDto(atualizado);
}

export async function buscarContrato(id: string): Promise<ContratoDto> {
  if (!UUID.test(id)) throw naoEncontrado();
  const contrato = await prisma.contrato.findUnique({ where: { id }, include: incluirCliente });
  if (!contrato) throw naoEncontrado();
  return paraDto(contrato);
}

export async function listarContratos({
  titulo,
  dataInicio,
  dataFim,
  pagina,
}: ConsultaContratos): Promise<PaginaDto<ContratoResumoDto>> {
  const where: Prisma.ContratoWhereInput = {};
  if (titulo) where.tituloBusca = { contains: normalizarParaBusca(titulo) };
  if (dataInicio || dataFim) {
    where.dataAssinatura = {
      ...(dataInicio ? { gte: new Date(`${dataInicio}T00:00:00.000Z`) } : {}),
      ...(dataFim ? { lte: new Date(`${dataFim}T00:00:00.000Z`) } : {}),
    };
  }

  const total = await prisma.contrato.count({ where });
  const totalPaginas = Math.ceil(total / TAMANHO_PAGINA);
  // Página além da última devolve a última válida.
  const paginaAtual = Math.min(pagina, Math.max(totalPaginas, 1));

  const contratos = await prisma.contrato.findMany({
    where,
    include: incluirCliente,
    orderBy: [{ dataAssinatura: 'desc' }, { id: 'asc' }],
    skip: (paginaAtual - 1) * TAMANHO_PAGINA,
    take: TAMANHO_PAGINA,
  });

  return {
    itens: contratos.map(paraResumo),
    pagina: paginaAtual,
    tamanhoPagina: TAMANHO_PAGINA,
    total,
    totalPaginas,
  };
}

export async function excluirContrato(id: string): Promise<void> {
  if (!UUID.test(id)) throw naoEncontrado();
  try {
    // A análise (rodada 4) sai junto, por cascata no banco.
    await prisma.contrato.delete({ where: { id } });
  } catch (erro) {
    if (codigoPrisma(erro) === 'P2025') throw naoEncontrado();
    throw erro;
  }
  await removerPdf(id);
}

/** Dados para servir o PDF: caminho no storage e nome original (para o Content-Disposition). */
export async function localizarArquivo(id: string): Promise<{ caminho: string; nomeOriginal: string }> {
  if (!UUID.test(id)) throw naoEncontrado();
  const contrato = await prisma.contrato.findUnique({ where: { id }, select: { arquivoNomeOriginal: true } });
  if (!contrato) throw naoEncontrado();
  return { caminho: caminhoDoPdf(id), nomeOriginal: contrato.arquivoNomeOriginal };
}
