import { Router } from 'express';
import { criarClienteIA, type ClienteIA } from './cliente-ia.js';
import { analisarContrato } from './servico-analise.js';

export interface OpcoesAnalise {
  /** ClienteIA a usar. Sem ele, cria o real (Gemini) na primeira análise. */
  clienteIA?: ClienteIA;
  /** Tempo-limite da IA em ms. Só os testes mudam; o padrão é 15 s. */
  tempoLimiteIaMs?: number;
}

/** Rotas de análise por IA, montadas sob /api/contratos. A sessão é exigida pelo app. */
export function criarRotasAnalise(opcoes: OpcoesAnalise = {}): Router {
  const rotas = Router();
  // Criado só quando preciso: subir o app (ou rodar testes) não exige GEMINI_API_KEY.
  let cliente = opcoes.clienteIA;

  rotas.post('/:id/analise', async (req, res, next) => {
    try {
      cliente ??= criarClienteIA();
      res.json(await analisarContrato(String(req.params.id), cliente, opcoes.tempoLimiteIaMs));
    } catch (erro) {
      next(erro);
    }
  });

  return rotas;
}
