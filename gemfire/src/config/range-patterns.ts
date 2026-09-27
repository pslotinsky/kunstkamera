import type { RangePattern } from '@/core/domain/Unit';

export const RANGE_REACH = 2;

// biome-ignore format: keep each 5x5 grid legible as stacked rows (spec §C.6)
// prettier-ignore
export const RANGE_GRIDS: Record<RangePattern, readonly string[]> = {
  short: [
    'ooooo',
    'ooxoo',
    'ox+xo',
    'ooxoo',
    'ooooo',
  ],
  long: [
    'ooxoo',
    'ooooo',
    'xo+ox',
    'ooooo',
    'ooxoo',
  ],
  circular: [
    'xxxxx',
    'xooox',
    'xo+ox',
    'xooox',
    'xxxxx',
  ],
  largest: [
    'xxxxx',
    'xxxxx',
    'xx+xx',
    'xxxxx',
    'xxxxx',
  ],
};
