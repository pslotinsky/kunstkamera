import { describe, expect, it, vi } from 'vitest';

import { CalendarDate } from '@/core/domain/CalendarDate';
import { Development } from '@/core/domain/Development';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Nerith } from '@/core/domain/Nerith';
import { ProvinceEventResolver } from '@/core/domain/province-events/ProvinceEventResolver';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const APRIL = new CalendarDate(1186, 4);

function setup(protection = 0) {
  const lord = makeGeneral({ intelligence: 99, war: 50 });
  const family = makeFamily({ ruler: lord });
  const province = makeProvince({
    number: 17,
    family,
    governor: lord,
    cultivation: 100,
    protection,
    loyalty: 80,
    food: 990,
    gold: 100,
    troops: 100,
  });
  return { province, family, lord };
}

function createResolver(
  provinces: ReturnType<typeof makeProvince>[],
  date: CalendarDate,
  random: () => number,
): ProvinceEventResolver {
  const { world } = makeWorld(
    provinces,
    provinces[0]?.family ?? makeFamily(),
    date,
  );

  return new ProvinceEventResolver(world, random);
}

function completeCycle(
  province: ReturnType<typeof makeProvince>,
  goodwill = 1,
): void {
  for (let action = 0; action < 3; action += 1) {
    province.recordAction(goodwill);
  }
}

describe('Province events', () => {
  it('waits for three counted orders and resets the cycle even when no encounter occurs', () => {
    const { province } = setup();
    province.recordAction(1);
    province.recordAction(1);
    const random = vi.fn(() => 0.99);

    expect(
      createResolver([province], APRIL, random).resolve().incidents,
    ).toEqual([]);
    expect(random).not.toHaveBeenCalled();
    expect(province.actionCount).toBe(2);
    province.recordAction(1);
    expect(province.isEventDue).toBe(true);
    expect(
      createResolver([province], APRIL, random).resolve().incidents,
    ).toEqual([]);
    expect(province.actionCount).toBe(0);
    expect(province.goodwill).toBe(0);
    createResolver([province], APRIL, () => 0).resolve().incidents;
    expect(province.development.cultivation).toBe(100);
  });

  it('resets a neutral policy cycle without rolling for an event', () => {
    const { province } = setup();
    completeCycle(province, 0);
    const random = vi.fn(() => 0);

    expect(
      createResolver([province], APRIL, random).resolve().incidents,
    ).toEqual([]);
    expect(random).not.toHaveBeenCalled();
    expect(province.actionCount).toBe(0);
  });

  it('restricts a banshee death to the ruler’s court', () => {
    const { province, family } = setup();
    const courtier = makeGeneral({ name: 'Courtier' });
    const distantLord = makeGeneral({ name: 'Distant Lord' });
    family.enlist(courtier);
    family.enlist(distantLord);
    family.homeProvince = province;
    const distantProvince = makeProvince({
      number: 18,
      family,
      governor: distantLord,
    });
    const { world } = makeWorld([province, distantProvince], family, APRIL);
    completeCycle(province, -1);

    const [incident] = new ProvinceEventResolver(world, () => 0).resolve()
      .incidents;

    expect(incident?.definition.image).toBe('banshee');
    expect(incident?.recipient).toBe(courtier.name);
    expect(world.generals.all).not.toContain(courtier);
    expect(family.members).toContain(distantLord);
    expect(distantProvince.governor).toBe(distantLord);
  });

  it('records capped resource gains rather than the advertised base amount', () => {
    const { province } = setup();
    province.recordAction(1);
    province.recordAction(1);
    province.recordAction(0);
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValue(0.45);
    const [incident] = createResolver([province], APRIL, random).resolve()
      .incidents;

    expect(incident?.definition.image).toBe('far-gorta');
    expect(incident?.changes).toEqual([
      { stat: 'food', before: 990, after: 999 },
    ]);
    expect(province.resources.food).toBe(999);
  });

  it('rewards the current lord with full abilities even under remote rule', () => {
    const { province, family, lord } = setup();
    family.homeProvince = makeProvince({ number: 1, family, governor: lord });
    completeCycle(province);
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValue(0.1);
    const [incident] = createResolver([province], APRIL, random).resolve()
      .incidents;

    expect(incident?.definition.image).toBe('unicorn');
    expect(incident?.recipient).toBe(lord.name);
    expect(lord.stats.intelligence).toBe(100);
    expect(lord.stats.war).toBe(53);
    expect(province.effectiveStats.war).toBe(26);
    expect(incident?.changes).toContainEqual({
      stat: 'intelligence',
      before: 99,
      after: 100,
    });
  });

  it('grants Nerith once and blocks a visit while a monster is stationed', () => {
    const { province } = setup();
    const guarded = setup().province;
    guarded.addUnit(HiredUnit.ofName('Grimhides')!);
    const selectNerith = () =>
      vi.fn().mockReturnValueOnce(0).mockReturnValue(0.99);

    completeCycle(province);
    const [incident] = createResolver(
      [province],
      APRIL,
      selectNerith(),
    ).resolve().incidents;
    completeCycle(province);
    const repeat = createResolver([province], APRIL, selectNerith()).resolve()
      .incidents;
    completeCycle(guarded);
    const guardedRoll = vi
      .fn()
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValue(0.99);
    const blocked = createResolver([guarded], APRIL, guardedRoll).resolve()
      .incidents;

    expect(incident?.definition.image).toBe('nerith');
    expect(repeat).toEqual([]);
    expect(blocked).toEqual([]);
    expect(
      province.stationedUnits.filter((unit) => unit instanceof Nerith),
    ).toHaveLength(1);
  });

  it('clears inherited cycles on ownership changes but retains them when the lord changes', () => {
    const { province, family } = setup();
    completeCycle(province, -1);
    province.assignGovernor(makeGeneral());
    province.claim(family);
    expect(province.isEventDue).toBe(true);
    province.claim(makeFamily({ name: family.name }));

    expect(province.isEventDue).toBe(false);
    expect(province.goodwill).toBe(0);
    expect(
      createResolver([province], APRIL, () => 0).resolve().incidents,
    ).toEqual([]);
  });

  it('applies plague before flood and preserves both damage snapshots', () => {
    const { province } = setup(50);
    const [plague, flood] = createResolver(
      [province],
      new CalendarDate(1186, 6),
      () => 0,
    ).resolve().incidents;

    expect(plague?.definition.image).toBe('plague');
    expect(plague?.changes).toContainEqual({
      stat: 'cultivation',
      before: 100,
      after: 80,
    });
    expect(flood?.definition.image).toBe('flood');
    expect(flood?.changes).toContainEqual({
      stat: 'cultivation',
      before: 80,
      after: 71,
    });

    province.development = Development.empty();
    expect(plague?.changes).toContainEqual({
      stat: 'protection',
      before: 50,
      after: 40,
    });
  });

  it('limits regional disasters by geography and month, while plague can strike elsewhere', () => {
    const { family } = setup();
    const wetland = makeProvince({ number: 17, family, cultivation: 100 });
    const beyond = makeProvince({ number: 16, family, cultivation: 100 });
    const unowned = makeProvince({ number: 18, cultivation: 100 });
    const incidents = createResolver(
      [unowned, beyond, wetland],
      new CalendarDate(1186, 6),
      () => 0,
    ).resolve().incidents;

    expect(
      incidents.map((incident) => [
        incident.definition.image,
        incident.province.number,
      ]),
    ).toEqual([
      ['plague', 16],
      ['plague', 17],
      ['flood', 17],
    ]);
    expect(unowned.development.cultivation).toBe(100);
    expect(
      createResolver([wetland], APRIL, () => 0).resolve().incidents,
    ).toEqual([]);
  });

  it('uses Loyalty to prevent fire and Protection to absorb its damage', () => {
    const family = makeFamily();
    const provinces = [
      makeProvince({ number: 7, family, loyalty: 100, cultivation: 100 }),
      makeProvince({ number: 9, family, protection: 100, cultivation: 100 }),
      makeProvince({ number: 10, family, cultivation: 100 }),
    ];
    const date = new CalendarDate(1186, 9);
    const random = vi
      .fn()
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.99)
      .mockReturnValue(0);

    const incidents = createResolver(provinces, date, random).resolve()
      .incidents;

    expect(incidents.map((incident) => incident.province.number)).toEqual([10]);
    expect(
      provinces.map((province) => province.development.cultivation),
    ).toEqual([100, 100, 80]);
  });

  it('rolls one monster across the map and bases damage on its current Strength', () => {
    const { province, family } = setup(200);
    family.fame = 0;
    const otherProvince = makeProvince({
      number: 18,
      family,
      cultivation: 100,
    });
    const monster = HiredUnit.ofName('Grimhides')!;
    monster.retainBattleStrength(74);
    province.addUnit(monster);
    province.addUnit(new Nerith());
    otherProvince.addUnit(HiredUnit.ofName('Grimhides')!);
    province.recordAction(1);

    const { incidents } = createResolver(
      [otherProvince, province],
      APRIL,
      () => 0,
    ).resolve();

    expect(incidents.map((incident) => incident.monster)).toEqual([
      'Grimhides',
    ]);
    expect(incidents[0]?.province).toBe(province);
    expect(province.resources.gold).toBe(90);
    expect(province.resources.food).toBe(980);
    expect(province.development.cultivation).toBe(98);
    expect(province.development.protection).toBe(200);
    expect(otherProvince.development.cultivation).toBe(100);
    expect(province.actionCount).toBe(1);
    expect(monster.strength).toBe(74);
    expect(province.hiredUnits).toContain(monster);
  });

  it('checks only the selected mercenary against its Fame requirement', () => {
    const { province, family } = setup();
    family.fame = 12;
    const spearmen = HiredUnit.ofName('Spearmen')!;
    const lancers = HiredUnit.ofName('Lancers')!;
    province.addUnit(spearmen);
    province.addUnit(lancers);

    const safeRoll = createResolver([province], APRIL, () => 0).resolve();

    expect(safeRoll.desertion).toBeUndefined();
    const checkLancers = vi.fn().mockReturnValueOnce(0).mockReturnValue(0.99);
    const { desertion } = createResolver(
      [province],
      APRIL,
      checkLancers,
    ).resolve();

    expect(desertion).toEqual({ province, unit: lancers });
    expect(province.hiredUnits).toEqual([spearmen]);
    expect(province.hirePool).toContain(lancers.name);
  });

  it('rolls the same harmful policy event for both protection levels', () => {
    const exposed = setup(0).province;
    const protectedProvince = setup(200).province;
    for (const province of [exposed, protectedProvince]) {
      province.recordAction(-1);
      province.recordAction(0);
      province.recordAction(0);
    }
    const random = () => 0.25;

    const [exposedIncident] = createResolver([exposed], APRIL, random).resolve()
      .incidents;
    const [protectedIncident] = createResolver(
      [protectedProvince],
      APRIL,
      random,
    ).resolve().incidents;

    expect(exposedIncident?.definition.image).toBe('durahan');
    expect(protectedIncident?.definition.image).toBe('durahan');
    expect(protectedIncident?.changes[0]?.before).toBe(200);
    expect(protectedIncident?.changes[0]?.after).toBe(197);
    expect(protectedProvince.actionCount).toBe(0);
  });
});
