import { describe, expect, it } from 'vitest';

import { BATTLEFIELDS } from '@/config/battlefields';
import { Battlefield } from '@/core/domain/Battlefield';
import { BattleUnit } from '@/core/domain/BattleUnit';
import { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';
import { StandardUnit } from '@/core/domain/StandardUnit';
import { Unit } from '@/core/domain/Unit';

import { makeGeneral } from './factories';

class TestUnit extends Unit {
  public override get consumesFood(): boolean {
    return true;
  }
}

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

describe('Battlefield', () => {
  it('loads every layout as eighty cells with one flag a side', () => {
    expect(BATTLEFIELDS).toHaveLength(30);

    for (const layout of BATTLEFIELDS) {
      const field = Battlefield.ofProvince(layout.province);

      expect(field.allCells).toHaveLength(80);
      expect(field.columns).toBe(10);
      expect(field.rows).toBe(8);
      expect(field.attackerFlag).toBeDefined();
      expect(field.defenderFlag).toBeDefined();
    }
  });

  it('names a field after the province that owns it', () => {
    const field = Battlefield.ofProvince(22);

    expect(field.name).toBe('Londre');
    expect(field.attackerFlag.name).toBe('A4');
    expect(field.defenderFlag.name).toBe('G5');
  });

  it('reads the river and wall variants as one terrain each', () => {
    const field = Battlefield.ofProvince(22);
    const kinds = new Set(field.allCells.map((cell) => cell.terrain));

    expect(kinds.has('river')).toBe(true);
    expect(kinds.has('wall')).toBe(true);
    expect(field.getSprite(field.getCell(3, 0)!)).toBe('river-ns');
    expect(field.getSprite(field.getCell(4, 2)!)).toBe('river-ns');
    expect(field.getCell(3, 0)!.terrain).toBe('river');
    expect(field.getCell(5, 3)!.terrain).toBe('wall');
  });

  it('stops a ground unit at woods, water, fences, stone and wall', () => {
    const field = Battlefield.ofProvince(22);
    const knights = StandardUnit.ofName('Knights')!;
    const blocked = ['woods', 'river', 'fence', 'boulder', 'wall'] as const;

    for (const terrain of blocked) {
      const cell = field.allCells.find((each) => each.terrain === terrain);

      if (cell) {
        expect(place(knights, cell).canEnter(cell)).toBe(false);
      }
    }

    const bridge = field.allCells.find((cell) => cell.terrain === 'bridge')!;

    expect(place(knights, bridge).canEnter(bridge)).toBe(true);
  });

  it('lets a flier clear woods, water and fences but not stone or wall', () => {
    const field = Battlefield.ofProvince(22);
    const flier = new TestUnit({
      name: 'Wyverns',
      move: 3,
      range: 'short',
      flying: true,
    });
    const cleared = ['woods', 'river', 'fence'] as const;

    for (const terrain of cleared) {
      const cell = field.allCells.find((each) => each.terrain === terrain);

      if (cell) {
        expect(place(flier, cell).canEnter(cell)).toBe(true);
      }
    }

    const wall = field.allCells.find((cell) => cell.terrain === 'wall')!;

    expect(place(flier, wall).canEnter(wall)).toBe(false);
  });
});
