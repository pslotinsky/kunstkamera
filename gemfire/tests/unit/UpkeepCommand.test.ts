import { afterEach, describe, expect, it, vi } from 'vitest';

import { UpkeepCommand } from '@/core/commands/UpkeepCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { HiredUnit } from '@/core/domain/HiredUnit';
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
  const family = makeFamily({ name: 'Blanche', fame: options.fame });
  const province = makeProvince({
    number: 1,
    family,
    gold: options.gold ?? 100,
  });

  for (const type of options.units ?? ['Orks', 'Bugbear']) {
    province.addUnit(HiredUnit.ofType(type)!);
  }

  const { world, events } = makeWorld(
    [province],
    family,
    options.date ?? QUARTER_MONTH,
  );

  return { province, events, command: new UpkeepCommand({ world, events }) };
}

function rollAt(roll: number): void {
  vi.spyOn(Math, 'random').mockReturnValue(roll);
}

describe('UpkeepCommand', () => {
  afterEach(() => vi.restoreAllMocks());

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

    // Orks (20) is paid, leaving 20; Bugbear (30) is unaffordable and deserts.
    expect(province.resources.gold).toBe(20);
    expect(province.hiredUnits.map((unit) => unit.type)).toEqual(['Orks']);
  });

  it('risks a mercenary in proportion to the fame it still wants', () => {
    // Spearmen settle down at 20 fame.
    const unknown = createFixture({ units: ['Spearmen'], fame: 0 });

    unknown.command.execute();

    // A deserter takes no pay with it.
    expect(unknown.province.hiredUnits).toHaveLength(0);
    expect(unknown.province.resources.gold).toBe(100);

    const famous = createFixture({ units: ['Spearmen'], fame: 20 });

    famous.command.execute();

    expect(famous.province.hiredUnits).toHaveLength(1);
    expect(famous.province.resources.gold).toBe(80);

    // Halfway short of the fame they want is a one-in-two chance of desertion.
    rollAt(0.49);
    const unlucky = createFixture({ units: ['Spearmen'], fame: 10 });

    unlucky.command.execute();

    expect(unlucky.province.hiredUnits).toHaveLength(0);

    rollAt(0.51);
    const lucky = createFixture({ units: ['Spearmen'], fame: 10 });

    lucky.command.execute();

    expect(lucky.province.hiredUnits).toHaveLength(1);
  });

  it('keeps monsters serving a family with no fame at all', () => {
    rollAt(0);
    const { province, command } = createFixture({
      units: ['Orks'],
      fame: 0,
      gold: 100,
    });

    command.execute();

    expect(province.hiredUnits).toHaveLength(1);
    expect(province.resources.gold).toBe(80);
  });

  it('reports each desertion with the reason the unit left', () => {
    const desertions: [string, string][] = [];
    const { command, events } = createFixture({
      units: ['Spearmen', 'Pikemen'],
      fame: 0,
      gold: 20,
    });

    events.subscribe(UnitDesertedEvent, (event) =>
      desertions.push([event.unit.type, event.reason]),
    );
    command.execute();

    // Spearmen (20) are affordable but faithless; Pikemen (40) are just unpaid.
    expect(desertions).toEqual([
      ['Spearmen', 'faithless'],
      ['Pikemen', 'unpaid'],
    ]);
  });
});
