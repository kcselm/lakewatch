import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    // every authored bird's model, loaded before each test file (src/birds/models.setup.ts)
    setupFiles: ['src/birds/models.setup.ts'],
    // the swim simulations run seconds each; side by side on a busy machine they pass the 5 s default
    testTimeout: 20_000,
    // the long simulations slow each other down a worker per core, past their timeouts; half the cores runs them
    // all in less time than that
    maxWorkers: '50%',
  },
})
