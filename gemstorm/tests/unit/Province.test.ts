import { describe, expect, it } from 'vitest';

import { makeFamily, makeGeneral, makeProvince } from './factories';

describe('Province effective stats', () => {
  it('is full for a resident lord and the ruler at home, half for the ruler elsewhere, zero with no governor', () => {
    const ruler = makeGeneral({ name: 'Avar', intelligence: 80 });
    const lord = makeGeneral({ name: 'Nemer', intelligence: 40 });
    const family = makeFamily({ name: 'Alderwyn', ruler });

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
    const ruler = makeGeneral({ name: 'Avar' });
    const lord = makeGeneral({ name: 'Rhovan' });
    const family = makeFamily({
      name: 'Alderwyn',
      ruler,
      members: [ruler, lord],
    });
    const home = makeProvince({ number: 1, family, governor: ruler });
    const lorded = makeProvince({ number: 2, family, governor: lord });

    family.homeProvince = home;

    return { ruler, lord, family, home, lorded };
  }

  it('may be set anywhere but the province the ruler is in', () => {
    const { ruler, home, lorded } = setup();
    const manor = makeProvince({
      number: 3,
      family: home.family,
      governor: ruler,
    });
    const empty = makeProvince({ number: 4, family: home.family });

    home.entrust();
    manor.entrust();
    lorded.entrust();
    empty.entrust();

    expect(home.isEntrusted).toBe(false);
    expect(manor.status).toBe('entrusted');
    expect(lorded.status).toBe('entrusted');
    expect(empty.status).toBe('entrusted');
  });

  it('survives losing or replacing its lord', () => {
    const { ruler, lorded } = setup();

    lorded.entrust();
    lorded.assignGovernor(makeGeneral());

    expect(lorded.isEntrusted).toBe(true);

    lorded.assignGovernor(ruler);

    expect(lorded.isEntrusted).toBe(true);

    lorded.assignGovernor(undefined);

    expect(lorded.isEntrusted).toBe(true);
  });

  it('lapses when the province changes hands or the ruler moves in', () => {
    const { family, lorded } = setup();
    const rival = makeFamily({ name: 'Stormmere' });

    lorded.entrust();
    family.moveHome(lorded);

    expect(lorded.isEntrusted).toBe(false);

    const other = makeProvince({ number: 5, family });
    other.entrust();
    other.claim(rival);

    expect(other.isEntrusted).toBe(false);
  });
});
