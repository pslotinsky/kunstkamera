import { describe, expect, it } from 'vitest';

import { UpkeepCommand } from '@/core/commands/UpkeepCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Nerith } from '@/core/domain/Nerith';
import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';

import { makeFamily, makeProvince, makeWorld } from './factories';

const QUARTER_MONTH = new CalendarDate(1186, 3);
const OFF_QUARTER_MONTH = new CalendarDate(1186, 5);

function createFixture(
  options: {
    readonly gold?: number;
    readonly date?: CalendarDate;
    readonly fame?: number;
    readonly units?: readonly string[];
  } = {},
) {
  const family = makeFamily({ name: 'Alderwyn', fame: options.fame });
  const province = makeProvince({
    number: 1,
    family,
    gold: options.gold ?? 100,
  });

  for (const type of options.units ?? ['Grimhides', 'Bugbear']) {
    province.addUnit(HiredUnit.ofName(type)!);
  }

  const { world, events } = makeWorld(
    [province],
    family,
    options.date ?? QUARTER_MONTH,
  );

  return { province, events, command: new UpkeepCommand({ world, events }) };
}

describe('UpkeepCommand', () => {
  it('keeps Nerith without pay or desertion even when hired units cannot be maintained', () => {
    const { province, command } = createFixture({
      gold: 0,
      units: ['Grimhides'],
    });
    const nerith = new Nerith();
    province.addUnit(nerith);
    command.execute();

    expect(province.resources.gold).toBe(0);
    expect(province.stationedUnits).toEqual([nerith]);
  });

  it('charges every stationed unit its cost on a quarter month', () => {
    const { province, command } = createFixture({ gold: 100 });

    command.execute();

    expect(province.resources.gold).toBe(100 - 20 - 30);
    expect(province.hiredUnits).toHaveLength(2);
  });

  it('charges nothing outside the quarter months', () => {
    const { province, command } = createFixture({
      gold: 100,
      date: OFF_QUARTER_MONTH,
    });

    command.execute();

    expect(province.resources.gold).toBe(100);
    expect(province.hiredUnits).toHaveLength(2);
  });

  it('deserts the units the province cannot pay for', () => {
    const { province, command } = createFixture({ gold: 40 });

    command.execute();

    expect(province.resources.gold).toBe(20);
    expect(province.hiredUnits.map((unit) => unit.name)).toEqual(['Grimhides']);
  });

  it('pays a mercenary even when the ruler has too little Fame to keep it', () => {
    const { province, command } = createFixture({
      units: ['Spearmen'],
      fame: 0,
    });

    command.execute();

    expect(province.hiredUnits).toHaveLength(1);
    expect(province.resources.gold).toBe(80);
  });

  it('reports unpaid desertion and returns the unit to the hire pool', () => {
    const desertions: [string, string][] = [];
    const { command, events, province } = createFixture({
      units: ['Spearmen', 'Pikemen'],
      fame: 0,
      gold: 20,
    });

    events.subscribe(UnitDesertedEvent, (event) =>
      desertions.push([event.unit.name, event.reason]),
    );
    command.execute();

    expect(desertions).toEqual([['Pikemen', 'unpaid']]);
    expect(province.hirePool).toContain('Pikemen');
  });
});
