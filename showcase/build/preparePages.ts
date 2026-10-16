import { globSync } from 'node:fs';
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { prototypes } from '../src/prototypes.ts';
import { publishedAssets } from '../src/publishedAssets.ts';

// React Router writes prerendered routes under the basename, while assets live
// at the client root. GitHub Pages needs both in one publishable directory.
const client = new URL('../dist/client/', import.meta.url);
const output = new URL('../dist/public/', import.meta.url);
const showcase = new URL('../', import.meta.url);
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

for (const prototype of prototypes) {
  const directory = new URL(prototype.publishedPath, output);
  await mkdir(directory, { recursive: true });
  await cp(
    new URL(prototype.sourceFile, showcase),
    new URL('index.html', directory),
  );
}
for (const asset of publishedAssets) {
  const source = new URL(asset.sourcePath, showcase);
  await access(source);
  const files =
    asset.type === 'directory'
      ? globSync(`**/*${asset.extension}`, { cwd: source })
      : [''];
  for (const file of files) {
    const destination = new URL(asset.publishedPath + file, output);
    await mkdir(new URL('./', destination), { recursive: true });
    await cp(new URL(asset.sourcePath + file, showcase), destination);
  }
}
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
