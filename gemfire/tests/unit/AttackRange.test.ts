import { describe, expect, it } from 'vitest';

import { AttackRange } from '@/core/domain/AttackRange';
import { Battlefield } from '@/core/domain/Battlefield';
import { BattleSide } from '@/core/domain/BattleSide';
import { BattleUnit } from '@/core/domain/BattleUnit';
import type { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';
import { FifthUnit } from '@/core/domain/FifthUnit';
import { StandardUnit } from '@/core/domain/StandardUnit';
import type { RangePattern, Unit } from '@/core/domain/Unit';

import { makeGeneral } from './factories';

const LONDRE = 22;
const field = Battlefield.ofProvince(LONDRE);

function guardian(range: RangePattern): FifthUnit {
  return new FifthUnit({
    name: 'Pluvius',
    move: 2,
    range,
    description: 'a guardian',
    strength: 160,
  });
}

function station(unit: Unit, column: number, row: number): BattleUnit {
  return new BattleUnit({
    unit,
    side: BattleSide.attacker,
    commander: makeGeneral(),
    strength: 40,
    cell: field.getCell(column, row)!,
    facing: Facing.east,
  });
}

function reached(unit: BattleUnit, from?: Cell): string[] {
  const range = from
    ? new AttackRange(unit, field, from)
    : new AttackRange(unit, field);

  return range.cells.map((cell) => cell.name).sort();
}

describe('AttackRange', () => {
  it('gives the short pattern the four neighbours', () => {
    const horsemen = station(StandardUnit.ofName('Horsemen')!, 3, 3);

    expect(reached(horsemen)).toEqual(['C4', 'D3', 'D5', 'E4']);
  });

  it('gives the long pattern only the cells two straight steps away', () => {
    const archers = station(StandardUnit.ofName('Archers')!, 3, 3);

    expect(reached(archers)).toEqual(['B4', 'D2', 'D6', 'F4']);
  });

  it('gives the circular pattern a ring of sixteen with the middle open', () => {
    const pluvius = station(guardian('circular'), 3, 3);
    const cells = reached(pluvius);

    expect(cells).toHaveLength(16);
    expect(cells).toContain('B2');
    expect(cells).toContain('F6');
    expect(cells).not.toContain('D3');
    expect(cells).not.toContain('C4');
  });

  it('gives the largest pattern the whole block of twenty-four', () => {
    const dragon = station(guardian('largest'), 3, 3);
    const cells = reached(dragon);

    expect(cells).toHaveLength(24);
    expect(cells).toContain('D3');
    expect(cells).toContain('B2');
    expect(cells).not.toContain('D4');
  });

  it('clips the pattern where it runs off the board', () => {
    const horsemen = station(StandardUnit.ofName('Horsemen')!, 0, 0);

    expect(reached(horsemen)).toEqual(['A2', 'B1']);
  });

  it('stops at nothing — not woods, not the castle wall', () => {
    const archers = station(StandardUnit.ofName('Archers')!, 7, 1);

    expect(field.getCell(7, 2)!.terrain).toBe('wall');
    expect(reached(archers)).toEqual(['F2', 'H4', 'J2']);
  });

  it('stamps around a cell the unit has not reached yet', () => {
    const archers = station(StandardUnit.ofName('Archers')!, 0, 0);
    const elsewhere = field.getCell(3, 3)!;

    expect(reached(archers, elsewhere)).toEqual(['B4', 'D2', 'D6', 'F4']);
  });
});
