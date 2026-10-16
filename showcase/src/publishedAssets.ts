import type { ProjectId } from './projects.ts';

interface AssetLocation {
  readonly project: ProjectId;
  /** Relative to the project's documentation root. */
  readonly documentPath: string;
  /** Relative to the showcase directory. */
  readonly sourcePath: string;
  /** Relative to the published site base. */
  readonly publishedPath: string;
  readonly contentType: string;
}

type PublishedAsset = AssetLocation &
  (
    | { readonly type: 'file' }
    | { readonly type: 'directory'; readonly extension: string }
  );

export const publishedAssets: readonly PublishedAsset[] = [
  {
    type: 'directory',
    project: 'total-space',
    documentPath: 'game/content/ships/images/',
    sourcePath: '../total-space/docs/game/content/ships/images/',
    publishedPath: 'total-space/game/content/ships/images/',
    extension: '.webp',
    contentType: 'image/webp',
  },
  {
    type: 'directory',
    project: 'total-space',
    documentPath: 'game/content/buildings/images/',
    sourcePath: '../total-space/docs/game/content/buildings/images/',
    publishedPath: 'total-space/game/content/buildings/images/',
    extension: '.webp',
    contentType: 'image/webp',
  },
  {
    type: 'file',
    project: 'total-space',
    documentPath: 'game/content/ships/prototype-ships.json',
    sourcePath: '../total-space/docs/game/content/ships/prototype-ships.json',
    publishedPath: 'total-space/game/content/ships/prototype-ships.json',
    contentType: 'application/json',
  },
];

function matchAsset(
  asset: PublishedAsset,
  path: string,
  field: 'documentPath' | 'publishedPath',
): string | undefined {
  const prefix = asset[field];
  if (asset.type === 'file') return path === prefix ? '' : undefined;
  if (!path.startsWith(prefix)) return undefined;
  const relative = path.slice(prefix.length);
  const valid =
    !relative.includes('\\') &&
    relative
      .split('/')
      .every((part) => part !== '' && part !== '.' && part !== '..');
  return valid && relative.endsWith(asset.extension) ? relative : undefined;
}

export function getDocumentAssetPath(
  project: ProjectId,
  path: string,
): string | undefined {
  for (const asset of publishedAssets) {
    if (asset.project !== project) continue;
    const relative = matchAsset(asset, path, 'documentPath');
    if (relative !== undefined) return asset.publishedPath + relative;
  }
  return undefined;
}

export function getPublishedAsset(
  path: string,
): { sourcePath: string; contentType: string } | undefined {
  for (const asset of publishedAssets) {
    const relative = matchAsset(asset, path, 'publishedPath');
    if (relative !== undefined)
      return {
        sourcePath: asset.sourcePath + relative,
        contentType: asset.contentType,
      };
  }
  return undefined;
}
