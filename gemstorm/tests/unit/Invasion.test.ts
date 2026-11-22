import { afterEach, describe, expect, it, vi } from 'vitest';

import { Battle } from '@/core/domain/Battle';
import { BattleOutcome } from '@/core/domain/BattleOutcome';
import { BattleSide } from '@/core/domain/BattleSide';
import { CalendarDate } from '@/core/domain/CalendarDate';
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

afterEach(() => vi.restoreAllMocks());

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
  it('keeps Entrust at a lord’s origin when he departs and takes new land', () => {
    const { world, mine, source, target } = setup();
    const lord = makeGeneral();
    mine.enlist(lord);
    source.assignGovernor(lord);
    source.entrust();
    const attacker = makeArmy({ commander: lord, troops: 100, food: 120 });
    const invasion = new Invasion({ world, source, target, attacker });

    invasion.begin();
    expect(source.governor).toBeUndefined();
    expect(source.isEntrusted).toBe(true);
    invasion.conclude(makeOutcome());

    expect(target.governor).toBe(lord);
    expect(source.isRemotelyRuled).toBe(true);
    expect(source.isEntrusted).toBe(true);
  });

  it.each([
    [BattleSide.attacker, 23, 17],
    [BattleSide.defender, 19, 21],
  ])(
    'applies victory and defeat Fame changes when %s wins',
    (winner, attackingFame, defendingFame) => {
      const { invasion, mine, rival } = setup();
      mine.loseFame(80);
      rival.loseFame(80);

      invasion.begin();
      invasion.conclude(makeOutcome({ winner }));

      expect(mine.fame).toBe(attackingFame);
      expect(rival.fame).toBe(defendingFame);
    },
  );

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

  it('destroys supplies and resets loyalty when the defender has no adjacent refuge', () => {
    const { invasion, target, mine } = setup({
      defenderGold: 90,
      defenderFood: 100,
    });
    target.addDevelopment({ loyalty: 80, cultivation: 90, protection: 45 });
    vi.spyOn(Math, 'random')
      .mockReturnValue(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    invasion.begin();
    invasion.conclude(makeOutcome({ winner: BattleSide.attacker }));

    expect(target.belongsTo(mine)).toBe(true);
    expect(target.resources).toMatchObject({ gold: 63, food: 149, troops: 60 });
    expect(target.development).toMatchObject({
      loyalty: 0,
      cultivation: 81,
      protection: 40,
    });
  });

  it('takes the beaten attacker’s remaining food and damages the defending province', () => {
    const { invasion, target, source } = setup();
    target.addDevelopment({ loyalty: 90, cultivation: 90, protection: 45 });
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    invasion.begin();
    invasion.defender.food = 95;
    invasion.attacker.food = 31;
    const report = invasion.conclude(
      makeOutcome({
        winner: BattleSide.defender,
        days: 3,
        defenderSurvivors: 80,
      }),
    );

    expect(target.resources).toMatchObject({ food: 126, troops: 80 });
    expect(target.development).toMatchObject({
      loyalty: 74,
      cultivation: 76,
      protection: 37,
    });
    expect(source.resources.troops).toBe(SOURCE_TROOPS - 100 + 30);
    expect(source.resources.food).toBe(SOURCE_FOOD - 120);
    expect(report.recoveredTroops).toBe(30);
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

  it('takes WAR from the commander whose Fifth Unit was destroyed', () => {
    const { invasion, target, rival } = setup();
    const lancers = HiredUnit.ofName('Lancers')!;
    const marven = target.governor!;
    const warBefore = marven.stats.war;
    const fameBefore = rival.fame;

    target.fifthUnits.addUnit(lancers);
    invasion.muster();
    invasion.answer({ answer: 'fight', unit: lancers });
    invasion.conclude(
      makeOutcome({
        winner: BattleSide.attacker,
        lostUnits: [BattleSide.defender],
      }),
    );

    expect(marven.stats.war).toBe(warBefore - 3);
    expect(rival.fame).toBe(fameBefore - 1 - 3);
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

  it('rests a withdrawn Guardian three months and takes no Fame or WAR for it', () => {
    const { invasion, rival, target, attacker, world } = setup();
    const gem = Gem.ofName('Asterion');
    const marven = target.governor!;
    const warBefore = marven.stats.war;
    const fameBefore = rival.fame;

    rival.gems = [gem];
    world.date = new CalendarDate(1186, 11);

    invasion.begin();
    invasion.conclude(
      new BattleOutcome({
        winner: BattleSide.attacker,
        reason: 'rout',
        days: 2,
        attackerSurvivors: attacker.troops,
        defenderSurvivors: 0,
        lostUnits: [],
      }),
    );

    expect(gem.isReadyOn(new CalendarDate(1187, 1))).toBe(false);
    expect(gem.isReadyOn(new CalendarDate(1187, 2))).toBe(true);
    expect(marven.stats.war).toBe(warBefore);
    expect(rival.fame).toBe(fameBefore - 3);
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

function setupRefuges(adjacentHome = false) {
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
    neighbors: adjacentHome ? [1, 23, 30] : [1, 23],
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

  return { invasion, target, neighbor, home, rival, world };
}

describe('Invasion answered by its defender', () => {
  it('awards three Fame when an uncaptured defender retreats into unowned land', () => {
    const { invasion, target, neighbor, rival } = setupRefuges();
    const lord = target.governor;
    neighbor.unclaim();
    rival.loseFame(90);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    invasion.muster();
    invasion.answer({ answer: 'retreat', refuge: neighbor });

    expect(neighbor.family).toBe(rival);
    expect(neighbor.governor).toBe(lord);
    expect(rival.fame).toBe(13);
    expect(invasion.affected).toContain(neighbor);
  });

  it('sends retreating leadership to its chosen refuge and returns recovered troops to the origin', () => {
    const { invasion, neighbor, target } = setupRefuges();
    const { source } = invasion;
    const attacker = source.family!;
    neighbor.unclaim();
    attacker.moveHome(source);
    attacker.loseFame(90);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    invasion.begin();
    invasion.conclude(
      makeOutcome({ winner: BattleSide.defender, reason: 'retreat' }),
      neighbor,
    );

    expect(neighbor.family).toBe(attacker);
    expect(attacker.homeProvince).toBe(neighbor);
    expect(attacker.fame).toBe(12);
    expect(neighbor.resources.troops).toBe(0);
    expect(source.resources.troops).toBe(SOURCE_TROOPS - 100 + 30);
    expect(target.resources.food).toBe(388);
    expect(invasion.affected).toContain(neighbor);
  });

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

  it('flees to the chosen distant capital and abandons soldiers and supplies', () => {
    const { invasion, target, home } = setupRefuges();

    invasion.muster();

    const report = invasion.answer({ answer: 'retreat', refuge: home });

    expect((report as InvasionReport).refuge).toBe(home);
    expect(home.resources).toMatchObject({ troops: 0, food: 0, gold: 0 });
    expect(target.resources).toMatchObject({ troops: 100, gold: 80 });
  });

  it('gives a defender nowhere to retreat when every way out is taken', () => {
    const { invasion, neighbor, home } = setupRefuges();
    neighbor.claim(invasion.source.family!);
    home.claim(invasion.source.family!);

    expect(invasion.getRetreatProvinces(BattleSide.defender)).toEqual([]);
    expect(invasion.getRetreatProvinces(BattleSide.attacker)).toContain(
      invasion.source,
    );
  });

  it('takes the first answer it may still give when the chosen one is no longer allowed', () => {
    const { invasion } = setupRefuges();

    invasion.muster();

    expect(invasion.answer({ answer: 'surrender' })).toBeInstanceOf(Battle);
  });

  it('lets a computer defender leave its Guardian out against a small army', () => {
    const { world, target, rival } = setupRefuges();
    rival.gems = [Gem.ofName('Ashwing')];
    const invasion = new Invasion({
      world,
      source: world.map.getProvince(1),
      target,
      attacker: makeArmy({ troops: 19 }),
    });

    const started = invasion.begin();

    expect((started as Battle).defender.unit).toBeUndefined();
    expect(rival.getReadyGuardians(world.date)).toHaveLength(1);
  });

  it('sends a computer defender to the strongest own neighbour', () => {
    const { world, target, neighbor, home } = setupRefuges();
    target.reduceResources({ troops: 150 });
    neighbor.addResources({ troops: 40 });
    home.addResources({ troops: 900 });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const invasion = new Invasion({
      world,
      source: world.map.getProvince(1),
      target,
      attacker: makeArmy({ troops: 250 }),
    });

    const report = invasion.begin() as InvasionReport;

    expect(report.answer).toBe('retreat');
    expect(report.refuge).toBe(neighbor);
  });

  it('leaves the gold behind when fleeing to a neighbour', () => {
    const { invasion, neighbor } = setupRefuges();

    invasion.muster();
    invasion.answer({ answer: 'retreat', refuge: neighbor });

    expect(neighbor.resources).toMatchObject({ troops: 200, gold: 0 });
  });

  it('credits each rescued resource to the adjacent refuge after a mid-battle withdrawal', () => {
    const { invasion, target, neighbor } = setupRefuges();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    invasion.begin();
    invasion.defender.takeCasualties(130);
    invasion.defender.food = 210;

    const report = invasion.conclude(
      makeOutcome({
        winner: BattleSide.attacker,
        reason: 'retreat',
        defenderSurvivors: 70,
      }),
      neighbor,
    );

    expect(report.refuge).toBe(neighbor);
    expect(report.recoveredTroops).toBe(35);
    expect(neighbor.resources).toMatchObject({
      gold: 40,
      food: 105,
      troops: 35,
    });
    expect(target.resources).toMatchObject({ gold: 40, food: 214, troops: 60 });
  });

  it('recovers less when the ruler commanded the defeated army remotely', () => {
    const { invasion, target, neighbor, rival } = setupRefuges();
    target.assignGovernor(rival.ruler);

    invasion.begin();
    const report = invasion.conclude(makeOutcome({ defenderSurvivors: 75 }));

    expect(report.recoveredTroops).toBe(15);
    expect(neighbor.resources).toMatchObject({
      gold: 16,
      food: 55,
      troops: 15,
    });
    expect(invasion.affected).toContain(neighbor);
  });

  it.each([
    [0, 'neighbor'],
    [0.99, 'home'],
  ] as const)(
    'uses the random neighboring refuge on a defeat (%s)',
    (refugeRoll, choice) => {
      const { invasion, target, neighbor, home, rival, world } =
        setupRefuges(true);
      const lord = target.governor!;
      neighbor.assignGovernor(rival.ruler);
      vi.spyOn(Math, 'random')
        .mockReturnValue(0.99)
        .mockReturnValueOnce(refugeRoll);

      invasion.begin();
      const report = invasion.conclude(makeOutcome());
      const refuge = choice === 'home' ? home : neighbor;

      expect(report.refuge).toBe(refuge);
      expect(report.captive).toBeUndefined();
      expect(world.getResidence(rival, lord)).toBe(refuge);
      expect(refuge.governor).toBe(choice === 'home' ? rival.ruler : lord);
    },
  );

  it('falls back to the distant capital when none of the neighbors can receive the lord', () => {
    const { invasion, target, neighbor, home, rival, world } = setupRefuges();
    const lord = target.governor!;
    neighbor.claim(invasion.source.family!);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    invasion.begin();
    const report = invasion.conclude(makeOutcome({ defenderSurvivors: 80 }));

    expect(report.refuge).toBe(home);
    expect(home.governor).toBe(rival.ruler);
    expect(home.resources).toMatchObject({ gold: 0, food: 0, troops: 0 });
    expect(world.getVassals(rival)).toContain(lord);
  });

  it('keeps a remote defender at court when the army is defeated', () => {
    const { invasion, target, neighbor, home, rival } = setupRefuges();
    target.assignGovernor(rival.ruler);
    neighbor.unclaim();

    invasion.begin();
    const report = invasion.conclude(makeOutcome());

    expect(report.defender.remotelyCommanded).toBe(true);
    expect(report.captive).toBeUndefined();
    expect(rival.homeProvince).toBe(home);
    expect(neighbor.isNeutral()).toBe(true);
  });

  it('moves an escaping ruler’s court into the refuge and clears its Entrust setting', () => {
    const { invasion, target, neighbor, rival, world } = setupRefuges();
    const lord = target.governor!;
    rival.moveHome(target);
    neighbor.assignGovernor(lord);
    neighbor.entrust();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    invasion.begin();
    const report = invasion.conclude(makeOutcome());

    expect(report.refuge).toBe(neighbor);
    expect(rival.homeProvince).toBe(neighbor);
    expect(neighbor.governor).toBe(rival.ruler);
    expect(neighbor.isEntrusted).toBe(false);
    expect(world.getVassals(rival)).toContain(lord);
  });
});

describe('Invasion settling Fifth Units', () => {
  function hire(name: string): HiredUnit {
    return HiredUnit.ofName(name)!;
  }

  function attackWith(unit: HiredUnit) {
    const fixture = setupRefuges();
    const source = fixture.world.map.getProvince(1);
    source.fifthUnits.addUnit(unit);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const invasion = new Invasion({
      world: fixture.world,
      source,
      target: fixture.target,
      attacker: makeArmy({ commander: source.governor!, unit }),
    });

    return { ...fixture, source, invasion };
  }

  function defendWith(unit: HiredUnit) {
    const fixture = setupRefuges();
    fixture.target.fifthUnits.addUnit(unit);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    fixture.invasion.muster();
    fixture.invasion.answer({ answer: 'fight', unit });

    return fixture;
  }

  it('sends the defender’s surviving hire with its owner to the refuge', () => {
    const grimhides = hire('Grimhides');
    const { invasion, target, neighbor } = defendWith(grimhides);

    invasion.conclude(makeOutcome({ winner: BattleSide.attacker }));

    expect(neighbor.fifthUnits.units).toEqual([grimhides]);
    expect(target.fifthUnits.units).toEqual([]);
    expect(target.fifthUnits.hirePool).toEqual([]);
  });

  it('leaves the defender’s surviving hire for hire on the field when the refuge is full', () => {
    const grimhides = hire('Grimhides');
    const { invasion, target, neighbor } = defendWith(grimhides);
    const garrison = [hire('Ogre'), hire('Bugbear'), hire('Fachan')];
    for (const unit of garrison) {
      neighbor.fifthUnits.addUnit(unit);
    }

    invasion.conclude(makeOutcome({ winner: BattleSide.attacker }));

    expect(neighbor.fifthUnits.units).toEqual(garrison);
    expect(target.fifthUnits.hirePool).toEqual([grimhides]);
  });

  it('puts every other hire left in the captured province up for hire', () => {
    const grimhides = hire('Grimhides');
    const reserve = hire('Ogre');
    const nerith = new Nerith();
    const { invasion, target } = defendWith(grimhides);
    target.fifthUnits.addUnit(reserve);
    target.fifthUnits.addUnit(nerith);

    invasion.conclude(makeOutcome({ winner: BattleSide.attacker }));

    expect(target.fifthUnits.units).toEqual([]);
    expect(target.fifthUnits.hirePool).toEqual([reserve]);
  });

  it('puts the hires up for hire when the defender gives up without a fight', () => {
    const { invasion, target } = setupRefuges();
    const reserve = hire('Ogre');
    target.fifthUnits.addUnit(reserve);

    invasion.muster();
    invasion.answer({ answer: 'retreat' });

    expect(target.fifthUnits.units).toEqual([]);
    expect(target.fifthUnits.hirePool).toEqual([reserve]);
  });

  it('keeps the attacker’s surviving hire at home when the captured province has no slot', () => {
    const lancers = hire('Lancers');
    const { invasion, source, target } = attackWith(lancers);
    const offers = ['Ogre', 'Bugbear', 'Fachan', 'Gunners', 'Spearmen'];
    for (const name of offers) {
      target.fifthUnits.addHireOffer(hire(name));
    }

    invasion.begin();
    invasion.conclude(makeOutcome({ winner: BattleSide.attacker }));

    expect(source.fifthUnits.units).toEqual([lancers]);
    expect(target.fifthUnits.units).toEqual([]);
  });

  it('brings the attacker’s surviving hire back to its origin after a retreat elsewhere', () => {
    const lancers = hire('Lancers');
    const { invasion, source, neighbor } = attackWith(lancers);
    neighbor.unclaim();

    invasion.begin();
    invasion.conclude(
      makeOutcome({ winner: BattleSide.defender, reason: 'retreat' }),
      neighbor,
    );

    expect(neighbor.belongsTo(source.family!)).toBe(true);
    expect(neighbor.fifthUnits.units).toEqual([]);
    expect(source.fifthUnits.units).toEqual([lancers]);
  });
});
