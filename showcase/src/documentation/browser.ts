import generatedCollections from '../../.source/browser';
import { mapProjects, type ProjectId } from '../projects';
import { collectionNames } from './config';

export const browserCollections = mapProjects(
  (project) => generatedCollections[collectionNames[project]],
);

export function hasPublishedDocument(
  project: ProjectId,
  path: string,
): boolean {
  const normalized = path.replace(/\/$/, '');
  const file = normalized.endsWith('.md') ? normalized : `${normalized}.md`;
  const collection = browserCollections[project];
  return Object.hasOwn(collection.raw, `./${file}`);
}
