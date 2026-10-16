import { createSearchAPI } from 'fumadocs-core/search/server';
import { getDocumentPath } from '../documentation';
import { getDocumentSectionTitle } from '../documentation/catalog.server';
import { sources } from '../documentation/source.server';
import { mapProjects, type ProjectId, projectNames } from '../projects';

type SourcePage = ReturnType<(typeof sources)[ProjectId]['getPages']>[number];

async function buildIndex(project: ProjectId, page: SourcePage) {
  return {
    id: page.url,
    title: page.data.title,
    url: getDocumentPath(project, page.data.info.path),
    breadcrumbs: [
      projectNames[project],
      'Documentation',
      getDocumentSectionTitle(project, page.data.info.path),
    ],
    structuredData: await page.data.structuredData(),
  };
}

const search = createSearchAPI('advanced', {
  indexes: async () =>
    Promise.all(
      Object.values(
        mapProjects((project) =>
          sources[project].getPages().map((page) => buildIndex(project, page)),
        ),
      ).flat(),
    ),
});

export function loader() {
  return search.staticGET();
}
