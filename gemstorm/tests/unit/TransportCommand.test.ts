import { describe, expect, it } from 'vitest';

import { TransportCommand } from '@/core/commands/province/TransportCommand';
import type { Province } from '@/core/domain/Province';

import { makeFamily, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 100;
const INITIAL_FOOD = 100;

function createFixture(options: { readonly rivalReceiver?: boolean } = {}) {
  const family = makeFamily({ name: 'Alderwyn' });
  const rival = makeFamily({ name: 'Crowe' });
  const provinces = [1, 2].map((number) =>
    makeProvince({
      number,
      name: `Province ${number}`,
      family: options.rivalReceiver && number === 2 ? rival : family,
      gold: INITIAL_GOLD,
      food: INITIAL_FOOD,
    }),
  );
  const { world, events } = makeWorld(provinces, family);
  const source = world.turnQueue.current!;
  const target = world.map.provinces.find(
    (province) => !province.isEqual(source),
  ) as Province;
  const command = new TransportCommand({ world, events });

  return { source, target, command };
}

describe('TransportCommand', () => {
  it('sends gold and food to the chosen province at goodwill 0', () => {
    const { source, target, command } = createFixture();

    command.direction = 'send';
    command.destination = target.number;
    command.gold = 30;
    command.food = 40;
    command.execute();

    expect(source.resources.gold).toBe(INITIAL_GOLD - 30);
    expect(source.resources.food).toBe(INITIAL_FOOD - 40);
    expect(target.resources.gold).toBe(INITIAL_GOLD + 30);
    expect(target.resources.food).toBe(INITIAL_FOOD + 40);
    expect(source.goodwill).toBe(0);
    expect(source.actionCount).toBe(1);
  });

  it('receives gold and food from the chosen province', () => {
    const { source, target, command } = createFixture();

    command.direction = 'receive';
    command.destination = target.number;
    command.gold = 30;
    command.food = 40;
    command.execute();

    expect(source.resources.gold).toBe(INITIAL_GOLD + 30);
    expect(source.resources.food).toBe(INITIAL_FOOD + 40);
    expect(target.resources.gold).toBe(INITIAL_GOLD - 30);
    expect(target.resources.food).toBe(INITIAL_FOOD - 40);
    expect(source.actionCount).toBe(1);
  });

  it('refuses a transfer the sender cannot afford', () => {
    const { source, target, command } = createFixture();

    command.destination = target.number;
    command.gold = INITIAL_GOLD + 1;
    command.execute();

    expect(source.resources.gold).toBe(INITIAL_GOLD);
    expect(target.resources.gold).toBe(INITIAL_GOLD);
    expect(source.actionCount).toBe(0);
  });

  it('refuses a transfer between provinces of different families', () => {
    const { source, target, command } = createFixture({ rivalReceiver: true });

    command.destination = target.number;
    command.gold = 30;
    command.execute();

    expect(source.resources.gold).toBe(INITIAL_GOLD);
    expect(target.resources.gold).toBe(INITIAL_GOLD);
    expect(source.actionCount).toBe(0);
  });

  it.each(['send', 'receive'] as const)(
    'caps a %s by the giver’s stock and the taker’s room',
    (direction) => {
      const { source, target, command } = createFixture();
      const taker = direction === 'send' ? target : source;
      taker.addResources({ gold: 880 });

      command.direction = direction;
      command.destination = target.number;

      expect(command.getMaximum('gold')).toBe(19);
      expect(command.getMaximum('food')).toBe(INITIAL_FOOD);
    },
  );

  it.each(['send', 'receive'] as const)(
    'refuses a %s the taker has no room for and changes nothing',
    (direction) => {
      const { source, target, command } = createFixture();
      const taker = direction === 'send' ? target : source;
      taker.addResources({ gold: 880 });
      const before = [source.resources.gold, target.resources.gold];

      command.direction = direction;
      command.destination = target.number;
      command.gold = 20;
      command.execute();

      expect([source.resources.gold, target.resources.gold]).toEqual(before);
      expect(source.actionCount).toBe(0);
    },
  );

  it('moves an exact fit', () => {
    const { source, target, command } = createFixture();
    target.addResources({ gold: 880 });

    command.destination = target.number;
    command.gold = 19;
    command.execute();

    expect(target.resources.gold).toBe(999);
    expect(source.actionCount).toBe(1);
  });

  it('refuses negative or fractional amounts', () => {
    const { source, target, command } = createFixture();

    command.destination = target.number;
    command.gold = 10;
    command.food = -5;
    command.execute();
    command.food = 2.5;
    command.execute();

    expect(source.resources).toMatchObject({
      gold: INITIAL_GOLD,
      food: INITIAL_FOOD,
    });
    expect(source.actionCount).toBe(0);
  });
});
