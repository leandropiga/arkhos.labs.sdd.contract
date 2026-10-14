import type { RequestHandler } from 'express';
import { z, type ZodType } from 'zod';

// Mensagens padrão do zod em português (contracts/api.md: nada de texto de biblioteca em
// `campos[].mensagem`). Configuração global, aplicada ao carregar o módulo que valida as rotas.
z.config(z.locales.ptBR());

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
