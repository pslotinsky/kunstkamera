import { describe, expect, it } from 'vitest';

import { DefensePolicy } from '@/core/domain/DefensePolicy';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

function setup(troops: number, hasRefuge: boolean) {
  const lord = makeGeneral({ name: 'Seth' });
  const family = makeFamily({ name: 'Lyle', ruler: lord });
  const rival = makeFamily({ name: 'Blanche' });

  const defended = makeProvince({
    number: 1,
    name: 'Hyland',
    neighbors: [2],
    family,
    governor: lord,
    troops,
  });
  const neighbor = makeProvince({
    number: 2,
    name: 'Carveti',
    neighbors: [1],
    family: hasRefuge ? family : rival,
    troops: 50,
  });

  const { world } = makeWorld([defended, neighbor], rival);

  return { defended, neighbor, policy: new DefensePolicy(world) };
}

describe('DefensePolicy', () => {
  it('fights while the province still has troops', () => {
    const { defended, policy } = setup(120, true);

    expect(policy.decide(defended)).toBe('fight');
  });

  it('retreats to a province of its own house when it cannot fight', () => {
    const { defended, neighbor, policy } = setup(0, true);

    expect(policy.decide(defended)).toBe('retreat');
    expect(policy.chooseRetreat(defended)).toBe(neighbor);
  });

  it('surrenders with no troops and nowhere of its own to flee', () => {
    const { defended, policy } = setup(0, false);

    expect(policy.decide(defended)).toBe('surrender');
    expect(policy.chooseRetreat(defended)).toBeUndefined();
  });
});
