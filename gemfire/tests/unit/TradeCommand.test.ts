import { describe, expect, it } from 'vitest';

import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { MarketRate } from '@/core/domain/MarketRate';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { makeFamily, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 100;
const INITIAL_FOOD = 100;

function createFixture(rate: MarketRate) {
  const family = makeFamily({ name: 'Blanche' });
  const province = makeProvince({
    number: 1,
    family: family,
    gold: INITIAL_GOLD,
    food: INITIAL_FOOD,
  });
  const { world, events } = makeWorld([province], family);

  world.market.rate = rate;

  const command = new TradeCommand({ world, events });
  const published: object[] = [];

  events.observe((event) => published.push(event));

  return { province, command, published };
}

describe('TradeCommand', () => {
  it('buys food, spending gold at the current rate', () => {
    const { province, command, published } = createFixture(MarketRate.LOW);

    command.direction = 'buy';
    command.food = 20;
    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD - 10);
    expect(province.resources.food).toBe(INITIAL_FOOD + 20);
    expect(
      published.some((event) => event instanceof ProvinceUpdatedEvent),
    ).toBe(true);
  });

  it('sells food, gaining gold at the current rate', () => {
    const { province, command } = createFixture(MarketRate.HIGH);

    command.direction = 'sell';
    command.food = 20;
    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD + 40);
    expect(province.resources.food).toBe(INITIAL_FOOD - 20);
  });

  it('refuses a buy the province cannot afford', () => {
    const { province, command } = createFixture(MarketRate.HIGH);

    command.direction = 'buy';
    command.food = 200;
    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD);
    expect(province.resources.food).toBe(INITIAL_FOOD);
  });

  it('does not end the turn or touch the goodwill counters', () => {
    const { province, command, published } = createFixture(MarketRate.AVERAGE);

    command.direction = 'sell';
    command.food = 20;
    command.execute();

    expect(province.goodwill).toBe(0);
    expect(province.actionCount).toBe(0);
    expect(published.some((event) => event instanceof TurnEndedEvent)).toBe(
      false,
    );
  });
});
