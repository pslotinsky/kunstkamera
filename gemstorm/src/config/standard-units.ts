import type { UnitParams } from '@/core/domain/Unit';

export const STANDARD_UNITS: readonly UnitParams[] = [
  { name: 'Horsemen', attack: 21, defense: 20, move: 3, range: 'short' },
  {
    name: 'Knights',
    attack: 20,
    defense: 19,
    move: 2,
    range: 'short',
    builds: true,
  },
  { name: 'Archers', attack: 18, defense: 18, move: 2, range: 'long' },
];
