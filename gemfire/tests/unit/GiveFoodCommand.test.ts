import { describe, expect, it } from 'vitest';

import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const INITIAL_FOOD = 300;
const INITIAL_LOYALTY = 10;

interface FixtureOptions {
  readonly food?: number | undefined;
  readonly charisma?: number | undefined;
}

function createFixture(options: FixtureOptions = {}) {
  const governor = options.charisma
    ? makeGeneral({ charisma: options.charisma })
    : undefined;
  const family = makeFamily({ name: 'Blanche' });
  const province = makeProvince({
    number: 1,
    owner: family,
    governor,
    food: options.food ?? INITIAL_FOOD,
    loyalty: INITIAL_LOYALTY,
  });
  const { world, events } = makeWorld([province], family);
  const command = new GiveFoodCommand({ world, events });

  return { world, events, province, command };
}

describe('GiveFoodCommand', () => {
  it('spends food, raises loyalty by the governor charm, and records the deed', () => {
    const { events, province, command } = createFixture({ charisma: 90 });
    const published: object[] = [];

    events.observe((event) => published.push(event));

    command.food = 100;
    command.execute();

    expect(province.resources.food).toBe(INITIAL_FOOD - 100);
    expect(province.development.loyalty).toBe(INITIAL_LOYALTY + 30);
    expect(province.goodwill).toBe(1);
    expect(province.actionCount).toBe(1);
    expect(
      published.some((event) => event instanceof ProvinceUpdatedEvent),
    ).toBe(true);
  });

  it('leaves loyalty untouched when the province has no governor', () => {
    const { province, command } = createFixture();

    command.food = 100;
    command.execute();

    expect(province.resources.food).toBe(INITIAL_FOOD - 100);
    expect(province.development.loyalty).toBe(INITIAL_LOYALTY);
  });
});
