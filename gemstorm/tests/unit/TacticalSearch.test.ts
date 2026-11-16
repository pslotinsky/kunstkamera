// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import type { Battle } from '@/core/domain/Battle';
import { BattleSide } from '@/core/domain/BattleSide';
import { BattleScore } from '@/core/domain/battle-ai/BattleScore';
import { TacticalPolicy } from '@/core/domain/battle-ai/TacticalPolicy';

import { makeArmy, makeBattle, runOutTheClock, station } from './factories';

const NODE_BUDGET = 2_000;

function photograph(battle: Battle): string {
  const units = battle.units.map(
    (unit) =>
      `${unit.name}${unit.cell.name}${unit.strength}${unit.facing}` +
      `${unit.stepsTaken}${unit.hasActed}`,
  );
  const ground = battle.field.allCells.map(
    (cell) => `${cell.name}${cell.terrain}${cell.sprite}`,
  );

  return [
    ...units,
    ...ground,
    battle.turn,
    battle.clock.day,
    battle.clock.phase,
    battle.attacker.troops,
    battle.attacker.food,
    battle.defender.troops,
    battle.defender.food,
  ].join('|');
}

describe('TacticalSearch', () => {
  it('leaves the board exactly as it found it', () => {
    const battle = makeBattle();
    const enemy = new TacticalPolicy(BattleSide.defender);
    const before = photograph(battle);

    enemy.orderUnit(battle.getUnits(BattleSide.defender)[0]!, battle);

    expect(photograph(battle)).toBe(before);
  });

  it('names cells and targets from the board it was asked about', () => {
    const battle = makeBattle();
    const enemy = new TacticalPolicy(BattleSide.defender);
    const guard = station(
      battle,
      battle.getUnits(BattleSide.defender)[0]!,
      9,
      4,
    );

    station(battle, battle.getUnits(BattleSide.attacker)[0]!, 9, 3);

    const order = enemy.orderUnit(guard, battle);

    expect(battle.field.allCells).toContain(order.destination);
    expect(battle.units).toContain(order.target);
  });

  it('rolls no dice while it is thinking', () => {
    const battle = makeBattle();
    const enemy = new TacticalPolicy(BattleSide.defender);
    const knights = battle
      .getUnits(BattleSide.defender)
      .find((unit) => unit.canBuild)!;
    const rolled = vi.spyOn(Math, 'random');

    enemy.orderUnit(knights, battle);

    expect(rolled).not.toHaveBeenCalled();

    rolled.mockRestore();
  });

  it('costs what it should, counted in nodes and not in seconds', () => {
    const battle = makeBattle();
    const enemy = new TacticalPolicy(BattleSide.defender);

    enemy.orderUnit(battle.getUnits(BattleSide.defender)[0]!, battle);

    expect(enemy.nodes).toBeLessThan(NODE_BUDGET);
  });

  it('steps onto a flag it can reach', () => {
    const battle = makeBattle();
    const enemy = new TacticalPolicy(BattleSide.defender);
    const flag = battle.field.attackerFlag;
    const rider = station(
      battle,
      battle.getUnits(BattleSide.defender)[0]!,
      flag.column,
      flag.row + 1,
    );

    const order = enemy.orderUnit(rider, battle);

    expect(order.destination).toBe(flag);
  });
});

describe('BattleScore', () => {
  it('scores a defender pressed forward above one held back', () => {
    const held = makeBattle();
    const behind = makeBattle();
    const score = new BattleScore(BattleSide.defender);
    const road = held.field.attackerFlag;

    station(
      held,
      held.getUnits(BattleSide.defender)[0]!,
      road.column + 1,
      road.row,
    );
    station(
      behind,
      behind.getUnits(BattleSide.defender)[0]!,
      road.column + 3,
      road.row,
    );

    expect(score.measure(held)).toBeGreaterThan(score.measure(behind));
  });
});

describe('Battle.clone', () => {
  it('shares no mutable state with the battle it came from', () => {
    const battle = makeBattle();
    const copy = battle.clone();
    const original = battle.units[0]!;
    const twin = copy.units[0]!;

    twin.takeLosses(5);
    twin.moveAlong([copy.field.getCell(1, 0)!]);
    copy.field.getCell(1, 1)!.raiseFence();
    copy.endTurn();
    copy.attacker.eat();

    expect(original.strength).not.toBe(twin.strength);
    expect(original.cell).not.toBe(twin.cell);
    expect(battle.field.getCell(1, 1)!.terrain).not.toBe('fence');
    expect(battle.turn).not.toBe(copy.turn);
    expect(battle.attacker.food).not.toBe(copy.attacker.food);
  });

  it('stands its units on its own cells', () => {
    const battle = makeBattle();
    const copy = battle.clone();
    const strays = copy.units.filter(
      (unit) => !copy.field.allCells.includes(unit.cell),
    );

    expect(strays).toHaveLength(0);
    expect(battle.field.allCells).not.toContain(copy.units[0]!.cell);
  });

  it('keeps what each army set out with', () => {
    const battle = makeBattle({ attacker: makeArmy({ troops: 200 }) });

    battle.attacker.takeCasualties(40);

    const copy = battle.clone();

    expect(copy.attacker.troops).toBe(160);
    expect(copy.attacker.committedTroops).toBe(200);
  });
});

describe('TacticalPolicy retreat', () => {
  it('stays while it is merely behind', () => {
    const battle = makeBattle({ attacker: makeArmy({ troops: 320 }) });

    expect(new TacticalPolicy(BattleSide.defender).chooseRetreat(battle)).toBe(
      false,
    );
  });

  it('stays when there is nothing left worth saving', () => {
    const battle = makeBattle({
      attacker: makeArmy({ troops: 400 }),
      defender: makeArmy({ troops: 4 }),
    });

    expect(new TacticalPolicy(BattleSide.defender).chooseRetreat(battle)).toBe(
      false,
    );
  });

  it('stays in an even battle however large the armies are', () => {
    const battle = makeBattle({
      attacker: makeArmy({ troops: 2000 }),
      defender: makeArmy({ troops: 2000 }),
    });

    expect(new TacticalPolicy(BattleSide.defender).chooseRetreat(battle)).toBe(
      false,
    );
  });

  it('answers no for a battle already decided', () => {
    const battle = runOutTheClock(makeBattle());

    expect(new TacticalPolicy(BattleSide.attacker).chooseRetreat(battle)).toBe(
      false,
    );
  });

  it('stays when its own flag is under immediate threat', () => {
    const battle = makeBattle({ attacker: makeArmy({ troops: 400 }) });
    const flag = battle.field.defenderFlag;

    station(
      battle,
      battle.getUnits(BattleSide.attacker)[0]!,
      flag.column,
      flag.row + 1,
    );

    expect(new TacticalPolicy(BattleSide.defender).chooseRetreat(battle)).toBe(
      false,
    );
  });
});
