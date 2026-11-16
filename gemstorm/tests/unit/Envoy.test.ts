import { afterEach, describe, expect, it, vi } from 'vitest';

import { Envoy } from '@/core/domain/Envoy';
import type { Family } from '@/core/domain/Family';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

interface SetupOptions {
  readonly ours?: number;
  readonly theirs?: number;
  readonly ourFame?: number;
  readonly theirFame?: number;
}

function setup(options: SetupOptions = {}) {
  const avar = makeGeneral({ name: 'Avar', lineage: 'Alderwyn' });
  const darian = makeGeneral({ name: 'Darian', lineage: 'Stormmere' });
  const marven = makeGeneral({ name: 'Marven' });
  const ruskarn = makeGeneral({ name: 'Ruskarn', lineage: 'Stormmere' });
  const alderwyn = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    fame: options.ourFame ?? 10,
  });
  const stormmere = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven, ruskarn],
    fame: options.theirFame ?? 10,
    gems: [Gem.ofName('Asterion')],
  });

  let number = 0;
  const makeProvinces = (family: Family, count: number): Province[] =>
    Array.from({ length: count }, () => {
      number += 1;
      return makeProvince({ number, family: family });
    });

  const ours = makeProvinces(alderwyn, options.ours ?? 1);
  const theirs = makeProvinces(stormmere, options.theirs ?? 1);
  const pineward = makeProvince({
    number: 100,
    name: 'Pineward',
    family: stormmere,
    governor: marven,
    gold: 136,
    troops: 90,
  });
  const mossvale = makeProvince({
    number: 101,
    name: 'Mossvale',
    family: stormmere,
    governor: ruskarn,
  });

  pineward.addUnit(HiredUnit.ofName('Warriors')!);

  const { world } = makeWorld(
    [...ours, ...theirs, pineward, mossvale],
    alderwyn,
  );
  const envoy = new Envoy({ world, family: alderwyn });

  return {
    world,
    envoy,
    alderwyn,
    stormmere,
    darian,
    marven,
    ruskarn,
    pineward,
  };
}

function rollAt(roll: number): void {
  vi.spyOn(Math, 'random').mockReturnValue(roll);
}

describe('Envoy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is refused at any roll by a family twice its size, and readily accepted by a weaker one', () => {
    const bigger = setup({ ours: 2, theirs: 2 });
    const weaker = setup({ ours: 6 });

    rollAt(0);

    expect(bigger.envoy.proposeAlliance(bigger.stormmere)).toBe(false);
    expect(bigger.alderwyn.ally).toBeUndefined();

    rollAt(0.79);

    expect(weaker.envoy.proposeAlliance(weaker.stormmere)).toBe(true);
    expect(weaker.alderwyn.ally).toBe(weaker.stormmere);
    expect(weaker.stormmere.ally).toBe(weaker.alderwyn);
  });

  it('takes a defecting lord’s province with him, everything in it included', () => {
    rollAt(0);

    const { envoy, alderwyn, stormmere, marven, pineward } = setup();

    expect(envoy.persuade(marven)).toBe(true);
    expect(pineward.belongsTo(alderwyn)).toBe(true);
    expect(pineward.governor).toBe(marven);
    expect(pineward.resources.gold).toBe(136);
    expect(pineward.resources.troops).toBe(90);
    expect(pineward.hasUnit('Warriors')).toBe(true);
    expect(alderwyn.members).toContain(marven);
    expect(stormmere.members).not.toContain(marven);
  });

  it('turns a sworn vassal more easily than a kinsman', () => {
    rollAt(0.2);

    const { envoy, marven, ruskarn } = setup();

    expect(envoy.persuade(marven)).toBe(true);
    expect(envoy.persuade(ruskarn)).toBe(false);
  });

  it('never asks a ruler to defect', () => {
    const { envoy, darian } = setup();

    expect(envoy.canPersuade(darian)).toBe(false);
  });

  it('wins no surrender short of three times the provinces and the greater fame', () => {
    rollAt(0);

    const tooFew = setup({ ours: 8, ourFame: 20 });
    const lessFamous = setup({ ours: 9, ourFame: 5, theirFame: 20 });

    expect(tooFew.envoy.demandSurrender(tooFew.stormmere)).toBe(false);
    expect(lessFamous.envoy.demandSurrender(lessFamous.stormmere)).toBe(false);
  });

  it('absorbs a family that yields: its provinces, its members, and its gems', () => {
    rollAt(0);

    const { world, envoy, alderwyn, stormmere, marven } = setup({
      ours: 9,
      ourFame: 20,
    });

    expect(envoy.demandSurrender(stormmere)).toBe(true);
    expect(world.getFamilyProvinces(alderwyn)).toHaveLength(12);
    expect(alderwyn.members).toContain(marven);
    expect(alderwyn.gems.map((gem) => gem.name)).toEqual(['Asterion']);
    expect(world.families.all).not.toContain(stormmere);
  });
});
