import { describe, expect, it } from 'vitest';

import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { BattleOutcome } from '@/core/domain/BattleOutcome';
import { BattleSide } from '@/core/domain/BattleSide';
import { Invasion } from '@/core/domain/Invasion';
import type { InvasionReport } from '@/core/domain/InvasionReport';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { WorldEngine } from '@/core/WorldEngine';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

const SKYREACH = 22;

function setup() {
  const avar = makeGeneral({ name: 'Avar' });
  const mine = makeFamily({ name: 'Alderwyn', ruler: avar });
  const marven = makeGeneral({ name: 'Marven' });
  const rival = makeFamily({ name: 'Stormmere', ruler: marven });
  const source = makeProvince({
    number: 1,
    name: 'Alderpass',
    neighbors: [SKYREACH],
    family: mine,
    governor: avar,
    gold: 200,
    troops: 156,
    food: 300,
  });
  const target = makeProvince({
    number: SKYREACH,
    name: 'Skyreach',
    neighbors: [1],
    family: rival,
    governor: marven,
    troops: 200,
    food: 300,
  });
  const { world, events } = makeWorld([source, target], mine);
  const engine = new WorldEngine(world, events);

  engine.start();
  advanceTo(world, source);

  const attacker = new Army({ commander: avar, troops: 100, food: 120 });
  const invasion = new Invasion({ world, source, target, attacker });

  return { world, events, invasion, attacker, source, target, mine };
}

describe('WorldEngine settling a battle', () => {
  it('concludes the invasion it was holding and reopens the turn', () => {
    const { events, invasion, attacker, target, mine } = setup();
    const battle = invasion.begin() as Battle;

    expect(battle).toBeInstanceOf(Battle);

    let report: InvasionReport | undefined;
    const updated: number[] = [];
    let turnEnded = false;

    events.subscribe(BattleReportedEvent, (event) => {
      report = event.report;
    });
    events.subscribe(ProvinceUpdatedEvent, (event) => {
      updated.push(event.province.number);
    });
    events.subscribe(TurnEndedEvent, () => {
      turnEnded = true;
    });

    events.publish(new BattleStartedEvent(invasion, battle));
    events.publish(
      new BattleEndedEvent(
        new BattleOutcome({
          winner: BattleSide.attacker,
          reason: 'flag',
          days: 2,
          attackerSurvivors: attacker.troops,
          defenderSurvivors: 0,
        }),
      ),
    );

    expect(report?.isTaken).toBe(true);
    expect(target.belongsTo(mine)).toBe(true);
    expect(updated).toContain(SKYREACH);
    expect(turnEnded).toBe(true);
  });

  it('ignores an outcome when it is holding no invasion', () => {
    const { events, attacker } = setup();

    let report: InvasionReport | undefined;
    events.subscribe(BattleReportedEvent, (event) => {
      report = event.report;
    });

    events.publish(
      new BattleEndedEvent(
        new BattleOutcome({
          winner: BattleSide.attacker,
          reason: 'flag',
          days: 1,
          attackerSurvivors: attacker.troops,
          defenderSurvivors: 0,
        }),
      ),
    );

    expect(report).toBeUndefined();
  });
});
