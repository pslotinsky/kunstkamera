import { afterEach, describe, expect, it, vi } from 'vitest';

import { LifecycleCommand } from '@/core/commands/LifecycleCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Gem } from '@/core/domain/Gem';
import type { General } from '@/core/domain/General';

import {
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

const MAY = new CalendarDate(1230, 5);
const LATER = new CalendarDate(1260, 1);

interface SetupOptions {
  readonly heirs?: readonly General[];
  readonly dying?: 'ruler' | 'lord';
  readonly garrisonedLord?: General;
}

function setup(options: SetupOptions = {}) {
  const { heirs = [], dying = 'ruler', garrisonedLord } = options;
  const lords = garrisonedLord ? [garrisonedLord] : [];
  const lars = makeGeneral({
    name: 'Lars',
    lineage: 'Coryll',
    deathDate: dying === 'ruler' ? MAY : LATER,
  });
  const erven = makeGeneral({
    name: 'Erven',
    intelligence: 90,
    deathDate: dying === 'lord' ? MAY : LATER,
  });
  const eustace = makeGeneral({ name: 'Eustace' });
  const coryll = makeFamily({
    name: 'Coryll',
    ruler: lars,
    members: [lars, erven, eustace, ...heirs, ...lords],
    gems: [Gem.ofName('Empyron')],
  });
  const lyle = makeFamily({ name: 'Lyle' });

  const ashlan = makeProvince({ number: 25, family: coryll, governor: lars });
  const penzan = makeProvince({
    number: 26,
    family: coryll,
    governor: erven,
    troops: 105,
  });
  const hyland = makeProvince({ number: 6, family: lyle });
  const belgam = makeProvince({
    number: 27,
    family: garrisonedLord && coryll,
    governor: garrisonedLord,
    troops: 200,
  });

  coryll.moveHome(ashlan);
  coryll.formAlliance(lyle);

  const { world, events } = makeWorld(
    [ashlan, penzan, hyland, belgam],
    lyle,
    MAY,
  );

  return {
    world,
    lifecycle: new LifecycleCommand({ world, events }),
    coryll,
    lyle,
    lars,
    erven,
    eustace,
    ashlan,
    penzan,
    belgam,
  };
}

function rollAt(roll: number): void {
  vi.spyOn(Math, 'random').mockReturnValue(roll);
}

describe('LifecycleCommand', () => {
  afterEach(() => vi.restoreAllMocks());

  it('takes a general on his death date, and gives a rare survivor another month', () => {
    const early = setup();

    early.world.date = new CalendarDate(1230, 4);
    rollAt(0);
    early.lifecycle.execute();

    expect(early.coryll.ruler).toBe(early.lars);

    rollAt(0.9);
    early.world.date = MAY;
    early.lifecycle.execute();

    expect(early.world.generals.all).toContain(early.lars);

    rollAt(0.89);
    early.world.date = new CalendarDate(1230, 6);
    early.lifecycle.execute();

    expect(early.world.generals.all).not.toContain(early.lars);
  });

  it('buries a lord and hands his province back to his ruler', () => {
    rollAt(0);

    const { world, lifecycle, coryll, lars, erven, penzan } = setup({
      dying: 'lord',
    });

    lifecycle.execute();

    expect(coryll.members).not.toContain(erven);
    expect(world.generals.all).not.toContain(erven);
    expect(penzan.governor).toBe(lars);
  });

  it('crowns the strongest kinsman, who takes the home seat and keeps the family whole', () => {
    rollAt(0);

    const wolfen = makeGeneral({ name: 'Wolfen', lineage: 'Coryll', war: 90 });
    const keyla = makeGeneral({ name: 'Keyla', lineage: 'Coryll' });
    const { world, lifecycle, coryll, lyle, ashlan } = setup({
      heirs: [keyla, wolfen],
    });

    lifecycle.execute();

    expect(coryll.ruler).toBe(wolfen);
    expect(ashlan.governor).toBe(wolfen);
    expect(world.getFamilyProvinces(coryll)).toHaveLength(2);
    expect(coryll.gems.map((gem) => gem.name)).toEqual(['Empyron']);
    expect(coryll.ally).toBe(lyle);
  });

  it('never crowns a sworn vassal, nor a kinsman held captive', () => {
    rollAt(0);

    const garth = makeGeneral({ name: 'Garth', lineage: 'Coryll' });
    const { world, lifecycle, coryll, lyle } = setup({ heirs: [garth] });

    world.hold(makeCaptive({ general: garth, house: coryll, captor: lyle }));
    lifecycle.execute();

    expect(world.families.all).not.toContain(coryll);
  });

  it('disbands a family with no heir: each lord breaks away with his land, the best garrisoned takes the vassals and gems, the rest turns neutral', () => {
    rollAt(0);

    const gerard = makeGeneral({ name: 'Gerard' });
    const { world, lifecycle, coryll, erven, eustace, ashlan, penzan, belgam } =
      setup({ garrisonedLord: gerard });

    lifecycle.execute();

    const weaker = penzan.family;
    const stronger = belgam.family;

    expect(world.families.all).not.toContain(coryll);
    expect(ashlan.family).toBeUndefined();
    expect(weaker?.ruler).toBe(erven);
    expect(stronger?.ruler).toBe(gerard);
    expect(stronger?.name).not.toBe(weaker?.name);
    expect(stronger?.members).toContain(eustace);
    expect(weaker?.members).not.toContain(eustace);
    expect(stronger?.gems.map((gem) => gem.name)).toEqual(['Empyron']);
  });

  it('ages generals in January, one year in three, and never in other months', () => {
    const january = new CalendarDate(1200, 1);
    const ruler = makeGeneral({ birth: new CalendarDate(1170, 1), war: 50 });
    const family = makeFamily({ ruler });
    const { world, events } = makeWorld(
      [makeProvince({ family, governor: ruler })],
      family,
      january,
    );
    const lifecycle = new LifecycleCommand({ world, events });

    rollAt(0.34);
    lifecycle.execute();
    world.date = january.next();
    rollAt(0);
    lifecycle.execute();

    expect(ruler.stats.war).toBe(50);

    world.date = january;
    rollAt(0.33);
    lifecycle.execute();

    expect(ruler.stats.war).toBe(52);
  });
});
