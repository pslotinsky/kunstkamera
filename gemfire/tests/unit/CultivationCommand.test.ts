import { afterEach, describe, expect, it, vi } from 'vitest';

import { CultivationCommand } from '@/core/commands/province/CultivationCommand';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

interface FixtureOptions {
  readonly gold?: number | undefined;
  readonly cultivation?: number | undefined;
  readonly intelligence?: number | undefined;
}

const INITIAL_GOLD = 500;
const INITIAL_CULTIVATION = 20;

function createFixture(options: FixtureOptions = {}) {
  const governor = makeGeneral({
    name: 'Ander',
    intelligence: options.intelligence,
  });
  const family = makeFamily({ name: 'Blanche', ruler: governor });
  const province = makeProvince({
    number: 1,
    owner: family,
    governor,
    gold: options.gold,
    loyalty: 10,
    cultivation: options.cultivation,
    protection: 30,
  });
  const { world, events } = makeWorld([province], family);
  const command = new CultivationCommand({ world, events });

  return { world, events, province, command };
}

describe('CultivationCommand', () => {
  afterEach(() => vi.useRealTimers());

  it('spends gold, raises cultivation, records the deed, and ends the turn', () => {
    vi.useFakeTimers();

    const { events, province, command } = createFixture({
      intelligence: 50,
      gold: INITIAL_GOLD,
      cultivation: INITIAL_CULTIVATION,
    });
    const published: object[] = [];

    events.observe((event) => published.push(event));

    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD - 10);
    expect(province.development.cultivation).toBe(INITIAL_CULTIVATION + 4);
    expect(province.goodwill).toBe(1);
    expect(province.actionCount).toBe(1);
    expect(
      published.some((event) => event instanceof ProvinceUpdatedEvent),
    ).toBe(true);

    vi.runAllTimers();

    expect(published.some((event) => event instanceof TurnEndedEvent)).toBe(
      true,
    );
  });

  it('scales the gain with the governor intelligence', () => {
    const dull = createFixture({
      intelligence: 0,
      gold: INITIAL_GOLD,
      cultivation: INITIAL_CULTIVATION,
    });
    const bright = createFixture({
      intelligence: 99,
      gold: INITIAL_GOLD,
      cultivation: INITIAL_CULTIVATION,
    });

    dull.command.execute();
    bright.command.execute();

    expect(dull.province.development.cultivation).toBe(INITIAL_CULTIVATION + 2);
    expect(bright.province.development.cultivation).toBe(
      INITIAL_CULTIVATION + 5,
    );
  });

  it('refuses when gold is short', () => {
    const { events, province, command } = createFixture({
      gold: 9,
      cultivation: INITIAL_CULTIVATION,
    });
    const published: object[] = [];

    events.observe((event) => published.push(event));

    expect(command.canExecute()).toBe(false);

    command.execute();

    expect(province.resources.gold).toBe(9);
    expect(province.development.cultivation).toBe(INITIAL_CULTIVATION);
    expect(province.actionCount).toBe(0);
    expect(published).toEqual([]);
  });
});
