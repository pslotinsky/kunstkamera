import { afterEach, describe, expect, it, vi } from 'vitest';

import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const INITIAL_FOOD = 300;
const INITIAL_LOYALTY = 10;

interface FixtureOptions {
  readonly food?: number | undefined;
  readonly charisma?: number | undefined;
  readonly loyalty?: number;
}

function createFixture(options: FixtureOptions = {}) {
  const governor =
    options.charisma !== undefined
      ? makeGeneral({ charisma: options.charisma })
      : undefined;
  const family = makeFamily({ name: 'Alderwyn' });
  const province = makeProvince({
    number: 1,
    family: family,
    governor,
    food: options.food ?? INITIAL_FOOD,
    loyalty: options.loyalty ?? INITIAL_LOYALTY,
  });
  const { world, events } = makeWorld([province], family);
  const command = new GiveFoodCommand({ world, events });

  return { family, governor, world, events, province, command };
}

describe('GiveFoodCommand', () => {
  afterEach(() => vi.restoreAllMocks());

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

  it('uses half the ruler’s Charisma when the province has no governor', () => {
    const { family, province, command } = createFixture();

    command.food = 100;
    command.execute();

    expect(province.resources.food).toBe(INITIAL_FOOD - 100);
    const expectedGain = Math.floor(family.ruler.stats.charisma / 6);
    expect(province.development.loyalty).toBe(INITIAL_LOYALTY + expectedGain);
  });

  it('rejects unsupported amounts and gifts larger than the food stock', () => {
    const { province, command } = createFixture({ food: 40 });

    for (const amount of [25, 50]) {
      command.food = amount;
      command.execute();
    }

    expect(province.resources.food).toBe(40);
    expect(province.actionCount).toBe(0);
  });

  it.each([
    [0.89, 101],
    [0.9, 100],
  ])(
    'spends food at full Loyalty and trains Charisma when the roll is %s',
    (roll, charisma) => {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      const { governor, province, command } = createFixture({
        charisma: 100,
        loyalty: 100,
      });

      command.food = 20;
      command.execute();

      expect(governor?.stats.charisma).toBe(charisma);
      expect(province.resources.food).toBe(INITIAL_FOOD - 20);
      expect(province.development.loyalty).toBe(100);
      expect(province.actionCount).toBe(1);
    },
  );

  it('caps training at 200 Charisma', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { governor, command } = createFixture({
      charisma: 200,
      loyalty: 100,
    });

    command.food = 20;
    command.execute();

    expect(governor?.stats.charisma).toBe(200);
  });
});
