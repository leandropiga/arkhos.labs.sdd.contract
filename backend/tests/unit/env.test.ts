import { describe, expect, it } from 'vitest';
import { lerEnv } from '../../src/config/env.js';

// Interface fixada por este teste (a T019 implementa exatamente isto):
//   src/config/env.ts -> lerEnv(fonte: NodeJS.ProcessEnv): Env
//   Função pura: não toca em process.env. Lança Error citando as variáveis faltantes/inválidas.
//   Obrigatórias: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY.
//   Opcionais: SEED_USUARIO, SEED_SENHA (só o seed usa) e as com padrão
//   (UPLOAD_TMP_DIR, STORAGE_DIR, PORT como número, NODE_ENV).

const completa: NodeJS.ProcessEnv = {
  DATABASE_URL: 'postgresql://contratos:contratos@localhost:5432/contratos',
  JWT_SECRET: 'segredo',
  GEMINI_API_KEY: 'chave',
  SEED_USUARIO: 'admin',
  SEED_SENHA: 'senha',
  UPLOAD_TMP_DIR: 'tmp/x',
  STORAGE_DIR: 'storage/x',
  PORT: '4000',
  NODE_ENV: 'test',
};

describe('lerEnv', () => {
  it('devolve o objeto tipado quando todas as variáveis estão presentes', () => {
    expect(lerEnv(completa)).toEqual({
      DATABASE_URL: completa.DATABASE_URL,
      JWT_SECRET: 'segredo',
      GEMINI_API_KEY: 'chave',
      SEED_USUARIO: 'admin',
      SEED_SENHA: 'senha',
      UPLOAD_TMP_DIR: 'tmp/x',
      STORAGE_DIR: 'storage/x',
      PORT: 4000,
      NODE_ENV: 'test',
    });
  });

  it('falha citando JWT_SECRET quando ele falta', () => {
    const { JWT_SECRET: _omitida, ...semSegredo } = completa;
    expect(() => lerEnv(semSegredo)).toThrow(/JWT_SECRET/);
  });

  it('falha citando JWT_SECRET quando ele é vazio', () => {
    expect(() => lerEnv({ ...completa, JWT_SECRET: '' })).toThrow(/JWT_SECRET/);
  });

  it('cita todas as obrigatórias que faltam', () => {
    expect(() => lerEnv({})).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET[\s\S]*GEMINI_API_KEY/);
  });

  it('aplica os padrões e deixa SEED_* opcionais', () => {
    const env = lerEnv({
      DATABASE_URL: 'postgresql://x',
      JWT_SECRET: 's',
      GEMINI_API_KEY: 'g',
    });
    expect(env.UPLOAD_TMP_DIR).toBe('tmp/uploads');
    expect(env.STORAGE_DIR).toBe('storage/contratos');
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.SEED_USUARIO).toBeUndefined();
    expect(env.SEED_SENHA).toBeUndefined();
  });

  it('rejeita NODE_ENV fora de development|test|production', () => {
    expect(() => lerEnv({ ...completa, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rejeita PORT que não é inteiro positivo', () => {
    expect(() => lerEnv({ ...completa, PORT: 'abc' })).toThrow(/PORT/);
  });
});
