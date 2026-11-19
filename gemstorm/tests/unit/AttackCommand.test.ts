import { describe, expect, it } from 'vitest';

import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { Army, type ArmyParams } from '@/core/domain/Army';
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

  const attack = (order: Partial<ArmyParams>) => {
    const params: ArmyParams = {
      commander: order.commander ?? avar,
      troops: order.troops ?? 156,
      food: order.food ?? 120,
      unit: order.unit,
    };

    command.attackAt(enemy, new Army(params));
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
  it('can attack with Nerith alone, but cannot summon a visit that has already departed', () => {
    const { source, attack, started } = setup();
    const nerith = new Nerith();
    source.addUnit(nerith);
    source.removeUnit(nerith);
    attack({ troops: 0, unit: nerith });
    expect(started()).toBeUndefined();
    source.addUnit(nerith);
    attack({ troops: 0, unit: nerith });
    expect(started()?.battle.attacker.unit).toBe(nerith);
    expect(started()?.battle.getUnits(BattleSide.attacker)).toHaveLength(1);
  });

  it('offers adjacent provinces held by another house only', () => {
    const { command } = setup();

    expect([...command.selectableTargets]).toEqual([2]);
  });

  it('spends the troops, the food, the deployment gold, and the turn', () => {
    const { source, attack } = setup();

    attack({ troops: 156, food: 120 });

    expect(source.resources.gold).toBe(SOURCE_GOLD - 29);
    expect(source.goodwill).toBe(-1);
    expect(source.actionCount).toBe(1);
  });

  it('refuses an army it cannot pay for, man, or feed for a day', () => {
    const cases = [
      { troops: 156, food: 120, gold: 10 },
      { troops: 0, food: 120, gold: SOURCE_GOLD },
      { troops: 156, food: 10, gold: SOURCE_GOLD },
    ];

    for (const { troops, food, gold } of cases) {
      const { source, enemy, attack } = setup();
      source.addResources({ gold: gold - SOURCE_GOLD });

      attack({ troops, food });

      expect(source.resources.troops).toBe(SOURCE_TROOPS);
      expect(source.resources.food).toBe(SOURCE_FOOD);
      expect(source.goodwill).toBe(0);
      expect(enemy.belongsTo(source.family!)).toBe(false);
    }
  });

  it('hands the province to the winner, garrisoned under its commander', () => {
    const { avar, rhovan, mine, source, enemy, attack, finish, report } =
      setup();

    attack({ commander: rhovan });
    finish(BattleSide.attacker);

    const outcome = report()!.outcome!;

    expect(outcome.isWonBy(BattleSide.attacker)).toBe(true);
    expect(enemy.belongsTo(mine)).toBe(true);
    expect(enemy.ruledBy(rhovan)).toBe(true);
    expect(enemy.resources.troops).toBe(outcome.attackerSurvivors);
    expect(source.ruledBy(avar)).toBe(true);
  });

  it('rules a province taken by the ruler himself at a distance', () => {
    const { avar, enemy, attack, finish } = setup();

    attack({ commander: avar });
    finish(BattleSide.attacker);

    expect(enemy.ruledBy(avar)).toBe(true);
    expect(enemy.isRemotelyRuled).toBe(true);
  });

  it('sends a beaten army home and leaves the province where it was', () => {
    const { rival, marven, source, enemy, attack, finish, report } = setup({
      defenders: 400,
      defenderFood: 400,
    });

    attack({ troops: 20, food: 120 });
    finish(BattleSide.defender);

    const outcome = report()!.outcome!;

    expect(outcome.isWonBy(BattleSide.defender)).toBe(true);
    expect(enemy.belongsTo(rival)).toBe(true);
    expect(enemy.ruledBy(marven)).toBe(true);
    expect(enemy.resources.troops).toBe(outcome.defenderSurvivors);
    expect(source.resources.troops).toBe(
      SOURCE_TROOPS - 20 + outcome.attackerSurvivors,
    );
    expect(source.goodwill).toBe(-1);
  });

  it('takes an abandoned province and moves the lord to his refuge', () => {
    const { mine, marven, enemy, refuge, attack, report } = setup({
      defenders: 0,
      defenderFood: 0,
    });

    attack({ troops: 156, food: 120 });

    expect(report()!.answer).toBe('retreat');
    expect(report()!.outcome).toBeUndefined();
    expect(refuge.ruledBy(marven)).toBe(true);
    expect(enemy.belongsTo(mine)).toBe(true);
    expect(enemy.resources.troops).toBe(156);
  });

  it('stations a marching hired unit in the province it took', () => {
    const { source, enemy, attack, finish } = setup();
    source.addUnit(HiredUnit.ofName('Grimhides')!);

    attack({ unit: source.hiredUnits[0] });
    finish(BattleSide.attacker);

    expect(enemy.hiredUnits.map((unit) => unit.name)).toEqual(['Grimhides']);
    expect(source.hiredUnits).toHaveLength(0);
  });

  it('leaves a summoned guardian stationed nowhere', () => {
    const { mine, enemy, attack, finish } = setup();

    attack({ unit: mine.guardians[0] });
    finish(BattleSide.attacker);

    expect(enemy.hiredUnits).toHaveLength(0);
    expect(mine.guardians.map((guardian) => guardian.name)).toEqual([
      'Voltryn',
    ]);
  });
});
