import { afterEach, describe, expect, it, vi } from 'vitest';

import { AttackCommand } from '@/core/commands/province/AttackCommand';
import type { AttackForce } from '@/core/domain/AttackDeployment';
import { BattleOutcome } from '@/core/domain/BattleOutcome';
import { BattleSide } from '@/core/domain/BattleSide';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { InvasionReport } from '@/core/domain/InvasionReport';
import { Nerith } from '@/core/domain/Nerith';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

const SOURCE_GOLD = 100;
const SOURCE_TROOPS = 156;
const SOURCE_FOOD = 200;

interface SetupParams {
  readonly defenders?: number;
  readonly defenderFood?: number;
}

function setup(params: SetupParams = {}) {
  const avar = makeGeneral({ name: 'Avar' });
  const rhovan = makeGeneral({ name: 'Rhovan' });
  const mine = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    members: [avar, rhovan],
    gems: [Gem.ofName('Voltryn')],
  });
  const marven = makeGeneral({ name: 'Marven' });
  const rival = makeFamily({ name: 'Stormmere', ruler: marven });
  const friend = makeFamily({ name: 'Fitzroy' });

  const source = makeProvince({
    number: 1,
    name: 'Alderpass',
    neighbors: [2, 3, 4, 5],
    family: mine,
    governor: avar,
    gold: SOURCE_GOLD,
    troops: SOURCE_TROOPS,
    food: SOURCE_FOOD,
  });
  const enemy = makeProvince({
    number: 2,
    name: 'Pineward',
    neighbors: [1, 6],
    family: rival,
    governor: marven,
    troops: params.defenders ?? 60,
    food: params.defenderFood ?? 40,
  });
  const neutral = makeProvince({ number: 3, name: 'Hollow', neighbors: [1] });
  const owned = makeProvince({
    number: 4,
    name: 'Ulster',
    neighbors: [1],
    family: mine,
  });
  const allied = makeProvince({
    number: 5,
    name: 'Anjou',
    neighbors: [1],
    family: friend,
  });
  const refuge = makeProvince({
    number: 6,
    name: 'Rimewatch',
    neighbors: [2],
    family: rival,
    troops: 50,
  });
  const distant = makeProvince({
    number: 7,
    name: 'Mauseio',
    neighbors: [],
    family: rival,
  });

  mine.ally = friend;
  friend.ally = mine;
  mine.moveHome(source);
  rival.moveHome(enemy);

  const { world, events } = makeWorld(
    [source, enemy, neutral, owned, allied, refuge, distant],
    mine,
  );
  const command = new AttackCommand({ world, events });

  advanceTo(world, source);

  let report: InvasionReport | undefined;
  let started: BattleStartedEvent | undefined;

  events.subscribe(BattleReportedEvent, (event) => {
    report = event.report;
  });
  events.subscribe(BattleStartedEvent, (event) => {
    started = event;
  });

  const attack = (order: Partial<AttackForce> = {}) => {
    const force: AttackForce = {
      troops: SOURCE_TROOPS,
      days: 3,
      ...order,
    };

    command.attackAt(enemy, force);
    command.execute();
  };

  const finish = (winner: BattleSide) => {
    const battle = started;

    if (!battle) {
      throw new Error('no battle was begun');
    }

    const outcome = new BattleOutcome({
      winner,
      reason: 'flag',
      days: 1,
      attackerSurvivors: battle.battle.attacker.troops,
      defenderSurvivors: battle.battle.defender.troops,
    });

    report = battle.invasion.conclude(outcome);
  };

  return {
    avar,
    rhovan,
    marven,
    mine,
    rival,
    world,
    source,
    enemy,
    owned,
    refuge,
    command,
    attack,
    finish,
    started: () => started,
    report: () => report,
  };
}

describe('AttackCommand', () => {
  afterEach(() => vi.restoreAllMocks());

  it('requires soldiers alongside a Fifth Unit and checks that the unit is still available', () => {
    const { source, attack, started } = setup();
    const nerith = new Nerith();
    source.fifthUnits.addUnit(nerith);
    attack({ troops: 0, unit: nerith });
    expect(started()).toBeUndefined();

    source.fifthUnits.removeUnit(nerith);
    attack({ troops: 100, unit: nerith });
    expect(started()).toBeUndefined();

    source.fifthUnits.addUnit(nerith);
    attack({ troops: 100, unit: nerith });
    expect(started()?.battle.attacker.unit).toBe(nerith);
  });

  it('offers adjacent provinces held by another house only', () => {
    const { command } = setup();

    expect([...command.selectableTargets]).toEqual([2]);
  });

  it('spends the troops, the food, the deployment gold, and the turn', () => {
    const { source, attack } = setup();

    attack({ troops: 156, days: 8 });

    expect(source.resources.gold).toBe(SOURCE_GOLD - 29);
    expect(source.resources.troops).toBe(0);
    expect(source.resources.food).toBe(SOURCE_FOOD - 128);
    expect(source.goodwill).toBe(-1);
    expect(source.actionCount).toBe(1);
  });

  it('refuses an unsupported duration or an army it cannot pay for, man, or feed', () => {
    const cases = [
      { troops: 156, days: 3, food: SOURCE_FOOD, gold: 10 },
      { troops: 0, days: 3, food: SOURCE_FOOD, gold: SOURCE_GOLD },
      { troops: 156, days: 3, food: 47, gold: SOURCE_GOLD },
      { troops: 156, days: 4, food: SOURCE_FOOD, gold: SOURCE_GOLD },
    ];

    for (const { troops, days, food, gold } of cases) {
      const { source, enemy, attack } = setup();
      source.addResources({
        gold: gold - SOURCE_GOLD,
        food: food - SOURCE_FOOD,
      });

      attack({ troops, days });

      expect(source.resources.troops).toBe(SOURCE_TROOPS);
      expect(source.resources.food).toBe(food);
      expect(source.goodwill).toBe(0);
      expect(enemy.belongsTo(source.family!)).toBe(false);
    }
  });

  it('hands the province to the winner, garrisoned under its commander', () => {
    const { avar, rhovan, mine, source, owned, enemy, attack, finish, report } =
      setup();

    mine.moveHome(owned);
    source.assignGovernor(rhovan);
    attack();
    expect(source.governor).toBeUndefined();
    finish(BattleSide.attacker);

    const outcome = report()!.outcome!;

    expect(outcome.isWonBy(BattleSide.attacker)).toBe(true);
    expect(enemy.belongsTo(mine)).toBe(true);
    expect(enemy.ruledBy(rhovan)).toBe(true);
    expect(enemy.resources.troops).toBe(outcome.attackerSurvivors);
    expect(source.ruledBy(avar)).toBe(true);
  });

  it('moves the ruler and court to the conquered province, leaving the origin under remote rule', () => {
    const { avar, rhovan, mine, world, source, enemy, attack, finish } =
      setup();

    attack();
    expect(source.residentGovernor).toBeUndefined();
    finish(BattleSide.attacker);

    expect(enemy.residentGovernor).toBe(avar);
    expect(mine.homeProvince).toBe(enemy);
    expect(world.getResidence(mine, rhovan)).toBe(enemy);
    expect(source.isRemotelyRuled).toBe(true);
  });

  it('keeps a captured attacking lord out of his former province', () => {
    const { avar, rhovan, mine, owned, source, attack, finish, report } =
      setup();
    mine.moveHome(owned);
    source.assignGovernor(rhovan);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    attack();
    finish(BattleSide.defender);

    expect(report()?.captive?.general).toBe(rhovan);
    expect(source.governor).toBe(avar);
    expect(source.isRemotelyRuled).toBe(true);
  });

  it('uses half the ruler’s War for an attack from an unstaffed province', () => {
    const { mine, avar, source, owned, enemy, attack, finish, started } =
      setup();
    mine.moveHome(owned);
    source.assignGovernor(undefined);

    attack();
    expect(started()?.battle.attacker.commander).toBe(avar);
    expect(started()?.battle.attacker.commanderWar).toBe(25);
    finish(BattleSide.attacker);

    expect(enemy.ruledBy(avar)).toBe(true);
    expect(enemy.isRemotelyRuled).toBe(true);
  });

  it('sends a beaten army home and leaves the province where it was', () => {
    const { rival, marven, source, enemy, attack, finish, report } = setup({
      defenders: 400,
      defenderFood: 400,
    });

    attack({ troops: 20 });
    finish(BattleSide.defender);

    const outcome = report()!.outcome!;

    expect(outcome.isWonBy(BattleSide.defender)).toBe(true);
    expect(enemy.belongsTo(rival)).toBe(true);
    expect(enemy.ruledBy(marven)).toBe(true);
    expect(enemy.resources.troops).toBe(outcome.defenderSurvivors);
    expect(source.resources.troops).toBe(SOURCE_TROOPS - 20 + 10);
    expect(source.goodwill).toBe(-1);
  });

  it('takes an abandoned province and moves the escaping defender to his refuge', () => {
    const { mine, marven, rival, enemy, refuge, attack, report } = setup({
      defenders: 0,
      defenderFood: 0,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    attack();

    expect(report()!.answer).toBe('retreat');
    expect(report()!.outcome).toBeUndefined();
    expect(refuge.ruledBy(marven)).toBe(true);
    expect(rival.homeProvince).toBe(refuge);
    expect(enemy.belongsTo(mine)).toBe(true);
    expect(enemy.resources.troops).toBe(156);
  });

  it('stations a marching hired unit in the province it took', () => {
    const { source, enemy, attack, finish } = setup();
    source.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);

    attack({ unit: source.fifthUnits.hiredUnits[0] });
    finish(BattleSide.attacker);

    expect(enemy.fifthUnits.hiredUnits.map((unit) => unit.name)).toEqual([
      'Grimhides',
    ]);
    expect(source.fifthUnits.hiredUnits).toHaveLength(0);
  });

  it('leaves a summoned guardian stationed nowhere', () => {
    const { mine, enemy, attack, finish } = setup();

    attack({ unit: mine.guardians[0] });
    finish(BattleSide.attacker);

    expect(enemy.fifthUnits.hiredUnits).toHaveLength(0);
    expect(mine.guardians.map((guardian) => guardian.name)).toEqual([
      'Voltryn',
    ]);
  });
});
