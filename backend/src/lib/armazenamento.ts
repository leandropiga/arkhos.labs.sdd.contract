import { mkdir, rename, rm } from 'node:fs/promises';
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
  await rename(caminhoTmp, caminhoDoPdf(id));
}

/** Apaga o PDF de um contrato. Não falha se o arquivo já não existe. */
export async function removerPdf(id: string): Promise<void> {
  await rm(caminhoDoPdf(id), { force: true });
}
