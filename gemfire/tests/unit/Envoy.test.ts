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
  const erin = makeGeneral({ name: 'Erin', lineage: 'Blanche' });
  const ander = makeGeneral({ name: 'Ander', lineage: 'Lyle' });
  const seth = makeGeneral({ name: 'Seth' });
  const wolfen = makeGeneral({ name: 'Wolfen', lineage: 'Lyle' });
  const blanche = makeFamily({
    name: 'Blanche',
    ruler: erin,
    fame: options.ourFame ?? 10,
  });
  const lyle = makeFamily({
    name: 'Lyle',
    ruler: ander,
    members: [ander, seth, wolfen],
    fame: options.theirFame ?? 10,
    gems: [Gem.ofName('Pluvius')],
  });

  let number = 0;
  const makeProvinces = (family: Family, count: number): Province[] =>
    Array.from({ length: count }, () => {
      number += 1;
      return makeProvince({ number, family: family });
    });

  const ours = makeProvinces(blanche, options.ours ?? 1);
  const theirs = makeProvinces(lyle, options.theirs ?? 1);
  const hyland = makeProvince({
    number: 100,
    name: 'Hyland',
    family: lyle,
    governor: seth,
    gold: 136,
    troops: 90,
  });
  const norwood = makeProvince({
    number: 101,
    name: 'Norwood',
    family: lyle,
    governor: wolfen,
  });

  hyland.addUnit(HiredUnit.ofName('Warriors')!);

  const { world } = makeWorld([...ours, ...theirs, hyland, norwood], blanche);
  const envoy = new Envoy({ world, family: blanche });

  return { world, envoy, blanche, lyle, ander, seth, wolfen, hyland };
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

    expect(bigger.envoy.proposeAlliance(bigger.lyle)).toBe(false);
    expect(bigger.blanche.ally).toBeUndefined();

    rollAt(0.79);

    expect(weaker.envoy.proposeAlliance(weaker.lyle)).toBe(true);
    expect(weaker.blanche.ally).toBe(weaker.lyle);
    expect(weaker.lyle.ally).toBe(weaker.blanche);
  });

  it('takes a defecting lord’s province with him, everything in it included', () => {
    rollAt(0);

    const { envoy, blanche, lyle, seth, hyland } = setup();

    expect(envoy.persuade(seth)).toBe(true);
    expect(hyland.belongsTo(blanche)).toBe(true);
    expect(hyland.governor).toBe(seth);
    expect(hyland.resources.gold).toBe(136);
    expect(hyland.resources.troops).toBe(90);
    expect(hyland.hasUnit('Warriors')).toBe(true);
    expect(blanche.members).toContain(seth);
    expect(lyle.members).not.toContain(seth);
  });

  it('turns a sworn vassal more easily than a kinsman', () => {
    rollAt(0.2);

    const { envoy, seth, wolfen } = setup();

    expect(envoy.persuade(seth)).toBe(true);
    expect(envoy.persuade(wolfen)).toBe(false);
  });

  it('never asks a ruler to defect', () => {
    const { envoy, ander } = setup();

    expect(envoy.canPersuade(ander)).toBe(false);
  });

  it('wins no surrender short of three times the provinces and the greater fame', () => {
    rollAt(0);

    const tooFew = setup({ ours: 8, ourFame: 20 });
    const lessFamous = setup({ ours: 9, ourFame: 5, theirFame: 20 });

    expect(tooFew.envoy.demandSurrender(tooFew.lyle)).toBe(false);
    expect(lessFamous.envoy.demandSurrender(lessFamous.lyle)).toBe(false);
  });

  it('absorbs a family that yields: its provinces, its members, and its gems', () => {
    rollAt(0);

    const { world, envoy, blanche, lyle, seth } = setup({
      ours: 9,
      ourFame: 20,
    });

    expect(envoy.demandSurrender(lyle)).toBe(true);
    expect(world.getFamilyProvinces(blanche)).toHaveLength(12);
    expect(blanche.members).toContain(seth);
    expect(blanche.gems.map((gem) => gem.name)).toEqual(['Pluvius']);
    expect(world.families.all).not.toContain(lyle);
  });
});
