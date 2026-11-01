import { describe, expect, it, vi } from 'vitest';

import { CalendarDate } from '@/core/domain/CalendarDate';
import { Development } from '@/core/domain/Development';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Pastha } from '@/core/domain/Pastha';
import { ProvinceEvents } from '@/core/domain/ProvinceEvents';

import { makeFamily, makeGeneral, makeProvince } from './factories';

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

    expect(new ProvinceEvents([province], APRIL, random).resolve()).toEqual([]);
    expect(random).not.toHaveBeenCalled();
    expect(province.actionCount).toBe(2);
    province.recordAction(1);
    expect(province.isEventDue).toBe(true);
    expect(new ProvinceEvents([province], APRIL, random).resolve()).toEqual([]);
    expect(province.actionCount).toBe(0);
    expect(province.goodwill).toBe(0);
    new ProvinceEvents([province], APRIL, () => 0).resolve();
    expect(province.development.cultivation).toBe(100);
  });

  it('records capped resource gains rather than the advertised base amount', () => {
    const { province } = setup();
    completeCycle(province);
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValue(0.45);
    const [incident] = new ProvinceEvents([province], APRIL, random).resolve();

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
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValue(0.9);
    const [incident] = new ProvinceEvents([province], APRIL, random).resolve();

    expect(incident?.definition.image).toBe('unicorn');
    expect(incident?.recipient).toBe(lord.name);
    expect(lord.stats.intelligence).toBe(100);
    expect(lord.stats.war).toBe(52);
    expect(province.effectiveStats.war).toBe(26);
    expect(incident?.changes).toContainEqual({
      stat: 'intelligence',
      before: 99,
      after: 100,
    });
  });

  it('grants separate Pastha visits without replacing stationed units', () => {
    const { province } = setup();
    const hired = HiredUnit.ofName('Orks')!;
    province.addUnit(hired);
    const random = vi
      .fn()
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValue(0.999);
    completeCycle(province);
    const [incident] = new ProvinceEvents([province], APRIL, random).resolve();
    completeCycle(province);
    const second = vi
      .fn()
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValue(0.999);
    new ProvinceEvents([province], APRIL, second).resolve();

    expect(incident?.definition.image).toBe('pastha');
    expect(
      province.stationedUnits.filter((unit) => unit instanceof Pastha),
    ).toHaveLength(2);
    expect(province.hiredUnits).toEqual([hired]);
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
    expect(new ProvinceEvents([province], APRIL, () => 0).resolve()).toEqual(
      [],
    );
  });

  it('uses Protection before each incident for every loss, and preserves earlier report snapshots', () => {
    const { province } = setup(200);
    const incidents = new ProvinceEvents(
      [province],
      new CalendarDate(1186, 6),
      () => 0,
    ).resolve();

    expect(incidents.map((incident) => incident.definition.image)).toEqual([
      'flood',
      'plague',
    ]);
    expect(incidents[0]?.changes).toContainEqual({
      stat: 'protection',
      before: 200,
      after: 190,
    });
    expect(incidents[0]?.changes).toContainEqual({
      stat: 'cultivation',
      before: 100,
      after: 90,
    });
    expect(incidents[1]?.changes).toContainEqual({
      stat: 'protection',
      before: 190,
      after: 180,
    });
    province.development = Development.empty();
    expect(incidents[0]?.changes).toContainEqual({
      stat: 'cultivation',
      before: 100,
      after: 90,
    });
  });

  it('limits regional disasters by geography and month, while plague can strike elsewhere', () => {
    const { family } = setup();
    const wetland = makeProvince({ number: 17, family, cultivation: 100 });
    const beyond = makeProvince({ number: 16, family, cultivation: 100 });
    const unowned = makeProvince({ number: 18, cultivation: 100 });
    const incidents = new ProvinceEvents(
      [unowned, beyond, wetland],
      new CalendarDate(1186, 6),
      () => 0,
    ).resolve();

    expect(
      incidents.map((incident) => [
        incident.definition.image,
        incident.province.number,
      ]),
    ).toEqual([
      ['flood', 17],
      ['plague', 16],
      ['plague', 17],
    ]);
    expect(unowned.development.cultivation).toBe(100);
    expect(new ProvinceEvents([wetland], APRIL, () => 0).resolve()).toEqual([]);
  });

  it('can rampage during good management without counted actions, but never blames mercenaries or Pastha', () => {
    const { province } = setup(200);
    const monster = HiredUnit.ofName('Orks')!;
    const mercenary = HiredUnit.ofName('Spearmen')!;
    province.addUnit(monster);
    province.addUnit(mercenary);
    province.addUnit(new Pastha());
    province.recordAction(1);
    const [incident] = new ProvinceEvents([province], APRIL, () => 0).resolve();

    expect(incident?.definition.kind).toBe('rampage');
    expect(incident?.monster).toBe('Orks');
    expect(province.hiredUnits).toEqual([monster, mercenary]);
    expect(province.development.cultivation).toBe(90);
    expect(province.actionCount).toBe(1);
    province.removeUnit(monster);
    expect(new ProvinceEvents([province], APRIL, () => 0).resolve()).toEqual(
      [],
    );
  });

  it('reduces harmful encounter risk with Protection without redirecting prevented encounters into rewards', () => {
    const exposed = setup(0).province;
    const protectedProvince = setup(200).province;
    completeCycle(exposed, -1);
    completeCycle(protectedProvince, -1);
    const random = () => 0.5;

    expect(new ProvinceEvents([exposed], APRIL, random).resolve()).toHaveLength(
      1,
    );
    expect(
      new ProvinceEvents([protectedProvince], APRIL, random).resolve(),
    ).toEqual([]);
    expect(protectedProvince.actionCount).toBe(0);
  });
});
