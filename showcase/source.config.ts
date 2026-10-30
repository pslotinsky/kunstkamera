import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { z } from 'zod';
import { remarkLiteralHtml } from './vite/remarkLiteralHtml.ts';

export const docs = defineDocs({
  dir: '../gemfire/docs',
  docs: {
    async: true,
    files: ['ROADMAP.md', 'design/[0-9]*.md', 'spec/*.md', 'guides/README.md'],
    schema: ({ source, path }) =>
      pageSchema.extend({
        title: z.string().default(source.match(/^#\s+(.+)$/m)?.[1] || path),
      }),
  },
  meta: { files: [] },
});

export const totalSpaceDocs = defineDocs({
  dir: '../total-space/docs',
  docs: {
    async: true,
    files: ['README.md', 'game/**/*.md', 'tech/**/*.md', 'mockups/**/*.md'],
    schema: ({ source, path }) =>
      pageSchema.extend({
        title: z.string().default(source.match(/^#\s+(.+)$/m)?.[1] || path),
      }),
  },
  meta: { files: [] },
});

export const sinkCityDocs = defineDocs({
  dir: '../sink-city/docs',
  docs: {
    async: true,
    files: ['README.md', 'game/**/*.md', 'tech/**/*.md', 'mockups/**/*.md'],
    schema: ({ source, path }) =>
      pageSchema.extend({
        title: z.string().default(source.match(/^#\s+(.+)$/m)?.[1] || path),
      }),
  },
  meta: { files: [] },
});

export default defineConfig({
  mdxOptions: {
    // Existing documents are Markdown, including literal angle brackets.
    format: 'md',
    remarkPlugins: (plugins) => [
      ...plugins,
      remarkLiteralHtml,
      remarkMdxMermaid,
    ],
    rehypeCodeOptions: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
    remarkHeadingOptions: { generateToc: true },
  },
});
