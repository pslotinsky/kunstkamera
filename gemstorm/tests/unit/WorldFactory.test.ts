import { describe, expect, it } from 'vitest';

import { SCENARIO_1 } from '@/config/scenario-1';
import { WorldFactory } from '@/core/WorldFactory';

const world = new WorldFactory().create();

describe('WorldFactory', () => {
  it('owns provinces with families from the world, leaving the rest neutral', () => {
    const families = new Set(world.families.all);

    let ownedCount = 0;
    let neutralCount = 0;

    for (const province of world.map.provinces) {
      const owner = province.family;

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
        expect(province.family, `province ${province.number}`).toBeDefined();
        expect(province.family?.members).toContain(province.governor);
      }
    }
  });

  it('seats each family ruler in the home province they govern', () => {
    for (const family of world.families.all) {
      expect(family.homeProvince.governor, family.name).toBe(family.ruler);
    }
  });

  it('governs every owned province, defaulting to the ruler under direct rule', () => {
    for (const province of world.map.provinces) {
      if (province.family) {
        expect(province.governor, `province ${province.number}`).toBeDefined();
      }
    }
  });

  it('gives each house the gems its scenario names, and nothing derives them', () => {
    for (const definition of SCENARIO_1.families) {
      const family = world.families.getOrFail(definition.name);

      expect(
        family.gems.map((gem) => gem.name),
        definition.name,
      ).toEqual([...definition.gems]);
    }
  });
  it('says what kind of country each province is', () => {
    const world = new WorldFactory().create();
    const grouped = (kind: string) =>
      world.map.provinces
        .filter((province) => province.landscape === kind)
        .map((province) => province.number);

    expect(grouped('snow')).toEqual([1, 2, 3, 4, 5]);
    expect(grouped('mountain')).toEqual([24, 25, 26, 27]);
    expect(grouped('river')).toEqual([17, 18, 19, 20, 21, 22, 28, 29]);
    expect(grouped('woods')).toEqual([
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 23, 30,
    ]);
  });
});
