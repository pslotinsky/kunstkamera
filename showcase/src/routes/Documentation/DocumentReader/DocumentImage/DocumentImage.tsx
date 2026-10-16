import type { ComponentProps } from 'react';
import type { ProjectId } from '../../../../projects';
import { resolvePublishedAsset } from '../DocumentLink/resolveDocumentLink';

type DocumentImageProps = ComponentProps<'img'> & {
  readonly project: ProjectId;
  readonly currentFile: string;
};

export function DocumentImage({
  src,
  alt,
  project,
  currentFile,
  ...props
}: DocumentImageProps) {
  return (
    <img
      {...props}
      alt={alt ?? ''}
      src={
        src
          ? (resolvePublishedAsset(src, currentFile, project) ?? src)
          : undefined
      }
    />
  );
}
