import { execFileSync } from 'node:child_process';

/**
 * Roda uma vez, no processo principal do Vitest, antes de qualquer arquivo de teste:
 * carrega o .env.test e aplica as migrações no banco de teste.
 */
export default async function globalSetup(): Promise<void> {
  // loadEnvFile não sobrescreve variáveis já definidas; por isso o .env.test entra primeiro
  // e o prisma.config.ts (que carrega o .env de desenvolvimento) não consegue trocar o banco.
  try {
    process.loadEnvFile('.env.test');
  } catch (erro) {
    throw new Error(
      `Não foi possível ler backend/.env.test (copie de .env.test.example): ${(erro as Error).message}`,
    );
  }

  const banco = process.env.DATABASE_URL ?? '';
  if (!/_test(\?.*)?$/.test(banco)) {
    throw new Error('DATABASE_URL do .env.test deve apontar para um banco terminado em _test.');
  }

  try {
    // Roda o CLI local com o próprio Node: sem npx, sem shell, igual em Windows e Linux.
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      env: process.env,
      stdio: 'pipe',
    });
  } catch (erro) {
    const e = erro as { stdout?: Buffer; stderr?: Buffer };
    throw new Error(
      `prisma migrate deploy falhou no banco de teste (o Docker está de pé? "docker compose up -d"):\n${e.stdout?.toString() ?? ''}${e.stderr?.toString() ?? ''}`,
    );
  }
}
