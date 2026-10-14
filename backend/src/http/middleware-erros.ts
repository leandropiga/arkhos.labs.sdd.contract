import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErroApp, type CampoInvalido } from './erros.js';

export function camposDoZod(erro: ZodError): CampoInvalido[] {
  return erro.issues.map((problema) => ({
    campo: problema.path.map(String).join('.'),
    mensagem: problema.message,
  }));
}

// Os 4 parâmetros são obrigatórios: é assim que o Express reconhece um middleware de erros.
export function middlewareErros(erro: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (erro instanceof ErroApp) {
    res.status(erro.status).json({
      erro: {
        codigo: erro.codigo,
        mensagem: erro.message,
        ...(erro.campos ? { campos: erro.campos } : {}),
      },
    });
    return;
  }

  if (erro instanceof ZodError) {
    res.status(400).json({
      erro: {
        codigo: 'VALIDACAO_INVALIDA',
        mensagem: 'Alguns campos estão inválidos.',
        campos: camposDoZod(erro),
      },
    });
    return;
  }

  // JSON malformado: o body-parser (express.json) lança SyntaxError com type 'entity.parse.failed'.
  // Sem `campos`: não há campo a apontar, e a mensagem da biblioteca não pode vazar.
  if (
    typeof erro === 'object' &&
    erro !== null &&
    (erro as { type?: unknown }).type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      erro: { codigo: 'VALIDACAO_INVALIDA', mensagem: 'O corpo da requisição não é um JSON válido.' },
    });
    return;
  }

  // O erro real fica só no log do servidor; nunca vai no corpo (Princípios III e V).
  console.error(erro);
  res.status(500).json({
    erro: { codigo: 'ERRO_INTERNO', mensagem: 'Ocorreu um erro inesperado. Tente novamente.' },
  });
}
