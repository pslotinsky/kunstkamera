import { describe, expect, it } from 'vitest';

import { CalendarDate } from '@/core/domain/CalendarDate';

import { makeGeneral } from './factories';

const NOW = new CalendarDate(1200, 1);

describe('General', () => {
  it('grows a point a year until sixty and loses one after, twice as fast as a ruler', () => {
    const young = makeGeneral({ birth: new CalendarDate(1141, 1) });
    const old = makeGeneral({ birth: new CalendarDate(1140, 1) });

    expect(young.getYearlyChange(NOW, false)).toBe(1);
    expect(young.getYearlyChange(NOW, true)).toBe(2);
    expect(old.getYearlyChange(NOW, false)).toBe(-1);
    expect(old.getYearlyChange(NOW, true)).toBe(-2);
  });
});
