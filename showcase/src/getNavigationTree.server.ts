import type { Node, Root } from 'fumadocs-core/page-tree';
import { getDocumentationSections } from './documentation/catalog.server';
import { games } from './games';
import { mapProjects, type ProjectId, projectNames } from './projects';
import { getPrototypeUrl, prototypes } from './prototypes';

function getProjectFolder(project: ProjectId) {
  const projectPrototypes = prototypes.filter(
    (item) => item.project === project,
  );
  return {
    type: 'folder' as const,
    defaultOpen: false,
    name: projectNames[project],
    children: [
      ...(games[project]
        ? [{ type: 'page' as const, name: 'Play', url: `/${project}/play` }]
        : []),
      ...(projectPrototypes.length
        ? [
            {
              type: 'folder' as const,
              name: 'Prototypes',
              children: projectPrototypes.map((prototype) => ({
                type: 'page' as const,
                name: prototype.name,
                url: getPrototypeUrl(prototype).replace(/\/$/, ''),
              })),
            },
          ]
        : []),
      {
        type: 'folder' as const,
        name: 'Documentation',
        defaultOpen: true,
        index: {
          type: 'page' as const,
          name: 'Documentation',
          url: `/${project}/docs`,
        },
        children: getDocumentationSections(project).map((section): Node => {
          const onlyPage = section.documents[0];
          if (section.documents.length === 1 && onlyPage) {
            return {
              type: 'page',
              name: section.title,
              url: onlyPage.url.replace(/\/$/, ''),
            };
          }
          return {
            type: 'folder',
            name: section.title,
            children: section.documents.map((page) => ({
              type: 'page',
              name: page.title,
              url: page.url.replace(/\/$/, ''),
            })),
          };
        }),
      },
    ],
  };
}

export function getNavigationTree() {
  return {
    name: 'Kunstkamera',
    children: Object.values(mapProjects(getProjectFolder)),
  } satisfies Root;
}
