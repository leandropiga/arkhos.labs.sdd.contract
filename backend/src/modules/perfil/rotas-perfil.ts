import { Router } from 'express';
import { z } from 'zod';
import type { Perfil } from '../../http/autenticacao.js';
import { validar } from '../../http/validar.js';
import { prisma } from '../../lib/prisma.js';

const MSG_NOME = 'Informe o nome.';
const MSG_FOTO = 'URL da foto inválida. Use um endereço http ou https.';
const MSG_FOTO_TAMANHO = 'A URL da foto deve ter no máximo 2048 caracteres.';
const MSG_TELEFONE = 'Telefone inválido. Informe DDD e número (10 ou 11 dígitos).';

/** Texto opcional: ausente, nulo ou vazio viram null. */
const vazioParaNulo = (valor: unknown) =>
  valor == null || (typeof valor === 'string' && valor.trim() === '') ? null : valor;

function ehUrlHttp(valor: string): boolean {
  try {
    const { protocol } = new URL(valor);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export const esquemaPerfil = z.object({
  nome: z
    .string({ error: MSG_NOME })
    .trim()
    .min(1, MSG_NOME)
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  fotoUrl: z.preprocess(
    vazioParaNulo,
    z
      .string({ error: MSG_FOTO })
      .trim()
      .max(2048, MSG_FOTO_TAMANHO)
      .refine(ehUrlHttp, MSG_FOTO)
      .nullable(),
  ),
  // Aceita pontuação comum ("(11) 98765-4321") e guarda só os dígitos.
  telefone: z.preprocess(
    vazioParaNulo,
    z
      .string({ error: MSG_TELEFONE })
      .trim()
      .refine((v) => /^[\d\s()\-.]+$/.test(v), MSG_TELEFONE)
      .transform((v) => v.replace(/\D/g, ''))
      .refine((d) => /^\d{10,11}$/.test(d), MSG_TELEFONE)
      .nullable(),
  ),
});

type DadosPerfil = z.infer<typeof esquemaPerfil>;

// Nunca selecionar senhaHash: só estes campos saem da API.
const camposPerfil = { id: true, usuario: true, nome: true, fotoUrl: true, telefone: true } as const;

/** Rotas de /api/perfil. A sessão é exigida pelo app, antes de montar este router. */
export const rotasPerfil = Router();

rotasPerfil.get('/', (req, res) => {
  res.json(req.usuario as Perfil);
});

rotasPerfil.put('/', validar({ corpo: esquemaPerfil }), async (req, res, next) => {
  try {
    const dados = res.locals.corpo as DadosPerfil;
    const atualizado = await prisma.usuario.update({
      where: { id: (req.usuario as Perfil).id },
      data: dados,
      select: camposPerfil,
    });
    res.json(atualizado);
  } catch (erro) {
    next(erro);
  }
});
