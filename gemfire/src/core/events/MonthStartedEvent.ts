import type { CalendarDate } from '@/core/domain/CalendarDate';

export class MonthStartedEvent extends CustomEvent<CalendarDate> {
  public constructor(date: CalendarDate) {
    super(MonthStartedEvent.name, { detail: date });
  }

  public get date(): CalendarDate {
    return this.detail;
  }
}
