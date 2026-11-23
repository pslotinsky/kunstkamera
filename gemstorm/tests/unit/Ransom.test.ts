import { afterEach, describe, expect, it, vi } from 'vitest';

import { Ransom } from '@/core/domain/Ransom';

import { makeFamily, makeGeneral, makeProvince } from './factories';

describe('Ransom', () => {
  afterEach(() => vi.restoreAllMocks());

  it('prices the demand from INT and WAR and charges more for a member of the ruling house', () => {
    const house = makeFamily({ name: 'Stormmere' });
    const stats = { intelligence: 51, war: 77 };
    const vassal = makeGeneral(stats);
    const kin = makeGeneral({ ...stats, lineage: house.name });

    expect(Ransom.forGeneral(vassal, house)).toMatchObject({
      gold: 35,
      food: 60,
    });
    expect(Ransom.forGeneral(kin, house)).toMatchObject({ gold: 52, food: 90 });
  });

  it.each([
    [39, 0, false],
    [40, 0.04, true],
    [47, 0.05, false],
    [48, 0.74, true],
    [59, 0.75, false],
    [60, 0.99, true],
  ])(
    'checks the treasury before rolling for payment (%s, %s)',
    (gold, roll, accepts) => {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      const ransom = new Ransom(40, 75);
      const home = makeProvince({ gold, food: 200 });

      expect(ransom.willPay('gold', home)).toBe(accepts);
    },
  );

  it('can be paid only in the requested currency and credits the battlefield', () => {
    const ransom = new Ransom(40, 75);
    const home = makeProvince({ gold: 30, food: 120 });
    const battlefield = makeProvince({ gold: 10, food: 15 });

    expect(ransom.canPay('gold', home)).toBe(false);
    expect(ransom.canPay('food', home)).toBe(true);

    ransom.pay('gold', home, battlefield);
    ransom.pay('food', home, battlefield);

    expect(home.resources).toMatchObject({ gold: 30, food: 45 });
    expect(battlefield.resources).toMatchObject({ gold: 10, food: 90 });
  });
});
