import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefensePolicy } from '@/core/domain/DefensePolicy';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Nerith } from '@/core/domain/Nerith';

import {
  makeArmy,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

afterEach(() => vi.restoreAllMocks());

interface SetupParams {
  readonly troops?: number;
  readonly food?: number;
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
    food: params.food ?? 0,
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

describe('DefensePolicy answers for a human defender', () => {
  it.each([
    [120, 50, ['fight', 'retreat']],
    [120, 0, ['retreat', 'surrender']],
    [0, 50, ['retreat', 'surrender']],
    [0, 0, ['retreat', 'surrender']],
  ] as const)(
    'with %s soldiers and %s Food offers %j',
    (troops, food, answers) => {
      const { defended, policy } = setup({ troops, food, hasNeighbor: true });

      expect(policy.getAnswers(defended)).toEqual(answers);
    },
  );

  it('fights with only a ready Guardian when it has Food', () => {
    const { defended, policy } = setup({ food: 50 });
    defended.family!.gems = [Gem.ofName('Ashwing')];

    expect(policy.getAnswers(defended)).toEqual(['fight']);
  });

  it('cannot fight with only a hired unit, which never fights alone', () => {
    const { defended, policy } = setup({ food: 50 });
    defended.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);

    expect(policy.getAnswers(defended)).toEqual(['surrender']);
  });
});

describe('DefensePolicy decision for a computer defender', () => {
  it.each([
    [120, 50, 'fight'],
    [0, 50, 'surrender'],
    [120, 0, 'surrender'],
  ] as const)(
    'without a refuge, %s soldiers and %s Food choose %s',
    (troops, food, answer) => {
      const { defended, policy } = setup({ troops, food });

      expect(policy.decide(defended, makeArmy({ troops: 100 }))).toBe(answer);
    },
  );

  it.each([
    [400, 0, 'retreat'],
    [400, 9, 'retreat'],
    [400, 10, 'fight'],
  ] as const)(
    'with a refuge, %s soldiers and %s Food choose %s',
    (troops, food, answer) => {
      const { defended, policy } = setup({ troops, food, hasNeighbor: true });

      expect(policy.decide(defended, makeArmy({ troops: 100 }))).toBe(answer);
    },
  );

  it.each([
    [100, 0.79, 'retreat'],
    [100, 0.8, 'fight'],
    [101, 0, 'fight'],
  ] as const)(
    'facing five times its %s soldiers with a %s roll chooses %s',
    (troops, roll, answer) => {
      const { defended, policy } = setup({
        troops,
        food: 100,
        hasNeighbor: true,
      });
      vi.spyOn(Math, 'random').mockReturnValue(roll);

      expect(policy.decide(defended, makeArmy({ troops: 500 }))).toBe(answer);
    },
  );

  it.each([
    [0.49, 'retreat'],
    [0.5, 'fight'],
  ] as const)(
    'holds firmer with a hired unit: a %s roll chooses %s',
    (roll, answer) => {
      const { defended, policy } = setup({
        troops: 100,
        food: 100,
        hasNeighbor: true,
      });
      defended.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);
      vi.spyOn(Math, 'random').mockReturnValue(roll);

      expect(policy.decide(defended, makeArmy({ troops: 500 }))).toBe(answer);
    },
  );

  it('sometimes fights with nothing when it has Food but no soldiers', () => {
    const { defended, policy } = setup({ food: 100, hasNeighbor: true });
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    expect(policy.decide(defended, makeArmy({ troops: 100 }))).toBe('fight');
  });
});

describe('DefensePolicy refuge for a computer defender', () => {
  function setupRefuges() {
    const family = makeFamily({ name: 'Stormmere' });
    const rival = makeFamily({ name: 'Alderwyn' });
    const defended = makeProvince({
      number: 1,
      neighbors: [2, 3, 4, 5],
      family,
      governor: makeGeneral(),
    });
    const weak = makeProvince({ number: 2, family, troops: 10 });
    const strong = makeProvince({ number: 3, family, troops: 50 });
    const unowned = makeProvince({ number: 4 });
    const hostile = makeProvince({ number: 5, family: rival, troops: 90 });
    const home = makeProvince({ number: 9, family, troops: 200 });

    family.homeProvince = home;

    const { world } = makeWorld(
      [defended, weak, strong, unowned, hostile, home],
      rival,
    );

    return {
      defended,
      weak,
      strong,
      unowned,
      home,
      policy: new DefensePolicy(world),
    };
  }

  it('prefers the own neighbour with the most soldiers', () => {
    const { defended, strong, policy } = setupRefuges();

    expect(policy.chooseRefuge(defended)).toBe(strong);
  });

  it('takes an unowned neighbour before a distant home', () => {
    const { defended, weak, strong, unowned, policy } = setupRefuges();
    weak.unclaim();
    strong.unclaim();
    unowned.claim(makeFamily());

    expect(policy.chooseRefuge(defended)).toBe(weak);
  });

  it('falls back to the distant home', () => {
    const { defended, weak, strong, unowned, home, policy } = setupRefuges();
    const other = makeFamily();
    weak.claim(other);
    strong.claim(other);
    unowned.claim(other);

    expect(policy.chooseRefuge(defended)).toBe(home);
  });
});

describe('DefensePolicy Fifth Unit for a computer defender', () => {
  it('always fields a Nerith', () => {
    const { defended, policy } = setup({ troops: 900, food: 100 });
    const nerith = new Nerith();
    defended.family!.gems = [Gem.ofName('Ashwing')];
    defended.fifthUnits.addUnit(nerith);

    expect(policy.chooseUnit(defended, makeArmy({ troops: 10 }))).toBe(nerith);
  });

  it('fields nothing against an army a tenth of its size', () => {
    const { defended, policy } = setup({ troops: 900, food: 100 });
    defended.family!.gems = [Gem.ofName('Ashwing')];

    expect(
      policy.chooseUnit(defended, makeArmy({ troops: 89 })),
    ).toBeUndefined();
    expect(policy.chooseUnit(defended, makeArmy({ troops: 90 }))).toBe(
      defended.family!.gems[0]!.guardian,
    );
  });

  it('counts the attacking unit towards the attacker', () => {
    const { defended, policy } = setup({ troops: 900, food: 100 });
    const attacker = makeArmy({
      troops: 0,
      unit: HiredUnit.ofName('Grimhides')!,
    });
    defended.family!.gems = [Gem.ofName('Ashwing')];

    expect(policy.chooseUnit(defended, attacker)).toBe(
      defended.family!.gems[0]!.guardian,
    );
  });

  it('fields the strongest ready unit, hired before a Guardian on a tie', () => {
    const { defended, policy } = setup({ troops: 100, food: 100 });
    const gunners = HiredUnit.ofName('Gunners')!;
    defended.family!.gems = [Gem.ofName('Voltryn'), Gem.ofName('Cindrath')];
    defended.fifthUnits.addUnit(gunners);

    expect(policy.chooseUnit(defended, makeArmy())).toBe(gunners);
  });
});
