import { describe, expect, it } from 'vitest';

import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { Facing } from '@/core/domain/Facing';
import { FifthUnit } from '@/core/domain/FifthUnit';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';

import {
  makeArmy,
  makeGeneral,
  makeBattle as makeShared,
  station,
} from './factories';

const SKYREACH = 22;
const TURNS_PER_DAY = 8;

function makeBattle(troops = 156, food = 400, unit?: HiredUnit) {
  return makeShared({
    province: SKYREACH,
    attacker: makeArmy({
      commander: makeGeneral({ name: 'Avar' }),
      troops,
      food,
      unit,
    }),
    defender: makeArmy({ commander: makeGeneral({ name: 'Malrec' }) }),
  });
}

function destroy(unit: BattleUnit): void {
  unit.takeLosses(unit.strength);
}

function finishDay(battle: ReturnType<typeof makeBattle>): void {
  for (let turns = 0; turns < TURNS_PER_DAY; turns += 1) {
    battle.endTurn();
  }
}

describe('Battle', () => {
  it('splits the troops four ways with the remainder to Horsemen', () => {
    const battle = makeBattle(157);
    const mine = battle.getUnits(BattleSide.attacker);

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
    const battle = makeBattle(156, 400, HiredUnit.ofName('Grimhides')!);
    const mine = battle.getUnits(BattleSide.attacker);

    expect(mine).toHaveLength(5);
    expect(mine.at(-1)!.name).toBe('Grimhides');
    expect(mine.at(-1)!.strength).toBe(100);
  });

  it('forms each side up on its own edge, standing on its own flag', () => {
    const battle = makeBattle();
    const mine = battle
      .getUnits(BattleSide.attacker)
      .map((unit) => unit.cell.name);
    const theirs = battle
      .getUnits(BattleSide.defender)
      .map((unit) => unit.cell.name);

    expect(mine.every((name) => name.startsWith('A'))).toBe(true);
    expect(theirs.every((name) => name.startsWith('J'))).toBe(true);
    expect(mine).toContain('A4');

    const facings = battle.units.map((unit) => unit.facing);
    const attackers = battle.getUnits(BattleSide.attacker);

    expect(facings).toContain(Facing.east);
    expect(facings).toContain(Facing.west);
    expect(attackers.every((unit) => unit.facing === Facing.east)).toBe(true);
  });

  it('leaves a unit facing the direction of its last step', () => {
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    rider.moveAlong([battle.field.getCell(1, 2)!, battle.field.getCell(1, 1)!]);

    expect(rider.facing).toBe(Facing.north);
    expect(rider.cell.name).toBe('B2');
  });

  it('takes its facing from a single step, with nowhere to look back to', () => {
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;
    const north = battle.field.getCell(rider.cell.column, rider.cell.row - 1)!;

    rider.moveAlong([north]);

    expect(rider.facing).toBe(Facing.north);
    expect(rider.cell).toBe(north);
  });

  it('leaves two paths to one cell looking two ways', () => {
    const battle = makeBattle();
    const field = battle.field;
    const east = battle.getUnits(BattleSide.attacker)[0]!;
    const north = battle.getUnits(BattleSide.attacker)[1]!;

    east.moveAlong([field.getCell(1, 1)!, field.getCell(2, 1)!]);
    north.moveAlong([field.getCell(2, 2)!, field.getCell(2, 1)!]);

    expect(east.facing).toBe(Facing.east);
    expect(north.facing).toBe(Facing.north);
  });

  it('charges both armies at the start of each day, including day one', () => {
    const battle = makeBattle();

    expect(battle.clock.phase).toBe('sunrise');
    expect(battle.turn).toBe(BattleSide.defender);
    expect(battle.attacker.food).toBe(384);
    expect(battle.defender.food).toBe(379);

    finishDay(battle);

    expect(battle.clock.day).toBe(2);
    expect(battle.clock.phase).toBe('sunrise');
    expect(battle.attacker.food).toBe(368);
    expect(battle.defender.food).toBe(358);
  });

  it('opens each round with the defender and advances the clock after the attacker', () => {
    const battle = makeBattle();
    const phases = ['sunrise', 'noon', 'sunset', 'midnight'];

    for (const phase of phases) {
      expect(battle.turn).toBe(BattleSide.defender);
      expect(battle.clock.phase).toBe(phase);
      expect(battle.clock.day).toBe(1);

      battle.endTurn();

      expect(battle.turn).toBe(BattleSide.attacker);
      expect(battle.clock.phase).toBe(phase);
      expect(battle.clock.day).toBe(1);

      battle.endTurn();
    }

    expect(battle.turn).toBe(BattleSide.defender);
    expect(battle.clock.phase).toBe('sunrise');
    expect(battle.clock.day).toBe(2);
  });

  it('charges for the remaining strength of a hired Fifth Unit', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Grimhides')!);
    const grimhides = battle.getUnits(BattleSide.attacker).at(-1)!;

    expect(battle.attacker.food).toBe(374);
    grimhides.takeLosses(43);
    finishDay(battle);
    expect(battle.attacker.food).toBe(352);

    destroy(grimhides);
    finishDay(battle);
    expect(battle.attacker.food).toBe(336);
  });

  it('exempts a Gem Guardian from the daily ration', () => {
    const attacker = makeArmy({
      troops: 156,
      unit: Gem.ofName('Voltryn')?.guardian,
    });
    const battle = makeShared({ attacker });

    expect(battle.attacker.food).toBe(384);
  });

  it('frees a unit to act again only on its own next turn', () => {
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.defender)[0]!;

    rider.wait();
    expect(rider.hasActed).toBe(true);

    battle.endTurn();
    expect(rider.hasActed).toBe(true);

    battle.endTurn();
    expect(rider.hasActed).toBe(false);
  });

  it('ends at once when a unit reaches the enemy flag', () => {
    const battle = makeBattle();
    const rider = battle.getUnits(BattleSide.attacker)[0]!;

    expect(battle.isOver).toBe(false);

    rider.moveAlong([battle.field.defenderFlag]);

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy(BattleSide.attacker)).toBe(true);
    expect(outcome.reason).toBe('flag');
  });

  it('checks for empty supplies only after the final turn of a day', () => {
    const battle = makeBattle(156, 17);

    expect(battle.attacker.food).toBe(1);
    finishDay(battle);
    expect(battle.attacker.food).toBe(0);
    expect(battle.findOutcome()).toBeUndefined();
    for (let turn = 1; turn < TURNS_PER_DAY; turn += 1) {
      battle.endTurn();
    }
    expect(battle.findOutcome()).toBeUndefined();

    battle.endTurn();
    expect(battle.findOutcome()).toMatchObject({
      winner: BattleSide.defender,
      reason: 'starvation',
      days: 2,
    });
    expect(battle.clone().findOutcome()).toEqual(battle.findOutcome());
  });

  it.each([
    [0, BattleSide.defender],
    [400, BattleSide.attacker],
  ])(
    'resolves day-one starvation when the attacker starts with %s food',
    (food, winner) => {
      const battle = makeShared({
        attacker: makeArmy({ food }),
        defender: makeArmy({ food: 0 }),
      });

      finishDay(battle);

      expect(battle.findOutcome()).toMatchObject({
        winner,
        reason: 'starvation',
        days: 1,
      });
    },
  );

  it('preserves the first day’s supplies when cloning a battle', () => {
    const battle = makeBattle();
    const copy = battle.clone();

    expect(copy.attacker.food).toBe(battle.attacker.food);
    expect(copy.defender.food).toBe(battle.defender.food);
  });

  it('gives the defender the battle when the fifth day closes', () => {
    const battle = makeBattle();

    for (let day = 0; day < 5; day += 1) {
      finishDay(battle);
    }

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy(BattleSide.defender)).toBe(true);
    expect(outcome.reason).toBe('endurance');
    expect(outcome.days).toBe(5);
    expect(battle.attacker.food).toBe(320);
    expect(battle.defender.food).toBe(295);
  });
  it('strikes the one unit it was pointed at, whatever the pattern reaches', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Fachan')!);
    const fachan = battle.getUnits(BattleSide.attacker).at(-1)!;
    const [chosen, beside] = battle.getUnits(BattleSide.defender);

    station(battle, fachan, 3, 3);
    station(battle, chosen!, 3, 2);
    station(battle, beside!, 4, 4);

    expect(battle.getTargets(fachan)).toHaveLength(2);

    battle.strike(fachan, chosen!);

    expect(chosen!.strength).toBeLessThan(chosen!.committedStrength);
    expect(beside!.strength).toBe(beside!.committedStrength);
  });

  it('charges a body of troops to the army behind it, a Fifth Unit to nobody', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Grimhides')!);
    const rider = station(
      battle,
      battle.getUnits(BattleSide.attacker)[0]!,
      3,
      3,
    );
    const grimhides = station(
      battle,
      battle.getUnits(BattleSide.attacker).at(-1)!,
      2,
      3,
    );
    const knight = station(
      battle,
      battle.getUnits(BattleSide.defender)[0]!,
      4,
      3,
    );
    const troops = battle.defender.troops;
    const mine = battle.attacker.troops;

    const clash = battle.strike(rider, knight);

    expect(battle.defender.troops).toBe(troops - clash.losses);
    expect(battle.attacker.troops).toBe(mine - clash.backlash);

    const spent = battle.attacker.troops;

    station(battle, knight, 3, 3);
    battle.strike(knight, grimhides);

    expect(grimhides.strength).toBeLessThan(grimhides.committedStrength);
    expect(battle.attacker.troops).toBe(spent);
  });

  it('turns a unit to face what it struck', () => {
    const battle = makeBattle();
    const rider = station(
      battle,
      battle.getUnits(BattleSide.attacker)[0]!,
      3,
      3,
    );
    const knight = station(
      battle,
      battle.getUnits(BattleSide.defender)[0]!,
      3,
      2,
    );

    rider.facing = Facing.east;
    battle.strike(rider, knight);

    expect(rider.facing).toBe(Facing.north);
    expect(rider.hasActed).toBe(true);
  });

  it('clears a destroyed piece off the field and frees its ground', () => {
    const battle = makeBattle();
    const rider = station(
      battle,
      battle.getUnits(BattleSide.attacker)[0]!,
      6,
      1,
    );
    const knight = station(
      battle,
      battle.getUnits(BattleSide.defender)[0]!,
      7,
      1,
    );
    const held = knight.cell;

    expect(battle.getMoveRange(rider).includes(held)).toBe(false);

    destroy(knight);

    expect(battle.getUnit(held)).toBeUndefined();
    expect(battle.getUnits(BattleSide.defender)).not.toContain(knight);
    expect(battle.getTargets(rider)).not.toContain(knight);
    expect(battle.getMoveRange(rider).includes(held)).toBe(true);
  });

  it('wins by rout when nothing of theirs stands', () => {
    const battle = makeBattle();

    for (const unit of battle.getUnits(BattleSide.defender)) {
      destroy(unit);
    }

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy(BattleSide.attacker)).toBe(true);
    expect(outcome.reason).toBe('rout');
  });

  it('is no rout while their Fifth Unit still stands', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Grimhides')!);

    for (const unit of battle.getUnits(BattleSide.attacker)) {
      if (unit.isTroops) {
        destroy(unit);
      }
    }

    expect(battle.attacker.hasTroops).toBe(true);
    expect(battle.findOutcome()).toBeUndefined();
  });

  it('ends at once when a side abandons the field', () => {
    const battle = makeBattle();

    battle.retreat(BattleSide.attacker);

    const outcome = battle.findOutcome()!;

    expect(outcome.isWonBy(BattleSide.defender)).toBe(true);
    expect(outcome.reason).toBe('retreat');
  });

  it('reports a Fifth Unit lost on the field', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Grimhides')!);
    const grimhides = battle.getUnits(BattleSide.attacker).at(-1)!;

    for (const unit of battle.getUnits(BattleSide.defender)) {
      destroy(unit);
    }

    expect(battle.findOutcome()!.hasLostUnit(BattleSide.attacker)).toBe(false);

    destroy(grimhides);

    expect(battle.findOutcome()!.hasLostUnit(BattleSide.attacker)).toBe(true);
  });

  it('frees a withdrawn Guardian’s cell and loses the battle without losing the Guardian', () => {
    const guardian = Gem.ofName('Voltryn').guardian;
    const attacker = makeArmy({ troops: 0, unit: guardian });
    const battle = makeShared({ attacker });
    const summoned = battle.getUnits(BattleSide.attacker)[0]!;

    summoned.takeLosses(guardian.maximumStrength - 14);

    expect(summoned.strength).toBe(14);
    expect(battle.getUnit(summoned.cell)).toBeUndefined();
    expect(battle.findOutcome()).toMatchObject({
      winner: BattleSide.defender,
      reason: 'rout',
      lostUnits: [],
    });
  });
  it('has a Guardian stand alone where troops and hired bands are many', () => {
    const battle = makeBattle(156, 400, HiredUnit.ofName('Grimhides')!);
    const guardian = new FifthUnit({
      name: 'Voltryn',
      attack: 28,
      defense: 28,
      move: 3,
      range: 'circular',
      description: 'the guardian of the Alderwyn gem',
      strength: 150,
    });

    expect(battle.getUnits(BattleSide.attacker)[0]!.standsAlone).toBe(false);
    expect(battle.getUnits(BattleSide.attacker).at(-1)!.standsAlone).toBe(
      false,
    );
    expect(guardian.standsAlone).toBe(true);
  });
});
