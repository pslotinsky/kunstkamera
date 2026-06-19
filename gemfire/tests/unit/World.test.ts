import { describe, expect, it } from 'vitest';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

describe('World vassals', () => {
  it('are the family members who are neither the ruler nor governing a province', () => {
    const ruler = makeGeneral({ name: 'Erin' });
    const lord = makeGeneral({ name: 'Anselm' });
    const karl = makeGeneral({ name: 'Karl' });
    const roland = makeGeneral({ name: 'Roland' });
    const family = makeFamily({
      name: 'Blanche',
      ruler,
      members: [ruler, lord, karl, roland],
    });

    const home = makeProvince({ number: 1, family: family, governor: ruler });
    const lorded = makeProvince({ number: 2, family: family, governor: lord });

    family.homeProvince = home;

    const { world } = makeWorld([home, lorded], family);

    expect(world.getVassals(family)).toEqual([karl, roland]);
  });
});
