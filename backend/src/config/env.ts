import { z } from 'zod';

const obrigatoria = z.string({ error: 'obrigatória' }).min(1, 'obrigatória');

const esquema = z.object({
  DATABASE_URL: obrigatoria,
  JWT_SECRET: obrigatoria,
  GEMINI_API_KEY: obrigatoria,
  // Só o seed usa; por isso opcionais aqui.
  SEED_USUARIO: z.string().min(1).optional(),
  SEED_SENHA: z.string().min(1).optional(),
  UPLOAD_TMP_DIR: z.string().min(1).default('tmp/uploads'),
  STORAGE_DIR: z.string().min(1).default('storage/contratos'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof esquema>;

/** Valida a fonte (sem tocar em process.env) e lança erro citando as variáveis com problema. */
export function lerEnv(fonte: NodeJS.ProcessEnv): Env {
  const resultado = esquema.safeParse(fonte);
  if (resultado.success) return resultado.data;

  const problemas = resultado.error.issues.map((i) => `${String(i.path[0])} (${i.message})`);
  throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${problemas.join(', ')}`);
}

let cache: Env | undefined;

/** Env da aplicação, lido de process.env na primeira chamada (preguiçoso: importar não valida). */
export function env(): Env {
  cache ??= lerEnv(process.env);
  return cache;
}
