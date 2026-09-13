import { describe, expect, it } from 'vitest';

import { Battlefield } from '@/core/domain/Battlefield';
import { BattleUnit } from '@/core/domain/BattleUnit';
import type { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';
import { MoveRange } from '@/core/domain/MoveRange';
import { StandardUnit } from '@/core/domain/StandardUnit';
import type { Unit } from '@/core/domain/Unit';

import { makeGeneral } from './factories';

const LONDRE = 22;

function place(unit: Unit, cell: Cell): BattleUnit {
  return new BattleUnit({
    unit,
    side: 'attacker',
    commander: makeGeneral(),
    strength: 10,
    cell,
    facing: Facing.east,
  });
}

function names(cells: readonly Cell[]): string[] {
  return cells.map((cell) => cell.name).sort();
}

describe('MoveRange', () => {
  it('reaches no further than the move value', () => {
    const field = Battlefield.ofProvince(LONDRE);
    const horsemen = StandardUnit.ofName('Horsemen')!;
    const rider = place(horsemen, field.getCell(0, 1)!);
    const range = new MoveRange(rider, field, [rider]);

    expect(names(range.cells)).toEqual([
      'A3',
      'A4',
      'A5',
      'B1',
      'B2',
      'B4',
      'C1',
      'C2',
      'D2',
    ]);

    for (const beyond of ['A6', 'E2', 'D1']) {
      expect(names(range.cells)).not.toContain(beyond);
    }
  });

  it('refuses a cell another unit is standing in', () => {
    const field = Battlefield.ofProvince(LONDRE);
    const horsemen = StandardUnit.ofName('Horsemen')!;
    const rider = place(horsemen, field.getCell(0, 1)!);
    const blocker = place(horsemen, field.getCell(1, 1)!);
    const range = new MoveRange(rider, field, [rider, blocker]);

    expect(names(range.cells)).not.toContain('B2');
    expect(names(range.cells)).toContain('A3');
  });

  it('answers with the path it found, so facing follows the last step', () => {
    const field = Battlefield.ofProvince(LONDRE);
    const horsemen = StandardUnit.ofName('Horsemen')!;
    const rider = place(horsemen, field.getCell(0, 1)!);
    const range = new MoveRange(rider, field, [rider]);
    const path = range.findPath(field.getCell(2, 0)!);

    expect(names(path).length).toBeGreaterThan(0);
    expect(path.at(-1)!.name).toBe('C1');
    expect(path.length).toBeLessThanOrEqual(horsemen.move);
  });

  it('gives no path to a cell out of reach', () => {
    const field = Battlefield.ofProvince(LONDRE);
    const knights = StandardUnit.ofName('Knights')!;
    const foot = place(knights, field.getCell(0, 1)!);
    const range = new MoveRange(foot, field, [foot]);

    expect(range.findPath(field.defenderFlag)).toHaveLength(0);
    expect(range.includes(field.defenderFlag)).toBe(false);
  });
});
