import { afterEach, describe, expect, it, vi } from 'vitest';

import { HiredUnit } from '@/core/domain/HiredUnit';
import { Nerith } from '@/core/domain/Nerith';
import { Succession } from '@/core/domain/Succession';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

afterEach(() => vi.restoreAllMocks());

function setup() {
  const ruler = makeGeneral({ name: 'Orlen' });
  const lord = makeGeneral({ name: 'Brannoc' });
  const house = makeFamily({
    name: 'Emberholt',
    ruler,
    members: [ruler, lord],
  });
  const player = makeFamily({ name: 'Stormmere' });

  const home = makeProvince({
    number: 1,
    family: house,
    governor: ruler,
    gold: 101,
    food: 61,
    troops: 300,
    loyalty: 70,
    cultivation: 40,
  });
  const lorded = makeProvince({
    number: 2,
    family: house,
    governor: lord,
    gold: 80,
    food: 40,
    troops: 200,
    loyalty: 50,
  });

  house.homeProvince = home;

  const { world } = makeWorld([home, lorded], player);

  return { world, house, home, lorded, lord };
}

describe('Succession of a house with no heir', () => {
  it('leaves a province without a lord to fall into neutral hands', () => {
    const { world, house, home } = setup();
    const ogre = HiredUnit.ofName('Ogre')!;
    home.fifthUnits.addUnit(ogre);
    home.fifthUnits.addUnit(new Nerith());
    home.entrust();

    new Succession(world).replace(house);

    expect(home.family).toBeUndefined();
    expect(home.governor).toBeUndefined();
    expect(home.isEntrusted).toBe(false);
    expect(home.resources).toMatchObject({ gold: 50, food: 30, troops: 0 });
    expect(home.development).toMatchObject({ loyalty: 0, cultivation: 40 });
    expect(home.fifthUnits.units).toEqual([]);
    expect(home.fifthUnits.hirePool).toEqual([ogre]);
  });

  it('lets a lord keep his province whole by founding a house there', () => {
    const { world, house, lorded, lord } = setup();
    const ogre = HiredUnit.ofName('Ogre')!;
    lorded.fifthUnits.addUnit(ogre);

    new Succession(world).replace(house);

    expect(lorded.family?.ruler).toBe(lord);
    expect(lorded.resources).toMatchObject({ gold: 80, food: 40, troops: 200 });
    expect(lorded.development.loyalty).toBe(50);
    expect(lorded.fifthUnits.units).toEqual([ogre]);
  });
});
