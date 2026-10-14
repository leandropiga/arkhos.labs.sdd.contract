import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ErroApp } from '../../src/http/erros.js';
import { middlewareErros } from '../../src/http/middleware-erros.js';

// Interface fixada por este teste (a T021 implementa exatamente isto):
//   src/http/erros.ts            -> class ErroApp(status, codigo, mensagem, campos?)
//   src/http/middleware-erros.ts -> middlewareErros(erro, req, res, next)
// Corpo de erro: { erro: { codigo, mensagem, campos? } }, `campos` só em VALIDACAO_INVALIDA.

function executar(erro: unknown) {
  const json = vi.fn();
  const res = { status: vi.fn(), json } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  const next = vi.fn() as unknown as NextFunction;
  const silenciar = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    middlewareErros(erro, {} as Request, res, next);
  } finally {
    silenciar.mockRestore();
  }
  const status = (res.status as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as number;
  const corpo = json.mock.calls[0]?.[0] as { erro: Record<string, unknown> };
  return { status, corpo, json };
}

describe('middleware de erros', () => {
  it('converte ErroApp no JSON do contrato com o status certo', () => {
    const { status, corpo } = executar(
      new ErroApp(409, 'CPF_DUPLICADO', 'Já existe um cliente com este CPF.'),
    );
    expect(status).toBe(409);
    expect(corpo).toEqual({
      erro: { codigo: 'CPF_DUPLICADO', mensagem: 'Já existe um cliente com este CPF.' },
    });
    expect(corpo.erro).not.toHaveProperty('campos');
  });

  it('inclui campos quando o ErroApp os carrega', () => {
    const campos = [{ campo: 'cpf', mensagem: 'CPF inválido.' }];
    const { status, corpo } = executar(
      new ErroApp(400, 'VALIDACAO_INVALIDA', 'Alguns campos estão inválidos.', campos),
    );
    expect(status).toBe(400);
    expect(corpo.erro.campos).toEqual(campos);
  });

  it('converte ZodError em 400 VALIDACAO_INVALIDA com campos', () => {
    const resultado = z
      .object({
        cpf: z.string().min(11, 'CPF inválido.'),
        endereco: z.object({ cep: z.string().min(8, 'CEP inválido.') }),
      })
      .safeParse({ cpf: '123', endereco: { cep: '1' } });
    expect(resultado.success).toBe(false);

    const { status, corpo } = executar(resultado.error);
    expect(status).toBe(400);
    expect(corpo.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(typeof corpo.erro.mensagem).toBe('string');
    expect(corpo.erro.campos).toEqual([
      { campo: 'cpf', mensagem: 'CPF inválido.' },
      { campo: 'endereco.cep', mensagem: 'CEP inválido.' },
    ]);
  });

  it('converte erro desconhecido em 500 ERRO_INTERNO genérico, sem vazar detalhes', () => {
    const erro = new Error(
      'select * from "Cliente" where cpf = 1 falhou em C:\Developer\app\src\repo.ts',
    );
    erro.stack = 'Error: x\n    at consultar (C:\Developer\app\src\repo.ts:10:5)';

    const { status, corpo } = executar(erro);
    expect(status).toBe(500);
    expect(corpo).toEqual({
      erro: { codigo: 'ERRO_INTERNO', mensagem: 'Ocorreu um erro inesperado. Tente novamente.' },
    });

    const texto = JSON.stringify(corpo);
    expect(texto).not.toMatch(/select|Cliente|stack|\.ts|C:\|\bat\b/i);
  });

  it('trata valores lançados que não são Error como 500 ERRO_INTERNO', () => {
    const { status, corpo } = executar('texto solto');
    expect(status).toBe(500);
    expect(corpo.erro.codigo).toBe('ERRO_INTERNO');
    expect(JSON.stringify(corpo)).not.toContain('texto solto');
  });
});
