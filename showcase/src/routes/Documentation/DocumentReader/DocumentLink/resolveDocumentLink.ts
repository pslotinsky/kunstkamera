import { getDocumentPath } from '../../../../documentation';
import { hasPublishedDocument } from '../../../../documentation/browser';
import type { ProjectId } from '../../../../projects';
import { getPrototypeUrl, prototypes } from '../../../../prototypes';
import { getDocumentAssetPath } from '../../../../publishedAssets';

function resolveSourcePath(
  href: string,
  currentFile: string,
): string | undefined {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) return undefined;
  try {
    return decodeURIComponent(
      new URL(href, `https://documents.invalid/${currentFile}`).pathname.slice(
        1,
      ),
    );
  } catch {
    return undefined;
  }
}

export function resolveDocumentLink(
  href: string,
  currentFile: string,
  project: ProjectId,
): string | undefined {
  const file = resolveSourcePath(href, currentFile);
  if (!file) return undefined;
  const hash = new URL(href, `https://documents.invalid/${currentFile}`).hash;
  const heading = hash ? decodeURIComponent(hash.slice(1)) : '';

  if (file.endsWith('.md')) return getDocumentPath(project, file, heading);
  const prototype = prototypes.find(
    (item) => item.project === project && item.documentPath === file,
  );
  if (prototype) return getPrototypeUrl(prototype);
  if (project !== 'total-space') return undefined;

  if (file.replace(/\/$/, '') === 'game/systems')
    return '/total-space/docs/#systems';
  if (file.replace(/\/$/, '').endsWith('/images')) {
    const roster = file.includes('/ships/')
      ? 'ships/ship-roster.md'
      : 'buildings/building-roster.md';
    return getDocumentPath(project, `game/content/${roster}`);
  }

  const index = `${file.replace(/\/$/, '')}/README.md`;
  return hasPublishedDocument(project, index)
    ? getDocumentPath(project, index)
    : undefined;
}

export function resolvePublishedAsset(
  href: string,
  currentFile: string,
  project: ProjectId,
): string | undefined {
  const file = resolveSourcePath(href, currentFile);
  if (!file) return undefined;
  const path = getDocumentAssetPath(project, file);
  return path ? `${import.meta.env.BASE_URL}${path}` : undefined;
}
