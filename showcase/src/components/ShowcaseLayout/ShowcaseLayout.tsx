import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { layoutOptions } from '../../layoutOptions';
import styles from './ShowcaseLayout.module.scss';

interface ShowcaseLayoutProps {
  readonly tree: Root;
  readonly immersive?: boolean;
  readonly children: ReactNode;
}

export function ShowcaseLayout({
  tree,
  immersive = false,
  children,
}: ShowcaseLayoutProps) {
  return (
    <DocsLayout
      {...layoutOptions}
      tree={tree}
      searchToggle={{ enabled: !immersive }}
      sidebar={{ defaultOpenLevel: 0 }}
      tabs={false}
      {...(immersive
        ? {
            containerProps: {
              className: styles.immersiveLayout ?? '',
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
