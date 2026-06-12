import { describe, expect, it } from 'vitest';

import { TurnQueue } from '@/core/domain/TurnQueue';
import { WorldFactory } from '@/core/WorldFactory';

const world = new WorldFactory().create();

describe('TurnQueue', () => {
  it('queues every province for the month', () => {
    const order = new TurnQueue(world.map.provinces).pending;

    expect(order).toHaveLength(world.map.provinces.length);
    expect(new Set(order)).toEqual(new Set(world.map.provinces));
  });

  it('refills the queue from the same province list on reset', () => {
    const queue = new TurnQueue(world.map.provinces);

    while (!queue.isDone()) {
      queue.next();
    }

    queue.reset();

    expect(queue.isDone()).toBe(false);
    expect(queue.pending).toHaveLength(world.map.provinces.length);
  });
});
