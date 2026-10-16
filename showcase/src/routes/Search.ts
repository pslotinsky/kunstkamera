import { createFromSource } from 'fumadocs-core/search/server';
import type { LoaderFunctionArgs } from 'react-router';
import { getDocumentPath } from '../documentation';
import { getDocumentSectionTitle } from '../documentation/catalog.server';
import { sources } from '../documentation/source.server';
import {
  isProjectId,
  mapProjects,
  type ProjectId,
  projectNames,
} from '../projects';

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

const searches = mapProjects((project) =>
  createFromSource(sources[project], {
    buildIndex: (page) => buildIndex(project, page),
  }),
);

export function loader({ params }: LoaderFunctionArgs) {
  if (!isProjectId(params.project))
    throw new Response('Project not found', { status: 404 });
  return searches[params.project].staticGET();
}
