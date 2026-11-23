import { afterEach, describe, expect, it, vi } from 'vitest';

import { MigrateMercenariesCommand } from '@/core/commands/MigrateMercenariesCommand';
import { RestockHirePoolsCommand } from '@/core/commands/RestockHirePoolsCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { WorldEngine } from '@/core/WorldEngine';

import { makeFamily, makeProvince, makeWorld } from './factories';

describe('Hire pools', () => {
  afterEach(() => vi.restoreAllMocks());

  it('restocks an empty pool before the February turn and leaves existing offers alone', () => {
    const family = makeFamily();
    const empty = makeProvince({ number: 1, family });
    const waiting = makeProvince({ number: 2, hirePool: ['Spearmen'] });
    const february = new CalendarDate(1186, 2);
    const { world, events } = makeWorld([empty, waiting], family, february);
    const turnOffers: string[][] = [];

    vi.spyOn(Math, 'random').mockReturnValue(0);
    events.subscribe(TurnStartedEvent, (event) => {
      if (event.province === empty) {
        turnOffers.push(empty.fifthUnits.hirePool.map((unit) => unit.name));
      }
    });
    new WorldEngine(world, events).start();

    expect(turnOffers).toEqual([['Grimhides']]);
    expect(waiting.fifthUnits.hirePool.map((unit) => unit.name)).toEqual([
      'Spearmen',
    ]);
  });

  it('restocks in August only when a province has a free slot', () => {
    const family = makeFamily();
    const empty = makeProvince({ number: 25 });
    const full = makeProvince({ number: 28 });
    const july = new CalendarDate(1186, 7);
    const context = makeWorld([empty, full], family, july);
    const restock = new RestockHirePoolsCommand(context);

    for (const name of [
      'Grimhides',
      'Bugbear',
      'Ogre',
      'Lizards',
      'Skeletons',
    ]) {
      full.fifthUnits.addUnit(HiredUnit.ofName(name)!);
    }

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    restock.execute();
    expect(empty.fifthUnits.hirePool).toHaveLength(0);

    context.world.date = july.next();
    restock.execute();

    expect(empty.fifthUnits.hirePool.map((unit) => unit.name)).toEqual([
      'Lizards',
    ]);
    expect(full.fifthUnits.hirePool).toHaveLength(0);
  });

  it('moves at most one available mercenary of each type and preserves the offers', () => {
    const family = makeFamily();
    const origin = makeProvince({
      number: 1,
      family,
      neighbors: [2, 3],
      hirePool: ['Spearmen', 'Grimhides'],
    });
    const full = makeProvince({
      number: 2,
      hirePool: ['Ogre', 'Lizards', 'Skeletons', 'Bugbear', 'Fachan'],
    });
    const destination = makeProvince({ number: 3, neighbors: [1, 4] });
    const other = makeProvince({
      number: 4,
      neighbors: [3],
      hirePool: ['Spearmen'],
    });
    const provinces = [origin, full, destination, other];
    const march = new CalendarDate(1186, 3);
    const context = makeWorld(provinces, family, march);
    const [spearmen, grimhides] = origin.fifthUnits.hirePool;
    const [otherSpearmen] = other.fifthUnits.hirePool;
    const offersBefore = provinces.flatMap(
      (province) => province.fifthUnits.hirePool,
    );

    spearmen?.retainBattleStrength(74);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    new MigrateMercenariesCommand(context).execute();

    const offersAfter = provinces.flatMap(
      (province) => province.fifthUnits.hirePool,
    );

    expect(destination.fifthUnits.hirePool[0]).toBe(spearmen);
    expect(destination.fifthUnits.hirePool[0]?.strength).toBe(74);
    expect(origin.fifthUnits.hirePool).toEqual([grimhides]);
    expect(other.fifthUnits.hirePool).toEqual([otherSpearmen]);
    expect(offersAfter).toHaveLength(offersBefore.length);
    expect(new Set(offersAfter)).toEqual(new Set(offersBefore));
  });

  it('only attempts migration in March or September and respects its chance', () => {
    const family = makeFamily();
    const origin = makeProvince({
      number: 1,
      neighbors: [2],
      hirePool: ['Spearmen'],
    });
    const destination = makeProvince({ number: 2 });
    const august = new CalendarDate(1186, 8);
    const context = makeWorld([origin, destination], family, august);
    const migrate = new MigrateMercenariesCommand(context);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    migrate.execute();
    expect(random).not.toHaveBeenCalled();

    context.world.date = august.next();
    random.mockReturnValue(0.6);
    migrate.execute();
    expect(destination.fifthUnits.hirePool).toHaveLength(0);

    random.mockReturnValue(0.59);
    migrate.execute();
    expect(destination.fifthUnits.hirePool).toHaveLength(1);
  });
});
