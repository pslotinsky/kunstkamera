import { describe, expect, it } from 'vitest';

import { WorldFactory } from '@/core/WorldFactory';

describe('WorldFactory', () => {
  it('owns provinces with families from the world, leaving the rest neutral', () => {
    const world = new WorldFactory().create();
    const families = new Set(world.families);

    let ownedCount = 0;
    let neutralCount = 0;

    for (const province of world.map.provinces) {
      const owner = province.owner;

      if (owner === undefined) {
        neutralCount += 1;
      } else {
        ownedCount += 1;
        expect(families.has(owner)).toBe(true);
      }
    }

    expect(ownedCount).toBeGreaterThan(0);
    expect(neutralCount).toBeGreaterThan(0);
  });
});
