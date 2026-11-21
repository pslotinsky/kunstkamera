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

const JANUARY = new CalendarDate(1230, 1);
const OLD_BIRTH = new CalendarDate(1155, 1);

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
    birth: dying === 'ruler' ? OLD_BIRTH : undefined,
  });
  const halric = makeGeneral({
    name: 'Halric',
    intelligence: 90,
    birth: dying === 'lord' ? OLD_BIRTH : undefined,
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
    JANUARY,
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

  it('checks mortality once in January and increases the risk with age', () => {
    const { world, lifecycle, tovren } = setup();

    rollAt(0.75);
    lifecycle.execute();
    expect(world.generals.all).toContain(tovren);

    rollAt(0);
    lifecycle.execute();
    expect(world.generals.all).toContain(tovren);

    world.date = JANUARY.next();
    lifecycle.execute();
    expect(world.generals.all).toContain(tovren);

    rollAt(0.75);
    world.date = new CalendarDate(1231, 1);
    lifecycle.execute();
    expect(world.generals.all).not.toContain(tovren);
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
    expect(weaker?.fame).toBe(3);
    expect(stronger?.fame).toBe(3);
  });

  it('decays development in every province and ages survivors only in January', () => {
    const january = new CalendarDate(1200, 1);
    const ruler = makeGeneral({ birth: new CalendarDate(1170, 1), war: 50 });
    const family = makeFamily({ ruler });
    const owned = makeProvince({
      family,
      governor: ruler,
      loyalty: 55,
      cultivation: 39,
      protection: 40,
    });
    const neutral = makeProvince({ number: 2, loyalty: 20, cultivation: 10 });
    const { world, events } = makeWorld(
      [owned, neutral],
      family,
      january.next(),
    );
    const lifecycle = new LifecycleCommand({ world, events });

    rollAt(0);
    lifecycle.execute();

    expect(ruler.stats.war).toBe(50);
    expect(owned.development.loyalty).toBe(55);
    expect(neutral.development.loyalty).toBe(20);

    world.date = january;
    lifecycle.execute();
    lifecycle.execute();

    expect(ruler.stats.war).toBe(52);
    expect(owned.development).toMatchObject({
      loyalty: 52,
      cultivation: 37,
      protection: 37,
    });
    expect(neutral.development).toMatchObject({
      loyalty: 17,
      cultivation: 9,
      protection: 0,
    });
  });
});
