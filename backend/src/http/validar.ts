import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface EsquemasValidacao {
  corpo?: ZodType;
  consulta?: ZodType;
}

/**
 * Valida `req.body` e/ou `req.query` com zod.
 * O resultado parseado (com coerções e padrões aplicados) fica em `res.locals.corpo` e
 * `res.locals.consulta`. No Express 5, `req.query` é um getter somente-leitura, então não
 * o reatribuímos; `res.locals` serve igualmente para os dois. Se falhar, o ZodError segue
 * para o middleware de erros (400 VALIDACAO_INVALIDA).
 */
export function validar({ corpo, consulta }: EsquemasValidacao): RequestHandler {
  return (req, res, next) => {
    try {
      if (corpo) res.locals.corpo = corpo.parse(req.body);
      if (consulta) res.locals.consulta = consulta.parse(req.query);
      next();
    } catch (erro) {
      next(erro);
    }
  };
}
