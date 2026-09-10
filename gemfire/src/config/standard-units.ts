import type { UnitParams } from '@/core/domain/Unit';

export const STANDARD_UNITS: readonly UnitParams[] = [
  { name: 'Horsemen', move: 3, range: 'short' },
  { name: 'Knights', move: 2, range: 'short' },
  { name: 'Archers', move: 2, range: 'long' },
];
