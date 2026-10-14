import { cp, readFile, rm, writeFile } from 'node:fs/promises';

// React Router writes prerendered routes under the basename, while assets live
// at the client root. GitHub Pages needs both in one publishable directory.
const client = new URL('../dist/client/', import.meta.url);
const output = new URL('../dist/public/', import.meta.url);
const basename = (process.env.SHOWCASE_BASE || '/kunstkamera/').replace(
  /^\/+|\/+$/g,
  '',
);
const pages = basename ? new URL(`${basename}/`, client) : client;

await rm(output, { recursive: true, force: true });
await cp(pages, output, { recursive: true });
if (basename)
  await cp(new URL('assets/', client), new URL('assets/', output), {
    recursive: true,
  });
// Pages serves this file at arbitrary missing URLs. Keep the rendered page,
// but omit hydration because its prerendered /404/ route data has another URL.
const notFound = await readFile(new URL('404/index.html', pages), 'utf8');
await writeFile(
  new URL('404.html', output),
  notFound
    .replace('<html lang="en"', '<html lang="en" class="dark"')
    .replace(/<link rel="modulepreload"[^>]*>/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ''),
);
