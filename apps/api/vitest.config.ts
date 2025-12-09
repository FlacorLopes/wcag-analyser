import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: false,
    root: './',
    include: ['**/*.e2e-spec.ts', '**/*.spec.ts'],
    hookTimeout: 120000, // Testcontainers can take time to start
    testTimeout: 30000,
  },
  plugins: [
    //@ts-expect-error  swc types messing
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
