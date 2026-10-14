/** Minúsculas e sem acentos, para buscar sem se preocupar com diacríticos (R-08). */
export function normalizarParaBusca(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
