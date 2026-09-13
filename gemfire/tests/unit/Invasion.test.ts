import { describe, expect, it } from 'vitest';

import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { BattleOutcome } from '@/core/domain/BattleOutcome';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Invasion } from '@/core/domain/Invasion';
import { InvasionReport } from '@/core/domain/InvasionReport';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const SOURCE_GOLD = 200;
const SOURCE_TROOPS = 156;
const SOURCE_FOOD = 300;

interface SetupParams {
  readonly defenders?: number;
  readonly defenderFood?: number;
}

function setup(params: SetupParams = {}) {
  const erin = makeGeneral({ name: 'Erin' });
  const mine = makeFamily({ name: 'Blanche', ruler: erin });
  const seth = makeGeneral({ name: 'Seth' });
  const rival = makeFamily({ name: 'Lyle', ruler: seth });

  const source = makeProvince({
    number: 1,
    name: 'Rodale',
    neighbors: [22],
    family: mine,
    governor: erin,
    gold: SOURCE_GOLD,
    troops: SOURCE_TROOPS,
    food: SOURCE_FOOD,
  });
  const target = makeProvince({
    number: 22,
    name: 'Londre',
    neighbors: [1],
    family: rival,
    governor: seth,
    troops: params.defenders ?? 200,
    food: params.defenderFood ?? 300,
  });

  const { world } = makeWorld([source, target], mine);
  const attacker = new Army({ commander: erin, troops: 100, food: 120 });
  const invasion = new Invasion({ world, source, target, attacker });

  return { invasion, source, target, attacker, mine, rival, world };
}

describe('Invasion', () => {
  it('charges the deployment cost and musters the defender on begin', () => {
    const { invasion, source, attacker } = setup();
    const goldBefore = source.resources.gold;

    const started = invasion.begin();

    expect(source.resources.gold).toBe(goldBefore - attacker.deploymentCost);
    expect(source.resources.troops).toBe(SOURCE_TROOPS - 100);
    expect(started).toBeInstanceOf(Battle);
    expect((started as Battle).defender.troops).toBe(200);
  });

  it('hands back a battle on the defending province own field', () => {
    const { invasion } = setup();
    const started = invasion.begin() as Battle;

    expect(started.field.name).toBe('Londre');
    expect(started.units).toHaveLength(8);
  });

  it('finishes without a battle when the defender will not fight', () => {
    const { invasion, target, mine } = setup({
      defenders: 0,
      defenderFood: 0,
    });
    const started = invasion.begin();

    expect(started).toBeInstanceOf(InvasionReport);
    expect((started as InvasionReport).isFought).toBe(false);
    expect(target.belongsTo(mine)).toBe(true);
  });

  it('settles the land on conclude', () => {
    const { invasion, target, mine, attacker } = setup();

    invasion.begin();

    const report = invasion.conclude(
      new BattleOutcome({
        winner: 'attacker',
        reason: 'flag',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
      }),
    );

    expect(report.isTaken).toBe(true);
    expect(target.belongsTo(mine)).toBe(true);
    expect(invasion.affected).toContain(target);
  });

  it('refuses to conclude a battle it never began', () => {
    const { invasion, attacker } = setup();

    expect(() =>
      invasion.conclude(
        new BattleOutcome({
          winner: 'attacker',
          reason: 'flag',
          days: 1,
          attackerSurvivors: attacker.troops,
          defenderSurvivors: 0,
        }),
      ),
    ).toThrow('conclude() called before begin()');
  });
  it('leaves a hired Fifth Unit destroyed on the field behind', () => {
    const { invasion, target, attacker } = setup();
    const orks = HiredUnit.ofName('Orks')!;

    target.addUnit(orks);
    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: 'attacker',
        reason: 'rout',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
        lostUnits: ['defender'],
      }),
    );

    expect(target.hiredUnits).not.toContain(orks);
  });

  it('brings a hired Fifth Unit that survived back with the province', () => {
    const { invasion, target, attacker } = setup();
    const orks = HiredUnit.ofName('Orks')!;

    target.addUnit(orks);
    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: 'attacker',
        reason: 'flag',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
      }),
    );

    expect(target.hiredUnits).toContain(orks);
  });
  it('rests the gem it summoned a Guardian from', () => {
    const { invasion, rival, attacker, world } = setup();
    const gem = Gem.ofName('Pluvius');

    rival.gems = [gem];

    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: 'attacker',
        reason: 'flag',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
      }),
    );

    expect(gem.isReadyOn(world.date)).toBe(false);
    expect(gem.countMonthsLeft(world.date)).toBe(3);
  });

  it('rests it longer when the Guardian was destroyed', () => {
    const { invasion, rival, attacker, world } = setup();
    const gem = Gem.ofName('Pluvius');

    rival.gems = [gem];

    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: 'attacker',
        reason: 'rout',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
        lostUnits: ['defender'],
      }),
    );

    expect(gem.countMonthsLeft(world.date)).toBe(5);
  });

  it('does not muster a Guardian whose gem is resting', () => {
    const { invasion, rival, target, world } = setup();
    const gem = Gem.ofName('Pluvius');

    rival.gems = [gem];
    gem.rest(world.date, 3);
    target.addResources({ troops: -target.resources.troops + 10 });

    const started = invasion.begin();

    expect(started).toBeInstanceOf(Battle);
    expect((started as Battle).defender.unit).toBeUndefined();
  });
  it('gives a house one Guardian-backed battle, not two in a month', () => {
    const { invasion, rival, world } = setup();
    const gem = Gem.ofName('Pluvius');

    rival.gems = [gem];

    expect(rival.getReadyGuardians(world.date)).toHaveLength(1);

    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: 'defender',
        reason: 'endurance',
        days: 5,
        attackerSurvivors: 0,
        defenderSurvivors: 90,
      }),
    );

    expect(rival.getReadyGuardians(world.date)).toHaveLength(0);
  });
});
