import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { lerCookie } from '../lib/cookies.js';
import { verificarToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { ErroApp } from './erros.js';

/** Dados do usuário logado: nunca inclui a senha. */
export interface Perfil {
  id: string;
  usuario: string;
  nome: string;
  fotoUrl: string | null;
  telefone: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Perfil;
    }
  }
}

const naoAutenticado = () =>
  new ErroApp(401, 'NAO_AUTENTICADO', 'Sessão inválida ou expirada. Faça login novamente.');

/** Exige sessão válida: lê o cookie `sessao`, verifica o JWT e põe o Perfil em `req.usuario`. */
export async function exigirSessao(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = lerCookie(req.headers.cookie, 'sessao');
    const usuarioId = token ? await verificarToken(token, env().JWT_SECRET) : null;
    if (!usuarioId) return next(naoAutenticado());

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, usuario: true, nome: true, fotoUrl: true, telefone: true },
    });
    if (!usuario) return next(naoAutenticado());

    req.usuario = usuario;
    next();
  } catch (erro) {
    next(erro);
  }
}
