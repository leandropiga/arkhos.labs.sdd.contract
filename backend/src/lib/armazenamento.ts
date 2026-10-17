import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

/** Pasta dos PDFs definitivos (STORAGE_DIR), absoluta. */
function pastaStorage(): string {
  return path.resolve(process.cwd(), env().STORAGE_DIR);
}

/** Caminho do PDF de um contrato: STORAGE_DIR/<id>.pdf. */
export function caminhoDoPdf(id: string): string {
  return path.join(pastaStorage(), `${id}.pdf`);
}

/**
 * Move o arquivo temporário para STORAGE_DIR/<id>.pdf. Se já houver um PDF com esse id,
 * ele é substituído. O temporário deixa de existir (rename), então não sobra nada em UPLOAD_TMP_DIR.
 */
export async function salvarDoTemporario(caminhoTmp: string, id: string): Promise<void> {
  await mkdir(pastaStorage(), { recursive: true });
  const destino = caminhoDoPdf(id);
  try {
    await rename(caminhoTmp, destino);
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code !== 'EXDEV') throw erro;
    // tmp e storage em volumes diferentes: rename não atravessa volumes, então copia e apaga.
    // Copia para um .part na mesma pasta do destino e só então faz rename (atômico no mesmo volume):
    // uma falha no meio da cópia nunca deixa o PDF de destino truncado.
    const parcial = `${destino}.${randomUUID()}.part`;
    try {
      await copyFile(caminhoTmp, parcial);
      await rename(parcial, destino);
    } catch (erroCopia) {
      await rm(parcial, { force: true });
      throw erroCopia;
    }
    await rm(caminhoTmp, { force: true });
  }
}

/** Apaga o PDF de um contrato. Não falha se o arquivo já não existe. */
export async function removerPdf(id: string): Promise<void> {
  await rm(caminhoDoPdf(id), { force: true });
}
