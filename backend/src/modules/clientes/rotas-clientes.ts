import { Router } from 'express';
import { validar } from '../../http/validar.js';
import {
  esquemaCliente,
  esquemaListagemClientes,
  type ConsultaClientes,
  type DadosCliente,
} from './esquemas-clientes.js';
import {
  buscarCliente,
  criarCliente,
  editarCliente,
  excluirCliente,
  listarClientes,
} from './servico-clientes.js';

/** Rotas de /api/clientes. A sessão é exigida pelo app, antes de montar este router. */
export const rotasClientes = Router();

rotasClientes.get('/', validar({ consulta: esquemaListagemClientes }), async (_req, res, next) => {
  try {
    res.json(await listarClientes(res.locals.consulta as ConsultaClientes));
  } catch (erro) {
    next(erro);
  }
});

rotasClientes.post('/', validar({ corpo: esquemaCliente }), async (_req, res, next) => {
  try {
    res.status(201).json(await criarCliente(res.locals.corpo as DadosCliente));
  } catch (erro) {
    next(erro);
  }
});

rotasClientes.get('/:id', async (req, res, next) => {
  try {
    res.json(await buscarCliente(req.params.id));
  } catch (erro) {
    next(erro);
  }
});

rotasClientes.put('/:id', validar({ corpo: esquemaCliente }), async (req, res, next) => {
  try {
    res.json(await editarCliente(String(req.params.id), res.locals.corpo as DadosCliente));
  } catch (erro) {
    next(erro);
  }
});

rotasClientes.delete('/:id', async (req, res, next) => {
  try {
    await excluirCliente(req.params.id);
    res.status(204).end();
  } catch (erro) {
    next(erro);
  }
});
