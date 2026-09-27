import { describe, expect, it } from 'vitest';

import type { Battle } from '@/core/domain/Battle';
import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { Roads } from '@/core/domain/battle-ai/Roads';
import { TacticalPolicy } from '@/core/domain/battle-ai/TacticalPolicy';
import type { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';
import type { UnitOrder } from '@/core/domain/UnitOrder';

import { makeArmy, makeBattle, station } from './factories';

function closes(
  order: UnitOrder,
  unit: BattleUnit,
  goal: Cell,
  battle: Battle,
): boolean {
  const roads = new Roads({
    goal,
    walker: unit,
    battlefield: battle.field,
  });

  return roads.isCloser(order.destination, unit.cell);
}

describe('TacticalPolicy', () => {
  it('comes for your flag when it is not outmatched', () => {
    const battle = makeBattle({ defender: makeArmy({ troops: 400 }) });
    const enemy = new TacticalPolicy(BattleSide.defender);
    const unit = station(
      battle,
      battle.getUnits(BattleSide.defender)[0]!,
      9,
      1,
    );

    const order = enemy.orderUnit(unit, battle);

    expect(closes(order, unit, battle.field.attackerFlag, battle)).toBe(true);
  });

  it('routes round what it cannot walk through', () => {
    const battle = makeBattle({ defender: makeArmy({ troops: 400 }) });
    const enemy = new TacticalPolicy(BattleSide.defender);
    const unit = station(
      battle,
      battle.getUnits(BattleSide.defender)[0]!,
      4,
      5,
    );
    const flag = battle.field.attackerFlag;
    const roads = new Roads({
      goal: flag,
      walker: unit,
      battlefield: battle.field,
    });
    const order = enemy.orderUnit(unit, battle);

    expect(battle.field.getCell(3, 5)!.terrain).toBe('river');
    expect(roads.isCloser(order.destination, unit.cell)).toBe(true);
    expect(order.destination.row).toBeGreaterThan(unit.cell.row);
  });

  it('falls back on its own flag when it is outmatched', () => {
    const battle = makeBattle({
      attacker: makeArmy({ troops: 400 }),
      defender: makeArmy({ troops: 40 }),
    });
    const enemy = new TacticalPolicy(BattleSide.defender);
    const unit = battle.getUnits(BattleSide.defender)[0]!;

    const order = enemy.orderUnit(unit, battle);

    expect(closes(order, unit, battle.field.defenderFlag, battle)).toBe(true);
  });

  it('names a target standing in its pattern from the cell it chose', () => {
    const battle = makeBattle({ defender: makeArmy({ troops: 400 }) });
    const enemy = new TacticalPolicy(BattleSide.defender);
    const guard = battle.getUnits(BattleSide.defender)[0]!;
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    station(
      battle,
      guard,
      battle.field.defenderFlag.column,
      battle.field.defenderFlag.row,
    );
    station(battle, rider, 7, 4);

    const order = enemy.orderUnit(guard, battle);

    expect(order.destination).toBe(guard.cell);
    expect(order.target).toBe(rider);
  });
  it('walks into a blow rather than waiting to be hit', () => {
    const battle = makeBattle({ defender: makeArmy({ troops: 400 }) });
    const enemy = new TacticalPolicy(BattleSide.defender);
    const guard = battle.getUnits(BattleSide.defender)[1]!;
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    station(battle, guard, 9, 1);
    station(battle, rider, 6, 1);

    expect(battle.getTargets(guard)).toHaveLength(0);

    const order = enemy.orderUnit(guard, battle);

    expect(order.target).toBe(rider);
    expect(rider.isNextTo(order.destination)).toBe(true);
  });

  it('goes round to the rear when the flank is just as close', () => {
    const battle = makeBattle({ defender: makeArmy({ troops: 400 }) });
    const enemy = new TacticalPolicy(BattleSide.defender);
    const guard = battle.getUnits(BattleSide.defender)[1]!;
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    station(battle, guard, 5, 0);
    station(battle, rider, 6, 1);
    rider.facing = Facing.east;

    const order = enemy.orderUnit(guard, battle);
    const behind = battle.field.getCell(5, 1)!;
    const beside = battle.field.getCell(6, 0)!;

    expect(order.target).toBe(rider);
    expect(order.destination).toBe(behind);
    expect(rider.getApproach(behind)).toBe('rear');
    expect(rider.getApproach(beside)).toBe('flank');
  });
});
