import { afterEach, describe, expect, it, vi } from 'vitest';

import { Infiltration } from '@/core/domain/Infiltration';

import { makeFamily, makeGeneral, makeProvince } from './factories';

function setup(agentIntelligence: number, lordIntelligence: number) {
  const blanche = makeFamily({ name: 'Blanche' });
  const lyle = makeFamily({ name: 'Lyle', fame: 9 });
  const source = makeProvince({
    number: 1,
    family: blanche,
    governor: makeGeneral({ intelligence: agentIntelligence }),
    gold: 10,
    food: 10,
  });
  const target = makeProvince({
    number: 2,
    family: lyle,
    governor: makeGeneral({ intelligence: lordIntelligence }),
    gold: 136,
    food: 145,
    troops: 100,
    loyalty: 50,
    protection: 40,
  });

  return {
    source,
    target,
    lyle,
    infiltration: new Infiltration({ source, target }),
  };
}

describe('Infiltration', () => {
  afterEach(() => vi.restoreAllMocks());

  it('gets agents past a lord up to ten INT sharper for sabotage, but only five for plunder', () => {
    expect(setup(50, 60).infiltration.sabotage()).toBeDefined();
    expect(setup(50, 61).infiltration.sabotage()).toBeUndefined();
    expect(setup(50, 55).infiltration.plunder()).toBeDefined();
    expect(setup(50, 56).infiltration.plunder()).toBeUndefined();
  });

  it('destroys a fifth of what it hits', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const { target, infiltration } = setup(50, 50);

    expect(infiltration.sabotage()).toBe('protection');
    expect(target.development.protection).toBe(32);
  });

  it("carries off a fifth of the target's gold and food, and dents its ruler's fame", () => {
    const { source, target, lyle, infiltration } = setup(50, 50);

    const loot = infiltration.plunder();

    expect(loot?.gold).toBe(27);
    expect(loot?.food).toBe(29);
    expect(target.resources.gold).toBe(109);
    expect(target.resources.food).toBe(116);
    expect(source.resources.gold).toBe(37);
    expect(source.resources.food).toBe(39);
    expect(lyle.fame).toBe(8);
  });
});
