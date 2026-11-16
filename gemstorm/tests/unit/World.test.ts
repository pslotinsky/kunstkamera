import { describe, expect, it } from 'vitest';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

describe('World vassals', () => {
  it('are the family members who are neither the ruler nor governing a province', () => {
    const ruler = makeGeneral({ name: 'Avar' });
    const lord = makeGeneral({ name: 'Nemer' });
    const beran = makeGeneral({ name: 'Beran' });
    const tharen = makeGeneral({ name: 'Tharen' });
    const family = makeFamily({
      name: 'Alderwyn',
      ruler,
      members: [ruler, lord, beran, tharen],
    });

    const home = makeProvince({ number: 1, family: family, governor: ruler });
    const lorded = makeProvince({ number: 2, family: family, governor: lord });

    family.homeProvince = home;

    const { world } = makeWorld([home, lorded], family);

    expect(world.getVassals(family)).toEqual([beran, tharen]);
  });
});
