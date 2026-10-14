/** Tira tudo que não é dígito (pontos, traço, espaços...). */
export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function digitoVerificador(base: number[]): number {
  const soma = base.reduce((acc, d, i) => acc + d * (base.length + 1 - i), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** CPF válido: 11 dígitos (com ou sem pontuação), não repetidos, com os 2 dígitos verificadores corretos. */
export function cpfValido(cpf: string): boolean {
  // Letras não são pontuação: recusa antes de normalizar.
  if (/[A-Za-z]/.test(cpf)) return false;
  const digitos = normalizarCpf(cpf);
  if (!/^\d{11}$/.test(digitos)) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  const numeros = digitos.split('').map(Number);
  const d1 = digitoVerificador(numeros.slice(0, 9));
  const d2 = digitoVerificador(numeros.slice(0, 10));
  return d1 === numeros[9] && d2 === numeros[10];
}
