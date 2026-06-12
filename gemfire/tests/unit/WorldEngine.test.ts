import { describe, expect, it } from 'vitest';

import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Development } from '@/core/domain/Development';
import { Family } from '@/core/domain/Family';
import { General } from '@/core/domain/General';
import { Province } from '@/core/domain/Province';
import { Resources } from '@/core/domain/Resources';
import { Stats } from '@/core/domain/Stats';
import { World } from '@/core/domain/World';
import { WorldMap } from '@/core/domain/WorldMap';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { WorldEngine } from '@/core/WorldEngine';
import { Collection } from '@/lib/Collection';
import { EventBus } from '@/lib/EventBus';

interface Fixture {
  readonly world: World;
  readonly events: EventBus;
}

function createFixture(date: CalendarDate): Fixture {
  const blancheRuler = new General({
    name: 'Ander',
    stats: new Stats(50, 50, 50),
  });
  const lankshireRuler = new General({
    name: 'Zemmel',
    stats: new Stats(50, 50, 50),
  });
  const blanche = new Family({ name: 'Blanche', ruler: blancheRuler });
  const lankshire = new Family({ name: 'Lankshire', ruler: lankshireRuler });

  const provinceEntries: [number, Province][] = [
    [
      1,
      new Province({
        number: 1,
        name: 'Rodale',
        neighbors: [2],
        owner: blanche,
        resources: new Resources(500, 1000, 100),
        development: new Development(10, 20, 30),
      }),
    ],
    [
      2,
      new Province({
        number: 2,
        name: 'Ulster',
        neighbors: [1],
        owner: blanche,
      }),
    ],
    [
      3,
      new Province({
        number: 3,
        name: 'Hertzog',
        neighbors: [],
        owner: lankshire,
        development: new Development(5, 5, 5),
      }),
    ],
    [4, new Province({ number: 4, name: 'Mauseio', neighbors: [] })],
  ];

  const world = new World({
    date,
    map: new WorldMap(new Collection(new Map(provinceEntries), 'province')),
    families: new Collection(
      new Map([
        ['Blanche', blanche],
        ['Lankshire', lankshire],
      ]),
      'family',
    ),
    generals: new Collection(
      new Map([
        ['Ander', blancheRuler],
        ['Zemmel', lankshireRuler],
      ]),
      'general',
    ),
    player: blanche,
  });

  const events = new EventBus();
  const engine = new WorldEngine(world, events);

  engine.start();

  return { world, events };
}

function drainMonth(fixture: Fixture): void {
  const monthStart = fixture.world.date;

  while (fixture.world.date.equals(monthStart)) {
    fixture.events.publish(new TurnEndedEvent());
  }
}

describe('WorldEngine', () => {
  it('advances the queue when a turn-consuming command executes on the current province', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const province = world.turnQueue.current!;

    new DevelopCommand({ world, events }).execute();

    expect(world.turnQueue.current).not.toBe(province);
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

    events.publish(new TurnEndedEvent());

    expect(world.turnQueue.current).not.toBe(province);
  });

  it('advances the month only when the queue drains, then queues the next month', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));

    events.publish(new TurnEndedEvent());

    expect(world.date.equals(new CalendarDate(1186, 4))).toBe(true);

    events.publish(new TurnEndedEvent());

    expect(world.date.equals(new CalendarDate(1186, 5))).toBe(true);
    expect(world.turnQueue.current?.isOwner(world.player)).toBe(true);
  });

  it('announces every turn start, auto-ending rival and neutral ones', () => {
    const { world, events } = createFixture(new CalendarDate(1186, 4));
    const announcements: string[] = [];

    events.subscribe(TurnStartedEvent, (event) => {
      expect(event.province).toBe(world.turnQueue.current);

      if (event.province.isOwner(world.player)) {
        announcements.push('player turn started');
      }
    });
    events.subscribe(MonthStartedEvent, (event) => {
      announcements.push('month started');
      expect(event.date).toBe(world.date);
    });

    events.publish(new TurnEndedEvent());
    events.publish(new TurnEndedEvent());

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
    expect(playerProvince.resources.food).toBe(1000 + 10 + 20 * 2 + 30);
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
    expect(playerProvince.resources.food).toBe(1000);
  });
});
