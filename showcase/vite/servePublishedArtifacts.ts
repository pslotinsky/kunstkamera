import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type { Plugin } from 'vite';
import { prototypeHtml } from '../build/prototypeHtml.ts';
import { prototypes } from '../src/prototypes.ts';
import { getPublishedAsset } from '../src/publishedAssets.ts';

const showcase = new URL('../', import.meta.url);

function artifact(
  path: string,
): { file: URL; contentType: string } | undefined {
  const prototype = prototypes.find((item) => item.publishedPath === path);
  if (prototype) {
    return {
      file: new URL(
        prototype.source.type === 'build'
          ? `${prototype.source.directory}index.html`
          : prototype.source.file,
        showcase,
      ),
      contentType: 'text/html; charset=utf-8',
    };
  }

  const build = prototypes.find(
    (item) =>
      item.source.type === 'build' && path.startsWith(item.publishedPath),
  );
  if (build?.source.type === 'build') {
    const relative = decodeURIComponent(path.slice(build.publishedPath.length));
    const valid =
      !relative.includes('\\') &&
      relative
        .split('/')
        .every((part) => part !== '' && part !== '.' && part !== '..');
    const contentTypes: Record<string, string> = {
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.webp': 'image/webp',
    };
    const contentType = contentTypes[extname(relative)];
    if (valid && contentType) {
      return {
        file: new URL(build.source.directory + relative, showcase),
        contentType,
      };
    }
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
        try {
          const match = artifact(relative);
          if (!match) return next();
          const prototype = prototypes.find(
            (item) => item.publishedPath === relative,
          );
          const body = prototype
            ? await prototypeHtml(prototype)
            : await readFile(match.file);
          response.setHeader('Content-Type', match.contentType);
          response.end(body);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
