import { ErroApp } from '../../http/erros.js';
import type { Perfil } from '../../http/autenticacao.js';
import { prisma } from '../../lib/prisma.js';
import { gerarHash, verificarSenha } from '../../lib/senha.js';

const MAX_FALHAS = 5;
const DURACAO_BLOQUEIO_MS = 15 * 60 * 1000;

const credenciaisInvalidas = () =>
  new ErroApp(401, 'CREDENCIAIS_INVALIDAS', 'Usuário ou senha inválidos.');

// Hash fictício: gasta o mesmo tempo de verificação quando o usuário não existe (FR-002).
let hashFicticio: Promise<string> | undefined;
const obterHashFicticio = () => (hashFicticio ??= gerarHash('senha-ficticia-sem-uso'));

/**
 * Login por usuário e senha, com bloqueio de 15 min após 5 falhas seguidas.
 * Lança ErroApp 401 CREDENCIAIS_INVALIDAS ou 429 LOGIN_BLOQUEADO; devolve o Perfil (sem senha).
 */
export async function entrar(usuario: string, senha: string): Promise<Perfil> {
  const chave = usuario.toLowerCase();
  const registro = await prisma.usuario.findUnique({ where: { usuario: chave } });

  if (!registro) {
    await verificarSenha(senha, await obterHashFicticio());
    throw credenciaisInvalidas();
  }

  const agora = new Date();
  if (registro.bloqueadoAte) {
    if (registro.bloqueadoAte > agora) {
      throw new ErroApp(
        429,
        'LOGIN_BLOQUEADO',
        'Muitas tentativas sem sucesso. Tente novamente em 15 minutos.',
      );
    }
    // Bloqueio vencido: recomeça a contagem (senão a próxima falha contaria como a 6ª).
    await prisma.usuario.update({
      where: { id: registro.id },
      data: { tentativasFalhas: 0, bloqueadoAte: null },
    });
  }

  if (!(await verificarSenha(senha, registro.senhaHash))) {
    // Incremento atômico no banco; quem cruzar o limite aplica o bloqueio.
    const atualizado = await prisma.usuario.update({
      where: { id: registro.id },
      data: { tentativasFalhas: { increment: 1 } },
      select: { tentativasFalhas: true },
    });
    if (atualizado.tentativasFalhas >= MAX_FALHAS) {
      await prisma.usuario.update({
        where: { id: registro.id },
        data: { bloqueadoAte: new Date(Date.now() + DURACAO_BLOQUEIO_MS) },
      });
    }
    throw credenciaisInvalidas();
  }

  await prisma.usuario.update({
    where: { id: registro.id },
    data: { tentativasFalhas: 0, bloqueadoAte: null },
  });

  return {
    id: registro.id,
    usuario: registro.usuario,
    nome: registro.nome,
    fotoUrl: registro.fotoUrl,
    telefone: registro.telefone,
  };
}
