import { afterEach, describe, expect, it, vi } from 'vitest';

import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { InvasionReport } from '@/core/domain/InvasionReport';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { IncidentReportedEvent } from '@/core/events/IncidentReportedEvent';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';
import { TurnHold } from '@/core/TurnHold';
import { WorldEngine } from '@/core/WorldEngine';
import { EventBus } from '@/lib/EventBus';

import {
  makeArmy,
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

interface Fixture {
  readonly world: ReturnType<typeof makeWorld>['world'];
  readonly events: EventBus;
  readonly engine: WorldEngine;
}

function createFixture(date: CalendarDate): Fixture {
  const alderwyn = makeFamily({ name: 'Alderwyn' });
  const varrengard = makeFamily({ name: 'Varrengard' });

  const provinces = [
    makeProvince({
      number: 1,
      name: 'Alderpass',
      neighbors: [2],
      family: alderwyn,
      gold: 500,
      food: 400,
      troops: 100,
      loyalty: 10,
      cultivation: 20,
      protection: 30,
    }),
    makeProvince({
      number: 2,
      name: 'Ulster',
      neighbors: [1],
      family: alderwyn,
    }),
    makeProvince({
      number: 3,
      name: 'Hertzog',
      family: varrengard,
      loyalty: 5,
      cultivation: 5,
      protection: 5,
    }),
    makeProvince({ number: 4, name: 'Mauseio' }),
  ];

  const { world, events } = makeWorld(provinces, alderwyn, date);
  const engine = new WorldEngine(world, events);

  engine.start();

  return { world, events, engine };
}

function drainMonth(fixture: Fixture): void {
  const monthStart = fixture.world.date;

  while (fixture.world.date.equals(monthStart)) {
    fixture.events.publish(
      new TurnEndedEvent(fixture.world.turnQueue.turnNumber),
    );
  }
}

const MAY = 5;

describe('WorldEngine', () => {
  afterEach(() => vi.restoreAllMocks());

  it('gives no turn to an unowned province', () => {
    const fixture = createFixture(new CalendarDate(1186, 4));
    const started: number[] = [];

    fixture.events.subscribe(TurnStartedEvent, (event) =>
      started.push(event.province.number),
    );
    drainMonth(fixture);
    drainMonth(fixture);

    expect(started).not.toContain(4);
    expect(started).toContain(3);
  });

  it('gives a province claimed before its slot one turn for its new owner', () => {
    const fixture = createFixture(new CalendarDate(1186, 4));
    const { world, events } = fixture;
    const mauseio = world.map.getProvince(4);
    const hertzog = world.map.getProvince(3);
    const claimant = hertzog.family!;
    const turns: { month: number; province: number }[] = [];

    events.subscribe(TurnStartedEvent, (event) =>
      turns.push({ month: world.date.month, province: event.province.number }),
    );
    mauseio.claim(claimant);
    drainMonth(fixture);
    drainMonth(fixture);

    const mayTurns = turns.filter(
      (turn) => turn.month === MAY && turn.province === mauseio.number,
    );

    expect(mayTurns).toHaveLength(1);
  });

  it('gets an AI ransom demand ready for the player when the battle is reported', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const { player } = world;
    const home = world.map.getProvince(1);
    const battlefield = world.map.getProvince(3);
    const captor = battlefield.family!;
    const general = makeGeneral();
    const captive = makeCaptive({
      general,
      house: player,
      captor,
      battlefield,
      pendingRansom: true,
    });
    const report = new InvasionReport({
      source: home,
      target: battlefield,
      defending: captor,
      attacker: makeArmy({ commander: general }),
      defender: makeArmy({ commander: captor.ruler }),
      answer: 'fight',
    });

    player.enlist(general);
    player.moveHome(home);
    world.hold(captive);
    report.captive = captive;
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    const before = home.resources.food;

    events.publish(new BattleReportedEvent(report));

    expect(world.findRansomFor(player)).toBe(captive);
    expect(captive.demand).toBe('food');
    expect(home.resources.food).toBe(before);
  });

  it('records the action but leaves the turn for the orchestrator when a command executes', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const province = world.turnQueue.current!;
    const command = new RecruitCommand({ world, events });

    province.addResources({ gold: 100 });
    command.recruit(10);
    command.execute();

    expect(world.turnQueue.current).toBe(province);
    expect(province.actionCount).toBe(1);
  });

  it('stops advancing turns once stopped', () => {
    const { world, events, engine } = createFixture(new CalendarDate(1186, 4));
    const province = world.turnQueue.current!;

    engine.stop();
    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    expect(world.turnQueue.current).toBe(province);
  });

  it('keeps the current province after a free command', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const province = world.turnQueue.current!;

    new TradeCommand({ world, events }).execute();

    expect(world.turnQueue.current).toBe(province);
  });

  it('advances the queue when the current turn is skipped', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const province = world.turnQueue.current!;

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    expect(world.turnQueue.current).not.toBe(province);
  });

  it('advances the month only when the queue drains, then queues the next month', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    expect(world.date.equals(new CalendarDate(1186, 4))).toBe(true);

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    expect(world.date.equals(new CalendarDate(1186, 5))).toBe(true);
    expect(world.turnQueue.current?.belongsTo(world.player)).toBe(true);
  });

  it('announces every turn start, auto-ending rival and neutral ones', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const announcements: string[] = [];

    events.subscribe(TurnStartedEvent, (event) => {
      expect(event.province).toBe(world.turnQueue.current);

      if (event.province.belongsTo(world.player)) {
        announcements.push('player turn started');
      }
    });
    events.subscribe(MonthStartedEvent, (event) => {
      announcements.push('month started');
      expect(event.date).toBe(world.date);
    });

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    expect(announcements).toEqual([
      'player turn started',
      'month started',
      'player turn started',
    ]);
  });

  it('collects tax and harvest on every owned province when September arrives', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const fixture = createFixture(new CalendarDate(1186, 8));
    const playerProvince = fixture.world.map.getProvince(1);
    const rivalProvince = fixture.world.map.getProvince(3);
    const neutralProvince = fixture.world.map.getProvince(4);
    let rivalHarvest = 0;

    fixture.events.subscribe(ProvinceUpdatedEvent, (event) => {
      if (
        event.province === rivalProvince &&
        rivalHarvest === 0 &&
        fixture.world.date.month === 9
      ) {
        rivalHarvest = rivalProvince.resources.food;
      }
    });
    drainMonth(fixture);

    expect(fixture.world.date.month).toBe(9);
    expect(playerProvince.resources.food).toBe(
      400 +
        10 * 2 +
        20 * 3 +
        Math.floor(playerProvince.effectiveStats.charisma) +
        30 -
        10,
    );
    expect(playerProvince.resources.gold).toBeGreaterThan(500);
    expect(playerProvince.resources.troops).toBe(100);
    expect(rivalHarvest).toBe(
      5 * 3 + 5 * 2 + Math.floor(rivalProvince.effectiveStats.charisma) + 30,
    );
    expect(neutralProvince.resources.food).toBe(0);
    expect(neutralProvince.resources.gold).toBe(0);
  });

  it('collects nothing on an ordinary month advance', () => {
    const fixture = createFixture(new CalendarDate(1186, 4));
    const playerProvince = fixture.world.map.getProvince(1);

    drainMonth(fixture);

    expect(fixture.world.date.month).toBe(5);
    expect(playerProvince.resources.gold).toBe(500);
    expect(playerProvince.resources.food).toBe(400);
  });

  it('removes unpaid units before rampage and restores paid units before the first turn', () => {
    const family = makeFamily({ fame: 12 });
    const province = makeProvince({
      family,
      gold: 20,
      loyalty: 80,
      cultivation: 100,
    });
    const spearmen = HiredUnit.ofName('Spearmen')!;
    spearmen.retainBattleStrength(90);
    province.fifthUnits.addUnit(spearmen);
    const monster = HiredUnit.ofName('Ogre')!;
    monster.retainBattleStrength(74);
    province.fifthUnits.addUnit(monster);
    const march = new CalendarDate(1186, 3);
    const { world, events } = makeWorld([province], family, march);
    const desertions: UnitDesertedEvent[] = [];
    const incidents: string[] = [];
    const strengthAtTurnStart: number[] = [];

    vi.spyOn(Math, 'random').mockReturnValue(0);
    events.subscribe(UnitDesertedEvent, (event) => desertions.push(event));
    events.subscribe(IncidentReportedEvent, (event) =>
      incidents.push(event.incident.definition.kind),
    );
    events.subscribe(TurnStartedEvent, () =>
      strengthAtTurnStart.push(spearmen.strength),
    );
    new WorldEngine(world, events).start();

    expect(desertions).toEqual([
      new UnitDesertedEvent(province, monster, 'unpaid'),
    ]);
    expect(incidents).toEqual(['disaster']);
    expect(province.fifthUnits.hiredUnits).toEqual([spearmen]);
    expect(strengthAtTurnStart).toEqual([115]);
    expect(monster.strength).toBe(74);
  });

  it("stops the clock once the player's family is no more", () => {
    const now = new CalendarDate(1186, 1);
    const avar = makeGeneral({ birth: new CalendarDate(1111, 1) });
    const alderwyn = makeFamily({ name: 'Alderwyn', ruler: avar });
    const alderpass = makeProvince({
      number: 1,
      family: alderwyn,
      governor: avar,
    });
    const { world, events } = makeWorld(
      [alderpass, makeProvince({ number: 2 })],
      alderwyn,
      now,
    );

    vi.spyOn(Math, 'random').mockReturnValue(0);
    new WorldEngine(world, events).start();

    expect(world.campaign.outcome?.isVictory === false).toBe(true);
    expect(world.date.equals(now)).toBe(true);
  });

  it('lets the lord of an entrusted province give its orders, waiting only for the rest', () => {
    const avar = makeGeneral({ name: 'Avar' });
    const rhovan = makeGeneral({ name: 'Rhovan' });
    const alderwyn = makeFamily({
      name: 'Alderwyn',
      ruler: avar,
      members: [avar, rhovan],
    });
    const home = makeProvince({ number: 1, family: alderwyn, governor: avar });
    const entrusted = makeProvince({
      number: 2,
      family: alderwyn,
      governor: rhovan,
      gold: 100,
    });

    alderwyn.moveHome(home);
    entrusted.entrust();

    const { world, events } = makeWorld([home, entrusted], alderwyn);

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    new WorldEngine(world, events).start();

    expect(world.turnQueue.current).toBe(home);

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    expect(world.turnQueue.current).toBe(home);
    expect(entrusted.development.cultivation).toBeGreaterThan(0);
  });

  it('starts no turn while something holds it, and ignores a stale turn end', async () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const holder = new TurnHold(events);
    const ended = world.turnQueue.turnNumber;
    const started: number[] = [];

    events.subscribe(TurnStartedEvent, (event) =>
      started.push(event.turnNumber),
    );
    holder.hold();
    events.publish(new TurnEndedEvent(ended));
    events.publish(new TurnEndedEvent(ended + 1));

    expect(started).toEqual([]);

    holder.release();
    await Promise.resolve();

    expect(started[0]).toBeGreaterThan(ended);
  });
});
