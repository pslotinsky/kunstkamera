import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import type { ProjectId } from '../../../../projects';
import {
  resolveDocumentLink,
  resolvePublishedAsset,
} from './resolveDocumentLink';

type DocumentLinkProps = ComponentProps<'a'> & {
  readonly project: ProjectId;
  readonly currentFile: string;
};

export function DocumentLink({
  href = '',
  project,
  currentFile,
  ...props
}: DocumentLinkProps) {
  const target = resolveDocumentLink(href, currentFile, project);

  return target ? (
    <Link to={target} {...props} />
  ) : (
    <a
      href={resolvePublishedAsset(href, currentFile, project) ?? href}
      {...props}
    />
  );
}
