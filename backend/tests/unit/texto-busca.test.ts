import { describe, expect, it } from 'vitest';
import { normalizarParaBusca } from '../../src/lib/texto-busca.js';

// Interface fixada por este teste (a T020 implementa exatamente isto):
//   src/lib/texto-busca.ts -> normalizarParaBusca(texto: string): string
// Regra (research.md R-08): texto.normalize('NFD'), remove diacríticos e toLowerCase().
// Não há trim nem colapso de espaços nesta regra.

describe('normalizarParaBusca', () => {
  it('remove acentos e converte para minúsculas', () => {
    expect(normalizarParaBusca('José ÁLVARES')).toBe('jose alvares');
  });

  it('remove a cedilha', () => {
    expect(normalizarParaBusca('Conceição')).toBe('conceicao');
  });
});
