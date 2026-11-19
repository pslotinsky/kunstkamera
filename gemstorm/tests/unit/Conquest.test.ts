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
  readonly targetGold?: number;
}

function setup(params: SetupParams = {}) {
  const avar = makeGeneral({ name: 'Avar' });
  const mine = makeFamily({ name: 'Alderwyn', ruler: avar });
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({ name: 'Marven' });
  const rival = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven],
  });

  const held = params.rivalHolds ?? [6];
  const hasRefuge = held.includes(7);
  const source = makeProvince({
    number: 5,
    neighbors: [6],
    family: mine,
    governor: avar,
  });
  const target = makeProvince({
    number: 6,
    neighbors: hasRefuge ? [5, 7] : [5],
    family: rival,
    governor: params.defendedBy === 'vassal' ? marven : darian,
    gold: params.targetGold ?? 0,
  });
  const refuge = makeProvince({
    number: 7,
    neighbors: [6],
    family: rival,
    governor: marven,
  });

  const { world } = makeWorld(
    hasRefuge ? [source, target, refuge] : [source, target],
    mine,
  );
  const report = makeInvasionReport({
    target,
    attacker: makeArmy({ commander: avar }),
    defender: makeArmy({ commander: target.governor! }),
    outcome: makeOutcome({ winner: params.won ?? BattleSide.attacker }),
  });

  return {
    conquest: new Conquest({ world, source, report }),
    world,
    mine,
    rival,
    target,
    darian,
    avar,
    marven,
  };
}

function houses(world: ReturnType<typeof setup>['world']): readonly string[] {
  return world.families.all.map((family) => family.name);
}

describe('Conquest', () => {
  it('takes the ruler of a house down to its last province, whatever the dice say', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const { conquest, darian } = setup();
    const captive = conquest.takeCaptive();

    expect(captive?.general).toBe(darian);
    expect(captive?.isRuler).toBe(true);
  });

  it('lets a beaten commander go when the dice favour him', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const { conquest } = setup({ rivalHolds: [6, 7], defendedBy: 'vassal' });

    expect(conquest.takeCaptive()).toBeUndefined();
  });

  it('takes a beaten commander when the dice do not', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const { conquest, marven } = setup({
      rivalHolds: [6, 7],
      defendedBy: 'vassal',
    });

    expect(conquest.takeCaptive()?.general).toBe(marven);
  });

  it('lets a beaten commander buy his way out of a province that can pay', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const { conquest, target } = setup({
      rivalHolds: [6, 7],
      defendedBy: 'vassal',
      targetGold: 500,
    });

    expect(conquest.takeCaptive()).toBeUndefined();
    expect(target.resources.gold).toBe(500 - 100);
  });

  it('never takes a ruler who was only commanding from afar', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const { conquest } = setup({ rivalHolds: [6, 7] });

    expect(conquest.takeCaptive()).toBeUndefined();
  });

  it('is far likelier to take a defender with nowhere to run', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const cornered = setup({ defendedBy: 'vassal' });
    const withRefuge = setup({ rivalHolds: [6, 7], defendedBy: 'vassal' });

    expect(cornered.conquest.takeCaptive()?.general).toBe(cornered.marven);
    expect(withRefuge.conquest.takeCaptive()).toBeUndefined();
  });

  it("takes the attacker's own commander when the attack fails", () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const { conquest, avar } = setup({
      rivalHolds: [6, 7],
      won: BattleSide.defender,
    });
    const captive = conquest.takeCaptive();

    expect(captive?.general).toBe(avar);
    expect(captive?.house.name).toBe('Alderwyn');
    expect(captive?.captor.name).toBe('Stormmere');
  });

  it('ends a house that has just lost its last province', () => {
    const { conquest, world, mine, rival, target } = setup();

    target.claim(mine);

    expect(conquest.endHouse(rival)).toBe(true);
    expect(houses(world)).not.toContain('Stormmere');
  });

  it('leaves a house standing while it still holds ground', () => {
    const { conquest, world, rival } = setup({ rivalHolds: [6, 7] });

    expect(conquest.endHouse(rival)).toBe(false);
    expect(houses(world)).toContain('Stormmere');
  });
});
