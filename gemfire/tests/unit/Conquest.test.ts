import { describe, expect, it, vi } from 'vitest';

import { BattleSide } from '@/core/domain/BattleSide';
import { Conquest } from '@/core/domain/Conquest';

import {
  makeArmy,
  makeFamily,
  makeGeneral,
  makeInvasionReport,
  makeOutcome,
  makeProvince,
  makeWorld,
} from './factories';

interface SetupParams {
  readonly rivalHolds?: readonly number[];
  readonly defendedBy?: 'ruler' | 'vassal';
  readonly won?: BattleSide;
}

function setup(params: SetupParams = {}) {
  const erin = makeGeneral({ name: 'Erin' });
  const mine = makeFamily({ name: 'Blanche', ruler: erin });
  const ander = makeGeneral({ name: 'Ander' });
  const seth = makeGeneral({ name: 'Seth' });
  const rival = makeFamily({
    name: 'Lyle',
    ruler: ander,
    members: [ander, seth],
  });

  const held = params.rivalHolds ?? [6];
  const hasRefuge = held.includes(7);
  const source = makeProvince({
    number: 5,
    neighbors: [6],
    family: mine,
    governor: erin,
  });
  const target = makeProvince({
    number: 6,
    neighbors: hasRefuge ? [5, 7] : [5],
    family: rival,
    governor: params.defendedBy === 'vassal' ? seth : ander,
  });
  const refuge = makeProvince({
    number: 7,
    neighbors: [6],
    family: rival,
    governor: seth,
  });

  const { world } = makeWorld(
    hasRefuge ? [source, target, refuge] : [source, target],
    mine,
  );
  const report = makeInvasionReport({
    target,
    attacker: makeArmy({ commander: erin }),
    defender: makeArmy({ commander: target.governor! }),
    outcome: makeOutcome({ winner: params.won ?? BattleSide.attacker }),
  });

  return {
    conquest: new Conquest({ world, source, report }),
    world,
    mine,
    rival,
    target,
    ander,
    erin,
    seth,
  };
}

function houses(world: ReturnType<typeof setup>['world']): readonly string[] {
  return world.families.all.map((family) => family.name);
}

describe('Conquest', () => {
  it('takes the ruler of a house down to its last province, whatever the dice say', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const { conquest, ander } = setup();
    const captive = conquest.takeCaptive();

    expect(captive?.general).toBe(ander);
    expect(captive?.isRuler).toBe(true);
  });

  it('lets a beaten commander go when the dice favour him', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const { conquest } = setup({ rivalHolds: [6, 7] });

    expect(conquest.takeCaptive()).toBeUndefined();
  });

  it('takes a beaten commander when the dice do not', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const { conquest, ander } = setup({ rivalHolds: [6, 7] });

    expect(conquest.takeCaptive()?.general).toBe(ander);
  });

  it('is far likelier to take a defender with nowhere to run', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const cornered = setup({ defendedBy: 'vassal' });
    const withRefuge = setup({ rivalHolds: [6, 7], defendedBy: 'vassal' });

    expect(cornered.conquest.takeCaptive()?.general).toBe(cornered.seth);
    expect(withRefuge.conquest.takeCaptive()).toBeUndefined();
  });

  it("takes the attacker's own commander when the attack fails", () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const { conquest, erin } = setup({
      rivalHolds: [6, 7],
      won: BattleSide.defender,
    });
    const captive = conquest.takeCaptive();

    expect(captive?.general).toBe(erin);
    expect(captive?.house.name).toBe('Blanche');
    expect(captive?.captor.name).toBe('Lyle');
  });

  it('ends a house that has just lost its last province', () => {
    const { conquest, world, mine, rival, target } = setup();

    target.claim(mine);

    expect(conquest.endHouse(rival)).toBe(true);
    expect(houses(world)).not.toContain('Lyle');
  });

  it('leaves a house standing while it still holds ground', () => {
    const { conquest, world, rival } = setup({ rivalHolds: [6, 7] });

    expect(conquest.endHouse(rival)).toBe(false);
    expect(houses(world)).toContain('Lyle');
  });
});
