import { describe, expect, it } from 'vitest';

import { WorldFactory } from '@/core/WorldFactory';

const world = new WorldFactory().create();

describe('WorldFactory', () => {
  it('owns provinces with families from the world, leaving the rest neutral', () => {
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

  it('gives every governed province a governor from the owning family', () => {
    for (const province of world.map.provinces) {
      if (province.governor) {
        expect(province.owner, `province ${province.number}`).toBeDefined();
        expect(province.owner?.members).toContain(province.governor);
      }
    }
  });

  it('seats each family ruler in the home province they govern', () => {
    for (const family of world.families) {
      expect(family.homeProvince?.governor, family.name).toBe(family.ruler);
    }
  });

  it('governs every owned province, defaulting to the ruler under direct rule', () => {
    for (const province of world.map.provinces) {
      if (province.owner) {
        expect(province.governor, `province ${province.number}`).toBeDefined();
      }
    }
  });
});
