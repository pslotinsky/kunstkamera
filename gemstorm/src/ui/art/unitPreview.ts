import type { Unit } from '@/core/domain/Unit';
import { getPublicAssetUrl } from '@/ui/art/getPublicAssetUrl';

export function unitPreview(unit: Unit): string {
  return getPublicAssetUrl(`unit/${unit.name.toLowerCase()}.webp`);
}
