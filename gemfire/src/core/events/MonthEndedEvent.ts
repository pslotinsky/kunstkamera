import type { CalendarDate } from '@/core/domain/CalendarDate';

export class MonthEndedEvent {
  public constructor(public readonly date: CalendarDate) {}
}
