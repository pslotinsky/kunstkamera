import { type ReactNode, useRef } from 'react';
import { PageTitle } from '../PageTitle';
import styles from './Page.module.scss';
import { usePageFocus } from './usePageFocus';

interface PageProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly fullWidth?: boolean;
  readonly className?: string | undefined;
}

export function Page({
  title,
  children,
  fullWidth = false,
  className,
}: PageProps) {
  const content = useRef<HTMLElement>(null);
  usePageFocus(content);
  const classes = [fullWidth ? undefined : styles.content, className]
    .filter(Boolean)
    .join(' ');

  return (
    <main ref={content} id="content" className={classes} tabIndex={-1}>
      <PageTitle title={title} />
      {children}
    </main>
  );
}
