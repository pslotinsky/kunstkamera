import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { layoutOptions } from '../../layoutOptions';
import styles from './ProjectLayout.module.scss';

interface ProjectLayoutProps {
  readonly tree: Root;
  readonly game?: boolean;
  readonly children: ReactNode;
}

export function ProjectLayout({
  tree,
  game = false,
  children,
}: ProjectLayoutProps) {
  return (
    <DocsLayout
      {...layoutOptions}
      tree={tree}
      searchToggle={{ enabled: !game }}
      sidebar={{ defaultOpenLevel: game ? 0 : 2 }}
      tabs={false}
      {...(game
        ? {
            containerProps: {
              className: styles.gameLayout ?? '',
              style: {
                gridTemplate:
                  '"sidebar header" var(--fd-header-height) "sidebar main" minmax(0, 1fr) / var(--fd-sidebar-col) minmax(0, 1fr)',
              },
            },
          }
        : {})}
    >
      {children}
    </DocsLayout>
  );
}
