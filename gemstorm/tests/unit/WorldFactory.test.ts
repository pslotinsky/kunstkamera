import { describe, expect, it } from 'vitest';

import { SCENARIOS } from '@/config/scenarios';
import { WorldFactory } from '@/core/WorldFactory';

describe.each(SCENARIOS)('WorldFactory: $name', (scenario) => {
  const world = new WorldFactory().create({
    scenario,
    family: scenario.playableFamilies[0]!,
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
    for (const definition of scenario.families) {
      const family = world.families.getOrFail(definition.name);

      expect(
        family.gems.map((gem) => gem.name),
        definition.name,
      ).toEqual([...definition.gems]);
    }
  });

  it('starts in January of the scenario year with the chosen house', () => {
    expect(world.date.year).toBe(scenario.year);
    expect(world.date.month).toBe(1);
    expect(world.player.name).toBe(scenario.playableFamilies[0]);
  });
});

describe('WorldFactory', () => {
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

  it('refuses a house that is not playable in the scenario', () => {
    const [scenario] = SCENARIOS;

    expect(() =>
      new WorldFactory().create({ scenario: scenario!, family: 'Varrengard' }),
    ).toThrow();
  });

  it('keeps the chosen advisor with the campaign', () => {
    const [scenario] = SCENARIOS;
    const [, advisor] = new WorldFactory().createAdvisors();
    const world = new WorldFactory().create({
      scenario: scenario!,
      family: scenario!.playableFamilies[0]!,
      advisor: advisor!,
    });

    expect(world.campaign.advisor?.isEqual(advisor!)).toBe(true);
  });
});
