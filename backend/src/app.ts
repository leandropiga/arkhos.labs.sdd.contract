import express, { type Express } from 'express';
import { exigirSessao } from './http/autenticacao.js';
import { ErroApp } from './http/erros.js';
import { middlewareErros } from './http/middleware-erros.js';
import { criarRotasAnalise, type OpcoesAnalise } from './modules/analise/rotas-analise.js';
import { rotasAuth } from './modules/auth/rotas-auth.js';
import { rotasClientes } from './modules/clientes/rotas-clientes.js';
import { rotasContratos } from './modules/contratos/rotas-contratos.js';

/**
 * Fábrica do app Express: devolve um app novo a cada chamada, sem chamar listen.
 * `opcoes.clienteIA` permite injetar a IA (os testes passam um dublê).
 */
export function criarApp(opcoes: OpcoesAnalise = {}): Express {
  const app = express();
  // Não anunciar a stack ("X-Powered-By: Express") nas respostas (Princípio III).
  app.disable('x-powered-by');
  app.use(express.json());

  const api = express.Router();
  // Montado antes da proteção: contém a única rota pública (POST /api/auth/login);
  // as outras rotas de auth exigem sessão por conta própria.
  api.use('/auth', rotasAuth);
  // Daqui para baixo, toda rota sob /api exige sessão.
  api.use(exigirSessao);
  api.use('/clientes', rotasClientes);
  // Antes de rotasContratos: POST /:id/analise; as demais rotas seguem para rotasContratos.
  api.use('/contratos', criarRotasAnalise(opcoes));
  api.use('/contratos', rotasContratos);
  api.use((_req, _res, next) => {
    next(new ErroApp(404, 'NAO_ENCONTRADO', 'Recurso não encontrado.'));
  });
  app.use('/api', api);

  app.use(middlewareErros);
  return app;
}
