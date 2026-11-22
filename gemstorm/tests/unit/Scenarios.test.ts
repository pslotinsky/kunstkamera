import { describe, expect, it } from 'vitest';

import { HIRED_UNITS } from '@/config/fifth-units';
import { GEMS } from '@/config/gems';
import { type ProvinceDefinition, SCENARIOS } from '@/config/scenarios';

const PROVINCE_COUNT = 30;
const PLAYABLE_COUNT = 4;
const FAME_PER_PROVINCE = 3;
const MONSTERS_PER_PROVINCE = 2;
const MERCENARY_COUNT = 12;
const MERCENARIES_PER_KIND = 2;
const MERCENARIES = getUnitNames('mercenary');
const MONSTERS = getUnitNames('monster');

function getUnitNames(category: string): ReadonlySet<string> {
  const units = HIRED_UNITS.filter((unit) => unit.category === category);
  const names = units.map((unit) => unit.name);

  return new Set(names);
}

function getMercenaryOffers(province: ProvinceDefinition) {
  const mercenaries = province.hirePool.filter((name) => MERCENARIES.has(name));

  return mercenaries.map((name) => ({ name, province: province.number }));
}

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

  it('gives every ruler 3 Fame for each province the house owns', () => {
    for (const family of scenario.families) {
      const owned = scenario.provinces.filter(
        (province) => province.family === family.name,
      );

      expect(family.fame, family.name).toBe(FAME_PER_PROVINCE * owned.length);
    }
  });

  it('offers two monsters for hire in every province', () => {
    for (const province of scenario.provinces) {
      const monsters = province.hirePool.filter((name) => MONSTERS.has(name));
      const mercenaries = province.hirePool.filter((name) =>
        MERCENARIES.has(name),
      );
      const offered = monsters.length + mercenaries.length;

      expect(monsters, `province ${province.number}`).toHaveLength(
        MONSTERS_PER_PROVINCE,
      );
      expect(offered).toBe(province.hirePool.length);
    }
  });

  it('offers twelve mercenaries, two of each kind, in twelve provinces', () => {
    const offers = scenario.provinces.flatMap(getMercenaryOffers);
    const provinces = new Set(offers.map((offer) => offer.province));

    expect(offers).toHaveLength(MERCENARY_COUNT);
    expect(provinces.size).toBe(MERCENARY_COUNT);
    for (const kind of MERCENARIES) {
      const ofKind = offers.filter((offer) => offer.name === kind);

      expect(ofKind, kind).toHaveLength(MERCENARIES_PER_KIND);
    }
  });

  it('leaves unowned provinces without soldiers or Loyalty', () => {
    const unowned = scenario.provinces.filter((province) => !province.family);

    for (const province of unowned) {
      expect(province, `province ${province.number}`).toMatchObject({
        troops: 0,
        loyalty: 0,
      });
    }
  });
});

it('puts Halric at Cambry in Scenario 3 and keeps Dornic at court, governing nothing', () => {
  const scenario = SCENARIOS.find((each) => each.number === 3)!;
  const cambry = scenario.provinces.find((province) => province.number === 29);
  const valecross = scenario.families.find(
    (family) => family.name === 'Valecross',
  );
  const governors = scenario.provinces.map((province) => province.governor);

  expect(cambry?.governor).toBe('Halric');
  expect(valecross?.members).toContain('Dornic');
  expect(governors).not.toContain('Dornic');
});
