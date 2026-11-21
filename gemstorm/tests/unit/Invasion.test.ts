import { describe, expect, it } from 'vitest';

import { Battle } from '@/core/domain/Battle';
import { BattleOutcome } from '@/core/domain/BattleOutcome';
import { BattleSide } from '@/core/domain/BattleSide';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Invasion } from '@/core/domain/Invasion';
import { InvasionReport } from '@/core/domain/InvasionReport';
import { Nerith } from '@/core/domain/Nerith';

import {
  makeArmy,
  makeFamily,
  makeGeneral,
  makeOutcome,
  makeProvince,
  makeWorld,
} from './factories';

const SOURCE_GOLD = 200;
const SOURCE_TROOPS = 156;
const SOURCE_FOOD = 300;

interface SetupParams {
  readonly defenders?: number;
  readonly defenderFood?: number;
  readonly defenderGold?: number;
}

function setup(params: SetupParams = {}) {
  const avar = makeGeneral({ name: 'Avar' });
  const mine = makeFamily({ name: 'Alderwyn', ruler: avar });
  const marven = makeGeneral({ name: 'Marven' });
  const rival = makeFamily({ name: 'Stormmere', ruler: marven });

  const source = makeProvince({
    number: 1,
    name: 'Alderpass',
    neighbors: [22],
    family: mine,
    governor: avar,
    gold: SOURCE_GOLD,
    troops: SOURCE_TROOPS,
    food: SOURCE_FOOD,
  });
  const target = makeProvince({
    number: 22,
    name: 'Skyreach',
    neighbors: [1],
    family: rival,
    governor: marven,
    gold: params.defenderGold ?? 0,
    troops: params.defenders ?? 200,
    food: params.defenderFood ?? 300,
  });

  const { world } = makeWorld([source, target], mine);
  const attacker = makeArmy({ commander: avar, troops: 100, food: 120 });
  const invasion = new Invasion({ world, source, target, attacker });

  return { invasion, source, target, attacker, mine, rival, world };
}

describe('Invasion', () => {
  it('lets an untrooped province defend with its stationed Nerith', () => {
    const { source, target, world } = setup({ defenders: 0 });
    const nerith = new Nerith();
    target.fifthUnits.addUnit(nerith);
    const invasion = new Invasion({
      world,
      source,
      target,
      attacker: makeArmy(),
    });
    const started = invasion.begin();

    expect(started).toBeInstanceOf(Battle);
    if (!(started instanceof Battle)) {
      throw new Error('Nerith was not allowed to defend');
    }
    expect(started.getUnits(BattleSide.defender)).toHaveLength(1);
    expect(started.defender.unit).toBe(nerith);
  });

  it.each([BattleSide.attacker, BattleSide.defender])(
    'spends only the participating Nerith visits after a fought battle won by %s',
    (winner) => {
      const { source, target, world } = setup();
      const attacking = new Nerith();
      const reserve = new Nerith();
      const defending = new Nerith();
      source.fifthUnits.addUnit(attacking);
      source.fifthUnits.addUnit(reserve);
      target.fifthUnits.addUnit(defending);
      const defensiveReserve = new Nerith();
      target.fifthUnits.addUnit(defensiveReserve);
      const attacker = makeArmy({
        commander: source.governor!,
        unit: attacking,
      });
      const invasion = new Invasion({ world, source, target, attacker });
      invasion.muster();
      invasion.answer({ answer: 'fight', unit: defending });
      invasion.conclude(makeOutcome({ winner }));

      expect(source.fifthUnits.units).toEqual([reserve]);
      expect(target.fifthUnits.units).toEqual(
        winner.isAttacker ? [] : [defensiveReserve],
      );
    },
  );

  it('keeps an attacking Nerith after a concession', () => {
    const { source, target, world } = setup({ defenders: 0, defenderFood: 0 });
    const attacking = new Nerith();
    source.fifthUnits.addUnit(attacking);
    const attacker = makeArmy({ commander: source.governor!, unit: attacking });
    const invasion = new Invasion({ world, source, target, attacker });
    invasion.muster();
    invasion.answer({ answer: 'surrender' });

    expect(source.fifthUnits.units).toEqual([]);
    expect(target.fifthUnits.units).toEqual([attacking]);
  });

  it('spends Nerith even when its side retreats without losing the unit', () => {
    const { source, target, world } = setup();
    const nerith = new Nerith();
    source.fifthUnits.addUnit(nerith);
    const attacker = makeArmy({ commander: source.governor!, unit: nerith });
    const invasion = new Invasion({ world, source, target, attacker });
    invasion.muster();
    invasion.answer({ answer: 'fight' });
    invasion.conclude(
      makeOutcome({
        winner: BattleSide.defender,
        reason: 'retreat',
        lostUnits: [],
      }),
    );

    expect(source.fifthUnits.units).toEqual([]);
  });

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

    expect(started.field.name).toBe('Skyreach');
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

  it('hands the gold standing on a taken province to its new owner', () => {
    const { invasion, target, mine } = setup({
      defenderGold: 90,
      defenderFood: 100,
    });

    invasion.begin();
    invasion.conclude(makeOutcome({ winner: BattleSide.attacker }));

    expect(target.belongsTo(mine)).toBe(true);
    expect(target.resources.gold).toBe(90);
  });

  it('settles the land on conclude', () => {
    const { invasion, target, mine, attacker } = setup();

    invasion.begin();

    const report = invasion.conclude(
      makeOutcome({
        winner: BattleSide.attacker,
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
        makeOutcome({
          winner: BattleSide.attacker,
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
    const grimhides = HiredUnit.ofName('Grimhides')!;

    target.fifthUnits.addUnit(grimhides);
    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: BattleSide.attacker,
        reason: 'rout',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
        lostUnits: [BattleSide.defender],
      }),
    );

    expect(target.fifthUnits.hiredUnits).not.toContain(grimhides);
  });

  it('keeps a surviving hired Fifth Unit at its remaining battle strength', () => {
    const { invasion, target } = setup();
    const grimhides = HiredUnit.ofName('Grimhides')!;

    target.fifthUnits.addUnit(grimhides);
    invasion.muster();
    const battle = invasion.answer({ answer: 'fight', unit: grimhides });
    expect(battle).toBeInstanceOf(Battle);
    if (battle instanceof Battle) {
      const defender = battle
        .getUnits(BattleSide.defender)
        .find((unit) => unit.isFifthUnit)!;
      defender.strength = 74;
      battle.retreat(BattleSide.attacker);

      invasion.conclude(battle.findOutcome()!);
    }

    expect(target.fifthUnits.hiredUnits).toContain(grimhides);
    expect(grimhides.strength).toBe(74);
  });

  it('rests the gem it summoned a Guardian from', () => {
    const { invasion, rival, attacker, world } = setup();
    const gem = Gem.ofName('Asterion');

    rival.gems = [gem];

    invasion.begin();
    invasion.conclude(
      makeOutcome({
        winner: BattleSide.attacker,
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
    const gem = Gem.ofName('Asterion');

    rival.gems = [gem];

    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: BattleSide.attacker,
        reason: 'rout',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
        lostUnits: [BattleSide.defender],
      }),
    );

    expect(gem.countMonthsLeft(world.date)).toBe(5);
  });

  it('does not muster a Guardian whose gem is resting', () => {
    const { invasion, rival, target, world } = setup();
    const gem = Gem.ofName('Asterion');

    rival.gems = [gem];
    gem.rest(world.date, 3);
    target.addResources({ troops: -target.resources.troops + 10 });

    const started = invasion.begin();

    expect(started).toBeInstanceOf(Battle);
    expect((started as Battle).defender.unit).toBeUndefined();
  });
  it('gives a house one Guardian-backed battle, not two in a month', () => {
    const { invasion, rival, world } = setup();
    const gem = Gem.ofName('Asterion');

    rival.gems = [gem];

    expect(rival.getReadyGuardians(world.date)).toHaveLength(1);

    invasion.begin();
    invasion.conclude(
      makeOutcome({
        winner: BattleSide.defender,
        reason: 'endurance',
        days: 5,
        attackerSurvivors: 0,
        defenderSurvivors: 90,
      }),
    );

    expect(rival.getReadyGuardians(world.date)).toHaveLength(0);
  });
});

function setupRefuges() {
  const avar = makeGeneral({ name: 'Avar' });
  const mine = makeFamily({ name: 'Alderwyn', ruler: avar });
  const marven = makeGeneral({ name: 'Marven' });
  const darian = makeGeneral({ name: 'Darian' });
  const rival = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven],
  });

  const source = makeProvince({
    number: 1,
    neighbors: [22],
    family: mine,
    governor: avar,
    gold: SOURCE_GOLD,
    troops: SOURCE_TROOPS,
    food: SOURCE_FOOD,
  });
  const target = makeProvince({
    number: 22,
    name: 'Skyreach',
    neighbors: [1, 23],
    family: rival,
    governor: marven,
    gold: 80,
    troops: 200,
    food: 300,
  });
  const neighbor = makeProvince({
    number: 23,
    name: 'Rimewatch',
    neighbors: [22],
    family: rival,
  });
  const home = makeProvince({
    number: 30,
    name: 'Wintercairn',
    family: rival,
    governor: darian,
  });

  rival.homeProvince = home;

  const { world } = makeWorld([source, target, neighbor, home], mine);
  const attacker = makeArmy({ commander: avar, troops: 100, food: 120 });
  const invasion = new Invasion({ world, source, target, attacker });

  return { invasion, target, neighbor, home, rival };
}

describe('Invasion answered by its defender', () => {
  it('fights with the Fifth Unit the defender picks, not the strongest', () => {
    const { invasion, target, rival } = setupRefuges();
    const grimhides = HiredUnit.ofName('Grimhides')!;
    const ashwing = Gem.ofName('Ashwing')!;

    rival.gems = [ashwing];
    target.fifthUnits.addUnit(grimhides);
    invasion.muster();

    const battle = invasion.answer({
      answer: 'fight',
      unit: grimhides,
    }) as Battle;

    expect(invasion.defendingUnits[0]).toBe(ashwing.guardian);
    expect(battle.defender.unit).toBe(grimhides);
  });

  it('flees to the refuge the defender picks, home taking the gold too', () => {
    const { invasion, target, home } = setupRefuges();

    invasion.muster();

    const report = invasion.answer({ answer: 'retreat', refuge: home });

    expect((report as InvasionReport).refuge).toBe(home);
    expect(home.resources).toMatchObject({ troops: 200, food: 300, gold: 80 });
    expect(target.resources.gold).toBe(0);
  });

  it('leaves the gold behind when fleeing to a neighbour', () => {
    const { invasion, neighbor } = setupRefuges();

    invasion.muster();
    invasion.answer({ answer: 'retreat', refuge: neighbor });

    expect(neighbor.resources).toMatchObject({ troops: 200, gold: 0 });
  });

  it('leads the survivors of a mid-battle withdrawal to the refuge', () => {
    const { invasion, neighbor } = setupRefuges();

    invasion.begin();

    const report = invasion.conclude(
      makeOutcome({
        winner: BattleSide.attacker,
        reason: 'retreat',
        defenderSurvivors: 70,
      }),
      neighbor,
    );

    expect(report.refuge).toBe(neighbor);
    expect(neighbor.resources.troops).toBe(200);
  });
});
