import { describe, expect, it } from 'vitest';

import { Advance } from '@/core/domain/Advance';
import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { Battlefield } from '@/core/domain/Battlefield';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Cell } from '@/core/domain/Cell';
import { Facing } from '@/core/domain/Facing';
import { TacticalPolicy } from '@/core/domain/TacticalPolicy';
import type { UnitOrder } from '@/core/domain/UnitOrder';

import { makeGeneral } from './factories';

const LONDRE = 22;

function makeBattle(mine: number, theirs: number): Battle {
  return new Battle({
    attacker: new Army({
      commander: makeGeneral({ name: 'Erin' }),
      troops: mine,
      food: 400,
    }),
    defender: new Army({
      commander: makeGeneral({ name: 'Eselred' }),
      troops: theirs,
      food: 400,
    }),
    field: Battlefield.ofProvince(LONDRE),
  });
}

function closes(
  order: UnitOrder,
  unit: BattleUnit,
  goal: Cell,
  battle: Battle,
): boolean {
  const advance = new Advance(goal, unit, battle.field);

  return advance.isCloser(order.destination, unit.cell);
}

function photograph(battle: Battle): string {
  const units = battle.units.map(
    (unit) =>
      `${unit.name}${unit.cell.name}${unit.strength}${unit.facing}` +
      `${unit.hasMoved}${unit.hasActed}`,
  );

  return [
    ...units,
    battle.turn,
    battle.clock.day,
    battle.clock.phase,
    battle.attacker.troops,
    battle.attacker.food,
    battle.defender.troops,
    battle.defender.food,
  ].join('|');
}

function station(
  battle: Battle,
  unit: BattleUnit,
  column: number,
  row: number,
) {
  unit.cell = battle.field.getCell(column, row)!;

  return unit;
}

describe('TacticalPolicy', () => {
  it('gives back an order and changes nothing', () => {
    const battle = makeBattle(156, 200);
    const enemy = new TacticalPolicy('defender');
    const unit = battle.getUnits('defender')[0]!;
    const before = photograph(battle);

    const order = enemy.orderUnit(unit, battle);

    expect(order.destination).toBeDefined();
    expect(photograph(battle)).toBe(before);
  });

  it('comes for your flag when it is not outmatched', () => {
    const battle = makeBattle(40, 400);
    const enemy = new TacticalPolicy('defender');
    const unit = station(battle, battle.getUnits('defender')[0]!, 9, 1);

    const order = enemy.orderUnit(unit, battle);

    expect(closes(order, unit, battle.field.attackerFlag, battle)).toBe(true);
  });

  it('routes round what it cannot walk through', () => {
    const battle = makeBattle(40, 400);
    const enemy = new TacticalPolicy('defender');
    const unit = station(battle, battle.getUnits('defender')[0]!, 4, 5);
    const flag = battle.field.attackerFlag;
    const advance = new Advance(flag, unit, battle.field);
    const order = enemy.orderUnit(unit, battle);

    // due west is river, so the only walk to the flag detours south to a bridge
    expect(battle.field.getCell(3, 5)!.terrain).toBe('river');
    expect(advance.isCloser(order.destination, unit.cell)).toBe(true);
    expect(order.destination.row).toBeGreaterThan(unit.cell.row);
  });

  it('falls back on its own flag when it is outmatched', () => {
    const battle = makeBattle(400, 40);
    const enemy = new TacticalPolicy('defender');
    const unit = battle.getUnits('defender')[0]!;

    const order = enemy.orderUnit(unit, battle);

    expect(closes(order, unit, battle.field.defenderFlag, battle)).toBe(true);
  });

  it('names a target standing in its pattern from the cell it chose', () => {
    const battle = makeBattle(400, 40);
    const enemy = new TacticalPolicy('defender');
    const guard = battle.getUnits('defender')[0]!;
    const rider = battle.getUnits('attacker')[0]!;

    station(
      battle,
      guard,
      battle.field.defenderFlag.column,
      battle.field.defenderFlag.row,
    );
    station(battle, rider, 7, 4);

    const order = enemy.orderUnit(guard, battle);

    expect(order.destination).toBe(guard.cell);
    expect(order.isAttacking).toBe(true);
    expect(order.target).toBe(rider);
    expect(rider.strength).toBe(rider.committedStrength);
  });
  it('walks into a blow rather than waiting to be hit', () => {
    const battle = makeBattle(400, 40);
    const enemy = new TacticalPolicy('defender');
    const guard = battle.getUnits('defender')[1]!;
    const rider = battle.getUnits('attacker')[0]!;

    station(battle, guard, 9, 1);
    station(battle, rider, 6, 1);

    expect(battle.getTargets(guard)).toHaveLength(0);

    const order = enemy.orderUnit(guard, battle);

    expect(order.isAttacking).toBe(true);
    expect(order.target).toBe(rider);
    expect(order.destination).not.toBe(guard.cell);
    expect(rider.isNextTo(order.destination)).toBe(true);
  });

  it('goes round to the rear when the flank is just as close', () => {
    const battle = makeBattle(400, 40);
    const enemy = new TacticalPolicy('defender');
    const guard = battle.getUnits('defender')[1]!;
    const rider = battle.getUnits('attacker')[0]!;

    station(battle, guard, 5, 0);
    station(battle, rider, 6, 1);
    rider.facing = Facing.east;

    const order = enemy.orderUnit(guard, battle);
    const behind = battle.field.getCell(5, 1)!;
    const beside = battle.field.getCell(6, 0)!;

    expect(order.target).toBe(rider);
    expect(order.destination).toBe(behind);
    expect(order.destination).not.toBe(beside);
    expect(rider.getApproach(behind)).toBe('rear');
    expect(rider.getApproach(beside)).toBe('flank');
  });
});
