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
  const tovren = makeGeneral({
    name: 'Tovren',
    lineage: 'Emberholt',
    deathDate: dying === 'ruler' ? MAY : LATER,
  });
  const halric = makeGeneral({
    name: 'Halric',
    intelligence: 90,
    deathDate: dying === 'lord' ? MAY : LATER,
  });
  const denric = makeGeneral({ name: 'Denric' });
  const emberholt = makeFamily({
    name: 'Emberholt',
    ruler: tovren,
    members: [tovren, halric, denric, ...heirs, ...lords],
    gems: [Gem.ofName('Cindrath')],
  });
  const stormmere = makeFamily({ name: 'Stormmere' });

  const cinderpeak = makeProvince({
    number: 25,
    family: emberholt,
    governor: tovren,
  });
  const duskcrag = makeProvince({
    number: 26,
    family: emberholt,
    governor: halric,
    troops: 105,
  });
  const pineward = makeProvince({ number: 6, family: stormmere });
  const ironpass = makeProvince({
    number: 27,
    family: garrisonedLord && emberholt,
    governor: garrisonedLord,
    troops: 200,
  });

  emberholt.moveHome(cinderpeak);
  emberholt.formAlliance(stormmere);

  const { world, events } = makeWorld(
    [cinderpeak, duskcrag, pineward, ironpass],
    stormmere,
    MAY,
  );

  return {
    world,
    lifecycle: new LifecycleCommand({ world, events }),
    emberholt,
    stormmere,
    tovren,
    halric,
    denric,
    cinderpeak,
    duskcrag,
    ironpass,
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

    expect(early.emberholt.ruler).toBe(early.tovren);

    rollAt(0.9);
    early.world.date = MAY;
    early.lifecycle.execute();

    expect(early.world.generals.all).toContain(early.tovren);

    rollAt(0.89);
    early.world.date = new CalendarDate(1230, 6);
    early.lifecycle.execute();

    expect(early.world.generals.all).not.toContain(early.tovren);
  });

  it('buries a lord and hands his province back to his ruler', () => {
    rollAt(0);

    const { world, lifecycle, emberholt, tovren, halric, duskcrag } = setup({
      dying: 'lord',
    });

    lifecycle.execute();

    expect(emberholt.members).not.toContain(halric);
    expect(world.generals.all).not.toContain(halric);
    expect(duskcrag.governor).toBe(tovren);
  });

  it('crowns the strongest kinsman, who takes the home seat and keeps the family whole', () => {
    rollAt(0);

    const ruskarn = makeGeneral({
      name: 'Ruskarn',
      lineage: 'Emberholt',
      war: 90,
    });
    const olyss = makeGeneral({ name: 'Olyss', lineage: 'Emberholt' });
    const { world, lifecycle, emberholt, stormmere, cinderpeak } = setup({
      heirs: [olyss, ruskarn],
    });

    lifecycle.execute();

    expect(emberholt.ruler).toBe(ruskarn);
    expect(cinderpeak.governor).toBe(ruskarn);
    expect(world.getFamilyProvinces(emberholt)).toHaveLength(2);
    expect(emberholt.gems.map((gem) => gem.name)).toEqual(['Cindrath']);
    expect(emberholt.ally).toBe(stormmere);
  });

  it('never crowns a sworn vassal, nor a kinsman held captive', () => {
    rollAt(0);

    const sarnic = makeGeneral({ name: 'Sarnic', lineage: 'Emberholt' });
    const { world, lifecycle, emberholt, stormmere } = setup({
      heirs: [sarnic],
    });

    world.hold(
      makeCaptive({ general: sarnic, house: emberholt, captor: stormmere }),
    );
    lifecycle.execute();

    expect(world.families.all).not.toContain(emberholt);
  });

  it('disbands a family with no heir: each lord breaks away with his land, the best garrisoned takes the vassals and gems, the rest turns neutral', () => {
    rollAt(0);

    const dovar = makeGeneral({ name: 'Dovar' });
    const {
      world,
      lifecycle,
      emberholt,
      halric,
      denric,
      cinderpeak,
      duskcrag,
      ironpass,
    } = setup({ garrisonedLord: dovar });

    lifecycle.execute();

    const weaker = duskcrag.family;
    const stronger = ironpass.family;

    expect(world.families.all).not.toContain(emberholt);
    expect(cinderpeak.family).toBeUndefined();
    expect(weaker?.ruler).toBe(halric);
    expect(stronger?.ruler).toBe(dovar);
    expect(stronger?.name).not.toBe(weaker?.name);
    expect(stronger?.members).toContain(denric);
    expect(weaker?.members).not.toContain(denric);
    expect(stronger?.gems.map((gem) => gem.name)).toEqual(['Cindrath']);
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
