import { describe, expect, it } from 'vitest';

import { TransportCommand } from '@/core/commands/province/TransportCommand';
import type { Province } from '@/core/domain/Province';

import { makeFamily, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 100;
const INITIAL_FOOD = 100;

function createFixture(options: { readonly rivalReceiver?: boolean } = {}) {
  const family = makeFamily({ name: 'Blanche' });
  const rival = makeFamily({ name: 'Crowe' });
  const provinces = [1, 2].map((number) =>
    makeProvince({
      number,
      name: `Province ${number}`,
      owner: options.rivalReceiver && number === 2 ? rival : family,
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
});
