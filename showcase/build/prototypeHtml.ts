import { readFile } from 'node:fs/promises';
import { posix } from 'node:path';
import type { prototypes } from '../src/prototypes.ts';
import { publishedAssets } from '../src/publishedAssets.ts';

export async function prototypeHtml(prototype: (typeof prototypes)[number]) {
  const showcase = new URL('../', import.meta.url);
  let html = await readFile(new URL(prototype.sourceFile, showcase), 'utf8');
  for (const asset of publishedAssets) {
    if (asset.project !== prototype.project) continue;
    const sourcePath = posix.relative(
      posix.dirname(prototype.documentPath),
      asset.documentPath,
    );
    const publishedPath = posix.relative(
      prototype.publishedPath,
      asset.publishedPath,
    );
    html = html.replaceAll(sourcePath, publishedPath);
  }
  return html;
}
