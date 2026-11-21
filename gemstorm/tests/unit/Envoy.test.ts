import { afterEach, describe, expect, it, vi } from 'vitest';

import { Characteristics } from '@/core/domain/Characteristics';
import { Envoy } from '@/core/domain/Envoy';
import type { Family } from '@/core/domain/Family';
import { Gem } from '@/core/domain/Gem';
import type { DefectionClass } from '@/core/domain/General';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

interface SetupOptions {
  readonly ours?: number;
  readonly theirs?: number;
  readonly ourFame?: number;
  readonly theirFame?: number;
  readonly defectionClass?: DefectionClass;
  readonly royal?: boolean;
}

function setup(options: SetupOptions = {}) {
  const avar = makeGeneral({ name: 'Avar', lineage: 'Alderwyn', charisma: 80 });
  const darian = makeGeneral({ name: 'Darian', lineage: 'Stormmere' });
  const marven = makeGeneral({
    name: 'Marven',
    defectionClass: options.defectionClass ?? 0,
  });
  const ruskarn = makeGeneral({
    name: 'Ruskarn',
    lineage: 'Stormmere',
    defectionClass: 3,
  });
  const alderwyn = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    fame: options.ourFame ?? 10,
    royal: options.royal,
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
  alderwyn.moveHome(ours[0]!);
  stormmere.moveHome(theirs[0]!);
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

  pineward.fifthUnits.addUnit(HiredUnit.ofName('Warriors')!);

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
    const [warriors] = pineward.fifthUnits.hiredUnits;

    expect(envoy.persuade(marven)).toBe(true);
    expect(pineward.belongsTo(alderwyn)).toBe(true);
    expect(pineward.governor).toBe(marven);
    expect(pineward.resources.gold).toBe(136);
    expect(pineward.resources.troops).toBe(90);
    expect(pineward.fifthUnits.hiredUnits).toContain(warriors);
    expect(alderwyn.members).toContain(marven);
    expect(stormmere.members).not.toContain(marven);
    expect(alderwyn.fame).toBe(13);
    expect(stormmere.fame).toBe(7);
  });

  it.each([
    [0, 0.03],
    [1, 0.15],
    [2, 0.3],
    [3, 0.5],
  ] as const)('uses the fixed odds for class %s', (defectionClass, chance) => {
    const { envoy, marven } = setup({
      defectionClass,
      ourFame: 0,
      theirFame: 100,
    });

    rollAt(chance);
    expect(envoy.persuade(marven)).toBe(false);

    rollAt(chance - 0.01);
    expect(envoy.persuade(marven)).toBe(true);
  });

  it('always fails a mission to a member of the rival ruler’s house', () => {
    const { envoy, ruskarn } = setup();
    const roll = vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(envoy.canApproach(ruskarn)).toBe(true);
    expect(envoy.persuade(ruskarn)).toBe(false);
    expect(roll).not.toHaveBeenCalled();
  });

  it('requires strictly higher Charisma and a strictly stronger ruler', () => {
    const { envoy, marven, darian } = setup();

    marven.stats = Characteristics.from({ charisma: 80 });
    expect(envoy.canPersuade(marven)).toBe(false);

    marven.stats = Characteristics.from({ charisma: 79 });
    darian.stats = Characteristics.from({
      intelligence: 65,
      war: 65,
      charisma: 50,
    });
    expect(envoy.canPersuade(marven)).toBe(false);

    darian.stats = darian.stats.decrease({ war: 1 });
    expect(envoy.canPersuade(marven)).toBe(true);
  });

  it('uses half the ruler’s Charisma when the acting province has no governor', () => {
    const { envoy, alderwyn, marven } = setup();

    alderwyn.homeProvince.assignGovernor(undefined);
    marven.stats = Characteristics.from({ charisma: 40 });
    expect(envoy.canPersuade(marven)).toBe(false);

    marven.stats = marven.stats.decrease({ charisma: 1 });
    expect(envoy.canPersuade(marven)).toBe(true);
  });

  it('keeps the royal house from sending defection offers', () => {
    const { envoy, marven } = setup({ royal: true });

    expect(envoy.canApproach(marven)).toBe(false);
  });

  it('never asks a ruler to defect', () => {
    const { envoy, darian } = setup();

    expect(envoy.canApproach(darian)).toBe(false);
  });

  it('refuses surrender below the province threshold despite higher Fame', () => {
    rollAt(0);

    const tooFew = setup({ ours: 8, ourFame: 20 });
    expect(tooFew.envoy.demandSurrender(tooFew.stormmere)).toBe(false);
  });

  it('absorbs a family that yields: its provinces, its members, and its gems', () => {
    rollAt(0);

    const { world, envoy, alderwyn, stormmere, marven } = setup({
      ours: 9,
      ourFame: 5,
      theirFame: 20,
    });

    expect(envoy.demandSurrender(stormmere)).toBe(true);
    expect(world.getFamilyProvinces(alderwyn)).toHaveLength(12);
    expect(alderwyn.members).toContain(marven);
    expect(alderwyn.gems.map((gem) => gem.name)).toEqual(['Asterion']);
    expect(alderwyn.fame).toBe(14);
    expect(world.families.all).not.toContain(stormmere);
  });
});
