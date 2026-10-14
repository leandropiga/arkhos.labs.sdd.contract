import { mkdir, readdir, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Os testes de contratos usam pastas próprias (dentro de backend/tmp, ignorada pelo Git) para
// nunca encostar nos PDFs de desenvolvimento. As variáveis precisam ser trocadas ANTES de a
// aplicação ler o env; por isso os testes importam este módulo antes de '../../src/app.js'.
process.env.UPLOAD_TMP_DIR = 'tmp/teste/uploads';
process.env.STORAGE_DIR = 'tmp/teste/storage';

export const LIMITE_PDF_BYTES = 52_428_800;

export const dirTmp = (): string => path.resolve(process.cwd(), process.env.UPLOAD_TMP_DIR as string);
export const dirStorage = (): string => path.resolve(process.cwd(), process.env.STORAGE_DIR as string);
export const caminhoNoStorage = (id: string): string => path.join(dirStorage(), `${id}.pdf`);

/** Esvazia e recria as duas pastas de teste. */
export async function prepararPastas(): Promise<void> {
  for (const dir of [dirTmp(), dirStorage()]) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
}

/** Apaga as duas pastas de teste (não deixa nada para trás). */
export async function removerPastas(): Promise<void> {
  for (const dir of [dirTmp(), dirStorage()]) {
    await rm(dir, { recursive: true, force: true });
  }
  // Remove também a pasta-mãe 'tmp/teste' se ficou vazia (rmdir não apaga pasta com conteúdo).
  await rmdir(path.dirname(dirTmp())).catch(() => undefined);
}

/** Nomes dos arquivos de uma pasta (vazio se a pasta não existir). */
export async function listar(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).sort();
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw erro;
  }
}

/** PDF mínimo válido: começa com %PDF- e termina com %%EOF. `marca` torna o conteúdo distinguível. */
export function pdfValido(marca = 'original'): Buffer {
  return Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n% ${marca}\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`,
    'latin1',
  );
}

/** Começa com %PDF- mas foi cortado: não há %%EOF nos últimos 1024 bytes. */
export function pdfTruncado(): Buffer {
  return Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n${'x'.repeat(2000)}`, 'latin1');
}

/** Arquivo com cara de PDF (nome .pdf), mas sem a assinatura %PDF-. */
export function pdfFalso(): Buffer {
  return Buffer.from('Isto é só um texto, não um PDF.\n%%EOF\n', 'utf8');
}

/** PDF (assinatura e %%EOF ok) com 1 byte a mais que o limite de 50 MB. */
export function pdfGrande(): Buffer {
  const tamanho = LIMITE_PDF_BYTES + 1;
  const buf = Buffer.alloc(tamanho, 0x20);
  buf.write('%PDF-1.4\n', 0, 'latin1');
  buf.write('\n%%EOF\n', tamanho - 7, 'latin1');
  return buf;
}

/** Grava um PDF direto na pasta de armazenamento, como se o upload já tivesse acontecido. */
export async function gravarNoStorage(id: string, conteudo: Buffer): Promise<void> {
  await mkdir(dirStorage(), { recursive: true });
  await writeFile(caminhoNoStorage(id), conteudo);
}
