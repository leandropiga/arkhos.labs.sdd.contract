import { randomUUID } from 'node:crypto';
import { mkdir, open, rm } from 'node:fs/promises';
import path from 'node:path';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import multer, { MulterError } from 'multer';
import { env } from '../config/env.js';
import { ErroApp } from './erros.js';

/** Limite do PDF: 50 MB (52.428.800 bytes), o limite do Gemini (FR-017). */
export const LIMITE_PDF_BYTES = 52_428_800;

/** O `%%EOF` precisa aparecer nos últimos 1.024 bytes (FR-016). */
const BYTES_FINAIS = 1024;

export interface ArquivoRecebido {
  /** Caminho do temporário em UPLOAD_TMP_DIR. Já foi validado como PDF. */
  caminhoTmp: string;
  nomeOriginal: string;
  tamanhoBytes: number;
}

const arquivoInvalido = (mensagem: string) => new ErroApp(400, 'ARQUIVO_INVALIDO', mensagem);

const armazenamento = multer.diskStorage({
  destination(_req, _arquivo, cb) {
    const pasta = path.resolve(process.cwd(), env().UPLOAD_TMP_DIR);
    mkdir(pasta, { recursive: true }).then(() => cb(null, pasta), (erro: Error) => cb(erro, pasta));
  },
  // Nome aleatório: o nome enviado pelo cliente nunca vira caminho em disco.
  filename(_req, _arquivo, cb) {
    cb(null, `${randomUUID()}.tmp`);
  },
});

const multerPdf = multer({
  storage: armazenamento,
  // Navegadores mandam o nome do arquivo em UTF-8.
  defParamCharset: 'utf8',
  limits: { fileSize: LIMITE_PDF_BYTES, files: 1, fields: 20 },
}).single('arquivo');

function executarMulter(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    multerPdf(req, res, (erro?: unknown) => (erro ? reject(erro) : resolve()));
  });
}

function traduzirErroMulter(erro: unknown): unknown {
  if (!(erro instanceof MulterError)) {
    // Multipart malformado (busboy): o texto da biblioteca não vaza para o cliente.
    const mensagem = erro instanceof Error ? erro.message : '';
    if (/multipart|boundary|unexpected end of form/i.test(mensagem)) {
      return new ErroApp(400, 'VALIDACAO_INVALIDA', 'O corpo da requisição não é um formulário válido.');
    }
    return erro;
  }
  if (erro.code === 'LIMIT_FILE_SIZE') {
    return new ErroApp(413, 'ARQUIVO_MUITO_GRANDE', 'O arquivo é maior que o limite de 50 MB.');
  }
  if (erro.code === 'LIMIT_UNEXPECTED_FILE' || erro.code === 'LIMIT_FILE_COUNT') {
    return arquivoInvalido('Envie um único arquivo PDF no campo "arquivo".');
  }
  return new ErroApp(400, 'VALIDACAO_INVALIDA', 'O corpo da requisição não é um formulário válido.');
}

/** Confere a assinatura `%PDF-` no início e o `%%EOF` nos últimos 1.024 bytes. */
async function pareceUmPdf(caminho: string, tamanho: number): Promise<boolean> {
  if (tamanho < 5) return false;
  const arquivo = await open(caminho, 'r');
  try {
    const inicio = Buffer.alloc(5);
    await arquivo.read(inicio, 0, 5, 0);
    if (inicio.toString('latin1') !== '%PDF-') return false;

    const comprimento = Math.min(tamanho, BYTES_FINAIS);
    const fim = Buffer.alloc(comprimento);
    await arquivo.read(fim, 0, comprimento, tamanho - comprimento);
    return fim.includes('%%EOF', 0, 'latin1');
  } finally {
    await arquivo.close();
  }
}

export interface RespostaJson {
  status: number;
  corpo: unknown;
}

/**
 * Recebe o campo `arquivo` (multipart), confere se é mesmo um PDF e entrega ao `tratar`, que
 * devolve a resposta JSON. O temporário é removido em `finally`, com ou sem erro (Princípio IV),
 * ANTES de a resposta sair: quando o cliente recebe a resposta, UPLOAD_TMP_DIR já está limpo.
 * Se o `tratar` mover o arquivo para o storage, não resta nada para apagar.
 * Campos de texto ficam em `req.body`.
 */
export function receberPdf(
  opcoes: { obrigatorio: boolean },
  tratar: (req: Request, arquivo: ArquivoRecebido | undefined) => Promise<RespostaJson>,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    let resposta: RespostaJson | undefined;
    let falha: unknown;
    try {
      try {
        await executarMulter(req, res);
      } catch (erro) {
        throw traduzirErroMulter(erro);
      }

      let arquivo: ArquivoRecebido | undefined;
      if (req.file) {
        if (!(await pareceUmPdf(req.file.path, req.file.size))) {
          throw arquivoInvalido('O arquivo enviado não é um PDF válido ou está corrompido.');
        }
        arquivo = { caminhoTmp: req.file.path, nomeOriginal: req.file.originalname, tamanhoBytes: req.file.size };
      } else if (opcoes.obrigatorio) {
        throw arquivoInvalido('Envie o arquivo PDF do contrato.');
      }

      resposta = await tratar(req, arquivo);
    } catch (erro) {
      falha = erro;
    } finally {
      if (req.file) await rm(req.file.path, { force: true }).catch(() => undefined);
    }
    if (resposta) res.status(resposta.status).json(resposta.corpo);
    else next(falha);
  };
}
