import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeJwt } from 'jose';
import { assinarToken, verificarToken } from '../../src/lib/jwt.js';
import { apagarCookieSessao, criarCookieSessao, lerCookie } from '../../src/lib/cookies.js';

// Interface fixada por este teste (a T020 implementa exatamente isto):
//   src/lib/jwt.ts     -> assinarToken(usuarioId: string, segredo: string): Promise<string>
//                         verificarToken(token: string, segredo: string): Promise<string | null>
//                         (HS256, expira em 8 h, claim `sub` = id do usuário;
//                          devolve o id, ou null se o token for inválido, adulterado ou expirado;
//                          nunca lança erro)
//   src/lib/cookies.ts -> lerCookie(cabecalho: string | undefined, nome: string): string | undefined
//                         criarCookieSessao(token: string, ambiente: string): string
//                         apagarCookieSessao(ambiente: string): string
//                         (valores do cabeçalho Set-Cookie; `ambiente` é o NODE_ENV recebido por
//                          parâmetro, e Secure só aparece quando ele não é 'development')
// As libs não leem process.env: segredo e ambiente entram por parâmetro.

const SEGREDO = 'segredo-de-teste-com-pelo-menos-32-caracteres';
const OUTRO_SEGREDO = 'outro-segredo-de-teste-com-32-caracteres!!';
const OITO_HORAS_MS = 8 * 60 * 60 * 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe('jwt', () => {
  it('assina um token que expira em 8 horas', async () => {
    const token = await assinarToken('usuario-1', SEGREDO);
    const claims = decodeJwt(token);
    expect(claims.sub).toBe('usuario-1');
    expect(claims.exp! - claims.iat!).toBe(28800);
  });

  it('verifica um token válido e devolve o id do usuário', async () => {
    const token = await assinarToken('usuario-1', SEGREDO);
    await expect(verificarToken(token, SEGREDO)).resolves.toBe('usuario-1');
  });

  it('recusa um token com a assinatura adulterada', async () => {
    const token = await assinarToken('usuario-1', SEGREDO);
    const [cabecalho, corpo, assinatura] = token.split('.');
    const trocada = (assinatura![0] === 'A' ? 'B' : 'A') + assinatura!.slice(1);
    await expect(verificarToken(`${cabecalho}.${corpo}.${trocada}`, SEGREDO)).resolves.toBeNull();
  });

  it('recusa um token cujo corpo foi alterado', async () => {
    const token = await assinarToken('usuario-1', SEGREDO);
    const [cabecalho, , assinatura] = token.split('.');
    const corpoFalso = Buffer.from(JSON.stringify({ sub: 'usuario-2' })).toString('base64url');
    await expect(verificarToken(`${cabecalho}.${corpoFalso}.${assinatura}`, SEGREDO)).resolves.toBeNull();
  });

  it('recusa um token assinado com outro segredo', async () => {
    const token = await assinarToken('usuario-1', OUTRO_SEGREDO);
    await expect(verificarToken(token, SEGREDO)).resolves.toBeNull();
  });

  it('recusa lixo em vez de lançar erro', async () => {
    await expect(verificarToken('', SEGREDO)).resolves.toBeNull();
    await expect(verificarToken('isto-nao-e-um-jwt', SEGREDO)).resolves.toBeNull();
  });

  it('aceita o token logo antes das 8 horas e recusa depois delas', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const token = await assinarToken('usuario-1', SEGREDO);

    vi.setSystemTime(Date.now() + OITO_HORAS_MS - 60_000);
    await expect(verificarToken(token, SEGREDO)).resolves.toBe('usuario-1');

    vi.setSystemTime(Date.now() + 2 * 60_000);
    await expect(verificarToken(token, SEGREDO)).resolves.toBeNull();
  });
});

describe('lerCookie', () => {
  it('extrai o valor do cookie pelo nome', () => {
    expect(lerCookie('sessao=abc.def.ghi', 'sessao')).toBe('abc.def.ghi');
  });

  it('acha o cookie entre vários', () => {
    expect(lerCookie('tema=escuro; sessao=abc123; idioma=pt-BR', 'sessao')).toBe('abc123');
  });

  it('não confunde nomes parecidos', () => {
    expect(lerCookie('outra_sessao=x; sessao=certo', 'sessao')).toBe('certo');
    expect(lerCookie('outra_sessao=x', 'sessao')).toBeUndefined();
  });

  it('devolve undefined sem cabeçalho ou sem o cookie', () => {
    expect(lerCookie(undefined, 'sessao')).toBeUndefined();
    expect(lerCookie('', 'sessao')).toBeUndefined();
    expect(lerCookie('tema=escuro', 'sessao')).toBeUndefined();
  });
});

describe('cookie de sessão', () => {
  it('traz o token e os atributos HttpOnly, SameSite=Lax, Path=/ e Max-Age=28800', () => {
    const cookie = criarCookieSessao('abc.def.ghi', 'production');
    expect(cookie.startsWith('sessao=abc.def.ghi;')).toBe(true);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=28800');
  });

  it('inclui Secure fora de development', () => {
    expect(criarCookieSessao('t', 'production')).toContain('Secure');
    expect(criarCookieSessao('t', 'test')).toContain('Secure');
  });

  it('não inclui Secure em development', () => {
    expect(criarCookieSessao('t', 'development')).not.toContain('Secure');
  });

  it('o cookie que apaga a sessão tem valor vazio, expira na hora e mantém Path e HttpOnly', () => {
    const cookie = apagarCookieSessao('production');
    expect(cookie.startsWith('sessao=;')).toBe(true);
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
  });

  it('o cookie que apaga a sessão não inclui Secure em development', () => {
    expect(apagarCookieSessao('development')).not.toContain('Secure');
  });

  it('o valor do cookie de criação lido de volta por lerCookie é o token', () => {
    const cookie = criarCookieSessao('abc.def.ghi', 'production');
    expect(lerCookie(cookie.split(';')[0], 'sessao')).toBe('abc.def.ghi');
  });
});
