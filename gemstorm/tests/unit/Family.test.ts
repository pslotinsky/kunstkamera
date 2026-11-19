import { describe, expect, it } from 'vitest';

import { makeFamily, makeGeneral } from './factories';

describe('Family', () => {
  it('counts every member serving the ruler as a vassal', () => {
    const ruler = makeGeneral({ name: 'Darian' });
    const brennor = makeGeneral({ name: 'Brennor' });
    const marven = makeGeneral({ name: 'Marven' });
    const family = makeFamily({ ruler, members: [ruler, brennor, marven] });

    expect(family.vassals).toEqual([brennor, marven]);
  });
});
