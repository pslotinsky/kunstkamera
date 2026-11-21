import { describe, expect, it } from 'vitest';

import { HIRED_UNITS } from '@/config/fifth-units';
import { GEMS } from '@/config/gems';
import { SCENARIOS } from '@/config/scenarios';

const PROVINCE_COUNT = 30;
const PLAYABLE_COUNT = 4;

it('keeps each general’s recruit and defection classes across scenarios', () => {
  const classes = new Map<
    string,
    { recruitClass: number; defectionClass: number }
  >();

  for (const { generals } of SCENARIOS) {
    for (const { name, recruitClass, defectionClass } of generals) {
      const current = { recruitClass, defectionClass };

      expect(current, name).toEqual(classes.get(name) ?? current);
      classes.set(name, current);
    }
  }
});

describe.each(SCENARIOS)('Scenario $number: $name', (scenario) => {
  const generals = new Set(scenario.generals.map((general) => general.name));
  const families = new Set(scenario.families.map((family) => family.name));

  it('defines each of the 30 provinces once', () => {
    const numbers = scenario.provinces.map((province) => province.number);
    const expected = Array.from(
      { length: PROVINCE_COUNT },
      (_unused, index) => index + 1,
    );

    expect([...numbers].sort((left, right) => left - right)).toEqual(expected);
  });

  it('names every general once', () => {
    expect(generals.size).toBe(scenario.generals.length);
  });

  it('places each general in at most one house, ruled by its own member', () => {
    const members = scenario.families.flatMap((family) => family.members);

    expect(new Set(members).size).toBe(members.length);

    for (const family of scenario.families) {
      expect(family.members, family.name).toContain(family.ruler);
      for (const member of family.members) {
        expect(generals.has(member), member).toBe(true);
      }
    }
  });

  it('gives provinces only known owners, governed by their members', () => {
    for (const province of scenario.provinces) {
      const owner = scenario.families.find(
        (family) => family.name === province.family,
      );

      if (province.family) {
        expect(owner, `province ${province.number}`).toBeDefined();
      }
      if (province.governor) {
        expect(owner?.members, `province ${province.number}`).toContain(
          province.governor,
        );
      }
    }
  });

  it('hands out known Gems, each to one house at most', () => {
    const known = new Set(GEMS.map((gem) => gem.guardian.name));
    const held = scenario.families.flatMap((family) => family.gems);

    expect(new Set(held).size).toBe(held.length);
    for (const gem of held) {
      expect(known.has(gem), gem).toBe(true);
    }
  });

  it('offers only catalogued units for hire', () => {
    const catalogue = new Set(HIRED_UNITS.map((unit) => unit.name));

    for (const province of scenario.provinces) {
      for (const unit of province.hirePool) {
        expect(catalogue.has(unit), `${unit} in ${province.number}`).toBe(true);
      }
    }
  });

  it('lets the player choose among four of its houses', () => {
    expect(scenario.playableFamilies).toHaveLength(PLAYABLE_COUNT);
    for (const family of scenario.playableFamilies) {
      expect(families.has(family), family).toBe(true);
    }
  });
});
