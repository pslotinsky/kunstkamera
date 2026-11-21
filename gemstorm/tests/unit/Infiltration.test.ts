import { afterEach, describe, expect, it, vi } from 'vitest';

import { Infiltration } from '@/core/domain/Infiltration';

import { makeFamily, makeGeneral, makeProvince } from './factories';

function setup(agentIntelligence: number, lordIntelligence: number) {
  const alderwyn = makeFamily({ name: 'Alderwyn', fame: 9 });
  const stormmere = makeFamily({ name: 'Stormmere', fame: 9 });
  const source = makeProvince({
    number: 1,
    family: alderwyn,
    governor: makeGeneral({ intelligence: agentIntelligence }),
    gold: 10,
    food: 10,
  });
  const target = makeProvince({
    number: 2,
    family: stormmere,
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
    alderwyn,
    stormmere,
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

  it('keeps the acting ruler’s Fame when there is nothing to plunder', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { target, alderwyn, infiltration } = setup(50, 50);
    target.reduceResources({ gold: 136, food: 145 });

    expect(infiltration.plunder()).toBeUndefined();
    expect(alderwyn.fame).toBe(9);
  });

  it.each([
    [0, 0],
    [0.5, 1],
    [0.99, 2],
  ])(
    'plunders a fifth of the resources and charges the acting ruler (%s)',
    (roll, loss) => {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      const { source, target, alderwyn, stormmere, infiltration } = setup(
        50,
        50,
      );

      const loot = infiltration.plunder();

      expect(loot?.gold).toBe(27);
      expect(loot?.food).toBe(29);
      expect(target.resources.gold).toBe(109);
      expect(target.resources.food).toBe(116);
      expect(source.resources.gold).toBe(37);
      expect(source.resources.food).toBe(39);
      expect(alderwyn.fame).toBe(9 - loss);
      expect(stormmere.fame).toBe(9);
    },
  );
});
