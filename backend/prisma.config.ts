import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// R-11: sem dotenv. O Node carrega o .env nativamente e NÃO sobrescreve variáveis
// já definidas (o global-setup dos testes injeta o DATABASE_URL do .env.test).
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Leitura direta (sem env()): comandos que não tocam no banco, como
    // `prisma generate`, funcionam mesmo sem DATABASE_URL definido.
    url: process.env.DATABASE_URL ?? '',
  },
});
