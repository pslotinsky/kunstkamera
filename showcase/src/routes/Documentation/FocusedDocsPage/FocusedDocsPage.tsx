import { DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { type ComponentProps, useRef } from 'react';
import { usePageFocus } from '../../../components/Page/usePageFocus';
import { useDocumentFragment } from './useDocumentFragment';

export function FocusedDocsPage(props: ComponentProps<typeof DocsPage>) {
  const content = useRef<HTMLElement>(null);
  usePageFocus(content);
  useDocumentFragment(content);

  return <DocsPage {...props} ref={content} id="content" tabIndex={-1} />;
}
