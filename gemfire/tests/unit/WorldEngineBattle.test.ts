import { describe, expect, it } from 'vitest';

import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { BattleOutcome } from '@/core/domain/BattleOutcome';
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

const LONDRE = 22;

function setup() {
  const erin = makeGeneral({ name: 'Erin' });
  const mine = makeFamily({ name: 'Blanche', ruler: erin });
  const seth = makeGeneral({ name: 'Seth' });
  const rival = makeFamily({ name: 'Lyle', ruler: seth });
  const source = makeProvince({
    number: 1,
    name: 'Rodale',
    neighbors: [LONDRE],
    family: mine,
    governor: erin,
    gold: 200,
    troops: 156,
    food: 300,
  });
  const target = makeProvince({
    number: LONDRE,
    name: 'Londre',
    neighbors: [1],
    family: rival,
    governor: seth,
    troops: 200,
    food: 300,
  });
  const { world, events } = makeWorld([source, target], mine);
  const engine = new WorldEngine(world, events);

  engine.start();
  advanceTo(world, source);

  const attacker = new Army({ commander: erin, troops: 100, food: 120 });
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
          winner: 'attacker',
          reason: 'flag',
          days: 2,
          attackerSurvivors: attacker.troops,
          defenderSurvivors: 0,
        }),
      ),
    );

    expect(report?.isTaken).toBe(true);
    expect(target.belongsTo(mine)).toBe(true);
    expect(updated).toContain(LONDRE);
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
          winner: 'attacker',
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
