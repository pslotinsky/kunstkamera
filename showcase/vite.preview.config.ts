import { defineConfig } from 'vite';

// Preview the exact Pages artifact without the framework's SSR middleware.
export default defineConfig({
  base: process.env.SHOWCASE_BASE || '/kunstkamera/',
  appType: 'mpa',
  build: { outDir: 'dist/public' },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
