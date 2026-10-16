import type { ProjectId } from './projects.ts';

interface PrototypeConfig {
  readonly project: ProjectId;
  readonly slug: string;
  readonly name: string;
  readonly sourceFile: string;
  readonly documentPath: string;
  readonly publishedPath: string;
}

export const prototypes: readonly PrototypeConfig[] = [
  {
    project: 'total-space',
    slug: 'campaign',
    name: 'Campaign',
    sourceFile: '../total-space/docs/mockups/campaign/prototype.html',
    documentPath: 'mockups/campaign/prototype.html',
    publishedPath: 'total-space/interactive/campaign/',
  },
  {
    project: 'total-space',
    slug: 'battle',
    name: 'Battle',
    sourceFile: '../total-space/docs/mockups/battle/prototype.html',
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
