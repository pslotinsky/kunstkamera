import type { General } from '@/core/domain/General';

import { getPublicAssetUrl } from './getPublicAssetUrl';

export function getGeneralPortraitUrl(general: General): string {
  return getPublicAssetUrl(`portraits/${general.name.toLowerCase()}.webp`);
}
