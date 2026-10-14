import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { resolveDocumentLink } from './resolveDocumentLink';

type DocumentLinkProps = ComponentProps<'a'> & {
  readonly currentFile: string;
};

export function DocumentLink({
  href = '',
  currentFile,
  ...props
}: DocumentLinkProps) {
  const target = resolveDocumentLink(href, currentFile);

  return target ? (
    <Link to={target} {...props} />
  ) : (
    <a href={href} {...props} />
  );
}
