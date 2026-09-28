import { describe, expect, it } from 'vitest';

import { Ransom } from '@/core/domain/Ransom';

import { makeGeneral, makeProvince } from './factories';

describe('Ransom', () => {
  it('prices a captive by what he is worth in war', () => {
    const ransom = Ransom.forGeneral(makeGeneral({ war: 77 }));

    expect(ransom.gold).toBe(154);
    expect(ransom.food).toBe(231);
  });

  it('takes the gold when the payer has it', () => {
    const ransom = Ransom.forGeneral(makeGeneral({ war: 77 }));
    const payer = makeProvince({ gold: 216, food: 300 });
    const receiver = makeProvince({ gold: 136 });

    expect(ransom.payFrom(payer, receiver)).toBe(true);
    expect(payer.resources.gold).toBe(216 - 154);
    expect(receiver.resources.gold).toBe(136 + 154);
  });

  it('takes food instead when the gold falls short', () => {
    const ransom = Ransom.forGeneral(makeGeneral({ war: 77 }));
    const payer = makeProvince({ gold: 136, food: 300 });
    const receiver = makeProvince();

    expect(ransom.payFrom(payer, receiver)).toBe(true);
    expect(payer.resources.gold).toBe(136);
    expect(payer.resources.food).toBe(300 - 231);
    expect(receiver.resources.food).toBe(231);
  });

  it('takes nothing from a province that can meet neither price', () => {
    const ransom = Ransom.forGeneral(makeGeneral({ war: 77 }));
    const payer = makeProvince({ gold: 136, food: 145 });

    expect(ransom.payFrom(payer, makeProvince())).toBe(false);
    expect(payer.resources.gold).toBe(136);
    expect(payer.resources.food).toBe(145);
  });

  it('can be met in gold alone or in food alone', () => {
    const ransom = Ransom.forGeneral(makeGeneral({ war: 77 }));

    expect(ransom.canBePaidBy(makeProvince({ gold: 154, food: 0 }))).toBe(true);
    expect(ransom.canBePaidBy(makeProvince({ gold: 0, food: 231 }))).toBe(true);
    expect(ransom.canBePaidBy(makeProvince({ gold: 153, food: 230 }))).toBe(
      false,
    );
  });
});
