import { afterEach, describe, expect, it, vi } from 'vitest';

import { CultivationCommand } from '@/core/commands/province/CultivationCommand';
import type { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { ProtectionCommand } from '@/core/commands/province/ProtectionCommand';
import type { WorldCommandContext } from '@/core/commands/WorldCommand';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 500;
const INITIAL_STAT = 20;

const developOrders = [
  {
    label: 'CultivationCommand',
    stat: 'cultivation',
    make: (context: WorldCommandContext) => new CultivationCommand(context),
  },
  {
    label: 'ProtectionCommand',
    stat: 'protection',
    make: (context: WorldCommandContext) => new ProtectionCommand(context),
  },
] as const;

interface FixtureOptions {
  readonly gold?: number | undefined;
  readonly intelligence?: number | undefined;
}

function createFixture(
  make: (context: WorldCommandContext) => DevelopCommand,
  options: FixtureOptions = {},
) {
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
    cultivation: INITIAL_STAT,
    protection: INITIAL_STAT,
  });
  const { world, events } = makeWorld([province], family);
  const command = make({ world, events });

  return { world, events, province, command };
}

describe.each(developOrders)('$label', ({ make, stat }) => {
  afterEach(() => vi.useRealTimers());

  it('spends gold, raises its stat, records the deed, and ends the turn', () => {
    vi.useFakeTimers();

    const { events, province, command } = createFixture(make, {
      intelligence: 50,
      gold: INITIAL_GOLD,
    });
    const published: object[] = [];

    events.observe((event) => published.push(event));

    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD - 10);
    expect(province.development[stat]).toBe(INITIAL_STAT + 4);
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
    const dull = createFixture(make, { intelligence: 0, gold: INITIAL_GOLD });
    const bright = createFixture(make, {
      intelligence: 99,
      gold: INITIAL_GOLD,
    });

    dull.command.execute();
    bright.command.execute();

    expect(dull.province.development[stat]).toBe(INITIAL_STAT + 2);
    expect(bright.province.development[stat]).toBe(INITIAL_STAT + 5);
  });

  it('refuses when gold is short', () => {
    const { events, province, command } = createFixture(make, { gold: 9 });
    const published: object[] = [];

    events.observe((event) => published.push(event));

    expect(command.canExecute()).toBe(false);

    command.execute();

    expect(province.resources.gold).toBe(9);
    expect(province.development[stat]).toBe(INITIAL_STAT);
    expect(province.actionCount).toBe(0);
    expect(published).toEqual([]);
  });
});
