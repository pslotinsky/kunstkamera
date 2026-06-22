import { describe, expect, it } from 'vitest';

import { UpkeepCommand } from '@/core/commands/UpkeepCommand';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { HiredUnit } from '@/core/domain/HiredUnit';

import { makeFamily, makeProvince, makeWorld } from './factories';

const QUARTER_MONTH = new CalendarDate(1186, 3);
const OFF_QUARTER_MONTH = new CalendarDate(1186, 5);

function createFixture(
  options: { readonly gold?: number; readonly date?: CalendarDate } = {},
) {
  const family = makeFamily({ name: 'Blanche' });
  const province = makeProvince({
    number: 1,
    family,
    gold: options.gold ?? 100,
  });

  province.addUnit(HiredUnit.ofType('Orks')!); // cost 20
  province.addUnit(HiredUnit.ofType('Bugbear')!); // cost 30

  const { world, events } = makeWorld(
    [province],
    family,
    options.date ?? QUARTER_MONTH,
  );

  return { province, command: new UpkeepCommand({ world, events }) };
}

describe('UpkeepCommand', () => {
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
});
