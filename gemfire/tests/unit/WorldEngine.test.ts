import { describe, expect, it } from 'vitest';

import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { WorldEngine } from '@/core/WorldEngine';
import { EventBus } from '@/lib/EventBus';

import { makeFamily, makeProvince, makeWorld } from './factories';

interface Fixture {
  readonly world: ReturnType<typeof makeWorld>['world'];
  readonly events: EventBus;
}

function createFixture(date: CalendarDate): Fixture {
  const blanche = makeFamily({ name: 'Blanche' });
  const lankshire = makeFamily({ name: 'Lankshire' });

  const provinces = [
    makeProvince({
      number: 1,
      name: 'Rodale',
      neighbors: [2],
      family: blanche,
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
      family: blanche,
    }),
    makeProvince({
      number: 3,
      name: 'Hertzog',
      family: lankshire,
      loyalty: 5,
      cultivation: 5,
      protection: 5,
    }),
    makeProvince({ number: 4, name: 'Mauseio' }),
  ];

  const { world, events } = makeWorld(provinces, blanche, date);
  const engine = new WorldEngine(world, events);

  engine.start();

  return { world, events };
}

function drainMonth(fixture: Fixture): void {
  const monthStart = fixture.world.date;

  while (fixture.world.date.equals(monthStart)) {
    fixture.events.publish(
      new TurnEndedEvent(fixture.world.turnQueue.turnNumber),
    );
  }
}

describe('WorldEngine', () => {
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
    const fixture = createFixture(new CalendarDate(1186, 8));
    const playerProvince = fixture.world.map.getProvince(1);
    const rivalProvince = fixture.world.map.getProvince(3);
    const neutralProvince = fixture.world.map.getProvince(4);

    drainMonth(fixture);

    expect(fixture.world.date.month).toBe(9);
    expect(playerProvince.resources.food).toBe(400 + 10 + 20 * 2 + 30);
    expect(playerProvince.resources.gold).toBeGreaterThan(500);
    expect(playerProvince.resources.troops).toBe(100);
    expect(rivalProvince.resources.food).toBe(5 + 5 * 2 + 5);
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
});
