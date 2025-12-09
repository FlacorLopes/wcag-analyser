import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: false,
    root: './',
    include: ['**/*.e2e-spec.ts', '**/*.spec.ts'],
  },
  plugins: [
    //@ts-expect-error swc
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
