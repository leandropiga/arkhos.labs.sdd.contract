import { readFile } from 'node:fs/promises';
import type { AnaliseContrato } from '../../generated/prisma/client.js';
import { ErroApp } from '../../http/erros.js';
import { caminhoDoPdf } from '../../lib/armazenamento.js';
import { prisma } from '../../lib/prisma.js';
import { ErroIA, TEMPO_LIMITE_IA_MS, type ClienteIA, type ResultadoIA } from './cliente-ia.js';
import { JANELA_TRAVA_ANALISE_MS } from './trava.js';

export interface AnaliseDto {
  resumo: string;
  riscos: { titulo: string; descricao: string; gravidade: 'BAIXA' | 'MEDIA' | 'ALTA' }[];
  clausulasCriticas: { clausula: string; motivo: string }[];
  geradaEm: string;
}

const UUID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const naoEncontrado = () => new ErroApp(404, 'NAO_ENCONTRADO', 'Contrato não encontrado.');
const iaIndisponivel = () =>
  new ErroApp(503, 'IA_INDISPONIVEL', 'O serviço de análise está temporariamente indisponível. Tente novamente em instantes.');

/** Linha do banco -> formato da API (`Analise` em contracts/api.md). */
export function paraAnaliseDto(a: AnaliseContrato): AnaliseDto {
  return {
    resumo: a.resumo,
    riscos: a.riscos as AnaliseDto['riscos'],
    clausulasCriticas: a.clausulasCriticas as AnaliseDto['clausulasCriticas'],
    geradaEm: a.geradaEm.toISOString(),
  };
}

/** Chama a IA e desiste depois de `limiteMs`: quem demora demais vira ErroIA (503). */
async function chamarComTempoLimite(
  cliente: ClienteIA,
  pdf: Buffer,
  limiteMs: number,
): Promise<ResultadoIA> {
  let temporizador: NodeJS.Timeout | undefined;
  const estouro = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new ErroIA('Tempo-limite da IA excedido.')), limiteMs);
  });
  try {
    return await Promise.race([cliente.analisarContrato(pdf), estouro]);
  } finally {
    clearTimeout(temporizador);
  }
}

async function lerPdf(id: string): Promise<Buffer> {
  try {
    return await readFile(caminhoDoPdf(id));
  } catch (erro) {
    // Linha no banco sem o PDF no disco: para o cliente, o arquivo não existe (sem vazar caminho).
    if ((erro as { code?: string }).code === 'ENOENT') {
      throw new ErroApp(404, 'NAO_ENCONTRADO', 'Arquivo do contrato não encontrado.');
    }
    throw erro;
  }
}

/**
 * Analisa o PDF do contrato com a IA e grava o resultado (substitui a análise anterior).
 * - Trava atômica (R-09): `updateMany` só marca `analiseIniciadaEm` se estiver nulo ou velho
 *   (> 60 s); se não marcou nada, há outra análise rodando -> 409.
 * - Só grava em caso de sucesso: falha ou PDF não analisável deixam a análise anterior intacta.
 * - A trava é liberada em `finally`, com sucesso ou com erro.
 */
export async function analisarContrato(
  id: string,
  cliente: ClienteIA,
  tempoLimiteMs: number = TEMPO_LIMITE_IA_MS,
): Promise<AnaliseDto> {
  if (!UUID_VALIDO.test(id)) throw naoEncontrado();
  const existe = await prisma.contrato.findUnique({ where: { id }, select: { id: true } });
  if (!existe) throw naoEncontrado();

  const agora = new Date();
  const travou = await prisma.contrato.updateMany({
    where: {
      id,
      OR: [
        { analiseIniciadaEm: null },
        { analiseIniciadaEm: { lt: new Date(agora.getTime() - JANELA_TRAVA_ANALISE_MS) } },
      ],
    },
    data: { analiseIniciadaEm: agora },
  });
  if (travou.count === 0) {
    throw new ErroApp(409, 'ANALISE_EM_ANDAMENTO', 'Já existe uma análise em andamento para este contrato.');
  }

  try {
    const pdf = await lerPdf(id);

    let resultado: ResultadoIA;
    try {
      resultado = await chamarComTempoLimite(cliente, pdf, tempoLimiteMs);
    } catch (erro) {
      // Qualquer falha da IA vira 503; o detalhe (chave, caminho, stack) fica só no log.
      console.error('Falha na análise por IA:', erro);
      throw iaIndisponivel();
    }

    if (!resultado.analisavel) {
      throw new ErroApp(
        422,
        'PDF_NAO_ANALISAVEL',
        'Não foi possível analisar este PDF: ele não tem texto legível (por exemplo, é uma imagem escaneada).',
      );
    }

    const dados = {
      resumo: resultado.resumo,
      riscos: resultado.riscos,
      clausulasCriticas: resultado.clausulasCriticas,
      geradaEm: new Date(),
    };
    // Só grava se a trava ainda é a nossa (o carimbo `agora`). Se um PUT trocou o PDF no meio
    // da análise, ele zerou a trava: o resultado é do PDF antigo e é descartado. Confirmar a
    // trava e gravar na mesma transação evita a janela entre uma coisa e outra.
    return await prisma.$transaction(async (tx) => {
      const aindaNossa = await tx.contrato.updateMany({
        where: { id, analiseIniciadaEm: agora },
        data: { analiseIniciadaEm: null },
      });
      if (aindaNossa.count === 0) {
        throw new ErroApp(
          409,
          'ANALISE_EM_ANDAMENTO',
          'O PDF do contrato mudou durante a análise e o resultado foi descartado. Analise novamente.',
        );
      }
      const gravada = await tx.analiseContrato.upsert({
        where: { contratoId: id },
        create: { contratoId: id, ...dados },
        update: dados,
      });
      return paraAnaliseDto(gravada);
    });
  } finally {
    // Libera só a própria trava: a de outra análise (carimbo diferente) fica como está.
    await prisma.contrato.updateMany({ where: { id, analiseIniciadaEm: agora }, data: { analiseIniciadaEm: null } });
  }
}
