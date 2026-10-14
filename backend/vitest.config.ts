import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    // Pastas de upload/storage só dos testes (backend/tmp é ignorada pelo Git). Precisam vir
    // daqui: o setupFile já carrega o env() com cache antes de qualquer arquivo de teste.
    env: { UPLOAD_TMP_DIR: 'tmp/teste/uploads', STORAGE_DIR: 'tmp/teste/storage' },
    globalSetup: "tests/setup/global-setup.ts",
    setupFiles: "tests/setup/limpar-banco.ts",
  },
});
