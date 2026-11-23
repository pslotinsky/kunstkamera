import { describe, expect, it } from 'vitest';

import { BATTLEFIELDS } from '@/config/battlefields';
import { Battle } from '@/core/domain/Battle';
import { Battlefield } from '@/core/domain/Battlefield';
import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';

import { makeArmy } from './factories';

const ATTACKER_COLUMN = 0;
const DEFENDER_COLUMN = 9;
const FULL_ROSTER = ['Horsemen', 'Knights', 'Knights', 'Archers', 'Grimhides'];

function describePositions(units: readonly BattleUnit[]) {
  return units.map((unit) => ({
    name: unit.name,
    column: unit.cell.column,
    row: unit.cell.row,
  }));
}

function lineUp(column: number, names: readonly (string | undefined)[]) {
  return names.flatMap((name, slot) =>
    name ? [{ name, column, row: slot + 2 }] : [],
  );
}

describe('BattleDeployment', () => {
  it.each(BATTLEFIELDS.map((field) => [field.name, field.province]))(
    'lines a full roster up in the outer columns of %s, rows 3 to 7',
    (_name, province) => {
      const battle = new Battle({
        attacker: makeArmy({ unit: HiredUnit.ofName('Grimhides')! }),
        defender: makeArmy({ unit: HiredUnit.ofName('Grimhides')! }),
        field: Battlefield.ofProvince(province),
      });

      expect(describePositions(battle.getUnits(BattleSide.attacker))).toEqual(
        lineUp(ATTACKER_COLUMN, FULL_ROSTER),
      );
      expect(describePositions(battle.getUnits(BattleSide.defender))).toEqual(
        lineUp(DEFENDER_COLUMN, FULL_ROSTER),
      );
      expect(battle.isOver).toBe(false);
    },
  );

  it('keeps the slots of empty units empty in a small army', () => {
    const battle = new Battle({
      attacker: makeArmy({ troops: 3, unit: HiredUnit.ofName('Grimhides')! }),
      defender: makeArmy(),
      field: Battlefield.ofProvince(1),
    });

    expect(describePositions(battle.getUnits(BattleSide.attacker))).toEqual(
      lineUp(ATTACKER_COLUMN, [
        'Horsemen',
        undefined,
        undefined,
        undefined,
        'Grimhides',
      ]),
    );
  });

  it('stations a Guardian defending alone in its own row', () => {
    const guardian = Gem.ofName('Ashwing').guardian;
    const battle = new Battle({
      attacker: makeArmy(),
      defender: makeArmy({ troops: 0, unit: guardian }),
      field: Battlefield.ofProvince(1),
    });

    expect(describePositions(battle.getUnits(BattleSide.defender))).toEqual(
      lineUp(DEFENDER_COLUMN, [
        undefined,
        undefined,
        undefined,
        undefined,
        guardian.name,
      ]),
    );
  });
});
