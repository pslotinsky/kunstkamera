import { describe, expect, it } from 'vitest';

import { makeFamily, makeGeneral, makeProvince } from './factories';

describe('Province effective stats', () => {
  it('is full for a resident lord and the ruler at home, half for the ruler elsewhere, zero with no governor', () => {
    const ruler = makeGeneral({ name: 'Erin', intelligence: 80 });
    const lord = makeGeneral({ name: 'Anselm', intelligence: 40 });
    const family = makeFamily({ name: 'Blanche', ruler });

    const home = makeProvince({ number: 1, family: family, governor: ruler });
    const remote = makeProvince({ number: 2, family: family, governor: ruler });
    const lorded = makeProvince({ number: 3, family: family, governor: lord });
    const empty = makeProvince({ number: 4, family: family });

    family.homeProvince = home;

    expect(home.isRemotelyRuled).toBe(false);
    expect(home.effectiveStats.intelligence).toBe(80);

    expect(remote.isRemotelyRuled).toBe(true);
    expect(remote.effectiveStats.intelligence).toBe(40);

    expect(lorded.isRemotelyRuled).toBe(false);
    expect(lorded.effectiveStats.intelligence).toBe(40);

    expect(empty.effectiveStats.intelligence).toBe(0);
  });
});
