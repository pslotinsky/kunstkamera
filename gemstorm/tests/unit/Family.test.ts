import { describe, expect, it } from 'vitest';

import { makeFamily, makeGeneral } from './factories';

describe('Family', () => {
  it('keeps Fame between zero and one hundred', () => {
    const family = makeFamily({ fame: 105 });

    expect(family.fame).toBe(100);
    family.loseFame(110);
    expect(family.fame).toBe(0);
    family.gainFame(110);
    expect(family.fame).toBe(100);
  });

  it('counts every member serving the ruler as a vassal', () => {
    const ruler = makeGeneral({ name: 'Darian' });
    const brennor = makeGeneral({ name: 'Brennor' });
    const marven = makeGeneral({ name: 'Marven' });
    const family = makeFamily({ ruler, members: [ruler, brennor, marven] });

    expect(family.vassals).toEqual([brennor, marven]);
  });
});
