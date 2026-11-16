import { defineConfig } from 'vitest/config';

const sourceDir = new URL('./src', import.meta.url).pathname;

export default defineConfig({
  resolve: {
    alias: {
      '@': sourceDir,
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
