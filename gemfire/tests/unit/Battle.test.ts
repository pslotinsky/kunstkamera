import { describe, expect, it } from 'vitest';

import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { Battlefield } from '@/core/domain/Battlefield';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { Facing } from '@/core/domain/Facing';
import { FifthUnit } from '@/core/domain/FifthUnit';
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

function station(
  battle: Battle,
  unit: BattleUnit,
  column: number,
  row: number,
) {
  unit.cell = battle.field.getCell(column, row)!;

  return unit;
}

function destroy(unit: BattleUnit): void {
  unit.takeLosses(unit.strength);
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
  it('strikes the one unit it was pointed at, whatever the pattern reaches', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Fachan')!);
    const fachan = battle.getUnits('attacker').at(-1)!;
    const [chosen, beside] = battle.getUnits('defender');

    station(battle, fachan, 3, 3);
    station(battle, chosen!, 3, 2);
    station(battle, beside!, 4, 4);

    expect(battle.getTargets(fachan)).toHaveLength(2);

    battle.strike(fachan, chosen!);

    expect(chosen!.strength).toBeLessThan(chosen!.committedStrength);
    expect(beside!.strength).toBe(beside!.committedStrength);
  });

  it('charges a body of troops to the army behind it, a Fifth Unit to nobody', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Orks')!);
    const rider = station(battle, battle.getUnits('attacker')[0]!, 3, 3);
    const orks = station(battle, battle.getUnits('attacker').at(-1)!, 2, 3);
    const knight = station(battle, battle.getUnits('defender')[0]!, 4, 3);
    const troops = battle.defender.troops;
    const mine = battle.attacker.troops;

    const clash = battle.strike(rider, knight);

    expect(battle.defender.troops).toBe(troops - clash.losses);
    expect(battle.attacker.troops).toBe(mine - clash.backlash);

    const spent = battle.attacker.troops;

    station(battle, knight, 3, 3);
    battle.strike(knight, orks);

    expect(orks.strength).toBeLessThan(orks.committedStrength);
    expect(battle.attacker.troops).toBe(spent);
  });

  it('turns a unit to face what it struck', () => {
    const battle = makeBattle();
    const rider = station(battle, battle.getUnits('attacker')[0]!, 3, 3);
    const knight = station(battle, battle.getUnits('defender')[0]!, 3, 2);

    rider.facing = Facing.east;
    battle.strike(rider, knight);

    expect(rider.facing).toBe(Facing.north);
    expect(rider.hasActed).toBe(true);
  });

  it('clears a destroyed piece off the field and frees its ground', () => {
    const battle = makeBattle();
    const rider = station(battle, battle.getUnits('attacker')[0]!, 6, 1);
    const knight = station(battle, battle.getUnits('defender')[0]!, 7, 1);
    const held = knight.cell;

    expect(battle.getMoveRange(rider).includes(held)).toBe(false);

    destroy(knight);

    expect(battle.getUnit(held)).toBeUndefined();
    expect(battle.getUnits('defender')).not.toContain(knight);
    expect(battle.getTargets(rider)).not.toContain(knight);
    expect(battle.getMoveRange(rider).includes(held)).toBe(true);
  });

  it('wins by rout when nothing of theirs stands', () => {
    const battle = makeBattle();

    for (const unit of battle.getUnits('defender')) {
      destroy(unit);
    }

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy('attacker')).toBe(true);
    expect(outcome.reason).toBe('rout');
  });

  it('is no rout while their Fifth Unit still stands', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Orks')!);

    for (const unit of battle.getUnits('attacker')) {
      if (unit.isTroops) {
        destroy(unit);
      }
    }

    expect(battle.attacker.hasTroops).toBe(true);
    expect(battle.findOutcome()).toBeUndefined();
  });

  it('ends at once when a side abandons the field', () => {
    const battle = makeBattle();

    battle.retreat('attacker');

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy('defender')).toBe(true);
    expect(outcome.reason).toBe('retreat');
  });

  it('reports a Fifth Unit lost on the field', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Orks')!);
    const orks = battle.getUnits('attacker').at(-1)!;

    for (const unit of battle.getUnits('defender')) {
      destroy(unit);
    }

    expect(battle.findOutcome()!.hasLostUnit('attacker')).toBe(false);

    destroy(orks);

    expect(battle.findOutcome()!.hasLostUnit('attacker')).toBe(true);
  });
  it('has a Guardian stand alone where troops and hired bands are many', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Orks')!);
    const guardian = new FifthUnit({
      name: 'Zendor',
      move: 3,
      range: 'circular',
      description: 'the guardian of the Blanche gem',
      strength: 150,
    });

    expect(battle.getUnits('attacker')[0]!.standsAlone).toBe(false);
    expect(battle.getUnits('attacker').at(-1)!.standsAlone).toBe(false);
    expect(guardian.standsAlone).toBe(true);
  });
});
