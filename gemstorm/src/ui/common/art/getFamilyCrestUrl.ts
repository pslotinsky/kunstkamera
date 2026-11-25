import type { Family } from '@/core/domain/Family';

import { getPublicAssetUrl } from './getPublicAssetUrl';

export function getFamilyCrestUrl(family: Pick<Family, 'name'>): string {
  return getPublicAssetUrl(`crests/${family.name.toLowerCase()}.webp`);
}
