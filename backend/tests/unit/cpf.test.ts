import { describe, expect, it } from 'vitest';
import { cpfValido, normalizarCpf } from '../../src/lib/cpf.js';

// 529.982.247-25 é um CPF com dígitos verificadores corretos.
describe('normalizarCpf', () => {
  it('tira a pontuação e deixa só os 11 dígitos', () => {
    expect(normalizarCpf('529.982.247-25')).toBe('52998224725');
  });

  it('mantém o CPF que já vem só com dígitos', () => {
    expect(normalizarCpf('52998224725')).toBe('52998224725');
  });

  it('ignora espaços e outros símbolos', () => {
    expect(normalizarCpf(' 529 982 247/25 ')).toBe('52998224725');
  });
});

describe('cpfValido', () => {
  it('aceita CPF com pontuação', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
  });

  it('aceita CPF sem pontuação', () => {
    expect(cpfValido('52998224725')).toBe(true);
  });

  it('aceita CPF com dígito verificador 0 (resto 10 ou 0 vira 0)', () => {
    expect(cpfValido('123.456.788-10')).toBe(true);
    expect(cpfValido('390.533.447-05')).toBe(true);
  });

  it('recusa primeiro dígito verificador errado', () => {
    expect(cpfValido('529.982.247-35')).toBe(false);
  });

  it('recusa segundo dígito verificador errado', () => {
    expect(cpfValido('529.982.247-26')).toBe(false);
  });

  it('recusa sequências repetidas, mesmo com dígitos "corretos"', () => {
    expect(cpfValido('111.111.111-11')).toBe(false);
    for (let d = 0; d <= 9; d++) {
      expect(cpfValido(String(d).repeat(11))).toBe(false);
    }
  });

  it('recusa tamanho diferente de 11 dígitos', () => {
    expect(cpfValido('5299822472')).toBe(false);
    expect(cpfValido('529982247250')).toBe(false);
    expect(cpfValido('')).toBe(false);
  });

  it('recusa texto com letras', () => {
    expect(cpfValido('abc.def.ghi-jk')).toBe(false);
    expect(cpfValido('5299822472a')).toBe(false);
  });
});
