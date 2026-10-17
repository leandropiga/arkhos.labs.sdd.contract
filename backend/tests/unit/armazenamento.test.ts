import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { caminhoNoStorage, dirTmp, listar, prepararPastas, removerPastas } from '../helpers/arquivos.js';

// rename falha com EXDEV quando tmp e storage estão em volumes diferentes: simulamos isso aqui.
const { renameMock, copyFileMock } = vi.hoisted(() => ({ renameMock: vi.fn(), copyFileMock: vi.fn() }));
vi.mock('node:fs/promises', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('node:fs/promises')>();
  renameMock.mockImplementation(original.rename);
  copyFileMock.mockImplementation(original.copyFile);
  return { ...original, rename: renameMock, copyFile: copyFileMock };
});

const { salvarDoTemporario } = await import('../../src/lib/armazenamento.js');

const ID = '11111111-1111-4111-8111-111111111111';

beforeAll(prepararPastas);
afterAll(removerPastas);
beforeEach(async () => {
  await prepararPastas();
});

function erroComCodigo(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}

describe('salvarDoTemporario', () => {
  it('com EXDEV copia para o storage e apaga o temporário', async () => {
    const tmp = path.join(dirTmp(), 'upload.tmp');
    await writeFile(tmp, 'conteudo-pdf');
    renameMock.mockRejectedValueOnce(erroComCodigo('EXDEV'));

    await salvarDoTemporario(tmp, ID);

    expect((await readFile(caminhoNoStorage(ID))).toString()).toBe('conteudo-pdf');
    expect(await listar(dirTmp())).toEqual([]);
  });

  it('com EXDEV e falha na cópia, o PDF de destino anterior fica intacto e não sobra .part', async () => {
    await writeFile(caminhoNoStorage(ID), 'antigo-intacto');
    const tmp = path.join(dirTmp(), 'upload.tmp');
    await writeFile(tmp, 'novo');
    renameMock.mockRejectedValueOnce(erroComCodigo('EXDEV'));
    copyFileMock.mockImplementationOnce(async (_origem: string, parcial: string) => {
      await writeFile(parcial, 'trunc'); // cópia que morre no meio, deixando lixo no .part
      throw erroComCodigo('ENOSPC');
    });

    await expect(salvarDoTemporario(tmp, ID)).rejects.toMatchObject({ code: 'ENOSPC' });

    expect((await readFile(caminhoNoStorage(ID))).toString()).toBe('antigo-intacto');
    expect(await listar(path.dirname(caminhoNoStorage(ID)))).toEqual([`${ID}.pdf`]);
    expect(await listar(dirTmp())).toEqual(['upload.tmp']);
  });

  it('outros erros do rename continuam subindo e o temporário fica intacto', async () => {
    const tmp = path.join(dirTmp(), 'upload.tmp');
    await writeFile(tmp, 'x');
    renameMock.mockRejectedValueOnce(erroComCodigo('EACCES'));

    await expect(salvarDoTemporario(tmp, ID)).rejects.toMatchObject({ code: 'EACCES' });
    expect(await listar(dirTmp())).toEqual(['upload.tmp']);
  });
});
