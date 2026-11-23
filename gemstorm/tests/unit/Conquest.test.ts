import { afterEach, describe, expect, it, vi } from 'vitest';

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
  readonly defendedBy?: 'ruler' | 'vassal' | 'remote';
  readonly won?: BattleSide;
  readonly targetGold?: number;
  readonly surrendered?: boolean;
  readonly captureImmune?: boolean;
}

function setup(params: SetupParams = {}) {
  const avar = makeGeneral({ name: 'Avar' });
  const mine = makeFamily({ name: 'Alderwyn', ruler: avar });
  const darian = makeGeneral({
    name: 'Darian',
    captureImmune: params.captureImmune ?? false,
  });
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
    source,
    target,
    defending: rival,
    answer: params.surrendered ? 'surrender' : 'fight',
    refuge: hasRefuge ? refuge : undefined,
    attacker: makeArmy({ commander: avar }),
    defender: makeArmy({
      commander: target.governor!,
      remotelyCommanded: params.defendedBy === 'remote',
    }),
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
  afterEach(() => vi.restoreAllMocks());

  it('takes the ruler of a house down to its last province, whatever the dice say', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const { conquest, darian } = setup();
    const captive = conquest.takeCaptive();

    expect(captive?.general).toBe(darian);
    expect(captive?.isRuler).toBe(true);
  });

  it('lets a beaten commander go when the dice favour him', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.65);

    const { conquest } = setup({ rivalHolds: [6, 7], defendedBy: 'vassal' });

    expect(conquest.takeCaptive()).toBeUndefined();
  });

  it('takes a beaten commander when the dice do not', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.64);

    const { conquest, marven } = setup({
      rivalHolds: [6, 7],
      defendedBy: 'vassal',
    });

    expect(conquest.takeCaptive()?.general).toBe(marven);
  });

  it('holds a beaten commander for a ransom demand without charging the battlefield', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const { conquest, target } = setup({
      rivalHolds: [6, 7],
      defendedBy: 'vassal',
      targetGold: 500,
    });

    const captive = conquest.takeCaptive();

    expect(captive?.battlefield).toBe(target);
    expect(captive?.canDemandRansom).toBe(true);
    expect(target.resources.gold).toBe(500);
  });

  it('never takes a ruler who was only commanding from afar', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const { conquest } = setup({ rivalHolds: [6, 7], defendedBy: 'remote' });

    expect(conquest.takeCaptive()).toBeUndefined();
  });

  it('always takes a defender with nowhere to run or who surrendered', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const cornered = setup({ defendedBy: 'vassal' });
    const surrendered = setup({
      rivalHolds: [6, 7],
      defendedBy: 'vassal',
      surrendered: true,
    });

    expect(cornered.conquest.takeCaptive()?.general).toBe(cornered.marven);
    expect(surrendered.conquest.takeCaptive()?.general).toBe(
      surrendered.marven,
    );
  });

  it('honors a commander’s capture immunity even when cornered', () => {
    const { conquest } = setup({ captureImmune: true });

    expect(conquest.takeCaptive()).toBeUndefined();
  });

  it("takes the attacker's own commander when the attack fails", () => {
    const roll = vi.spyOn(Math, 'random').mockReturnValue(0.6);

    const { conquest, avar } = setup({
      rivalHolds: [6, 7],
      won: BattleSide.defender,
    });
    expect(conquest.takeCaptive()).toBeUndefined();
    roll.mockReturnValue(0.59);
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
