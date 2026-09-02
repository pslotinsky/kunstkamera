import type { RangePattern } from '@/core/domain/FifthUnit';

export type RangeCell = 'center' | 'hit' | 'empty';

// biome-ignore format: keep each 5x5 grid legible as stacked rows (spec §C.6)
const PATTERNS: Record<RangePattern, readonly string[]> = {
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

const CELLS: Record<string, RangeCell> = {
  o: 'empty',
  x: 'hit',
  '+': 'center',
};

export function rangeGrid(range: RangePattern): RangeCell[][] {
  return PATTERNS[range].map((row) => [...row].map((char) => CELLS[char]!));
}
