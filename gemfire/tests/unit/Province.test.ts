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

describe('Province entrustment', () => {
  function setup() {
    const ruler = makeGeneral({ name: 'Erin' });
    const lord = makeGeneral({ name: 'Pender' });
    const family = makeFamily({
      name: 'Blanche',
      ruler,
      members: [ruler, lord],
    });
    const home = makeProvince({ number: 1, family, governor: ruler });
    const lorded = makeProvince({ number: 2, family, governor: lord });

    family.homeProvince = home;

    return { ruler, lord, family, home, lorded };
  }

  it('is handed only to a lord, never at the capital or a manor', () => {
    const { ruler, home, lorded } = setup();
    const manor = makeProvince({
      number: 3,
      family: home.family,
      governor: ruler,
    });

    home.entrust();
    manor.entrust();
    lorded.entrust();

    expect(home.isEntrusted).toBe(false);
    expect(manor.isEntrusted).toBe(false);
    expect(lorded.status).toBe('entrusted');
  });

  it('lapses when the lord leaves or the province changes hands', () => {
    const { ruler, lord, lorded } = setup();
    const rival = makeFamily({ name: 'Lyle' });

    lorded.entrust();
    lorded.assignGovernor(lord);

    expect(lorded.isEntrusted).toBe(true);

    lorded.assignGovernor(ruler);

    expect(lorded.isEntrusted).toBe(false);

    lorded.assignGovernor(lord);
    lorded.entrust();
    lorded.claim(rival);

    expect(lorded.isEntrusted).toBe(false);
  });
});
