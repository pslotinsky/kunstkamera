import { describe, expect, it } from 'vitest';

import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { MarketRate } from '@/core/domain/MarketRate';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { makeFamily, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 100;
const INITIAL_FOOD = 100;

function createFixture(
  rate: MarketRate,
  gold = INITIAL_GOLD,
  food = INITIAL_FOOD,
) {
  const family = makeFamily({ name: 'Alderwyn' });
  const province = makeProvince({
    number: 1,
    family: family,
    gold,
    food,
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
    command.amount = 10;
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
    command.amount = 20;
    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD + 40);
    expect(province.resources.food).toBe(INITIAL_FOOD - 20);
  });

  it('refuses a buy the province cannot afford', () => {
    const { province, command } = createFixture(MarketRate.HIGH);

    command.direction = 'buy';
    command.amount = 200;
    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD);
    expect(province.resources.food).toBe(INITIAL_FOOD);
  });

  it('rounds the result down in the direction being traded', () => {
    const buyer = createFixture(MarketRate.HIGH);
    const seller = createFixture(MarketRate.LOW);

    buyer.command.amount = 5;
    buyer.command.execute();
    seller.command.direction = 'sell';
    seller.command.amount = 5;
    seller.command.execute();

    expect(buyer.province.resources.gold).toBe(INITIAL_GOLD - 5);
    expect(buyer.province.resources.food).toBe(INITIAL_FOOD + 2);
    expect(seller.province.resources.food).toBe(INITIAL_FOOD - 5);
    expect(seller.province.resources.gold).toBe(INITIAL_GOLD + 2);
  });

  it('rejects a purchase that exceeds food storage or returns zero food', () => {
    const { province, command } = createFixture(MarketRate.HIGH, 100, 998);

    expect(command.getMinimumAmount('buy')).toBe(2);
    expect(command.getMaximumAmount('buy')).toBe(2);

    for (const amount of [1, 4]) {
      command.amount = amount;
      command.execute();

      expect(province.resources.food).toBe(998);
      expect(province.resources.gold).toBe(100);
    }

    command.amount = 2;
    command.execute();

    expect(province.resources.food).toBe(999);
    expect(province.resources.gold).toBe(98);
  });

  it('rejects sales that would overfill gold storage', () => {
    const { province, command } = createFixture(MarketRate.HIGH, 996, 100);

    expect(command.getMaximumAmount('sell')).toBe(1);

    command.direction = 'sell';
    command.amount = 2;
    command.execute();

    expect(province.resources.gold).toBe(996);
    expect(province.resources.food).toBe(100);

    command.amount = 1;
    command.execute();

    expect(province.resources.gold).toBe(998);
    expect(province.resources.food).toBe(99);
  });

  it('does not end the turn or touch the goodwill counters', () => {
    const { province, command, published } = createFixture(MarketRate.AVERAGE);

    command.direction = 'sell';
    command.amount = 20;
    command.execute();

    expect(province.goodwill).toBe(0);
    expect(province.actionCount).toBe(0);
    expect(published.some((event) => event instanceof TurnEndedEvent)).toBe(
      false,
    );
  });
});
