import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: false,
    root: './',
    hookTimeout: 120000, // Testcontainers can take time to start
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
    },
  },
  plugins: [
    //@ts-expect-error  swc types messing
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
