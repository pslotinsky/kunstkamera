import type { Node, Root } from 'fumadocs-core/page-tree';
import { getDocumentationSections } from './documentation/catalog.server';

export function getProjectTree() {
  return {
    $id: 'gemfire',
    name: 'Kunstkamera',
    children: [
      {
        type: 'folder' as const,
        name: 'Gemfire',
        defaultOpen: true,
        children: [
          { type: 'page' as const, name: 'Play', url: '/gemfire/play' },
          {
            type: 'folder' as const,
            name: 'Documentation',
            index: {
              type: 'page' as const,
              name: 'Documentation',
              url: '/gemfire/docs',
            },
            children: getDocumentationSections().map((section): Node => {
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
      },
    ],
  } satisfies Root;
}
