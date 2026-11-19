import type { FifthUnit } from '@/core/domain/FifthUnit';

import { getPublicAssetUrl } from './getPublicAssetUrl';

export function getFifthUnitPortraitUrl(unit: FifthUnit): string {
  return getPublicAssetUrl(`fifth-units/${unit.name.toLowerCase()}.webp`);
}
