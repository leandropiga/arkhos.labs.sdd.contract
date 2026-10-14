import { describe, expect, it } from 'vitest';
import { gerarHash, verificarSenha } from '../../src/lib/senha.js';

// Interface fixada por este teste (a T020 implementa exatamente isto):
//   src/lib/senha.ts -> gerarHash(senha): Promise<string>
//                       verificarSenha(senha, hash): Promise<boolean>
// Ambas assíncronas (scrypt assíncrono de node:crypto) e sem depender de variáveis de ambiente.

describe('senha', () => {
  it('gerarHash devolve uma string que não contém a senha em claro', async () => {
    const hash = await gerarHash('Senha@123');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toContain('Senha@123');
  });

  it('gerarHash produz valores diferentes para a mesma senha (sal aleatório)', async () => {
    const [a, b] = await Promise.all([gerarHash('Senha@123'), gerarHash('Senha@123')]);
    expect(a).not.toBe(b);
  });

  it('verificarSenha aceita a senha certa', async () => {
    const hash = await gerarHash('Senha@123');
    await expect(verificarSenha('Senha@123', hash)).resolves.toBe(true);
  });

  it('verificarSenha aceita a senha certa em qualquer um dos hashes gerados', async () => {
    const [a, b] = await Promise.all([gerarHash('Senha@123'), gerarHash('Senha@123')]);
    await expect(verificarSenha('Senha@123', a)).resolves.toBe(true);
    await expect(verificarSenha('Senha@123', b)).resolves.toBe(true);
  });

  it('verificarSenha recusa a senha errada', async () => {
    const hash = await gerarHash('Senha@123');
    await expect(verificarSenha('senha@123', hash)).resolves.toBe(false);
    await expect(verificarSenha('', hash)).resolves.toBe(false);
  });

  it('verificarSenha recusa um hash malformado em vez de lançar erro', async () => {
    await expect(verificarSenha('Senha@123', 'isto-nao-e-um-hash')).resolves.toBe(false);
    await expect(verificarSenha('Senha@123', '')).resolves.toBe(false);
  });
});
