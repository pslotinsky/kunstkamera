import { RANGE_GRIDS } from '@/config/range-patterns';
import type { RangePattern } from '@/core/domain/FifthUnit';

export type RangeCell = 'center' | 'hit' | 'empty';

const CELLS: Record<string, RangeCell> = {
  o: 'empty',
  x: 'hit',
  '+': 'center',
};

export function rangeGrid(range: RangePattern): RangeCell[][] {
  return RANGE_GRIDS[range].map((row) => [...row].map((mark) => CELLS[mark]!));
}
