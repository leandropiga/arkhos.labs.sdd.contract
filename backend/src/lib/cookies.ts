const NOME_COOKIE = 'sessao';
const OITO_HORAS_S = 8 * 60 * 60;

/** Lê o valor de um cookie do cabeçalho `Cookie`. */
export function lerCookie(cabecalho: string | undefined, nome: string): string | undefined {
  for (const par of (cabecalho ?? '').split(';')) {
    const i = par.indexOf('=');
    if (i > 0 && par.slice(0, i).trim() === nome) return par.slice(i + 1).trim();
  }
  return undefined;
}

function montar(valor: string, maxAge: number, ambiente: string): string {
  const atributos = [`${NOME_COOKIE}=${valor}`, 'HttpOnly', 'SameSite=Lax', 'Path=/', `Max-Age=${maxAge}`];
  if (ambiente !== 'development') atributos.push('Secure');
  return atributos.join('; ');
}

export function criarCookieSessao(token: string, ambiente: string): string {
  return montar(token, OITO_HORAS_S, ambiente);
}

export function apagarCookieSessao(ambiente: string): string {
  return montar('', 0, ambiente);
}
