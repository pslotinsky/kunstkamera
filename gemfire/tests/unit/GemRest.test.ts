// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { CalendarDate } from '@/core/domain/CalendarDate';
import { Gem } from '@/core/domain/Gem';

const MARCH = new CalendarDate(1245, 3);

describe('a spent gem', () => {
  it('is ready until it is spent', () => {
    expect(Gem.ofName('Zendor').isReadyOn(MARCH)).toBe(true);
  });

  it('rests three months, and comes back in the fourth', () => {
    const gem = Gem.ofName('Zendor');

    gem.rest(MARCH, 3);

    expect(gem.isReadyOn(MARCH)).toBe(false);
    expect(gem.isReadyOn(new CalendarDate(1245, 5))).toBe(false);
    expect(gem.isReadyOn(new CalendarDate(1245, 6))).toBe(true);
    expect(gem.countMonthsLeft(MARCH)).toBe(3);
  });

  it('rests five months when its guardian was destroyed', () => {
    const gem = Gem.ofName('Dragon');

    gem.rest(MARCH, 5);

    expect(gem.isReadyOn(new CalendarDate(1245, 7))).toBe(false);
    expect(gem.isReadyOn(new CalendarDate(1245, 8))).toBe(true);
  });

  it('counts its rest across the turn of a year', () => {
    const gem = Gem.ofName('Pluvius');
    const november = new CalendarDate(1245, 11);

    gem.rest(november, 3);

    expect(gem.isReadyOn(new CalendarDate(1246, 1))).toBe(false);
    expect(gem.isReadyOn(new CalendarDate(1246, 2))).toBe(true);
    expect(gem.countMonthsLeft(november)).toBe(3);
  });

  it('needs nothing to happen for its rest to end', () => {
    const gem = Gem.ofName('Zendor');

    gem.rest(MARCH, 3);

    expect(gem.isReadyOn(new CalendarDate(1250, 1))).toBe(true);
  });
});
