import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/generated/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
    env: loadEnv('test', process.cwd(), ''),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
