import { createFromSource } from 'fumadocs-core/search/server';
import { getDocumentPath } from '../documentation';
import { getDocumentSectionTitle } from '../documentation/catalog.server';
import { source } from '../documentation/source.server';

const search = createFromSource(source, {
  buildIndex: async (page) => ({
    id: page.url,
    title: page.data.title,
    url: getDocumentPath(page.data.info.path),
    breadcrumbs: [
      'Gemfire',
      'Documentation',
      getDocumentSectionTitle(page.data.info.path),
    ],
    structuredData: await page.data.structuredData(),
  }),
});

export function loader() {
  return search.staticGET();
}
