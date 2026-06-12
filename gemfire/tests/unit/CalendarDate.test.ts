import { describe, expect, it } from 'vitest';

import { CalendarDate } from '@/core/domain/CalendarDate';

describe('CalendarDate', () => {
  it('rolls to the next month, wrapping December into the next year', () => {
    const midYear = new CalendarDate(1186, 4).next();
    const newYear = new CalendarDate(1186, 12).next();

    expect(midYear.equals(new CalendarDate(1186, 5))).toBe(true);
    expect(newYear.equals(new CalendarDate(1187, 1))).toBe(true);
  });
});
