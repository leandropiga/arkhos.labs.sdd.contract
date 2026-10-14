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

/** Grava o bloqueio se o contador chegou ao limite e ainda não há bloqueio (idempotente). */
const aplicarBloqueioSeNoLimite = (id: string) =>
  prisma.usuario.updateMany({
    where: { id, tentativasFalhas: { gte: MAX_FALHAS }, bloqueadoAte: null },
    data: { bloqueadoAte: new Date(Date.now() + DURACAO_BLOQUEIO_MS) },
  });

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
  // 1) Bloqueio vencido: recomeça a contagem (senão a próxima falha contaria como a 6ª).
  //    Condicional no banco: só zera se o bloqueio já passou.
  await prisma.usuario.updateMany({
    where: { id: registro.id, bloqueadoAte: { lte: agora } },
    data: { tentativasFalhas: 0, bloqueadoAte: null },
  });

  // 2) Reserva ATÔMICA da tentativa ANTES de verificar a senha. O UPDATE condicional é
  //    serializado pelo Postgres (trava de linha): com N requisições simultâneas, no máximo
  //    MAX_FALHAS conseguem reservar; as demais recebem 429 sem chegar ao scrypt (SC-005).
  //    Bloqueado (bloqueadoAte no futuro) ou contador no limite também caem aqui, sem
  //    alterar os contadores.
  const reserva = await prisma.usuario.updateMany({
    where: { id: registro.id, tentativasFalhas: { lt: MAX_FALHAS }, bloqueadoAte: null },
    data: { tentativasFalhas: { increment: 1 } },
  });
  if (reserva.count === 0) {
    // Garante o bloqueio mesmo se quem reservou a 5ª tentativa não chegou a gravá-lo
    // (ex.: falhou no meio); sem isso a conta ficaria presa no limite sem prazo de saída.
    await aplicarBloqueioSeNoLimite(registro.id);
    throw new ErroApp(
      429,
      'LOGIN_BLOQUEADO',
      'Muitas tentativas sem sucesso. Tente novamente em 15 minutos.',
    );
  }

  // 3) Verifica a senha.
  if (!(await verificarSenha(senha, registro.senhaHash))) {
    // A tentativa já foi contada na reserva. Se o contador chegou ao limite, grava o
    // bloqueio — de forma idempotente (só quem encontrar bloqueadoAte nulo grava).
    await aplicarBloqueioSeNoLimite(registro.id);
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
