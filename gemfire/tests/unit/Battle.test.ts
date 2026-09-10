import { describe, expect, it } from 'vitest';

import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { Battlefield } from '@/core/domain/Battlefield';
import { Facing } from '@/core/domain/Facing';
import { HiredUnit } from '@/core/domain/HiredUnit';

import { makeGeneral } from './factories';

const LONDRE = 22;

function makeBattle(troops = 156, food = 400, unit?: HiredUnit) {
  const attacker = new Army({
    commander: makeGeneral({ name: 'Erin' }),
    troops,
    food,
    unit,
  });
  const defender = new Army({
    commander: makeGeneral({ name: 'Eselred' }),
    troops: 200,
    food: 400,
  });

  return new Battle({
    attacker,
    defender,
    field: Battlefield.ofProvince(LONDRE),
  });
}

describe('Battle', () => {
  it('splits the troops four ways with the remainder to Horsemen', () => {
    const battle = makeBattle(157);
    const mine = battle.getUnits('attacker');

    expect(mine.map((unit) => unit.name)).toEqual([
      'Horsemen',
      'Knights',
      'Knights',
      'Archers',
    ]);
    expect(mine.map((unit) => unit.strength)).toEqual([40, 39, 39, 39]);
    expect(mine.reduce((sum, unit) => sum + unit.strength, 0)).toBe(157);
  });

  it('gives the committed Fifth Unit the fifth place', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Orks')!);
    const mine = battle.getUnits('attacker');

    expect(mine).toHaveLength(5);
    expect(mine.at(-1)!.name).toBe('Orks');
    expect(mine.at(-1)!.strength).toBe(100);
  });

  it('forms each side up on its own edge around its own flag', () => {
    const battle = makeBattle();
    const mine = battle.getUnits('attacker').map((unit) => unit.cell.name);
    const theirs = battle.getUnits('defender').map((unit) => unit.cell.name);

    expect(mine.every((name) => name.startsWith('A'))).toBe(true);
    expect(theirs.every((name) => name.startsWith('J'))).toBe(true);
    expect(mine).not.toContain('A4');

    const facings = battle.units.map((unit) => unit.facing);
    const attackers = battle.getUnits('attacker');

    expect(facings).toContain(Facing.east);
    expect(facings).toContain(Facing.west);
    expect(attackers.every((unit) => unit.facing === Facing.east)).toBe(true);
  });

  it('leaves a unit facing the direction of its last step', () => {
    const battle = makeBattle();
    const rider = battle.getUnits('attacker')[0]!;

    rider.moveAlong([battle.field.getCell(1, 2)!, battle.field.getCell(1, 1)!]);

    expect(rider.facing).toBe(Facing.north);
    expect(rider.cell.name).toBe('B2');
  });

  it('takes its facing from a single step, with nowhere to look back to', () => {
    const battle = makeBattle();
    const rider = battle.getUnits('attacker')[0]!;
    const north = battle.field.getCell(rider.cell.column, rider.cell.row - 1)!;

    rider.moveAlong([north]);

    expect(rider.facing).toBe(Facing.north);
    expect(rider.cell).toBe(north);
  });

  it('leaves two paths to one cell looking two ways', () => {
    const battle = makeBattle();
    const field = battle.field;
    const east = battle.getUnits('attacker')[0]!;
    const north = battle.getUnits('attacker')[1]!;

    east.moveAlong([field.getCell(1, 1)!, field.getCell(2, 1)!]);
    north.moveAlong([field.getCell(2, 2)!, field.getCell(2, 1)!]);

    expect(east.facing).toBe(Facing.east);
    expect(north.facing).toBe(Facing.north);
  });

  it('runs four turns a side to the day and charges food as it turns', () => {
    const battle = makeBattle();
    const before = battle.attacker.food;

    expect(battle.clock.phase).toBe('sunrise');
    expect(battle.turn).toBe('attacker');

    for (let turns = 0; turns < 8; turns += 1) {
      battle.endTurn();
    }

    expect(battle.clock.day).toBe(2);
    expect(battle.clock.phase).toBe('sunrise');
    expect(battle.attacker.food).toBeLessThan(before);
  });

  it('frees a unit to act again only on its own next turn', () => {
    const battle = makeBattle();
    const rider = battle.getUnits('attacker')[0]!;

    rider.wait();
    expect(rider.hasActed).toBe(true);

    battle.endTurn();
    expect(rider.hasActed).toBe(true);

    battle.endTurn();
    expect(rider.hasActed).toBe(false);
  });

  it('ends at once when a unit reaches the enemy flag', () => {
    const battle = makeBattle();
    const rider = battle.getUnits('attacker')[0]!;

    expect(battle.isOver).toBe(false);

    rider.moveAlong([battle.field.defenderFlag]);

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy('attacker')).toBe(true);
    expect(outcome.reason).toBe('flag');
  });

  it('loses the battle for the side whose food runs out', () => {
    const battle = makeBattle(156, 0);
    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy('defender')).toBe(true);
    expect(outcome.reason).toBe('starvation');
  });

  it('gives the defender the battle when the fifth day closes', () => {
    const battle = makeBattle();

    for (let turns = 0; turns < 8 * 5; turns += 1) {
      battle.endTurn();
    }

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy('defender')).toBe(true);
    expect(outcome.reason).toBe('endurance');
    expect(outcome.days).toBe(5);
  });
});
