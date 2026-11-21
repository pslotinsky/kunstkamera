import { describe, expect, it } from 'vitest';

import { Captivity } from '@/core/domain/Captivity';
import { Gem } from '@/core/domain/Gem';
import type { RecruitClass } from '@/core/domain/General';

import {
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

interface SetupOptions {
  readonly recruitClass?: RecruitClass;
  readonly lineage?: string;
}

function setup({ recruitClass = 2, lineage }: SetupOptions = {}) {
  const avar = makeGeneral({ name: 'Avar' });
  const mine = makeFamily({ name: 'Alderwyn', ruler: avar, fame: 20 });
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({
    name: 'Marven',
    war: 77,
    recruitClass,
    lineage,
  });
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
    makeCaptive({ general, house: rival, captor: mine, battlefield: pineward });

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
  it.each([
    [0, 51],
    [1, 31],
    [2, 16],
    [3, 0],
  ] as const)(
    'requires exactly the Fame threshold for recruit class %s',
    (recruitClass, threshold) => {
      const { captivity, hold, mine } = setup({ recruitClass });
      const captive = hold();
      mine.loseFame(mine.fame);

      if (threshold > 0) {
        mine.gainFame(threshold - 1);
        expect(captivity.canRecruit(captive)).toBe(false);
        expect(captivity.recruit(captive)).toBe(false);
        mine.gainFame(1);
      }

      expect(captivity.canRecruit(captive)).toBe(true);
      expect(captivity.recruit(captive)).toBe(true);
    },
  );

  it('recruits a lord into court without his province or former house membership', () => {
    const { captivity, hold, mine, rival, marven, ostgard } = setup({
      lineage: 'Stormmere',
    });

    expect(captivity.recruit(hold())).toBe(true);
    expect(mine.members).toContain(marven);
    expect(rival.members).not.toContain(marven);
    expect(marven.isKinOf(rival)).toBe(false);
    expect(ostgard.family).toBe(rival);
    expect(ostgard.governor).toBe(rival.ruler);
    expect(mine.fame).toBe(20);
  });

  it('takes the whole house when its ruler is recruited', () => {
    const {
      captivity,
      hold,
      world,
      mine,
      rival,
      darian,
      marven,
      pineward,
      ostgard,
    } = setup({ lineage: 'Stormmere' });

    world.hold(hold(marven));
    expect(captivity.recruit(hold(darian))).toBe(true);

    expect(pineward.family).toBe(mine);
    expect(ostgard.family).toBe(mine);
    expect(mine.members).toContain(darian);
    expect(mine.members).toContain(marven);
    expect(marven.isKinOf(rival)).toBe(false);
    expect(world.isHeld(marven)).toBe(false);
    expect(mine.gems.map((gem) => gem.name)).toContain('Asterion');
    expect(mine.fame).toBe(26);
    expect(houses(world)).not.toContain('Stormmere');
  });

  it('protects a ruler with an eligible heir', () => {
    const { captivity, hold, rival, darian } = setup();
    rival.enlist(makeGeneral({ lineage: rival.name }));

    expect(captivity.canRecruit(hold(darian))).toBe(false);
    expect(captivity.recruit(hold(darian))).toBe(false);
  });

  it('returns a released lord to court and puts his province under direct rule', () => {
    const { captivity, hold, marven, rival, ostgard } = setup();

    captivity.release(hold());

    expect(marven.stats.war).toBe(77);
    expect(rival.members).toContain(marven);
    expect(ostgard.governor).toBe(rival.ruler);
  });

  it('moves a released ruler to a remaining province away from the battlefield', () => {
    const { captivity, hold, darian, rival, ostgard } = setup();

    expect(captivity.release(hold(darian))).toBe(ostgard);
    expect(rival.homeProvince).toBe(ostgard);
    expect(ostgard.governor).toBe(darian);
  });

  it('lets a landless ruler claim unowned land next to the battlefield', () => {
    const { captivity, hold, darian, rival, mine, pineward, ostgard } = setup();
    pineward.claim(mine);
    ostgard.unclaim();

    expect(captivity.release(hold(darian))).toBe(ostgard);
    expect(ostgard.family).toBe(rival);
    expect(rival.homeProvince).toBe(ostgard);
    expect(ostgard.governor).toBe(darian);
  });

  it('dissolves a released ruler’s house when there is nowhere for him to go', () => {
    const {
      captivity,
      hold,
      world,
      darian,
      rival,
      mine,
      pineward,
      ostgard,
      marven,
    } = setup();
    pineward.claim(mine);
    ostgard.claim(mine);

    expect(captivity.release(hold(darian))).toBeUndefined();
    expect(world.families.all).not.toContain(rival);
    expect(mine.gems.map((gem) => gem.name)).toContain('Asterion');
    expect(world.wanderers.offer).toEqual({ general: darian, court: mine });

    world.wanderers.answer(world.wanderers.offer!, true);

    expect(mine.members).toContain(darian);
    expect(world.wanderers.offer).toEqual({ general: marven, court: mine });
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
