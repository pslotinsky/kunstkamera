export const projectNames = {
  gemfire: 'Gemfire',
  'total-space': 'Total Space',
  'sink-city': 'Sink City',
} as const;

export type ProjectId = keyof typeof projectNames;

export function isProjectId(value: string | undefined): value is ProjectId {
  return value !== undefined && Object.hasOwn(projectNames, value);
}

export function mapProjects<T>(
  create: (project: ProjectId) => T,
): Record<ProjectId, T> {
  const entries = Object.keys(projectNames).map((project) => {
    if (!isProjectId(project)) throw new Error(`Unknown project: ${project}`);
    return [project, create(project)];
  });
  return Object.fromEntries(entries) as Record<ProjectId, T>;
}
