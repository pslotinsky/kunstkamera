import { globSync } from 'node:fs';
import type { Config } from '@react-router/dev/config';
import { docs } from './source.config.ts';

const basename = process.env.SHOWCASE_BASE || '/kunstkamera/';

export default {
  appDirectory: 'src',
  buildDirectory: 'dist',
  basename,
  ssr: false,
  prerender() {
    const documents = [...globSync(docs.docs.files || [], { cwd: docs.dir })];
    const paths = [
      '/',
      '/404/',
      '/gemfire/play/',
      '/gemfire/docs/',
      '/gemfire/search.json',
      ...documents.map((file) => `/gemfire/docs/${file.replace(/\.md$/, '')}/`),
    ];
    return paths;
  },
} satisfies Config;
