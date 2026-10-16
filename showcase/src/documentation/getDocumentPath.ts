import type { ProjectId } from '../projects.ts';

export function getDocumentPath(
  project: ProjectId,
  file: string,
  heading = '',
): string {
  const path = file
    .replace(/\.md$/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  return `/${project}/docs/${path}/${heading ? `#${encodeURIComponent(heading)}` : ''}`;
}
