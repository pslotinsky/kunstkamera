import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { fumadocsMdx } from 'fumadocs-mdx/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.SHOWCASE_BASE || '/kunstkamera/',
  plugins: [fumadocsMdx(), tailwindcss(), reactRouter()],
  server: { fs: { allow: ['.', '../gemfire/docs'] } },
  build: { target: 'es2022' },
});
