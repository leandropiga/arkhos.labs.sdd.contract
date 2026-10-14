import { afterAll, beforeAll } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';

// Antes de cada arquivo de teste: apaga os dados de todas as tabelas (menos o histórico
// de migrações). Os arquivos rodam em sequência (fileParallelism: false), então não há disputa.
beforeAll(async () => {
  const tabelas = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tabelas.length === 0) return;
  const lista = tabelas.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await prisma.$disconnect();
});
