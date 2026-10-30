import { isProjectId, type ProjectId } from '../projects.ts';

export const collectionNames = {
  gemfire: 'docs',
  'total-space': 'totalSpaceDocs',
  'sink-city': 'sinkCityDocs',
} as const satisfies Record<ProjectId, string>;

export function getDocumentationProject(
  pathname: string,
): ProjectId | undefined {
  const [, project, area] = pathname.split('/');
  return area === 'docs' && isProjectId(project) ? project : undefined;
}
