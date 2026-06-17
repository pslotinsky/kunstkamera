import { describe, expect, it } from 'vitest';

import {
  DevelopCommand,
  type DevelopTarget,
} from '@/core/commands/province/DevelopCommand';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 500;
const INITIAL_STAT = 20;

interface FixtureOptions {
  readonly gold?: number | undefined;
  readonly intelligence?: number | undefined;
}

function createFixture(target: DevelopTarget, options: FixtureOptions = {}) {
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
  family.homeProvince = province;

  const { world, events } = makeWorld([province], family);
  const command = new DevelopCommand({ world, events });

  command.target = target;

  return { world, events, province, command };
}

const targets: readonly DevelopTarget[] = ['cultivation', 'protection'];

describe.each(targets)('DevelopCommand (%s)', (target) => {
  it('spends gold, raises its stat, and records the deed', () => {
    const { events, province, command } = createFixture(target, {
      intelligence: 50,
      gold: INITIAL_GOLD,
    });
    const published: object[] = [];

    events.observe((event) => published.push(event));

    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD - 10);
    expect(province.development[target]).toBe(INITIAL_STAT + 4);
    expect(province.goodwill).toBe(1);
    expect(province.actionCount).toBe(1);
    expect(
      published.some((event) => event instanceof ProvinceUpdatedEvent),
    ).toBe(true);
  });

  it('scales the gain with the governor intelligence', () => {
    const dull = createFixture(target, { intelligence: 0, gold: INITIAL_GOLD });
    const bright = createFixture(target, {
      intelligence: 99,
      gold: INITIAL_GOLD,
    });

    dull.command.execute();
    bright.command.execute();

    expect(dull.province.development[target]).toBe(INITIAL_STAT + 2);
    expect(bright.province.development[target]).toBe(INITIAL_STAT + 5);
  });

  it('refuses when gold is short', () => {
    const { events, province, command } = createFixture(target, { gold: 9 });
    const published: object[] = [];

    events.observe((event) => published.push(event));

    expect(command.canExecute()).toBe(false);

    command.execute();

    expect(province.resources.gold).toBe(9);
    expect(province.development[target]).toBe(INITIAL_STAT);
    expect(province.actionCount).toBe(0);
    expect(published).toEqual([]);
  });
});
