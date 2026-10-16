import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { fumadocsMdx } from 'fumadocs-mdx/vite';
import { defineConfig } from 'vite';
import { servePublishedArtifacts } from './vite/servePublishedArtifacts.ts';

export default defineConfig({
  base: process.env.SHOWCASE_BASE || '/kunstkamera/',
  plugins: [
    fumadocsMdx(),
    tailwindcss(),
    reactRouter(),
    servePublishedArtifacts(),
  ],
  server: { fs: { allow: ['.', '../gemfire/docs', '../total-space/docs'] } },
  build: { target: 'es2022' },
});
