import { describe, expect, it } from 'vitest';

import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { Army, type ArmyParams } from '@/core/domain/Army';
import { BattleOutcome, type BattleSide } from '@/core/domain/BattleOutcome';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { InvasionReport } from '@/core/domain/InvasionReport';
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
  const erin = makeGeneral({ name: 'Erin' });
  const pender = makeGeneral({ name: 'Pender' });
  const mine = makeFamily({
    name: 'Blanche',
    ruler: erin,
    members: [erin, pender],
    gems: [Gem.ofName('Zendor')],
  });
  const seth = makeGeneral({ name: 'Seth' });
  const rival = makeFamily({ name: 'Lyle', ruler: seth });
  const friend = makeFamily({ name: 'Fitzroy' });

  const source = makeProvince({
    number: 1,
    name: 'Rodale',
    neighbors: [2, 3, 4, 5],
    family: mine,
    governor: erin,
    gold: SOURCE_GOLD,
    troops: SOURCE_TROOPS,
    food: SOURCE_FOOD,
  });
  const enemy = makeProvince({
    number: 2,
    name: 'Hyland',
    neighbors: [1, 6],
    family: rival,
    governor: seth,
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
    name: 'Carveti',
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
      commander: order.commander ?? erin,
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
    erin,
    pender,
    seth,
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
    const { erin, pender, mine, source, enemy, attack, finish, report } =
      setup();

    attack({ commander: pender });
    finish('attacker');

    const outcome = report()!.outcome!;

    expect(outcome.isWonBy('attacker')).toBe(true);
    expect(enemy.belongsTo(mine)).toBe(true);
    expect(enemy.ruledBy(pender)).toBe(true);
    expect(enemy.resources.troops).toBe(outcome.attackerSurvivors);
    expect(source.ruledBy(erin)).toBe(true);
  });

  it('rules a province taken by the ruler himself at a distance', () => {
    const { erin, enemy, attack, finish } = setup();

    attack({ commander: erin });
    finish('attacker');

    expect(enemy.ruledBy(erin)).toBe(true);
    expect(enemy.isRemotelyRuled).toBe(true);
  });

  it('sends a beaten army home and leaves the province where it was', () => {
    const { rival, seth, source, enemy, attack, finish, report } = setup({
      defenders: 400,
      defenderFood: 400,
    });

    attack({ troops: 20, food: 120 });
    finish('defender');

    const outcome = report()!.outcome!;

    expect(outcome.isWonBy('defender')).toBe(true);
    expect(enemy.belongsTo(rival)).toBe(true);
    expect(enemy.ruledBy(seth)).toBe(true);
    expect(enemy.resources.troops).toBe(outcome.defenderSurvivors);
    expect(source.resources.troops).toBe(
      SOURCE_TROOPS - 20 + outcome.attackerSurvivors,
    );
    expect(source.goodwill).toBe(-1);
  });

  it('takes an abandoned province and moves the lord to his refuge', () => {
    const { mine, seth, enemy, refuge, attack, report } = setup({
      defenders: 0,
      defenderFood: 0,
    });

    attack({ troops: 156, food: 120 });

    expect(report()!.answer).toBe('retreat');
    expect(report()!.outcome).toBeUndefined();
    expect(refuge.ruledBy(seth)).toBe(true);
    expect(enemy.belongsTo(mine)).toBe(true);
    expect(enemy.resources.troops).toBe(156);
  });

  it('stations a marching hired unit in the province it took', () => {
    const { source, enemy, attack, finish } = setup();
    source.addUnit(HiredUnit.ofName('Orks')!);

    attack({ unit: source.hiredUnits[0] });
    finish('attacker');

    expect(enemy.hiredUnits.map((unit) => unit.name)).toEqual(['Orks']);
    expect(source.hiredUnits).toHaveLength(0);
  });

  it('leaves a summoned guardian stationed nowhere', () => {
    const { mine, enemy, attack, finish } = setup();

    attack({ unit: mine.guardians[0] });
    finish('attacker');

    expect(enemy.hiredUnits).toHaveLength(0);
    expect(mine.guardians.map((guardian) => guardian.name)).toEqual(['Zendor']);
  });
});
