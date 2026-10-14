import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { exigirSessao } from '../../http/autenticacao.js';
import { validar } from '../../http/validar.js';
import { apagarCookieSessao, criarCookieSessao } from '../../lib/cookies.js';
import { assinarToken } from '../../lib/jwt.js';
import { entrar } from './servico-auth.js';

const esquemaLogin = z.object({
  usuario: z.string().min(1, 'Informe o usuário.'),
  senha: z.string().min(1, 'Informe a senha.'),
});

/** Rotas de /api/auth. Só o login é público; as demais passam por exigirSessao. */
export const rotasAuth = Router();

rotasAuth.post('/login', validar({ corpo: esquemaLogin }), async (_req, res, next) => {
  try {
    const { usuario, senha } = res.locals.corpo as z.infer<typeof esquemaLogin>;
    const perfil = await entrar(usuario, senha);
    const { JWT_SECRET, NODE_ENV } = env();
    const token = await assinarToken(perfil.id, JWT_SECRET);
    res.setHeader('Set-Cookie', criarCookieSessao(token, NODE_ENV));
    res.json({ usuario: perfil });
  } catch (erro) {
    next(erro);
  }
});

rotasAuth.post('/logout', exigirSessao, (_req, res) => {
  res.setHeader('Set-Cookie', apagarCookieSessao(env().NODE_ENV));
  res.status(204).end();
});

rotasAuth.get('/sessao', exigirSessao, (req, res) => {
  res.json({ usuario: req.usuario });
});
