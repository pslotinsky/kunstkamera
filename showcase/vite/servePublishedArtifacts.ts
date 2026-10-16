import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { prototypes } from '../src/prototypes.ts';
import { getPublishedAsset } from '../src/publishedAssets.ts';

const showcase = new URL('../', import.meta.url);

function artifact(
  path: string,
): { file: URL; contentType: string } | undefined {
  const prototype = prototypes.find((item) => item.publishedPath === path);
  if (prototype) {
    return {
      file: new URL(prototype.sourceFile, showcase),
      contentType: 'text/html; charset=utf-8',
    };
  }

  const asset = getPublishedAsset(path);
  if (asset) {
    return {
      file: new URL(asset.sourcePath, showcase),
      contentType: asset.contentType,
    };
  }
  return undefined;
}

export function servePublishedArtifacts(): Plugin {
  return {
    name: 'serve-published-artifacts',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost')
          .pathname;
        const base = server.config.base;
        const relative = pathname.startsWith(base)
          ? pathname.slice(base.length)
          : pathname.replace(/^\//, '');
        const match = artifact(relative);
        if (!match) return next();

        try {
          const body = await readFile(match.file);
          response.setHeader('Content-Type', match.contentType);
          response.end(body);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
