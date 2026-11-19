import { describe, expect, it } from 'vitest';

import { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';

function cell(column: number, row: number): Cell {
  return new Cell(column, row, 'plains');
}

describe('Facing', () => {
  it('reads the direction of a step', () => {
    const from = cell(3, 3);

    expect(Facing.between(from, cell(3, 2))).toBe(Facing.north);
    expect(Facing.between(from, cell(3, 4))).toBe(Facing.south);
    expect(Facing.between(from, cell(4, 3))).toBe(Facing.east);
    expect(Facing.between(from, cell(2, 3))).toBe(Facing.west);
  });

  it('knows how it is drawn, west being the side view mirrored', () => {
    expect(Facing.south.aspect).toBe('front');
    expect(Facing.north.aspect).toBe('back');
    expect(Facing.east.aspect).toBe('side');
    expect(Facing.west.aspect).toBe('side');

    expect(Facing.west.isMirrored).toBe(true);
    expect(Facing.east.isMirrored).toBe(false);
  });
});
