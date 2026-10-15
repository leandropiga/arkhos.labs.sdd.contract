import { Router } from 'express';
import { obterPainel } from './servico-painel.js';

/** Rotas de /api/painel. A sessão é exigida pelo app, antes de montar este router. */
export const rotasPainel = Router();

rotasPainel.get('/', async (_req, res, next) => {
  try {
    res.json(await obterPainel());
  } catch (erro) {
    next(erro);
  }
});
