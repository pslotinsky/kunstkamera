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
  const erin = makeGeneral({ name: 'Erin' });
  const mine = makeFamily({ name: 'Blanche', ruler: erin });
  const ander = makeGeneral({ name: 'Ander' });
  const seth = makeGeneral({ name: 'Seth', war: 77 });
  const rival = makeFamily({
    name: 'Lyle',
    ruler: ander,
    members: [ander, seth],
    gems: [Gem.ofName('Pluvius')],
  });

  const petaria = makeProvince({
    number: 5,
    neighbors: [6],
    family: mine,
    governor: erin,
  });
  const hyland = makeProvince({
    number: 6,
    neighbors: [5, 7],
    family: rival,
    governor: ander,
    gold: 136,
    food: 300,
  });
  const ostgard = makeProvince({
    number: 7,
    neighbors: [6],
    family: rival,
    governor: seth,
  });

  const { world } = makeWorld([petaria, hyland, ostgard], mine);

  const hold = (general = seth) =>
    makeCaptive({ general, house: rival, captor: mine });

  return {
    captivity: new Captivity(world),
    world,
    hold,
    mine,
    rival,
    ander,
    seth,
    hyland,
    ostgard,
  };
}

function houses(world: ReturnType<typeof setup>['world']): readonly string[] {
  return world.families.all.map((family) => family.name);
}

describe('Captivity', () => {
  it('turns a vassal who can be talked round', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const { captivity, hold, mine, rival, seth } = setup();

    expect(captivity.recruit(hold())).toBe(true);
    expect(mine.members).toContain(seth);
    expect(rival.members).not.toContain(seth);
  });

  it('leaves a vassal where he is when he refuses', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const { captivity, hold, mine, rival, seth } = setup();

    expect(captivity.recruit(hold())).toBe(false);
    expect(mine.members).not.toContain(seth);
    expect(rival.members).toContain(seth);
  });

  it('takes the whole house when its ruler is recruited', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const { captivity, hold, world, mine, ander, seth, hyland, ostgard } =
      setup();

    captivity.recruit(hold(ander));

    expect(hyland.family).toBe(mine);
    expect(ostgard.family).toBe(mine);
    expect(mine.members).toContain(seth);
    expect(mine.gems.map((gem) => gem.name)).toContain('Pluvius');
    expect(houses(world)).not.toContain('Lyle');
  });

  it('finds a ruler far harder to turn than his vassals', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.35);

    const vassal = setup();
    const ruler = setup();

    expect(vassal.captivity.recruit(vassal.hold())).toBe(true);
    expect(ruler.captivity.recruit(ruler.hold(ruler.ander))).toBe(false);
  });

  it('sends a released vassal home the weaker for it', () => {
    const { captivity, hold, seth } = setup();

    captivity.release(hold());

    expect(seth.stats.war).toBe(72);
  });

  it('puts a banished vassal out of the game for good', () => {
    const { captivity, hold, world, rival, seth } = setup();

    captivity.banish(hold());

    expect(world.isExiled(seth)).toBe(true);
    expect(rival.members).not.toContain(seth);
  });

  it('disbands a family whose banished ruler leaves no heir', () => {
    const { captivity, hold, world, mine, ander, seth, hyland, ostgard } =
      setup();

    captivity.banish(hold(ander));

    expect(hyland.family).toBeUndefined();
    expect(ostgard.family?.ruler).toBe(seth);
    expect(ostgard.family?.name).not.toBe('Lyle');
    expect(mine.gems.map((gem) => gem.name)).toContain('Pluvius');
    expect(houses(world)).not.toContain('Lyle');
  });

  it('crowns an heir instead when the banished ruler has one', () => {
    const { captivity, hold, world, rival, ander, hyland } = setup();
    const wolfen = makeGeneral({ name: 'Wolfen', lineage: 'Lyle' });

    rival.enlist(wolfen);
    world.generals.add(wolfen.name, wolfen);
    captivity.banish(hold(ander));

    expect(rival.ruler).toBe(wolfen);
    expect(hyland.governor).toBe(wolfen);
    expect(houses(world)).toContain('Lyle');
  });
});
