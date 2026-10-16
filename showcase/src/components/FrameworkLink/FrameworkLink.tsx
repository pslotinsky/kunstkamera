import type { ComponentProps } from 'react';
import { Link } from 'react-router';

type FrameworkLinkProps = ComponentProps<'a'> & { prefetch?: boolean };

function publishedUrl(href: string): string {
  const [, path, suffix] = /^([^?#]*)(.*)$/.exec(href) ?? [];
  if (
    !path?.startsWith('/') ||
    path.startsWith('//') ||
    path.endsWith('/') ||
    /\.[^/]+$/.test(path)
  ) {
    return href;
  }
  return `${path}/${suffix ?? ''}`;
}

export function FrameworkLink({
  href = '#',
  prefetch,
  ...props
}: FrameworkLinkProps) {
  return (
    <Link
      to={publishedUrl(href)}
      prefetch={prefetch ? 'intent' : 'none'}
      {...props}
    />
  );
}
