import { describe, expect, it, vi } from 'vitest';

import { Captivity } from '@/core/domain/Captivity';
import { Gem } from '@/core/domain/Gem';

import {
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const avar = makeGeneral({ name: 'Avar' });
  const mine = makeFamily({ name: 'Alderwyn', ruler: avar });
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({ name: 'Marven', war: 77 });
  const rival = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven],
    gems: [Gem.ofName('Asterion')],
  });

  const wintercairn = makeProvince({
    number: 5,
    neighbors: [6],
    family: mine,
    governor: avar,
  });
  const pineward = makeProvince({
    number: 6,
    neighbors: [5, 7],
    family: rival,
    governor: darian,
    gold: 136,
    food: 300,
  });
  const ostgard = makeProvince({
    number: 7,
    neighbors: [6],
    family: rival,
    governor: marven,
  });

  const { world } = makeWorld([wintercairn, pineward, ostgard], mine);

  const hold = (general = marven) =>
    makeCaptive({ general, house: rival, captor: mine });

  return {
    captivity: new Captivity(world),
    world,
    hold,
    mine,
    rival,
    darian,
    marven,
    pineward,
    ostgard,
  };
}

function houses(world: ReturnType<typeof setup>['world']): readonly string[] {
  return world.families.all.map((family) => family.name);
}

describe('Captivity', () => {
  it('turns a vassal who can be talked round', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const { captivity, hold, mine, rival, marven } = setup();

    expect(captivity.recruit(hold())).toBe(true);
    expect(mine.members).toContain(marven);
    expect(rival.members).not.toContain(marven);
  });

  it('leaves a vassal where he is when he refuses', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const { captivity, hold, mine, rival, marven } = setup();

    expect(captivity.recruit(hold())).toBe(false);
    expect(mine.members).not.toContain(marven);
    expect(rival.members).toContain(marven);
  });

  it('takes the whole house when its ruler is recruited', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const { captivity, hold, world, mine, darian, marven, pineward, ostgard } =
      setup();

    captivity.recruit(hold(darian));

    expect(pineward.family).toBe(mine);
    expect(ostgard.family).toBe(mine);
    expect(mine.members).toContain(marven);
    expect(mine.gems.map((gem) => gem.name)).toContain('Asterion');
    expect(houses(world)).not.toContain('Stormmere');
  });

  it('finds a ruler far harder to turn than his vassals', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.35);

    const vassal = setup();
    const ruler = setup();

    expect(vassal.captivity.recruit(vassal.hold())).toBe(true);
    expect(ruler.captivity.recruit(ruler.hold(ruler.darian))).toBe(false);
  });

  it('sends a released vassal home the weaker for it', () => {
    const { captivity, hold, marven } = setup();

    captivity.release(hold());

    expect(marven.stats.war).toBe(72);
  });

  it('puts a banished vassal out of the game for good', () => {
    const { captivity, hold, world, rival, marven } = setup();

    captivity.banish(hold());

    expect(world.isExiled(marven)).toBe(true);
    expect(rival.members).not.toContain(marven);
  });

  it('disbands a family whose banished ruler leaves no heir', () => {
    const { captivity, hold, world, mine, darian, marven, pineward, ostgard } =
      setup();

    captivity.banish(hold(darian));

    expect(pineward.family).toBeUndefined();
    expect(ostgard.family?.ruler).toBe(marven);
    expect(ostgard.family?.name).not.toBe('Stormmere');
    expect(mine.gems.map((gem) => gem.name)).toContain('Asterion');
    expect(houses(world)).not.toContain('Stormmere');
  });

  it('crowns an heir instead when the banished ruler has one', () => {
    const { captivity, hold, world, rival, darian, pineward } = setup();
    const ruskarn = makeGeneral({ name: 'Ruskarn', lineage: 'Stormmere' });

    rival.enlist(ruskarn);
    world.generals.add(ruskarn.name, ruskarn);
    captivity.banish(hold(darian));

    expect(rival.ruler).toBe(ruskarn);
    expect(pineward.governor).toBe(ruskarn);
    expect(houses(world)).toContain('Stormmere');
  });
});
