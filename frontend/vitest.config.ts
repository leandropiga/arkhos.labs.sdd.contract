import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      unstubGlobals: true,
      mockReset: true,
      setupFiles: ['tests/setup.ts'],
    },
  }),
)
