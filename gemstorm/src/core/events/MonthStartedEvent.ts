import type { CalendarDate } from '@/core/domain/CalendarDate';

export class MonthStartedEvent {
  public constructor(public readonly date: CalendarDate) {}
}
