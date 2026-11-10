import type { ProjectId } from './projects.ts';

interface PrototypeConfig {
  readonly project: ProjectId;
  readonly slug: string;
  readonly name: string;
  readonly source:
    | { readonly type: 'html'; readonly file: string }
    | { readonly type: 'build'; readonly directory: string };
  readonly documentPath: string;
  readonly publishedPath: string;
}

export const prototypes: readonly PrototypeConfig[] = [
  {
    project: 'debt-dungeon',
    slug: 'battle',
    name: 'Battle',
    source: { type: 'build', directory: '../debt-dungeon/dist/' },
    documentPath: 'mockups/battle/index.html',
    publishedPath: 'debt-dungeon/interactive/battle/',
  },
  {
    project: 'sink-city',
    slug: 'map-lab',
    name: 'Map Lab',
    source: { type: 'html', file: '../sink-city/docs/mockups/map-lab.html' },
    documentPath: 'mockups/map-lab.html',
    publishedPath: 'sink-city/interactive/map-lab/',
  },
  {
    project: 'total-space',
    slug: 'campaign',
    name: 'Campaign',
    source: {
      type: 'html',
      file: '../total-space/docs/mockups/campaign/prototype.html',
    },
    documentPath: 'mockups/campaign/prototype.html',
    publishedPath: 'total-space/interactive/campaign/',
  },
  {
    project: 'total-space',
    slug: 'battle',
    name: 'Battle',
    source: {
      type: 'html',
      file: '../total-space/docs/mockups/battle/prototype.html',
    },
    documentPath: 'mockups/battle/prototype.html',
    publishedPath: 'total-space/interactive/battle/',
  },
];

export function getPrototype(
  project: string | undefined,
  slug: string | undefined,
) {
  return prototypes.find(
    (prototype) => prototype.project === project && prototype.slug === slug,
  );
}

export function getPrototypeUrl(prototype: PrototypeConfig) {
  return `/${prototype.project}/prototypes/${prototype.slug}/`;
}
