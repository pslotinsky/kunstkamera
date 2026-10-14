import { getDocumentPath } from '../../../../documentation';

export function resolveDocumentLink(
  href: string,
  currentFile: string,
): string | undefined {
  if (/^(?:[a-z]+:|\/\/)/i.test(href)) {
    return undefined;
  }
  const target = new URL(href, `https://documents.invalid/${currentFile}`);
  const file = decodeURIComponent(target.pathname.slice(1));
  return file.endsWith('.md')
    ? getDocumentPath(file, decodeURIComponent(target.hash.slice(1)))
    : undefined;
}
