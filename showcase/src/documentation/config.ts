import { isProjectId, type ProjectId } from '../projects.ts';

export const collectionNames = {
  gemfire: 'docs',
  'debt-dungeon': 'debtDungeonDocs',
  'total-space': 'totalSpaceDocs',
  'sink-city': 'sinkCityDocs',
  'kingdom-hr': 'kingdomHrDocs',
} as const satisfies Record<ProjectId, string>;

export function getDocumentationProject(
  pathname: string,
): ProjectId | undefined {
  const [, project, area] = pathname.split('/');
  return area === 'docs' && isProjectId(project) ? project : undefined;
}
