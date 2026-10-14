import browserCollections from '../../.source/browser';

export { browserCollections };

export function hasPublishedDocument(path: string): boolean {
  const file = `${path.replace(/\/$/, '')}.md`;
  return Object.hasOwn(browserCollections.docs.raw, `./${file}`);
}
