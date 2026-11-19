import { describe, expect, it } from 'vitest';

import { DefensePolicy } from '@/core/domain/DefensePolicy';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

interface SetupParams {
  readonly troops?: number;
  readonly hasNeighbor?: boolean;
  readonly hasHome?: boolean;
}

function setup(params: SetupParams = {}) {
  const lord = makeGeneral({ name: 'Marven' });
  const family = makeFamily({ name: 'Stormmere', ruler: lord });
  const rival = makeFamily({ name: 'Alderwyn' });

  const defended = makeProvince({
    number: 1,
    name: 'Pineward',
    neighbors: [2],
    family,
    governor: lord,
    troops: params.troops ?? 0,
  });
  const neighbor = makeProvince({
    number: 2,
    name: 'Rimewatch',
    neighbors: [1],
    family: params.hasNeighbor ? family : rival,
    troops: 50,
  });
  const home = makeProvince({
    number: 9,
    name: 'Wintercairn',
    family: params.hasHome ? family : rival,
    troops: 10,
  });

  family.homeProvince = params.hasHome ? home : neighbor;

  const { world } = makeWorld([defended, neighbor, home], rival);

  return { defended, neighbor, home, policy: new DefensePolicy(world) };
}

describe('DefensePolicy', () => {
  it('fights while the province still has troops', () => {
    const { defended, policy } = setup({ troops: 120, hasNeighbor: true });

    expect(policy.decide(defended)).toBe('fight');
    expect(policy.getAnswers(defended)).toEqual(['fight', 'retreat']);
  });

  it('retreats to the strongest refuge when it cannot fight', () => {
    const { defended, neighbor, policy } = setup({
      hasNeighbor: true,
      hasHome: true,
    });

    expect(policy.decide(defended)).toBe('retreat');
    expect(policy.chooseRefuge(defended)).toBe(neighbor);
  });

  it('can always flee to a distant home province', () => {
    const { defended, home, policy } = setup({ hasHome: true });

    expect(policy.getRefuges(defended)).toEqual([home]);
    expect(policy.decide(defended)).toBe('retreat');
  });

  it('surrenders only with no troops and no refuge', () => {
    const { defended, policy } = setup();

    expect(policy.getAnswers(defended)).toEqual(['surrender']);
    expect(policy.chooseRefuge(defended)).toBeUndefined();
  });
});
