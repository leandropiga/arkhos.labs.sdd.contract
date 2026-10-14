import express, { type Express } from 'express';
import { exigirSessao } from './http/autenticacao.js';
import { ErroApp } from './http/erros.js';
import { middlewareErros } from './http/middleware-erros.js';

/** Fábrica do app Express: devolve um app novo a cada chamada, sem chamar listen. */
export function criarApp(): Express {
  const app = express();
  app.use(express.json());

  const api = express.Router();
  // Toda rota sob /api exige sessão. A exceção (POST /api/auth/login) entra na T033, montada antes disto.
  api.use(exigirSessao);
  api.get('/auth/sessao', (req, res) => {
    res.json({ usuario: req.usuario });
  });
  api.use((_req, _res, next) => {
    next(new ErroApp(404, 'NAO_ENCONTRADO', 'Recurso não encontrado.'));
  });
  app.use('/api', api);

  app.use(middlewareErros);
  return app;
}
