import type { Unit } from '@/core/domain/Unit';

export function unitPreview(unit: Unit): string {
  return `/unit/${unit.name.toLowerCase()}.webp`;
}
